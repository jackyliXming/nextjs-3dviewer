"use client";

import { useState } from "react";
import IFCViewerContainer from "@/containers/IFCViewerContainer";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <div
      className={`h-screen flex flex-col ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      }`}
    >
      <main className="flex-1">
        <IFCViewerContainer darkMode={darkMode} toggleTheme={toggleTheme} />
      </main>
    </div>
  );
}
