"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Focus, RefreshCcw, Ghost, EyeOff, Pipette, Scissors, Ruler, Square, BoxSelect } from "lucide-react";
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
  onColorize?: (color?: string) => void;
  onClearColor?: () => void;
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
  const [pickedColor, setPickedColor] = useState<string>("#ff6600");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getDescription = () => {
    if (!isClient) return null;
    switch (activeTool) {
      case "clipper":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>{t("clipper_description_title")}</b></span>
            </div>            
            <hr/>
            <span><b>{t("clipper_description_1")}</b></span>
            <br/>
            <span><b>{t("clipper_description_2")}</b></span>
            <br/>
            <span><b>{t("clipper_description_3")}</b></span>
            <br/>
            <span><b>{t("clipper_description_4")}</b></span>
            <br/>
            <span><b>{t("clipper_description_5")}</b></span>
          </div>        
      );
      case "length":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>{t("length_measurement_description_title")}</b></span>
            </div>            
            <hr/>
            <span><b>{t("length_measurement_description_1")}</b></span>
            <br/>
            <span><b>{t("length_measurement_description_2")}</b></span>
            <br/>
            <span><b>{t("clipper_description_5")}</b></span>
          </div>        
      );
      case "area":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>{t("area_measurement_description_title")}</b></span>
            </div>            
            <hr/>
            <span><b>{t("area_measurement_description_1")}</b></span>
            <br/>
            <span><b>{t("area_measurement_description_2")}</b></span>
            <br/>
            <span><b>{t("area_measurement_description_3")}</b></span>
            <br/>
            <span><b>{t("clipper_description_5")}</b></span>
          </div>        
      );
      case "colorize":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>{t("colorize_description_title")}</b></span>
            </div>
            <hr />
            <span><b>{t("colorize_description_1")}</b></span>
            {activeTool === "colorize" && (
              <div className="mt-2 flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <span>{t("pick_color")}</span>
                  <input
                    type="color"
                    value={pickedColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      setPickedColor(color);
                      if (onColorize) onColorize(color);
                    }}
                    className="w-10 h-8 p-0 border-0 rounded cursor-pointer"
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                    onClick={() => onClearColor && onClearColor()}
                  >
                    {t("clear_color")}
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => onColorize && onColorize(pickedColor)}
                  >
                    {t("apply_color")}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const buttonClass = (tool: string | null) =>
    `p-2 rounded-md ${activeTool === tool && tool !== null ? (darkMode ? "bg-blue-600" : "bg-blue-400") : (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-300")}`;

  return (
    <>
      <div
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end gap-4 px-4 py-2 rounded-full shadow-lg
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
          <Tooltip content={isClient ? t("clipper") : "Clipper"}>
            <button onClick={() => onSelectTool("clipper")} className={buttonClass("clipper")}>
              <Scissors size={18} />
            </button>
          </Tooltip>
          <Tooltip content={isClient ? t("length_measurement") : "Length Measurement"}>
            <button onClick={() => onSelectTool("length")} className={buttonClass("length")}>
              <Ruler size={18} />
            </button>
          </Tooltip>
          <Tooltip content={isClient ? t("area_measurement") : "Area Measurement"}>
            <button onClick={() => onSelectTool("area")} className={buttonClass("area")}>
              <Square size={18} />
            </button>
          </Tooltip>
          <Tooltip content={isClient ? t("colorize") : "Colorize"}>
            <button onClick={() => onSelectTool("colorize")} className={buttonClass("colorize")}>
              <Pipette size={18} />
            </button>
          </Tooltip>
        </div>
        <span className="text-xs mt-1">{isClient ? t("tools") : "Tools"}</span>
      </div>
      </div>
      {activeTool && (
        <div
          className={`absolute bottom-24 right-4 opacity-70 mt-6 w-45 text-sm rounded-lg p-1 shadow-md ${
            darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-800"
          }`}
        >
        {isClient && activeTool === "length" && (
          <div className="mb-2">
            <label className="mr-2 font-medium">{t("length_mode")}</label>
            <select
              value={lengthMode}
              onChange={(e) => setLengthMode(e.target.value as "free" | "edge")}
              className="text-black rounded px-1 py-1 bg-gray-400"
            >
              <option value="free">{t("free")}</option>
              <option value="edge">{t("edge")}</option>
            </select>
          </div>
        )}

        {isClient && activeTool === "area" && (
          <div className="mb-2">
            <label className="mr-2 font-medium">{t("area_mode")}</label>
            <select
              value={areaMode}
              onChange={(e) => setAreaMode(e.target.value as "free" | "square")}
              className="text-black rounded px-1 py-1 bg-gray-400"
            >
              <option value="free">{t("free")}</option>
              <option value="square">{t("square")}</option>
            </select>
          </div>
        )}

        {getDescription()}
        </div>
      )}
    </>
  );
}
