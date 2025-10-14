"use client";

import React, { createContext, useState, useContext } from "react";
import { viewerApi, ViewerAPI } from "@/lib/viewer-api";

interface AppContextType {
  darkMode: boolean;
  toggleTheme: () => void;
  uploadedModels: any[];
  setUploadedModels: React.Dispatch<React.SetStateAction<any[]>>;
  viewerApi: ViewerAPI;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [uploadedModels, setUploadedModels] = useState<any[]>([]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AppContext.Provider value={{ darkMode, toggleTheme, uploadedModels, setUploadedModels, viewerApi }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
