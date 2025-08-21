"use client";

import { useState } from "react";

export default function Sidebar() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <>
      {/* Sidebar overlay */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 p-4
          rounded-r-xl
          transition-colors duration-300 z-50
          ${darkMode ? "bg-gray-800 text-white" : "bg-yellow-200 text-gray-800"}
        `}
      >
        <h2 className="text-xl font-bold mb-6">Ifc loader</h2>
        {/* <ul>
          <li className="mb-2 cursor-pointer">Home</li>
          <li className="mb-2 cursor-pointer">About</li>
          <li className="mb-2 cursor-pointer">Settings</li>
        </ul> */}

        <button
          onClick={toggleTheme}
          className={`
            mt-6 px-4 py-2 rounded-lg
            ${darkMode ? "bg-yellow-200 text-gray-800" : "bg-gray-800 text-white"}
            transition-colors duration-300
          `}
        >
          Toggle Theme
        </button>
      </aside>

      {/* Main content
      <main className="ml-0 md:ml-64 p-6">
        <h1 className="text-3xl font-bold">Main Content</h1>
        <p>The sidebar is fixed and does not affect main content layout.</p>
      </main> */}
    </>
  );
}

