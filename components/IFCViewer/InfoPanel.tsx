import React, { useState } from "react";
import { X } from "lucide-react";

interface Props {
  darkMode: boolean;
  infoLoading: boolean;
  modelId: string | null;
  localId: number | null;
  attrs: Record<string, any> | null;
  psets: Record<string, Record<string, any>> | null;
  onClose: () => void;
}

export default function IFCInfoPanel({ darkMode, infoLoading, modelId, localId, attrs, psets, onClose }: Props) {
  const [searchText, setSearchText] = useState("");

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
    <div
      className={`absolute flex flex-col right-0 h-full w-[360px] border-l shadow-xl p-4 overflow-auto
        ${darkMode ? "bg-gray-900 text-amber-100 border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-semibold">Element Info</h3>
        <button onClick={onClose} className="p-1 rounded" aria-label="Close info panel">
          <X size={18} />
        </button>
      </div>

      <div className="text-l opacity-80 mb-3">
        {modelId ? `Model: ${modelId}` : ""}
        <br />
        {localId !== null ? ` Local ID: ${localId}` : ""}
      </div>

      {/* Search Bar */}
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search attributes & property sets..."
        className={`mb-3 p-2 rounded w-full border ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-gray-100 text-gray-900 border-gray-300"}`}
      />

      {infoLoading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : (
        <>
          <h4 className="font-semibold mb-1">Attributes</h4>
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
            <div className="text-sm opacity-60 mb-4">No attributes found.</div>
          )}

          <h4 className="font-semibold mb-1">Property Sets</h4>
          {filteredPsets && Object.keys(filteredPsets).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(filteredPsets).map(([pset, props]) => (
                <div key={pset} className="mb-2">
                  <div className="font-medium mb-1">{pset}</div>
                  <ul className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2 space-y-1`}>
                    {Object.entries(props).map(([propKey, value]) => (
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
            <div className="text-sm opacity-60">No property sets found.</div>
          )}
        </>
      )}
    </div>
  );
}
