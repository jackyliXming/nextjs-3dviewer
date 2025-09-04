// BCFTopics.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import * as OBC from "@thatopen/components";

interface BCFTopicsProps {
  components: OBC.Components;
  world: OBC.World;
}

interface CreateTopicFormData {
  title: string;
  description: string;
  type: string;
  priority: string;
  stage: string;
  labels: string[];
  assignedTo: string;
}

const BCFTopics: React.FC<BCFTopicsProps> = ({ components, world }) => {
  const [bcfTopics, setBcfTopics] = useState<OBC.BCFTopics | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<OBC.Topic | null>(null);
  const [topicsList, setTopicsList] = useState<OBC.Topic[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

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

    topics.list.onItemSet.add(() => setTopicsList([...topics.list.values()]));
    topics.list.onItemUpdated.add(() => setTopicsList([...topics.list.values()]));

    setBcfTopics(topics);
  }, [components]);

  const createTopic = () => {
    setCreateModalOpen(true);
  };

  const handleCreateTopic = (formData: any) => {
    if (!bcfTopics) return;

    const topic = bcfTopics.create({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      stage: formData.stage,
      labels: new Set(formData.labels),
      assignedTo: formData.assignedTo,
    });

    const viewpoints = components.get(OBC.Viewpoints);
    const vp = viewpoints.create();
    vp.world = world;
    topic.viewpoints.add(vp.guid);
    setCreateModalOpen(false);
  };

  const downloadBCF = async () => {
    if (!bcfTopics) return;
    const bcfData = await bcfTopics.export([...bcfTopics.list.values()]);
    const file = new File([bcfData], "topics.bcf");
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
      const file = input.files?.[0];
      if (!file) return;
      const buffer = await file.arrayBuffer();
      const { topics } = await bcfTopics.load(new Uint8Array(buffer));
      setTopicsList([...topics]);
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

  return (
    <div
      ref={panelRef}
      className={`fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col overflow-hidden ${
        collapsed ? "w-12 h-12 cursor-pointer" : "w-96 max-h-[600px]"
      }`}
      style={{ bottom: "1rem", right: "1rem" }}
    >
      <div
        className="bg-blue-800 text-amber-100 px-2 py-1 flex justify-between items-center font-bold cursor-grab select-none"
        onMouseDown={onMouseDown}
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>BCF Topics</span>
        <span>{collapsed ? "▼" : "▲"}</span>
      </div>

      {!collapsed && (
        <div className="p-2 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              className="bg-blue-800 text-amber-100 hover:bg-blue-900 px-2 py-1 rounded"
              onClick={createTopic}
            >
              Create
            </button>
            <button
              className="bg-green-800 text-amber-100 hover:bg-green-900 px-2 py-1 rounded"
              onClick={downloadBCF}
            >
              Export
            </button>
            <button
              className="bg-yellow-700 text-amber-100 hover:bg-yellow-800 px-2 py-1 rounded"
              onClick={loadBCF}
            >
              Load
            </button>
          </div>

          <div className="flex gap-2">
            {/* Topics List */}
            <div className="flex-1 max-h-[500px] overflow-y-auto border border-gray-300 p-1">
              <h5 className="font-semibold mb-1 fixed">Topics</h5>
              <br/>
              <ul>
                {topicsList.map((topic) => (
                  <li
                    key={topic.guid}
                    onClick={() => setSelectedTopic(topic)}
                    className={`cursor-pointer p-1 ${
                      selectedTopic?.guid === topic.guid ? "bg-gray-200" : ""
                    }`}
                  >
                    {topic.title}
                  </li>
                ))}
              </ul>
            </div>

            {/* Topic Details */}
            <div className="flex-2 max-h-[500px] overflow-y-auto border border-gray-300 p-1">
              <h5 className="font-semibold mb-1">Details</h5>
              {selectedTopic ? (
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Title:</strong> {selectedTopic.title}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedTopic.description}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedTopic.status || "No status"}
                  </p>
                  <p>
                    <strong>Assigned To:</strong> {selectedTopic.assignedTo || "Unassigned"}
                  </p>
                  <p>
                    <strong>Viewpoints:</strong> {Array.from(selectedTopic.viewpoints).join(", ")}
                  </p>
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
        />
      )}
    </div>
  );
};

const CreateTopicModal = ({ onClose, onSubmit, bcfTopics }: any) => {
  const [formData, setFormData] = useState<CreateTopicFormData>({
    title: "",
    description: "",
    type: "Clash",
    priority: "Normal",
    stage: "Design",
    labels: [],
    assignedTo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, labels: values }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-1/3">
        <h3 className="text-lg font-bold mb-4">Create BCF Topic</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                {bcfTopics && Array.from(bcfTopics.config.types).map((type) => <option key={type as string} value={type as string}>{type as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                {bcfTopics && Array.from(bcfTopics.config.priorities).map((priority) => <option key={priority as string} value={priority as string}>{priority as string}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <select name="stage" value={formData.stage} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                {bcfTopics && Array.from(bcfTopics.config.stages).map((stage) => <option key={stage as string} value={stage as string}>{stage as string}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option value="">Unassigned</option>
                {bcfTopics && Array.from(bcfTopics.config.users).map((user) => <option key={user as string} value={user as string}>{user as string}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Labels</label>
            <select multiple name="labels" value={formData.labels} onChange={handleLabelChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
              {bcfTopics && Array.from(bcfTopics.config.labels).map((label) => <option key={label as string} value={label as string}>{label as string}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
            <button type="submit" className="bg-blue-800 text-amber-100 px-4 py-2 rounded">Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BCFTopics;
