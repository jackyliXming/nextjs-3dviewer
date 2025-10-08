"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Focus, Ghost, EyeOff, Pipette, Scissors, Ruler, Square, BoxSelect } from "lucide-react";
import { Tooltip } from "@heroui/react";

interface ActionButtonsProps {
  darkMode: boolean;
  onToggleVisibility: () => void;
  onIsolate: () => void;
  onFocus: () => void;
  onShow: () => void;
  onGhost: () => void;
  isGhost: boolean;
  activeTool: "clipper" | "length" | "area" | "colorize" | "collision" | "search" | null;
  onSelectTool: (tool: "clipper" | "length" | "area" | "colorize" | "collision" | "search" | null) => void;
  lengthMode: "free" | "edge";
  setLengthMode: (mode: "free" | "edge") => void;
  areaMode: "free" | "square";
  setAreaMode: (mode: "free" | "square") => void;
  onColorize: (color: string) => void;
  onClearColor: () => void;
}

export default function ActionButtons({
  darkMode,
  onToggleVisibility,
  onIsolate,
  onFocus,
  onShow,
  onGhost,
  isGhost,
  activeTool,
  onSelectTool,
  lengthMode,
  setLengthMode,
  areaMode,
  setAreaMode,
  onColorize,
  onClearColor,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToolSelect = (tool: "clipper" | "length" | "area" | "colorize") => {
    if (activeTool === tool) {
      onSelectTool(null);
    } else {
      onSelectTool(tool);
    }
  };

  const buttonClass = (tool: string | null) =>
    `p-2 rounded-xl ${activeTool === tool && tool !== null ? (darkMode ? "bg-blue-600" : "bg-blue-400") : (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-300")}`;

  const renderOptionsPanel = (tool: "length" | "area" | "colorize") => {
    if (activeTool !== tool) return null;

    const panelBaseClasses = `absolute bottom-full mb-2 w-max p-2 rounded-xl shadow-lg flex flex-col items-center gap-2 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-200 text-black"}`;

    switch (tool) {
      case "length":
        return (
          <div className={`${panelBaseClasses} left-1/2 -translate-x-1/2`}>
            <span className="text-sm font-semibold">{t("length_mode")}</span>
            <div className="flex gap-2">
              <button onClick={() => setLengthMode("free")} className={`px-2 py-1 text-xs rounded ${lengthMode === 'free' ? 'bg-blue-500' : 'bg-gray-600'}`}>{t("free")}</button>
              <button onClick={() => setLengthMode("edge")} className={`px-2 py-1 text-xs rounded ${lengthMode === 'edge' ? 'bg-blue-500' : 'bg-gray-600'}`}>{t("edge")}</button>
            </div>
          </div>
        );
      case "area":
        return (
          <div className={`${panelBaseClasses} left-1/2 -translate-x-1/2`}>
            <span className="text-sm font-semibold">{t("area_mode")}</span>
            <div className="flex gap-2">
              <button onClick={() => setAreaMode("free")} className={`px-2 py-1 text-xs rounded ${areaMode === 'free' ? 'bg-blue-500' : 'bg-gray-600'}`}>{t("free")}</button>
              <button onClick={() => setAreaMode("square")} className={`px-2 py-1 text-xs rounded ${areaMode === 'square' ? 'bg-blue-500' : 'bg-gray-600'}`}>{t("Square")}</button>
            </div>
          </div>
        );
      case "colorize":
        return (
          <div className={`${panelBaseClasses} left-1/2 -translate-x-1/2`}>
            <span className="text-sm font-semibold">{t("pick_color")}</span>
            <input
              type="color"
              defaultValue="#ffa500"
              onChange={(e) => onColorize(e.target.value)}
              className="w-8 h-8"
            />
            <button onClick={onClearColor} className="mt-2 px-2 py-1 text-xs bg-red-500 rounded">{t("clear_colors")}</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end gap-4 px-4 py-2 rounded-xl shadow-lg
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Tooltip content={isClient ? t("show_all") : "Show All"}>
            <button onClick={onShow} className={buttonClass(null)}>
              <Eye size={18} />
            </button>
          </Tooltip>
          <Tooltip content={isClient ? t("toggle_ghost") : "Toggle Ghost"}>
            <button onClick={onGhost} className={`${buttonClass(null)} ${isGhost ? (darkMode ? "bg-purple-900" : "bg-purple-700") : ""}`}>
              <Ghost size={18} />
            </button>
          </Tooltip>
        </div>
        <span className="text-xs mt-1">{isClient ? t("visibility") : "Visibility"}</span>
      </div>

      <div className="h-6 border-l border-gray-500 self-center"></div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Tooltip content={isClient ? t("focus") : "Focus"}>
            <button onClick={onFocus} className={buttonClass(null)}>
              <Focus size={18} />
            </button>
          </Tooltip>
          <Tooltip content={isClient ? t("hide") : "Hide"}>
            <button onClick={onToggleVisibility} className={buttonClass(null)}>
              <EyeOff size={18} />
            </button>
          </Tooltip>
          <Tooltip content={isClient ? t("isolate") : "Isolate"}>
            <button onClick={onIsolate} className={buttonClass(null)}>
              <BoxSelect size={18} />
            </button>
          </Tooltip>
        </div>
        <span className="text-xs mt-1">{isClient ? t("selection") : "Selection"}</span>
      </div>

      <div className="h-6 border-l border-gray-500 self-center"></div>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Tooltip content={isClient ? t("clipper") : "Clipper"}>
              <button onClick={() => handleToolSelect("clipper")} className={buttonClass("clipper")}>
                <Scissors size={18} />
              </button>
            </Tooltip>
          </div>
          <div className="relative">
            <Tooltip content={isClient ? t("length_measurement") : "Length Measurement"}>
              <button onClick={() => handleToolSelect("length")} className={buttonClass("length")}>
                <Ruler size={18} />
              </button>
            </Tooltip>
            {renderOptionsPanel("length")}
          </div>
          <div className="relative">
            <Tooltip content={isClient ? t("area_measurement") : "Area Measurement"}>
              <button onClick={() => handleToolSelect("area")} className={buttonClass("area")}>
                <Square size={18} />
              </button>
            </Tooltip>
            {renderOptionsPanel("area")}
          </div>
          <div className="relative">
            <Tooltip content={isClient ? t("colorize") : "Colorize"}>
              <button onClick={() => handleToolSelect("colorize")} className={buttonClass("colorize")}>
                <Pipette size={18} />
              </button>
            </Tooltip>
            {renderOptionsPanel("colorize")}
          </div>
        </div>
        <span className="text-xs mt-1">{isClient ? t("tools") : "Tools"}</span>
      </div>
    </div>
  );
}
