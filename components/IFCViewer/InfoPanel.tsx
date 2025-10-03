import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import * as OBC from "@thatopen/components";

interface Props {
  components: OBC.Components;
  darkMode: boolean;
  infoLoading: boolean;
  modelId: string | null;
  localId: number | null;
  attrs: Record<string, any> | null;
  psets: Record<string, Record<string, any>> | null;
  onClose: () => void;
}

export default function IFCInfoPanel({
  components,
  darkMode,
  infoLoading,
  modelId,
  localId,
  attrs,
  psets,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredAttrs = attrs
    ? Object.fromEntries(
        Object.entries(attrs).filter(
          ([key, val]) =>
            !["_guid", "_localId"].includes(key) &&
            (key.toLowerCase().includes(searchText.toLowerCase()) ||
              String(val?.value ?? "").toLowerCase().includes(searchText.toLowerCase()))
        )
      )
    : null;

  const filteredPsets = psets
    ? Object.fromEntries(
        Object.entries(psets)
          .map(([psetName, props]) => [
            psetName,
            Object.fromEntries(
              Object.entries(props).filter(
                ([propKey, value]) =>
                  propKey.toLowerCase().includes(searchText.toLowerCase()) ||
                  String(value).toLowerCase().includes(searchText.toLowerCase())
              )
            )
          ])
          .filter(([_, props]) => Object.keys(props).length > 0)
      )
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-semibold">{isClient ? t("element_info") : "Element Info"}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-300" aria-label="Close info panel">
          <X size={18} />
        </button>
      </div>

      <div className="text-l opacity-80 mb-3">
        {modelId ? `${isClient ? t("model") : "Model: "}${modelId}` : ""}
        <br />
        {localId !== null ? `${isClient ? t("local_id") : " Local ID: "}${localId}` : ""}
      </div>


      {/* Search Bar */}
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder={isClient ? t("search_attributes_property_sets") : "Search attributes & property sets..."}
        className={`mb-3 p-2 rounded w-full border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"}`}
      />

      {infoLoading ? (
        <div className="text-sm opacity-70">{isClient ? t("loading", { progress: '' }) : "Loading…"}</div>
      ) : (
        <>
          <h4 className="font-semibold mb-1">{isClient ? t("attributes") : "Attributes"}</h4>
          {filteredAttrs && Object.keys(filteredAttrs).length > 0 ? (
            <div className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2 mb-4`}>
              <ul className="space-y-1">
                {Object.entries(filteredAttrs).map(([key, val]) => (
                  <li key={key} className="flex justify-between border-b border-gray-600/30 pb-1">
                    <span className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"} text-white`}>{key}</span>
                    <span className="flex items-center px-2 py-1">{String(val?.value ?? "")}</span>
                    {val?.type && <span className={`flex items-center gap-2 px-2 py-2 rounded-lg text-gray-400 ml-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>({val.type})</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm opacity-60 mb-4">{isClient ? t("no_attributes_found") : "No attributes found."}</div>
          )}

          <h4 className="font-semibold mb-1">{isClient ? t("property_sets") : "Property Sets"}</h4>
          {filteredPsets && Object.keys(filteredPsets).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(filteredPsets).map(([pset, props]) => (
                <div key={pset} className="mb-2">
                  <div className="font-medium mb-1">{pset}</div>
                  <ul className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2 space-y-1`}>
                    {Object.entries(props as Record<string, any>).map(([propKey, value]) => (
                      <li key={propKey} className="flex justify-between border-b border-gray-600/30 pb-1">
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? "bg-green-800 hover:bg-green-900" : "bg-green-600 hover:bg-green-700"} text-white`}>{propKey}</span>
                        <span className="flex items-center px-2">{String(value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm opacity-60">{isClient ? t("no_property_sets_found") : "No property sets found."}</div>
          )}
        </>
      )}
    </div>
  );
}
