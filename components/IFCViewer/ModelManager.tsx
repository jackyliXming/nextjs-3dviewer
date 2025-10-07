"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  uploadedModels: UploadedModel[];
  IfcUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFragmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleJSONUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadIFC: (model: UploadedModel) => void;
  downloadFragments: () => void;
  handleDownloadJSON: (model: UploadedModel) => void;
  deleteAllModels: () => void;
  deleteSelectedModel: (model: UploadedModel) => void;
}

export default function ModelManager({
  darkMode,
  uploadedModels,
  IfcUpload,
  handleFragmentUpload,
  handleJSONUpload,
  handleDownloadIFC,
  downloadFragments,
  handleDownloadJSON,
  deleteAllModels,
  deleteSelectedModel,
}: ModelManagerProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <HeaderToggle darkMode={darkMode} />

      <div className="flex flex-col justify-center items-center gap-2 mt-2 px-4">
        <label
          className={`w-full flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
            ${darkMode ? "bg-blue-800 text-amber-100 hover:bg-blue-900" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {isClient ? t("upload_ifc") : "Upload IFC File"}
            <input type="file" accept=".ifc" onChange={IfcUpload} className="hidden" />
          </label>
        <label
          className={`w-full flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
            ${darkMode ? "bg-gray-700 text-amber-100 hover:bg-gray-800" : "bg-gray-600 text-white hover:bg-gray-700"}`}
          >
            {isClient ? t("upload_fragment") : "Upload Fragment File"}
            <input type="file" accept=".frag" onChange={handleFragmentUpload} className="hidden" />
          </label>
        <label
          className={`w-full flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
            ${darkMode ? "bg-gray-700 text-amber-100 hover:bg-gray-800" : "bg-gray-600 text-white hover:bg-gray-700"}`}
          >
            {isClient ? t("upload_json") : "Upload JSON File"}
            <input type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
          </label>
        <button
          className={`w-full px-6 py-2 rounded-lg font-medium
            ${darkMode ? "bg-red-700 text-amber-100 hover:bg-red-800" : "bg-red-600 text-white hover:bg-red-700"}`}
          onClick={deleteAllModels}
          >
            {isClient ? t("delete_all_models") : "Delete All Models"}
          </button>
      </div>

      <br />

      <h2 className={`text-lg font-semibold mb-4 px-4 ${darkMode ? "text-amber-100" : "text-black"}`}>{isClient ? t("uploaded_models") : "Uploaded Models"}</h2>

      <hr />
      <br />

      <ul className="space-y-3 px-4 flex-1 overflow-auto">
        {uploadedModels.map((model) => (
          <li key={model.id}>
            <div className="flex flex-col gap-1">
              <span className="cursor-pointer hover:underline">{model.name}</span>
              <div className="flex space-x-1">
                <button
                  className={`${darkMode ? "bg-blue-800 text-amber-100 hover:bg-blue-900" : "bg-blue-600 text-white hover:bg-blue-700"} px-2 py-1 rounded text-xs`}
                    onClick={() => handleDownloadIFC(model)}
                  >
                    {isClient ? t("ifc") : "IFC"}
                  </button>
                <button
                  className={`${darkMode ? "bg-gray-700 text-amber-100 hover:bg-gray-800" : "bg-gray-600 text-white hover:bg-gray-700"} px-2 py-1 rounded text-xs`}
                  onClick={() => downloadFragments()}
                >
                  {isClient ? t("fragment") : "Fragment"}
                </button>
                <button
                  className={`${darkMode ? "bg-gray-700 text-amber-100 hover:bg-gray-800" : "bg-gray-600 text-white hover:bg-gray-700"} px-2 py-1 rounded text-xs`}
                    onClick={() => handleDownloadJSON(model)}
                  >
                    {isClient ? t("json") : "JSON"}
                  </button>
                <button
                  className={`${darkMode ? "bg-red-700 text-amber-100 hover:bg-red-800" : "bg-red-600 text-white hover:bg-red-700"} px-2 py-1 rounded text-xs`}
                  onClick={() => deleteSelectedModel(model)}
                >
                  {isClient ? t("delete") : "Delete"}
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
    </div>
  );
}
