import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import Draggable from "react-draggable";
import { Spinner } from "@heroui/react";

interface Props {
  components: OBC.Components;
  darkMode: boolean;
  onClose: () => void;
}

type TQueryRow = {
  id: number;
  attribute: "Category" | "Name" | "ObjectType" | "Tag";
  operator: "equal" | "include" | "startsWith" | "endsWith";
  value: string;
  logic: "AND" | "NOT";
};

type TResultItem = {
  id: string;
  name: string;
  expressID: number;
  fragmentId: string;
};

type TResultGroup = {
  id: number;
  name: string;
  items: TResultItem[];
  isCollapsed: boolean;
  isEditing: boolean;
};

export default function SearchElement({ components, darkMode, onClose }: Props) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [queryRows, setQueryRows] = useState<TQueryRow[]>([
    { id: 0, attribute: "Category", operator: "include", value: "", logic: "AND" },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [resultGroups, setResultGroups] = useState<TResultGroup[]>([]);
  const [groupCounter, setGroupCounter] = useState(1);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const getCategories = async () => {
      const fragments = components.get(OBC.FragmentsManager);
      const allCats: Set<string> = new Set();
      for (const model of fragments.list.values()) {
        const cats = await model.getItemsOfCategories([/.*/]);
        Object.keys(cats).forEach((c) => allCats.add(c));
      }
      setCategories(Array.from(allCats).sort());
    };
    getCategories();
  }, [components]);

  const handleAddRow = () => {
    setQueryRows([
      ...queryRows,
      { id: queryRows.length, attribute: "Name", operator: "include", value: "", logic: "AND" },
    ]);
  };

  const handleRemoveRow = (id: number) => {
    setQueryRows(queryRows.filter((row) => row.id !== id));
  };

  const handleRowChange = (id: number, newRow: Partial<TQueryRow>) => {
    setQueryRows(
      queryRows.map((row) => (row.id === id ? { ...row, ...newRow } : row))
    );
  };

  const toggleGroupCollapse = (groupId: number) => {
    setResultGroups(
      resultGroups.map((group) =>
        group.id === groupId ? { ...group, isCollapsed: !group.isCollapsed } : group
      )
    );
  };

  const handleGroupNameChange = (groupId: number, newName: string) => {
    setResultGroups(
      resultGroups.map((group) =>
        group.id === groupId ? { ...group, name: newName, isEditing: false } : group
      )
    );
  };

  const toggleGroupNameEdit = (groupId: number) => {
    setResultGroups(
      resultGroups.map((group) =>
        group.id === groupId ? { ...group, isEditing: !group.isEditing } : group
      )
    );
  };

  const handleDeleteGroup = (groupId: number) => {
    setResultGroups(resultGroups.filter((group) => group.id !== groupId));
    // Optionally, update the 3D view to show all elements again if no groups are left
  };

  const handleDeleteItem = (groupId: number, itemId: string) => {
    setResultGroups(
      resultGroups.map((group) => {
        if (group.id === groupId) {
          const newItems = group.items.filter((item) => item.id !== itemId);
          return { ...group, items: newItems };
        }
        return group;
      })
    );
    // Optionally, update the 3D view to de-select the removed item
  };

  const handleItemClick = async (fragmentId: string, expressID: number) => {
    const hider = components.get(OBC.Hider);
    await hider.set(true, { [fragmentId]: new Set([expressID]) });

    const highlighter = components.get(OBCF.Highlighter);
    await highlighter.highlightByID("select", { [fragmentId]: new Set([expressID]) }, true, true);
  };

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setNotification(null);
    try {
      const finder = components.get(OBC.ItemsFinder);
      const highlighter = components.get(OBCF.Highlighter);
      const hider = components.get(OBC.Hider);
      const fragments = components.get(OBC.FragmentsManager);

      type ModelIdMap = { [id: string]: Set<number> };

      const getAllItems = async (): Promise<ModelIdMap> => {
        const allItemsQueryName = "temp-get-all-items";
        if (finder.list.has(allItemsQueryName)) {
          finder.list.delete(allItemsQueryName);
        }
        finder.create(allItemsQueryName, [{ categories: [/.*/] }]);
        const query = finder.list.get(allItemsQueryName);
        if (!query) return {};
        const allItems = await query.test();
        finder.list.delete(allItemsQueryName);
        return allItems;
      };

      const intersect = (map1: ModelIdMap, map2: ModelIdMap): ModelIdMap => {
        const result: ModelIdMap = {};
        for (const fragmentId in map1) {
          if (map2[fragmentId]) {
            const items1 = map1[fragmentId];
            const items2 = map2[fragmentId];
            const intersection = new Set([...items1].filter(item => items2.has(item)));
            if (intersection.size > 0) {
              result[fragmentId] = intersection;
            }
          }
        }
        return result;
      };

      const difference = (map1: ModelIdMap, map2: ModelIdMap): ModelIdMap => {
        const result: ModelIdMap = {};
        for (const fragmentId in map1) {
          const items1 = map1[fragmentId];
          if (map2[fragmentId]) {
            const items2 = map2[fragmentId];
            const diff = new Set([...items1].filter(item => !items2.has(item)));
            if (diff.size > 0) {
              result[fragmentId] = diff;
            }
          } else {
            result[fragmentId] = new Set(items1);
          }
        }
        return result;
      };

      await highlighter.clear("select");

      const activeQueries = queryRows.filter(row => row.value);

      if (activeQueries.length === 0) {
        await hider.set(false);
        return;
      }

      let finalResult: ModelIdMap | null = null;

      for (let i = 0; i < activeQueries.length; i++) {
        const row = activeQueries[i];

        const isCategory = row.attribute === "Category";
        let regex;
        switch (row.operator) {
          case "equal": regex = new RegExp(`^${row.value}$`, "i"); break;
          case "startsWith": regex = new RegExp(`^${row.value}`, "i"); break;
          case "endsWith": regex = new RegExp(`${row.value}$`, "i"); break;
          default: regex = new RegExp(row.value, "i"); break;
        }

        const queryPart = isCategory
          ? { categories: [regex] }
          : { attributes: { queries: [{ name: new RegExp(row.attribute, "i"), value: regex }] } };
        
        const queryName = `query-row-${i}`;
        if (finder.list.has(queryName)) finder.list.delete(queryName);
        finder.create(queryName, [queryPart]);
        const query = finder.list.get(queryName);
        if (!query) continue;

        const currentQueryResult = await query.test();
        finder.list.delete(queryName);

        if (i === 0) {
          if (row.logic === "NOT") {
            const allItems = await getAllItems();
            finalResult = difference(allItems, currentQueryResult);
          } else { // AND
            finalResult = currentQueryResult;
          }
        } else {
          if (finalResult) {
            if (row.logic === "NOT") {
              finalResult = difference(finalResult, currentQueryResult);
            } else { // AND
              finalResult = intersect(finalResult, currentQueryResult);
            }
          }
        }
      }

      if (finalResult && Object.keys(finalResult).length > 0) {
        await hider.isolate(finalResult);

        const foundItems: TResultItem[] = [];
        for (const fragmentId in finalResult) {
          const model = fragments.list.get(fragmentId);
          if (!model) continue;
          const expressIDs = Array.from(finalResult[fragmentId]);
          const itemsData = await model.getItemsData(expressIDs, { attributesDefault: true });

          for (const itemData of itemsData) {
            const localIdAttribute = itemData._localId as OBC.IDSAttribute;
            const localId = localIdAttribute?.value;

            if (typeof localId === 'number') {
              let name = `Element ${localId}`;
              const nameAttribute = itemData.Name as OBC.IDSAttribute;
              if (nameAttribute && typeof nameAttribute.value === 'string') {
                name = nameAttribute.value;
              }

              foundItems.push({
                id: `${fragmentId}-${localId}`,
                name: name,
                expressID: localId,
                fragmentId: fragmentId,
              });
            }
          }
        }

        if (foundItems.length > 0) {
          const newGroup: TResultGroup = {
            id: groupCounter,
            name: t("element_group", { count: groupCounter }),
            items: foundItems,
            isCollapsed: false,
            isEditing: false,
          };
          setResultGroups((prevGroups) => [...prevGroups, newGroup]);
          setGroupCounter((prevCounter) => prevCounter + 1);
        } else {
          setNotification(t("no_elements_found"));
        }

      } else {
        await hider.set(true);
        setNotification(t("no_elements_found"));
      }
    } finally {
      setIsSearching(false);
    }
  }, [components, queryRows, groupCounter, t]);

  const nodeRef = useRef(null);

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div
        ref={nodeRef}
        className={`absolute flex flex-col left-80 top-14 w-[550px] max-h-[80vh] border shadow-xl p-4 rounded-lg
          ${darkMode ? "bg-gray-900 text-amber-100 border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
      >
        {notification && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-10">
            {notification}
          </div>
        )}
        <div className="handle flex items-center justify-between mb-2 cursor-move">
          <h3 className="text-2xl font-semibold">{isClient ? t("search_elements") : "Search Elements"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-300" aria-label="Close search panel">
            <X size={18} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
              <div className="w-1/6">{isClient ? t("logic") : "Logic"}</div>
              <div className="w-1/4">{isClient ? t("attribute") : "Attribute"}</div>
              <div className="w-1/4">{isClient ? t("operator") : "Operator"}</div>
              <div className="w-1/3">{isClient ? t("value") : "Value"}</div>
            </div>
            {queryRows.map((row) => (
              <div key={row.id} className="flex items-center space-x-2">
                <select
                  value={row.logic}
                  onChange={(e) =>
                    handleRowChange(row.id, { logic: e.target.value as "AND" | "NOT" })
                  }
                  className={`p-2 rounded-l border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-200 text-gray-900 border-gray-300"}`}
                >
                  <option>AND</option>
                  <option>NOT</option>
                </select>
                <select
                  value={row.attribute}
                  onChange={(e) =>
                    handleRowChange(row.id, {
                      attribute: e.target.value as any,
                    })
                  }
                  className={`p-2 border-t border-b ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-200 text-gray-900 border-gray-300"}`}
                >
                  <option value="Category">{isClient ? t("category") : "Category"}</option>
                  <option value="Name">{isClient ? t("name") : "Name"}</option>
                  <option value="ObjectType">{isClient ? t("object_type") : "ObjectType"}</option>
                  <option value="Tag">{isClient ? t("tag") : "Tag"}</option>
                </select>
                <select
                  value={row.operator}
                  onChange={(e) =>
                    handleRowChange(row.id, { operator: e.target.value as any })
                  }
                  className={`p-2 border-t border-b ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-200 text-gray-900 border-gray-300"}`}
                >
                  <option value="include">{isClient ? t("include") : "include"}</option>
                  <option value="equal">{isClient ? t("equal") : "equal"}</option>
                  <option value="startsWith">{isClient ? t("starts_with") : "startsWith"}</option>
                  <option value="endsWith">{isClient ? t("ends_with") : "endsWith"}</option>
                </select>
                {row.attribute === "Category" ? (
                  <select
                    value={row.value}
                    onChange={(e) => handleRowChange(row.id, { value: e.target.value })}
                    className={`w-full p-2 border-t border-b border-r rounded-r ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"}`}
                  >
                    <option value="">{isClient ? t("select_category") : "Select category"}</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleRowChange(row.id, { value: e.target.value })}
                    placeholder={isClient ? t("enter_attribute", { attribute: row.attribute }) : `Enter ${row.attribute}...`}
                    className={`w-full p-2 border-t border-b border-r rounded-r ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"}`}
                  />
                )}
                <button onClick={() => handleRemoveRow(row.id)} className="p-2 text-red-500 hover:text-red-700">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button onClick={handleAddRow} className={`p-2 rounded flex items-center ${darkMode ? "bg-green-800 hover:bg-green-900" : "bg-green-600 hover:bg-green-700"} text-white`}>
              <Plus size={18} className="mr-1" />
              {isClient ? t("add_condition") : "Add Condition"}
            </button>
            <div className="flex items-center gap-2">
              {isSearching && <Spinner size="sm" />}
              <button onClick={handleSearch} disabled={isSearching} className={`p-2 rounded ${darkMode ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"} text-white disabled:bg-gray-400`}>
                {isSearching ? (isClient ? t("searching") : "Searching...") : (isClient ? t("search") : "Search")}
              </button>
            </div>
          </div>

          <hr className={`my-4 ${darkMode ? "border-gray-700" : "border-gray-300"}`} />

          <div className="space-y-2">
            <h4 className="text-lg font-semibold">{t("search_results")}</h4>
            {resultGroups.length === 0 && <p className="text-gray-500">{t("no_results_yet")}</p>}
            {resultGroups.map((group) => (
              <div key={group.id} className={`border rounded-md ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                <div className={`flex items-center justify-between p-2 rounded-t-md cursor-pointer ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} onClick={() => toggleGroupCollapse(group.id)}>
                  <div className="flex items-center flex-grow">
                    {group.isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    {group.isEditing ? (
                      <input
                        type="text"
                        defaultValue={group.name}
                        className={`ml-2 p-1 text-sm rounded ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => handleGroupNameChange(group.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleGroupNameChange(group.id, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold ml-2">{group.name}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <button onClick={(e) => { e.stopPropagation(); toggleGroupNameEdit(group.id); }} className="p-1 text-gray-400 hover:text-white">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="p-1 text-red-500 hover:text-red-700">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {!group.isCollapsed && (
                  <ul className="p-2 space-y-1 max-h-48 overflow-y-auto">
                    {group.items.map((item) => (
                      <li 
                        key={item.id} 
                        className={`flex items-center justify-between p-1 rounded cursor-pointer ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                        onClick={() => handleItemClick(item.fragmentId, item.expressID)}
                      >
                        <span className="truncate" title={item.name}>{item.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(group.id, item.id);
                          }} 
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Draggable>
  );
}
