"use client";

import React from "react";
import { Scissors, Ruler, Square } from "lucide-react";

interface ToolbarProps {
  darkMode: boolean;
  activeTool: "clipper" | "length" | "area" | null;
  onSelectTool: (tool: "clipper" | "length" | "area") => void;
}

export default function ToolBar({ darkMode, activeTool, onSelectTool }: ToolbarProps) {
  const handleClick = (tool: "clipper" | "length" | "area") => {
    onSelectTool(tool);
  };

  const btnStyle = (tool: "clipper" | "length" | "area") =>
    `flex left-80 items-center justify-center w-12 h-12 rounded-lg transition-colors relative ${
      activeTool === tool
        ? darkMode
          ? "bg-gray-700 text-white"
          : "bg-gray-300 text-black"
        : darkMode
        ? "bg-white text-gray-600 hover:bg-gray-200"
        : "bg-gray-700 text-gray-400 hover:bg-gray-200"
    }`;

  const tooltipStyle = (tool: "clipper" | "length" | "area", label: string) =>
    `absolute left-90 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md text-sm font-medium z-10 whitespace-nowrap shadow-lg ${
      darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"
    } ${activeTool === tool ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`;

  return (
    <div className="absolute top-1/2 left-4 transform -translate-y-1/2 flex flex-col gap-4">
      <div className="group relative">
        <button className={btnStyle("clipper")} onClick={() => handleClick("clipper")}>
          <Scissors size={24} />
        </button>
        <span className={tooltipStyle("clipper", "Clipper")}>Clipper</span>
      </div>

      <div className="group relative">
        <button className={btnStyle("length")} onClick={() => handleClick("length")}>
          <Ruler size={24} />
        </button>
        <span className={tooltipStyle("length", "Length")}>Length Measurement</span>
      </div>

      <div className="group relative">
        <button className={btnStyle("area")} onClick={() => handleClick("area")}>
          <Square size={24} />
        </button>
        <span className={tooltipStyle("area", "Area")}>Area Measurement</span>
      </div>
    </div>
  );
}
