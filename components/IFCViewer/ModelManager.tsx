"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeaderToggle from "@/components/header";

export interface UploadedModel {
  id: string;
  name: string;
  type: "ifc" | "frag" | "json";
  data?: ArrayBuffer;
}

interface ModelManagerProps {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  uploadedModels: UploadedModel[];
  IfcUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFragmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJSONUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadIFC: (model: UploadedModel) => void;
  downloadFragments: () => void;
  handleDownloadJSON: (model: UploadedModel) => void;
}

export default function ModelManager({
  darkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  uploadedModels,
  IfcUpload,
  handleFragmentUpload,
  handleJSONUpload,
  handleDownloadIFC,
  downloadFragments,
  handleDownloadJSON,
}: ModelManagerProps) {
  return (
    <aside
      className={`transition-width duration-300 flex flex-col
        ${darkMode ? "bg-gray-900 text-white" : "bg-indigo-400 text-white"}`}
      style={{ width: sidebarCollapsed ? "64px" : "320px", minWidth: sidebarCollapsed ? "64px" : "320px" }}
    >
      {!sidebarCollapsed && <HeaderToggle darkMode={darkMode} />}

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="self-end m-1 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {!sidebarCollapsed && (
        <div className="flex flex-col justify-center items-center gap-2 mt-2">
          <label
            className={` w-5/6 flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
              ${darkMode ? "bg-blue-800 text-amber-100 hover:bg-blue-900" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            Upload IFC File
            <input type="file" accept=".ifc" onChange={IfcUpload} className="hidden" />
          </label>
          <label
            className={` w-5/6 flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
              ${darkMode ? "bg-green-800 text-amber-100 hover:bg-green-900" : "bg-green-600 text-white hover:bg-green-700"}`}
          >
            Upload Fragment File
            <input type="file" accept=".frag" onChange={handleFragmentUpload} className="hidden" />
          </label>
          <label
            className={` w-5/6 flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
              ${darkMode ? "bg-yellow-700 text-amber-100 hover:bg-yellow-800" : "bg-yellow-600 text-white hover:bg-yellow-700"}`}
          >
            Upload JSON File
            <input type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
          </label>
        </div>
      )}

      <br />

      {!sidebarCollapsed && (
        <h2 className={`text-lg font-semibold mb-4 px-4 ${darkMode ? "text-amber-100" : "text-white"}`}>Uploaded Models</h2>
      )}

      <hr />
      <br />

      <ul className="space-y-3 px-4 flex-1 overflow-auto">
        {!sidebarCollapsed &&
          uploadedModels.map((model) => (
            <li key={model.id}>
              <div className="flex flex-col gap-1">
                <span className="cursor-pointer hover:underline">{model.name}</span>
                <div className="flex space-x-1">
                  <button
                    className={`${darkMode ? "bg-blue-800 text-amber-100 hover:bg-blue-900" : "bg-blue-600 text-white hover:bg-blue-700"} px-2 py-1 rounded text-xs`}
                    onClick={() => handleDownloadIFC(model)}
                  >
                    IFC
                  </button>
                  <button
                    className={`${darkMode ? "bg-green-800 text-amber-100 hover:bg-green-900" : "bg-green-600 text-white hover:bg-green-700"} px-2 py-1 rounded text-xs`}
                    onClick={() => downloadFragments()}
                  >
                    Fragment
                  </button>
                  <button
                    className={`${darkMode ? "bg-yellow-700 text-amber-100 hover:bg-yellow-800" : "bg-yellow-600 text-white hover:bg-yellow-700"} px-2 py-1 rounded text-xs`}
                    onClick={() => handleDownloadJSON(model)}
                  >
                    JSON
                  </button>
                </div>
                <hr
                  style={{
                    height: "11px",
                    border: "none",
                    borderTop: `3px ridge ${darkMode ? "#fbbf29" : "#4cedef"}`,
                  }}
                />
              </div>
            </li>
          ))}
      </ul>
    </aside>
  );
}
