"use client";

interface HeaderToggleProps {
  darkMode: boolean;
}

export default function HeaderToggle({ darkMode }: HeaderToggleProps) {
  return (
    <header
      className={`h-12 flex justify-center items-center mb-8 rounded-xl transition-colors duration-300
        text-2xl font-semibold
        ${darkMode ? "bg-gray-700 text-yellow-200" : "bg-gray-200 text-gray-800"}`}
    >
      Gomore Ifc Loader
    </header>
  );
}
