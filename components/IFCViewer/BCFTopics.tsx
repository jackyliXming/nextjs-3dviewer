// BCFTopics.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { Calendar } from "lucide-react";

interface BCFTopicsProps {
  components: OBC.Components;
  world: OBC.World;
  darkMode: boolean;
  onTopicClick?: (topic: OBC.Topic) => void;
}

interface CreateTopicFormData {
  title: string;
  description: string;
  type: string;
  priority: string;
  stage: string;
  labels: string;
  assignedTo: string;
  dueDate: string;
}

interface HistoryRecord {
  before: any;
  after: any;
  editor: string;
  timestamp: string;
}

interface ExtendedTopic extends OBC.Topic {
  history?: HistoryRecord[];
}

const BCFTopics: React.FC<BCFTopicsProps> = ({ components, world, darkMode, onTopicClick }) => {
  const [bcfTopics, setBcfTopics] = useState<OBC.BCFTopics | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<OBC.Topic | null>(null);
  const [topicsList, setTopicsList] = useState<OBC.Topic[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [selectionForTopic, setSelectionForTopic] = useState<Set<string> | null>(null);
  const [newComment, setNewComment] = useState({ name: "", comment: "" });

  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  useEffect(() => {
    if (!components) return;

    const topics = components.get(OBC.BCFTopics);
    topics.setup({
      author: "signed.user@mail.com",
      users: new Set(["jhon.doe@example.com", "user_a@something.com", "user_b@something.com"]),
      labels: new Set(["Architecture", "Structure", "MEP"]),
    });

    const onTopicsChanged = () => setTopicsList([...topics.list.values()]);
    topics.list.onItemSet.add(onTopicsChanged);
    topics.list.onItemUpdated.add(onTopicsChanged);

    setBcfTopics(topics);

    return () => {
      topics.list.onItemSet.remove(onTopicsChanged);
      topics.list.onItemUpdated.remove(onTopicsChanged);
    };
  }, [components]);

  const createTopic = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const highlighter = components.get(OBCF.Highlighter);
    
    const currentSelection = structuredClone(highlighter.selection.select);

    if (Object.keys(currentSelection).length === 0) {
      alert("Please select an element before creating a topic.");
      return;
    }

    const fragments = components.get(OBC.FragmentsManager);
    const guids = await fragments.modelIdMapToGuids(currentSelection);

    const guidsSet = new Set([...guids]);

    console.log(" CreateTopic - Stored GUIDs:", [...guidsSet]);

    await highlighter.clear("select");
    setSelectionForTopic(guidsSet)
    setCreateModalOpen(true);
  };

  const handleCreateTopic = async (formData: any) => {
    if (!bcfTopics || !selectionForTopic) return;

    console.log(" HandleCreateTopic - Using GUIDs:", [...selectionForTopic]);

    const topic = bcfTopics.create({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      stage: formData.stage,
      labels: new Set([formData.labels]),
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    });

    const viewpoints = components.get(OBC.Viewpoints);
    const vp = viewpoints.create();
    if (vp) {
      vp.world = world;
      await vp.updateCamera();
      vp.selectionComponents.add(...selectionForTopic);
      console.log(" HandleCreateTopic - Saved to Viewpoint:", [...vp.selectionComponents]);
      topic.viewpoints.add(vp.guid);
    }

    setCreateModalOpen(false);
    setSelectionForTopic(null);
  };

  const handleEditTopic = (formData: any) => {
    if (!bcfTopics || !selectedTopic) return;

    const before = { ...selectedTopic };

    selectedTopic.title = formData.title;
    selectedTopic.description = formData.description;
    selectedTopic.type = formData.type;
    selectedTopic.priority = formData.priority;
    selectedTopic.stage = formData.stage;
    selectedTopic.labels = new Set([formData.labels]),
    selectedTopic.assignedTo = formData.assignedTo;
    selectedTopic.dueDate = formData.dueDate ? new Date(formData.dueDate) : undefined;

    const after = { ...selectedTopic };
    const editor = "signed.user@mail.com";

    const changes: HistoryRecord = {
      before,
      after,
      editor,
      timestamp: new Date().toLocaleString(),
    };

    if (!("history" in selectedTopic)) {
      (selectedTopic as ExtendedTopic).history = [];
    }
    (selectedTopic as ExtendedTopic).history!.push(changes);

    setTopicsList([...bcfTopics.list.values()]);
    setEditModalOpen(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !bcfTopics || !newComment.name || !newComment.comment) return;

    const newBcfComment: OBC.BCFApiComment = {
      guid: crypto.randomUUID(),
      date: new Date().toISOString(),
      author: newComment.name,
      comment: newComment.comment,
      viewpoint_guid: undefined,
    };

    selectedTopic.comments.set(newBcfComment.guid, newBcfComment as any);

    setTopicsList([...bcfTopics.list.values()]);
    setNewComment({ name: "", comment: "" });
  };

  const deleteTopic = (e: React.MouseEvent, guid: string) => {
    e.stopPropagation();
    if (!bcfTopics) return;
    bcfTopics.list.delete(guid);
    setTopicsList([...bcfTopics.list.values()]);
    if (selectedTopic?.guid === guid) {
      setSelectedTopic(null);
    }
  };

  const downloadBCF = async () => {
    if (!bcfTopics || !selectedTopic) return;
    const bcfData = await bcfTopics.export([selectedTopic]);
    const fileName = `${selectedTopic.title.replace(/[\\/:\*\?"<>\|]/g, '_')}.bcf`;
    const file = new File([bcfData], fileName, { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loadBCF = () => {
    if (!bcfTopics) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".bcf";
    input.addEventListener("change", async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const buffer = await file.arrayBuffer();
        const { topics } = await bcfTopics.load(new Uint8Array(buffer));
        const sanitizedTopics = topics.map((topic: any) => ({
          ...topic,
          dueDate: topic.dueDate ? new Date(topic.dueDate) : undefined,
          labels: topic.labels || new Set(),
          viewpoints: topic.viewpoints || new Set(),
        }));
        setTopicsList([...sanitizedTopics]);
      } catch (error) {
        console.error("Failed to load BCF file:", error);
        alert("Failed to load BCF file. It might be corrupted or in an unsupported format.");
      }
    });
    input.click();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    dragging.current = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging.current || !panelRef.current) return;

    const panel = panelRef.current;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;

    let left = e.clientX - dragOffset.current.x;
    let top = e.clientY - dragOffset.current.y;

    left = Math.max(0, Math.min(window.innerWidth - width, left));
    top = Math.max(0, Math.min(window.innerHeight - height, top));

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  };

  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  const handleMouseEnter = () => {
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.enabled = false;
  };

  const handleMouseLeave = () => {
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.enabled = true;
  };

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"} border rounded-lg shadow-lg flex flex-col overflow-hidden ${
        collapsed ? "w-40 h-12 cursor-pointer" : "w-96 max-h-[600px]"
      }`}
      style={{ bottom: "1rem", right: "1rem" }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`${darkMode ? "bg-blue-900" : "bg-blue-800"} text-amber-100 px-2 py-1 flex justify-between items-center font-bold cursor-grab select-none`}
        onMouseDown={onMouseDown}
      >
        <span>BCF Topics</span>
        <span onClick={() => setCollapsed(!collapsed)} className="cursor-pointer">{collapsed ?  "▲" : "▼" }</span>
      </div>

      {!collapsed && (
        <div className="p-2 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-2 py-1 rounded`}
              onClick={(e) => createTopic(e)}
            >
              Create
            </button>
            <button
              className={`${darkMode ? "bg-green-700 hover:bg-green-800" : "bg-green-800 hover:bg-green-900"} text-amber-100 px-2 py-1 rounded ${!selectedTopic ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={downloadBCF}
              disabled={!selectedTopic}
            >
              Export
            </button>
            <button
              className={`${darkMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-700 hover:bg-yellow-800"} text-amber-100 px-2 py-1 rounded`}
              onClick={loadBCF}
            >
              Load
            </button>
          </div>

          <div className="flex gap-2">
            {/* Topics List */}
            <div className={`flex-1 max-h-[500px] overflow-y-auto border ${darkMode ? "border-gray-600" : "border-gray-300"} p-1`}>
              <h5 className="font-semibold mb-1 fixed">Topics</h5>
              <br/>
              <ul>
                {topicsList.map((topic) => (
                  <li
                    key={topic.guid}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTopic(topic);
                      if (onTopicClick) {
                        const highlighter = components.get(OBCF.Highlighter);
                        highlighter.enabled = true;
                        onTopicClick(topic);
                      }
                    }}
                    className={`cursor-pointer p-1 flex justify-between items-center ${
                      selectedTopic?.guid === topic.guid ? (darkMode ? "bg-gray-600" : "bg-gray-200") : ""
                    }`}
                  >
                    <span className="truncate" title={topic.title}>{topic.title}</span>
                    <button
                      onClick={(e) => deleteTopic(e, topic.guid)}
                      className="text-red-500 hover:text-red-700 font-bold px-2"
                    >
                      X
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Topic Details */}
            <div className={`flex-2 max-h-[500px] overflow-y-auto border ${darkMode ? "border-gray-600" : "border-gray-300"} p-1`}>
              <div className="flex justify-between items-center">
                <h5 className="font-semibold mb-1">Details</h5>
                {selectedTopic && (
                  <div className="flex gap-2">
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  </div>
                )}
              </div>
              {selectedTopic ? (
                <div className="text-sm space-y-1">
                  <p><strong>Title:</strong> {selectedTopic.title}</p>
                  <p><strong>Description:</strong> {selectedTopic.description}</p>
                  <p><strong>Type:</strong> {selectedTopic.type}</p>
                  <p><strong>Priority:</strong> {selectedTopic.priority}</p>
                  <p><strong>Stage:</strong> {selectedTopic.stage}</p>
                  <p><strong>Labels:</strong> {Array.from(selectedTopic.labels).join(", ")}</p>
                  <p><strong>Assigned To:</strong> {selectedTopic.assignedTo || "Unassigned"}</p>
                  <p><strong>Due Date:</strong> {selectedTopic.dueDate?.toLocaleDateString()}</p>
                  <p><strong>Status:</strong> {selectedTopic.status || "No status"}</p>
                  <p><strong>Viewpoints:</strong> {Array.from(selectedTopic.viewpoints).join(", ")}</p>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => setHistoryModalOpen(true)}
                      className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
                    >
                      History
                    </button>
                  </div>
                  <div className="mt-4 pt-2 border-t border-gray-600">
                    <h6 className="font-semibold mb-2">Comments</h6>
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                      {selectedTopic.comments && Array.from(selectedTopic.comments.values()).map(comment => (
                        <div key={comment.guid} className={`p-2 rounded ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                          <p className="font-bold">{comment.author}</p>
                          <p>{comment.comment}</p>
                          <p className="text-xs text-gray-400">{new Date(comment.date).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleAddComment}>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Your name"
                          value={newComment.name}
                          onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                          className={`w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                          required
                        />
                        <textarea
                          placeholder="Add a comment..."
                          value={newComment.comment}
                          onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                          className={`w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                          required
                        />
                        <button type="submit" className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded self-end`}>
                          Add Comment
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No topic selected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <CreateTopicModal
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateTopic}
          bcfTopics={bcfTopics}
          darkMode={darkMode}
          topicsList={topicsList}
        />
      )}

      {isEditModalOpen && selectedTopic && (
        <EditTopicModal
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditTopic}
          bcfTopics={bcfTopics}
          topic={selectedTopic}
          darkMode={darkMode}
        />
      )}

      {isHistoryModalOpen && selectedTopic && (
        <HistoryModal
          onClose={() => setHistoryModalOpen(false)}
          bcfTopics={bcfTopics}
          topic={selectedTopic}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

const CreateTopicModal = ({ onClose, onSubmit, bcfTopics, darkMode, topicsList }: any) => {
  const [formData, setFormData] = useState<CreateTopicFormData>({
    title: "",
    description: "",
    type: "Clash",
    priority: "Normal",
    stage: "Design",
    labels: "",
    assignedTo: "",
    dueDate: "",
  });

  const [isAddingNew, setIsAddingNew] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");
  const [titleExists, setTitleExists] = useState(false);

  useEffect(() => {
    const existingTitles = new Set(topicsList.map((t: OBC.Topic) => t.title));
    let newIndex = 1;
    while (existingTitles.has(`NewTopic${newIndex}`)) {
      newIndex++;
    }
    setFormData((prev) => ({ ...prev, title: `NewTopic${newIndex}` }));
  }, [topicsList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "title") {
      const existingTitles = new Set(topicsList.map((t: OBC.Topic) => t.title));
      setTitleExists(existingTitles.has(value));
    }
    if (value === "add-new") {
      setIsAddingNew(name);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddNewOption = () => {
    if (!isAddingNew || !newOption || !bcfTopics) return;

    const configKeyMap: { [key: string]: string } = {
      type: "types",
      priority: "priorities",
      stage: "stages",
      labels: "labels",
      assignedTo: "users",
    };

    const configKey = configKeyMap[isAddingNew];
    if (!configKey) return;

    const newSet = new Set((bcfTopics.config as any)[configKey]);
    newSet.add(newOption);
    (bcfTopics.config as any)[configKey] = newSet;

    const formKey = isAddingNew;

    setFormData((prev) => ({ ...prev, [formKey]: newOption }));
    setIsAddingNew(null);
    setNewOption("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50" onMouseDown={(e) => e.stopPropagation()}>
      <div className={`${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"} p-4 rounded-lg shadow-lg w-1/3`}>
        <h3 className="text-lg font-bold mb-4">New Topic</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
              required
            />
            {titleExists && <p className="text-red-500 text-xs mt-1">A topic with this title already exists.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Type</label>
              {isAddingNew === "type" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="type" value={formData.type} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  {bcfTopics && Array.from(bcfTopics.config.types).map((type) => <option key={type as string} value={type as string}>{type as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Priority</label>
              {isAddingNew === "priority" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="priority" value={formData.priority} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  {bcfTopics && Array.from(bcfTopics.config.priorities).map((priority) => <option key={priority as string} value={priority as string}>{priority as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Labels</label>
              {isAddingNew === "labels" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="labels" value={formData.labels} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  <option value="">Select a label</option>
                  {bcfTopics && Array.from(bcfTopics.config.labels).map((label) => <option key={label as string} value={label as string}>{label as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Assigned To</label>
              {isAddingNew === "assignedTo" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  <option value="">Unassigned</option>
                  {bcfTopics && Array.from(bcfTopics.config.users).map((user) => <option key={user as string} value={user as string}>{user as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2 date-picker-input`}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Stage</label>
              {isAddingNew === "stage" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="stage" value={formData.stage} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  <option value="">Select a Stage</option>
                  {bcfTopics && Array.from(bcfTopics.config.stages).map((stage) => <option key={stage as string} value={stage as string}>{stage as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
            />
          </div>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
            <button type="submit" className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded ${titleExists ? "opacity-50 cursor-not-allowed" : ""}`} disabled={titleExists}>Add Topic</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditTopicModal = ({ onClose, onSubmit, bcfTopics, topic, darkMode }: any) => {
  const [formData, setFormData] = useState({
    title: topic.title,
    description: topic.description,
    type: topic.type,
    priority: topic.priority,
    stage: topic.stage,
    labels: Array.from(topic.labels).join(", "),
    assignedTo: topic.assignedTo || "",
    dueDate: topic.dueDate && !isNaN(topic.dueDate.getTime()) ? topic.dueDate.toISOString().split("T")[0] : "",
  });

  const [isAddingNew, setIsAddingNew] = useState<string | null>(null);
  const [newOption, setNewOption] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (value === "add-new") {
      setIsAddingNew(name);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddNewOption = () => {
    if (!isAddingNew || !newOption || !bcfTopics) return;

    const configKeyMap: { [key: string]: string } = {
      type: "types",
      priority: "priorities",
      stage: "stages",
      labels: "labels",
      assignedTo: "users",
    };

    const configKey = configKeyMap[isAddingNew];
    if (!configKey) return;

    const newSet = new Set((bcfTopics.config as any)[configKey]);
    newSet.add(newOption);
    (bcfTopics.config as any)[configKey] = newSet;

    const formKey = isAddingNew;

    setFormData((prev) => ({ ...prev, [formKey]: newOption }));
    setIsAddingNew(null);
    setNewOption("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50" onMouseDown={(e) => e.stopPropagation()}>
      <div className={`${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"} p-4 rounded-lg shadow-lg w-1/3`}>
        <h3 className="text-lg font-bold mb-4">Edit Topic</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Type</label>
              {isAddingNew === "type" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="type" value={formData.type} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  {bcfTopics && Array.from(bcfTopics.config.types).map((type) => <option key={type as string} value={type as string}>{type as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Priority</label>
              {isAddingNew === "priority" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="priority" value={formData.priority} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  {bcfTopics && Array.from(bcfTopics.config.priorities).map((priority) => <option key={priority as string} value={priority as string}>{priority as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Labels</label>
              {isAddingNew === "labels" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="labels" value={formData.labels} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  <option value="">Select a label</option>
                  {bcfTopics && Array.from(bcfTopics.config.labels).map((label) => <option key={label as string} value={label as string}>{label as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Assigned To</label>
              {isAddingNew === "assignedTo" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  <option value="">Unassigned</option>
                  {bcfTopics && Array.from(bcfTopics.config.users).map((user) => <option key={user as string} value={user as string}>{user as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2 date-picker-input`}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Stage</label>
              {isAddingNew === "stage" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
                  />
                  <button type="button" onClick={handleAddNewOption} className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Add</button>
                </div>
              ) : (
                <select name="stage" value={formData.stage} onChange={handleChange} className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}>
                  <option value="">Select a Stage</option>
                  {bcfTopics && Array.from(bcfTopics.config.stages).map((stage) => <option key={stage as string} value={stage as string}>{stage as string}</option>)}
                  <option value="add-new">Add New</option>
                </select>
              )}
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`mt-1 block w-full border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} rounded-md shadow-sm p-2`}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
            <button type="submit" className={`${darkMode ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-800 hover:bg-blue-900"} text-amber-100 px-4 py-2 rounded`}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  // Set Compare
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (let v of a) if (!b.has(v)) return false;
    return true;
  }

  // Array Compare
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }

  // Object Compare
  if (typeof a === 'object' && a && typeof b === 'object' && b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (let key of keys) {
      if (!isEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
};

const getDiff = (before: any, after: any) => {
  const diffs: { key: string; before: any; after: any }[] = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  keys.forEach((key) => {
    if (!isEqual(before?.[key], after?.[key])) {
      diffs.push({ key, before: before?.[key], after: after?.[key] });
    }
  });

  return diffs;
};

const HistoryModal = ({ onClose, topic, darkMode }: any) => {
  const extendedTopic = topic as ExtendedTopic;
  const history = extendedTopic.history || [];

  const formatValue = (val: any) => {
    if (val instanceof Set) return Array.from(val).join(", ");
    if (Array.isArray(val)) return val.join(", ");
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div
      className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={`${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"} p-4 rounded-lg shadow-lg w-1/2 max-h-[80vh] overflow-y-auto`}
      >
        <h3 className="text-lg font-bold mb-4">History - {topic.title}</h3>

        {history.length === 0 ? (
          <p className="text-gray-400">No history available for this topic.</p>
        ) : (
          <ul className="space-y-4">
            {history.map((record, idx) => {
              const diffs = getDiff(record.before, record.after);
              return (
                <li
                  key={idx}
                  className={`p-3 rounded border ${
                    darkMode ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Edited by <span className="font-bold">{record.editor}</span>
                    </span>
                    <span className="text-xs text-gray-400">{record.timestamp}</span>
                  </div>

                  {diffs.length === 0 ? (
                    <p className="text-xs text-gray-400">No changes detected.</p>
                  ) : (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-1 border-b">Field</th>
                          <th className="text-left p-1 border-b">Before</th>
                          <th className="text-left p-1 border-b">After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffs.map((d, i) => (
                          <tr key={i}>
                            <td className="p-1 font-semibold">{d.key}</td>
                            <td className="p-1 text-red-500">{formatValue(d.before)}</td>
                            <td className="p-1 text-green-500">{formatValue(d.after)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



export default BCFTopics;
