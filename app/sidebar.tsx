"use client";

interface SidebarProps {
  darkMode: boolean;
  toggleTheme: () => void;
}

export default function Sidebar({ darkMode, toggleTheme }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 p-4 rounded-r-xl z-50 transition-colors duration-300
        ${darkMode ? "bg-gray-800 text-white" : "bg-indigo-400 text-gray-800"}`}
    >
      <h2 className="text-xl font-bold mb-6">Ifc Loader</h2>

      <button
        onClick={toggleTheme}
        className={`mt-6 px-4 py-2 rounded-lg transition-colors duration-300
          ${darkMode ? "bg-yellow-200 text-gray-800" : "bg-gray-800 text-white"}`}
      >
        Theme
      </button>
    </aside>
  );
}



