"use client";

import React, {useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Scissors, Ruler, Square, PaintBucket, AlertTriangle, Search } from "lucide-react";

interface ToolBarProps {
  darkMode: boolean;
  activeTool: "clipper" | "length" | "area" | "colorize" | "collision" | "search" | null;
  onSelectTool: (tool: "clipper" | "length" | "area" | "colorize" | "collision" | "search" | null) => void;
  lengthMode: "free" | "edge";
  setLengthMode: (mode: "free" | "edge") => void;
  areaMode: "free" | "square";
  setAreaMode: (mode: "free" | "square") => void;
  onColorize?: (color?: string) => void;
  onClearColor?: () => void;
}

export default function ToolBar({ darkMode, activeTool, onSelectTool, lengthMode, setLengthMode, areaMode, setAreaMode, onColorize, onClearColor, }: ToolBarProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [pickedColor, setPickedColor] = useState<string>("#ff6600");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = (tool: "clipper" | "length" | "area" | "colorize" | "collision" | "search") => {
    onSelectTool(tool);
  };

  const btnStyle = (tool: "clipper" | "length" | "area" | "colorize" | "collision" | "search" ) =>
    `flex left-2 items-center justify-center w-12 h-12 rounded-lg transition-colors relative ${
      activeTool === tool
        ? darkMode
          ? "bg-gray-700 text-white"
          : "bg-gray-300 text-black"
        : darkMode
        ? "bg-white text-gray-600 hover:bg-gray-300"
        : "bg-gray-700 text-gray-400 hover:bg-gray-200"
    }`;

  const tooltipStyle = (tool: "clipper" | "length" | "area" | "colorize" | "collision" | "search" , label: string) =>
    `absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md text-sm font-medium z-10 whitespace-nowrap shadow-lg ${
      darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"
    } ${activeTool === tool ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`;

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

  return (
    <div className="absolute top-1/2 left-80 transform -translate-y-1/2 flex flex-col gap-4">
      <div className="group relative">
        <button className={btnStyle("clipper")} onClick={() => handleClick("clipper")}>
          <Scissors size={24} />
        </button>
        <span className={tooltipStyle("clipper", "Clipper")}>{isClient ? t("clipper") : "Clipper"}</span>
      </div>

      <div className="group relative">
        <button className={btnStyle("length")} onClick={() => handleClick("length")}>
          <Ruler size={24} />
        </button>
        <span className={tooltipStyle("length", "Length")}>{isClient ? t("length_measurement") : "Length Measurement"}</span>
      </div>

      <div className="group relative">
        <button className={btnStyle("area")} onClick={() => handleClick("area")}>
          <Square size={24} />
        </button>
        <span className={tooltipStyle("area", "Area")}>{isClient ? t("area_measurement") : "Area Measurement"}</span>
      </div>

      <div className="group relative">
        <button
          className={btnStyle("colorize")}
          onClick={() => handleClick("colorize")}
        >
          <PaintBucket size={24} />
        </button>
        <span className={tooltipStyle("colorize","Colorize")}>{isClient ? t("colorize") : "Colorize"}</span>
      </div>

      <div className="group relative">
        <button
          className={btnStyle("collision")}
          onClick={() => handleClick("collision")}
        >
          <AlertTriangle size={24} />
        </button>
        <span className={tooltipStyle("collision","Collision")}>{isClient ? t("collision_detection") : "Collision Detection"}</span>
      </div>

      <div className="group relative">
        <button
          className={btnStyle("search")}
          onClick={() => handleClick("search")}
        >
          <Search size={24} />
        </button>
        <span className={tooltipStyle("search","Search")}>{isClient ? t("search_elements") : "Search Elements"}</span>
      </div>

      <div
        className={`opacity-70 mt-6 w-45 text-sm rounded-lg p-1 shadow-md ${
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
    </div>
  );
}
