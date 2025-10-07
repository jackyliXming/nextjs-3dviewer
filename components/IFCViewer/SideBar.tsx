"use client";

import React, { useState } from "react";
import { Tooltip } from "@heroui/react";
import { Upload, Camera, Search, MessageSquare, Info, AlertTriangle } from "lucide-react";

interface SideBarProps {
  darkMode: boolean;
  children: React.ReactNode;
  themeSwitcher: React.ReactNode;
  languageSwitcher: React.ReactNode;
  onToggle: (isOpen: boolean) => void;
}

const SideBar: React.FC<SideBarProps> = ({ darkMode, children, themeSwitcher, languageSwitcher, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const tabs = React.Children.toArray(children) as React.ReactElement<{name: string}>[];

  const handleTabClick = (name: string) => {
    if (activeTab === name) {
      setIsOpen(false);
      setActiveTab(null);
      onToggle(false);
    } else {
      setActiveTab(name);
      setIsOpen(true);
      onToggle(true);
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case "Models":
        return <Upload size={20} />;
      case "Viewpoints":
        return <Camera size={20} />;
      case "Search":
        return <Search size={20} />;
      case "BCF":
        return <MessageSquare size={20} />;
      case "Info":
        return <Info size={20} />;
      case "Collision":
        return <AlertTriangle size={20} />;
      default:
        return "?";
    }
  };

  return (
    <div className="flex h-full">
      <div className={`flex flex-col justify-between items-center p-2 ${darkMode ? "bg-gray-900" : "bg-indigo-400"} text-white z-30`}>
        <div className="flex flex-col items-center">
          {tabs.map((child) => (
            child.props.name && (
              <Tooltip key={child.props.name} content={child.props.name} placement="right">
                <button
                  onClick={() => handleTabClick(child.props.name)}
                  className={`p-3 my-2 rounded-md ${activeTab === child.props.name ? (darkMode ? "bg-gray-700" : "bg-indigo-600") : ""}`}
                >
                  {getIcon(child.props.name)}
                </button>
              </Tooltip>
            )
          ))}
        </div>
        <div className="flex flex-col items-center space-y-4">
            {themeSwitcher}
            {languageSwitcher}
        </div>
      </div>
      <div
        className={`transition-all duration-300 ${darkMode ? "bg-neutral-800" : "bg-neutral-200"} ${
          isOpen ? "w-80 p-4" : "w-0"
        } overflow-y-auto overflow-x-hidden`}
      >
        {isOpen && tabs.find((child) => child.props.name === activeTab)}
      </div>
    </div>
  );
};

export default SideBar;
