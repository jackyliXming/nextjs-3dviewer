"use client";

import { useState } from "react";
import IFCViewer from "@/components/IFCViewer";
import HeaderToggle from "@/components/header";
import Sidebar from "@/components/sidebar";
import { Navbar } from "@/components/navbar";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <div
      className={`font-sans min-h-screen flex flex-col transition-colors duration-300
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
    >
      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />

      {/* <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} /> */}

      {/* <HeaderToggle darkMode={darkMode} /> */}

      <main className="flex flex-col gap-4 flex-1">
        <IFCViewer darkMode={darkMode} />
      </main>

      <footer className="flex flex-col md:flex-row gap-4 mt-8 flex-wrap">
      </footer>
    </div>
  );
}
