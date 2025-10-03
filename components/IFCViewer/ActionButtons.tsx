"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Focus, RefreshCcw, Ghost, EyeOff, Pipette } from "lucide-react";
import { Tooltip } from "@heroui/react";

interface ActionButtonsProps {
  darkMode: boolean;
  onToggleVisibility: () => void;
  onIsolate: () => void;
  onShow: () => void;
  onGhost: () => void;
  isGhost: boolean;
}

export default function ActionButtons({
  darkMode,
  onToggleVisibility,
  onIsolate,
  onShow,
  onGhost,
  isGhost,
}: ActionButtonsProps) {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const buttonClass = `p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-300"}`;

  return (
    <div
      className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full shadow-lg
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{isClient ? t("visibility") : "Visibility"}</span>
        <Tooltip content={isClient ? t("show_all") : "Show All"}>
          <button onClick={onShow} className={buttonClass}>
            <Eye size={18} />
          </button>
        </Tooltip>
        <Tooltip content={isClient ? t("toggle_ghost") : "Toggle Ghost"}>
          <button onClick={onGhost} className={`${buttonClass} ${isGhost ? (darkMode ? "bg-purple-900" : "bg-purple-700") : ""}`}>
            <Ghost size={18} />
          </button>
        </Tooltip>
      </div>

      <div className="h-6 border-l border-gray-500"></div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{isClient ? t("selection") : "Selection"}</span>
        <Tooltip content={isClient ? t("focus") : "Focus"}>
          <button onClick={onIsolate} className={buttonClass}>
            <Focus size={18} />
          </button>
        </Tooltip>
        <Tooltip content={isClient ? t("hide") : "Hide"}>
          <button onClick={onToggleVisibility} className={buttonClass}>
            <EyeOff size={18} />
          </button>
        </Tooltip>
        <Tooltip content={isClient ? t("isolate") : "Isolate"}>
          <button onClick={onIsolate} className={buttonClass}>
            <Focus size={18} />
          </button>
        </Tooltip>
        <Tooltip content={isClient ? t("colorize") : "Colorize"}>
          <button className={buttonClass}>
            <Pipette size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
