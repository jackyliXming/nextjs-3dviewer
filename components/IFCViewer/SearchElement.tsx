import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X, Plus, Trash2 } from "lucide-react";
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

export default function SearchElement({ components, darkMode, onClose }: Props) {
  const [categories, setCategories] = useState<string[]>([]);
  const [queryRows, setQueryRows] = useState<TQueryRow[]>([
    { id: 0, attribute: "Category", operator: "include", value: "", logic: "AND" },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

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

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setNotification(null);
    try {
      const finder = components.get(OBC.ItemsFinder);
      const highlighter = components.get(OBCF.Highlighter);
      const hider = components.get(OBC.Hider);

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
      } else {
        await hider.set(true);
        setNotification("No elements found.");
      }
    } finally {
      setIsSearching(false);
    }
  }, [components, queryRows]);

  const nodeRef = useRef(null);

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div
        ref={nodeRef}
        className={`absolute flex flex-col left-80 top-14 w-[550px] border shadow-xl p-4 rounded-lg
          ${darkMode ? "bg-gray-900 text-amber-100 border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
      >
        {notification && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
            {notification}
          </div>
        )}
        <div className="handle flex items-center justify-between mb-2 cursor-move">
          <h3 className="text-2xl font-semibold">Search Elements</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-300" aria-label="Close search panel">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-500">
            <div className="w-1/6">Logic</div>
            <div className="w-1/4">Attribute</div>
            <div className="w-1/4">Operator</div>
            <div className="w-1/3">Value</div>
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
                <option>Category</option>
                <option>Name</option>
                <option>ObjectType</option>
                <option>Tag</option>
              </select>
              <select
                value={row.operator}
                onChange={(e) =>
                  handleRowChange(row.id, { operator: e.target.value as any })
                }
                className={`p-2 border-t border-b ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-gray-200 text-gray-900 border-gray-300"}`}
              >
                <option>include</option>
                <option>equal</option>
                <option>startsWith</option>
                <option>endsWith</option>
              </select>
              {row.attribute === "Category" ? (
                <select
                  value={row.value}
                  onChange={(e) => handleRowChange(row.id, { value: e.target.value })}
                  className={`w-full p-2 border-t border-b border-r rounded-r ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"}`}
                >
                  <option value="">Select category</option>
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
                  placeholder={`Enter ${row.attribute}...`}
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
            Add Condition
          </button>
          <div className="flex items-center gap-2">
            {isSearching && <Spinner size="sm" />}
            <button onClick={handleSearch} disabled={isSearching} className={`p-2 rounded ${darkMode ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"} text-white disabled:bg-gray-400`}>
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>
    </Draggable>
  );
}
