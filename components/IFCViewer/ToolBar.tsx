"use client";

import React, {useState } from "react";
import { Scissors, Ruler, Square, PaintBucket } from "lucide-react";

interface ToolBarProps {
  darkMode: boolean;
  activeTool: "clipper" | "length" | "area" | "colorize" | null;
  onSelectTool: (tool: "clipper" | "length" | "area" | "colorize" | null) => void;
  lengthMode: "free" | "edge";
  setLengthMode: (mode: "free" | "edge") => void;
  areaMode: "free" | "square";
  setAreaMode: (mode: "free" | "square") => void;
  onColorize?: (color?: string) => void;
  onClearColor?: () => void;
}

export default function ToolBar({ darkMode, activeTool, onSelectTool, lengthMode, setLengthMode, areaMode, setAreaMode, onColorize, onClearColor, }: ToolBarProps) {
  const [pickedColor, setPickedColor] = useState<string>("#ff6600");

  const handleClick = (tool: "clipper" | "length" | "area" | "colorize") => {
    onSelectTool(tool);
  };

  const btnStyle = (tool: "clipper" | "length" | "area" | "colorize" ) =>
    `flex left-2 items-center justify-center w-12 h-12 rounded-lg transition-colors relative ${
      activeTool === tool
        ? darkMode
          ? "bg-gray-700 text-white"
          : "bg-gray-300 text-black"
        : darkMode
        ? "bg-white text-gray-600 hover:bg-gray-200"
        : "bg-gray-700 text-gray-400 hover:bg-gray-200"
    }`;

  const tooltipStyle = (tool: "clipper" | "length" | "area" | "colorize" , label: string) =>
    `absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md text-sm font-medium z-10 whitespace-nowrap shadow-lg ${
      darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"
    } ${activeTool === tool ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`;

   const getDescription = () => {
    switch (activeTool) {
      case "clipper":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>Clipper</b></span>
            </div>            
            <hr/>
            <span><b>*Double Left Click:</b> Create Clipping plane.</span>
            <br/>
            <span><b>*Drag the arrow:</b> Clip the model.</span>
            <br/>
            <span><b>*Click Clipper Button:</b> Quit Clipper Mode and delete all</span>
            <br/>
            <span><b>*Select the plane and press delete key twice:</b> Delete plane</span>
            <br/>
            <span><b>*Click the delete button below:</b> Delete All</span>
          </div>        
      );
      case "length":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>Length Measurement</b></span>
            </div>            
            <hr/>
            <span><b>*Double Left Click:</b> Create Dimension.</span>
            <br/>
            <span><b>*Click Length Measurement Button:</b> Quit Length Measurement Mode and delete all</span>
            <br/>
            <span><b>*Click the delete button below:</b> Delete All</span>
          </div>        
      );
      case "area":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>Area Measurement</b></span>
            </div>            
            <hr/>
            <span><b>*Double Left Click:</b> Create Dimension.</span>
            <br/>
            <span><b>*Enter:</b> Complete.</span>
            <br/>
            <span><b>*Click Area Measurement Button:</b> Quit Area Measurement Mode and delete all</span>
            <br/>
            <span><b>*Click the delete button below:</b> Delete All</span>
          </div>        
      );
      case "colorize":
        return (
          <div className="text-left">
            <div className="mb-1 font-bold text-center">
              <span><b>Colorize</b></span>
            </div>
            <hr />
            <span><b>*Left Click:</b> Colorize element.</span>
            {activeTool === "colorize" && (
              <div className="mt-2 flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <span>Pick Color:</span>
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
                    Clear Color
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => onColorize && onColorize(pickedColor)}
                  >
                    Apply Color
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

      <div className="group relative">
        <button
          className={btnStyle("colorize")}
          onClick={() => handleClick("colorize")}
        >
          <PaintBucket size={24} />
        </button>
        <span className={tooltipStyle("colorize","Colorize")}>Colorize</span>
      </div>

      <div
        className={`opacity-70 mt-6 w-45 text-sm rounded-lg p-1 shadow-md ${
          darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        {activeTool === "length" && (
          <div className="mb-2">
            <label className="mr-2 font-medium">Length Mode:</label>
            <select
              value={lengthMode}
              onChange={(e) => setLengthMode(e.target.value as "free" | "edge")}
              className="text-black rounded px-1 py-1 bg-gray-400"
            >
              <option value="free">Free</option>
              <option value="edge">Edge</option>
            </select>
          </div>
        )}

        {activeTool === "area" && (
          <div className="mb-2">
            <label className="mr-2 font-medium">Area Mode:</label>
            <select
              value={areaMode}
              onChange={(e) => setAreaMode(e.target.value as "free" | "square")}
              className="text-black rounded px-1 py-1 bg-gray-400"
            >
              <option value="free">Free</option>
              <option value="square">Square</option>
            </select>
          </div>
        )}

        {getDescription()}
      </div>
    </div>
  );
}
