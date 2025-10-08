import React, { useState, useEffect, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2, ChevronDown, ChevronRight, Pencil, PlusCircle, Search } from "lucide-react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { Spinner } from "@heroui/react";

interface Props {
  components: OBC.Components;
  darkMode: boolean;
  onClose: () => void;
  onToggleAddMode: (active: boolean, groupId: number | null) => void;
  onSearchResults: (groups: TResultGroup[]) => void;
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

export type SearchElementRef = {
  addItemToGroup: (groupId: number, item: TResultItem) => void;
};

const SearchElement = forwardRef<SearchElementRef, Props>(({ components, darkMode, onClose, onToggleAddMode, onSearchResults }, ref) => {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [queryRows, setQueryRows] = useState<TQueryRow[]>([
    { id: 0, attribute: "Category", operator: "include", value: "", logic: "AND" },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
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
          onSearchResults([newGroup]);
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
  }, [components, queryRows, groupCounter, t, onSearchResults]);

  return (
    <div className="flex flex-col h-full">
        {notification && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg z-10">
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
            {queryRows.map((row, index) => (
              <div key={row.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{isClient ? t("condition") : "Condition"} {index + 1}</span>
                  {queryRows.length > 1 && (
                    <button onClick={() => handleRemoveRow(row.id)} className="p-1 text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{isClient ? t("logic") : "Logic"}</label>
                    <select
                      value={row.logic}
                      onChange={(e) => handleRowChange(row.id, { logic: e.target.value as "AND" | "NOT" })}
                      className={`w-full p-2 mt-1 rounded border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                    >
                      <option>AND</option>
                      <option>NOT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{isClient ? t("attribute") : "Attribute"}</label>
                    <select
                      value={row.attribute}
                      onChange={(e) => handleRowChange(row.id, { attribute: e.target.value as any })}
                      className={`w-full p-2 mt-1 rounded border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                    >
                      <option value="Category">{isClient ? t("category") : "Category"}</option>
                      <option value="Name">{isClient ? t("name") : "Name"}</option>
                      <option value="ObjectType">{isClient ? t("object_type") : "ObjectType"}</option>
                      <option value="Tag">{isClient ? t("tag") : "Tag"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{isClient ? t("operator") : "Operator"}</label>
                    <select
                      value={row.operator}
                      onChange={(e) => handleRowChange(row.id, { operator: e.target.value as any })}
                      className={`w-full p-2 mt-1 rounded border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                    >
                      <option value="include">{isClient ? t("include") : "include"}</option>
                      <option value="equal">{isClient ? t("equal") : "equal"}</option>
                      <option value="startsWith">{isClient ? t("starts_with") : "startsWith"}</option>
                      <option value="endsWith">{isClient ? t("ends_with") : "endsWith"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{isClient ? t("value") : "Value"}</label>
                    {row.attribute === "Category" ? (
                      <select
                        value={row.value}
                        onChange={(e) => handleRowChange(row.id, { value: e.target.value })}
                        className={`w-full p-2 mt-1 rounded border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                      >
                        <option value="">{isClient ? t("select_category") : "Select category"}</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => handleRowChange(row.id, { value: e.target.value })}
                        placeholder={isClient ? t("enter_attribute", { attribute: row.attribute }) : `Enter ${row.attribute}...`}
                        className={`w-full p-2 mt-1 rounded border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button onClick={handleAddRow} className={`p-2 rounded flex items-center ${darkMode ? "bg-blue-700 text-white border-gray-600" : "bg-blue-500 text-gray-900 border-gray-300"} text-white`}>
              <Plus size={18} className="mr-1" />
              {isClient ? t("add_condition") : "Add Condition"}
            </button>
            <button onClick={handleSearch} disabled={isSearching} className={`p-2 px-4 rounded-xl flex items-center gap-2 ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white disabled:bg-gray-400`}>
              {isSearching ? <Spinner size="sm" /> : <Search size={18} />}
              {isSearching ? (isClient ? t("searching") : "Searching...") : (isClient ? t("search") : "Search")}
            </button>
          </div>

        </div>
      </div>
  );
});

export default SearchElement;
