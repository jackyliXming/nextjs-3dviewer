"use client";

import React, { useState, useEffect } from "react";

interface CameraControlsProps {
  darkMode: boolean;
  projection: "Perspective" | "Orthographic";
  navigation: "Orbit" | "FirstPerson" | "Plan";
  setProjection: React.Dispatch<React.SetStateAction<"Perspective" | "Orthographic">>;
  setNavigation: React.Dispatch<React.SetStateAction<"Orbit" | "FirstPerson" | "Plan">>;
  worldRef: React.MutableRefObject<any>;
}

export default function CameraControls({
  darkMode,
  projection,
  navigation,
  setProjection,
  setNavigation,
  worldRef,
}: CameraControlsProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    setTimeout(() => setShowToast(false), 1500);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleProjectionChange = (mode: "Perspective" | "Orthographic") => {
    if (mode === projection) return;
    worldRef.current?.camera.projection.set(mode);
    setProjection(mode);
    triggerToast(`Projection: ${mode}`);
  };

  const handleNavigationChange = (mode: "Orbit" | "FirstPerson" | "Plan") => {
    if (mode === navigation) return;
    worldRef.current?.camera.set(mode);
    setNavigation(mode);
    if (mode === "FirstPerson" ) {
      triggerToast(`Navigation Mode: First Person`);
    } else {
      triggerToast(`Navigation Mode: ${mode}`);
    }
  };

  return (
    <>
      <div
        className={`absolute top-15 left-1/2 transform -translate-x-1/2 flex gap-6 px-6 py-3 rounded-xl shadow-lg
          ${darkMode ? "bg-gray-800 text-amber-100" : "bg-white text-gray-900"}`}
      >
        {/* Projection */}
        <div className="flex flex-col items-center gap-2">
            <span className="font-medium">Projection</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  worldRef.current?.camera.projection.set("Perspective");
                  setProjection("Perspective");
                  handleProjectionChange("Perspective");
                }}
                disabled={projection === "Perspective"}
                className={`px-3 py-2 rounded-lg 
                  ${projection === "Perspective"
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
              >
                Perspective
              </button>

              <button
                onClick={() => {
                  handleProjectionChange("Orthographic");
                  if (navigation === "FirstPerson"){
                    worldRef.current?.camera.set("Orbit");
                    setNavigation("Orbit");
                    handleNavigationChange("Orbit");
                  }
                  worldRef.current?.camera.projection.set("Orthographic");
                  setProjection("Orthographic");                  
                }}
                disabled={projection === "Orthographic"}
                className={`px-3 py-2 rounded-lg 
                  ${projection === "Orthographic"
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
              >
                Orthographic
              </button>
            </div>
          </div>

        <div className={`w-px ${darkMode ? "bg-white" : "bg-gray-500"} opacity-50`}></div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-2">
            <span className="font-medium">Navigation Mode</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  worldRef.current?.camera.set("Orbit");
                  setNavigation("Orbit");
                  handleNavigationChange("Orbit");
                }}
                disabled={navigation === "Orbit"}
                className={`px-3 py-2 rounded-lg 
                  ${navigation === "Orbit"
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"}`}
              >
                Orbit
              </button>

              <button
                onClick={() => {
                  worldRef.current?.camera.set("FirstPerson");
                  setNavigation("FirstPerson");
                  handleNavigationChange("FirstPerson");
                }}
                disabled={navigation === "FirstPerson" || projection === "Orthographic"}
                className={`px-3 py-2 rounded-lg 
                  ${(navigation === "FirstPerson" || projection === "Orthographic")
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"}`}
              >
                First Person
              </button>

              <button
                onClick={() => {
                  worldRef.current?.camera.set("Plan");
                  setNavigation("Plan");
                  handleNavigationChange("Plan");
                }}
                disabled={navigation === "Plan"}
                className={`px-3 py-2 rounded-lg 
                  ${navigation === "Plan"
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"}`}
              >
                Plan
              </button>
            </div>
          </div>

        <div className={`w-px ${darkMode ? "bg-white" : "bg-gray-500"} opacity-50`}></div>

        {/* Fit to Model */}
        <div className="flex flex-col justify-center items-center gap-2">
          <button
            onClick={() => worldRef.current?.camera.fitToItems()}
            className="px-3 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
          >
            Fit to Model
          </button>
        </div>
      </div>

      {/* Navigation Mode Message */}
      {toastMessage && (
        <div
          className={`absolute top-12 left-1/2 transform -translate-x-1/2 
            px-6 py-3 rounded-xl bg-black text-white text-lg font-medium 
            transition-opacity duration-500 ${showToast ? "opacity-80" : "opacity-0"}`}
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
