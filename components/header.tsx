"use client";

interface HeaderToggleProps {
  darkMode: boolean;
}

export default function HeaderToggle({ darkMode }: HeaderToggleProps) {
  return (
    <header
      className={`w-1/2 h-15 flex justify-center items-center mb-8 rounded-xl transition-colors duration-300
        text-2xl font-semibold mx-auto
        ${darkMode ? "bg-gray-700 text-yellow-200" : "bg-gray-400 text-gray-800"}`}
    >
      Gomore Ifc Loader
    </header>
  );
}
