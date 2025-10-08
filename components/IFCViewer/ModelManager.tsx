"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeaderToggle from "@/components/header";
import Image from "next/image";

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
      <div className="p-4 flex justify-center">
        <Image src="/Type=Full.svg" alt="Type Full" width={200} height={50} />
      </div>

      <div className="flex flex-col justify-center items-center gap-2 mt-2 px-4">
        <label
          className={`w-full flex justify-center items-center font-medium px-6 py-2 rounded-xl cursor-pointer transition-colors duration-200
            ${darkMode ? "bg-dark-primary text-white hover:bg-dark-focus" : "bg-light-primary text-white hover:bg-light-focus"}`}
          >
            {isClient ? t("upload_ifc") : "Upload IFC File"}
            <input type="file" accept=".ifc" onChange={IfcUpload} className="hidden" />
          </label>
        <label
          className={`w-full flex justify-center items-center font-medium px-6 py-2 rounded-xl cursor-pointer transition-colors duration-200
            ${darkMode ? "bg-dark-default-400 text-white hover:bg-dark-default-300" : "bg-light-default-400 text-black hover:bg-light-default-500"}`}
          >
            {isClient ? t("upload_fragment") : "Upload Fragment File"}
            <input type="file" accept=".frag" onChange={handleFragmentUpload} className="hidden" />
          </label>
        <button
          className={`w-full px-6 py-2 rounded-xl font-medium cursor-pointer
            ${darkMode ? "bg-dark-danger text-white hover:bg-dark-danger-300" : "bg-light-danger text-white hover:bg-light-danger-400"} transition-colors duration-200`}
          onClick={deleteAllModels}
        >
          {isClient ? t("delete_all_models") : "Delete All Models"}
        </button>
      </div>

      <br />

      <h2 className={`text-lg font-semibold mb-4 px-4 ${darkMode ? "text-white" : "text-black"}`}>{isClient ? t("uploaded_models") : "Uploaded Models"}</h2>

      <hr />
      <br />

      <ul className="space-y-3 px-4 flex-1 overflow-auto">
        {uploadedModels.map((model) => (
          <li key={model.id}>
            <div className="flex flex-col gap-1">
              <span className="cursor-pointer hover:underline">{model.name}</span>
              <div className="flex space-x-1">
                <button
                  className={`${darkMode ? "bg-dark-primary text-white hover:bg-dark-focus" : "bg-light-primary text-white hover:bg-light-focus"} px-2 py-1 rounded text-xs transition-colors duration-200`}
                    onClick={() => handleDownloadIFC(model)}
                  >
                    {isClient ? t("ifc") : "IFC"}
                  </button>
                <button
                  className={`${darkMode ? "bg-dark-default-400 text-white hover:bg-dark-default-300" : "bg-light-default-400 text-black hover:bg-light-default-500"} px-2 py-1 rounded text-xs transition-colors duration-200`}
                  onClick={() => downloadFragments()}
                >
                  {isClient ? t("fragment") : "Fragment"}
                </button>
                <button
                  className={`${darkMode ? "bg-dark-danger text-white hover:bg-dark-danger-300" : "bg-light-danger text-white hover:bg-light-danger-400"} px-2 py-1 rounded text-xs transition-colors duration-200`}
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
