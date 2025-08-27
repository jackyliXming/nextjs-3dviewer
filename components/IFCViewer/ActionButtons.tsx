"use client";

import React from "react";
import { Eye, Focus, RefreshCcw } from "lucide-react";

interface ActionButtonsProps {
  darkMode: boolean;
  onToggleVisibility: () => void;
  onIsolate: () => void;
  onShow: () => void;
}

export default function ActionButtons({
  darkMode,
  onToggleVisibility,
  onIsolate,
  onShow,
}: ActionButtonsProps) {
  return (
    <div
      className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 px-4 py-2 rounded-xl shadow-lg
        ${darkMode ? "bg-gray-800 text-amber-100" : "bg-white text-gray-900"}`}
    >
      <button
        onClick={onToggleVisibility}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
          ${darkMode ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"} text-white`}
      >
        <Eye size={18} />
        Toggle Visibility
      </button>

      <button
        onClick={onIsolate}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
          ${darkMode ? "bg-green-800 hover:bg-green-900" : "bg-green-600 hover:bg-green-700"} text-white`}
      >
        <Focus size={18} />
        Isolate
      </button>

      <button
        onClick={onShow}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
          ${darkMode ? "bg-yellow-700 hover:bg-yellow-800" : "bg-yellow-600 hover:bg-yellow-700"} text-white`}
      >
        <RefreshCcw size={18} />
        Show All
      </button>
    </div>
  );
}
