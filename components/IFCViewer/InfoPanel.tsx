import React from "react";
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

      {infoLoading ? (
        <div className="text-sm opacity-70">Loading…</div>
            ) : (
              <>
                <h4 className="font-semibold mb-1">Attributes</h4>
                {attrs ? (
                  <div className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2 mb-4`}>
                    <ul className="space-y-1">
                      {Object.entries(attrs).filter(([key]) => !["_guid", "_localId"].includes(key)).map(([key, val]) => (
                        <li key={key} className="flex justify-between border-b border-gray-600/30 pb-1">
                          <span className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"} text-white`}>{key}</span>
                          <br/>                          
                          <span className="flex items-center px-2 py-1">{String(val?.value ?? "")}</span>
                          {val?.type && <span className={`flex items-center gap-2 px-2 py-2 rounded-lg text-gray-400 ml-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>({val.type})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm opacity-60 mb-4">No attributes.</div>
                )}
          <h4 className="font-semibold mb-1">Property Sets</h4>
                {psets && Object.keys(psets).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(psets).map(([pset, props]) => (
                      <div key={pset} className="mb-2">
                        <div className="font-medium mb-1">{pset}</div>
                        <ul className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2 space-y-1`}>
                          {Object.entries(props).map(([propKey, value]) => (
                            <li key={propKey} className="flex justify-between border-b border-gray-600/30 pb-1">
                              <span className={`flex items-center gap-2 px-4 py-2 rounded-lg ${darkMode ? "bg-green-800 hover:bg-green-900" : "bg-green-600 hover:bg-green-700"} text-white`}>{propKey}</span>
                              <br/>
                              <span className="flex items-center px-2">{String(value)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm opacity-60">No property sets.</div>
          )}
        </>
      )}
    </div>
  );
}
