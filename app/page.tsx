"use client";

import Image from "next/image";
import * as React from "react";
import { useState } from "react";
import IFCViewer from "./IFCViewer";
import HeaderToggle from "./header";
import Sidebar from "./sidebar";
import { ProjectsManager } from "./ProjectsManager";

interface Props {
  projectsManager: ProjectsManager;
}

export default function Home(props: Props) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`font-sans min-h-screen p-8 flex flex-col transition-colors duration-300
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
    >
      {/* Sidebar */}
      <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} />

      {/* Header */}
      <HeaderToggle darkMode={darkMode} />

      {/* Main content */}
      <main className="flex flex-col gap-4 flex-1">
        <IFCViewer darkMode={darkMode} />
      </main>

      {/* Footer */}
      <footer className="flex flex-col md:flex-row gap-4 mt-8 flex-wrap">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://gomore.com.tw/2015/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to Gomore Website →
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://gomore.com.tw/2015/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          2015 © Gomore Building Envelope Technology Co. Ltd | TEL:02 2797-9977 FAX:02 2797 2588
        </a>
      </footer>
    </div>
  );
}
