"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as OBC from "@thatopen/components";

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
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [show2DMenu, setShow2DMenu] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleProjectionChange = async (mode: "Perspective" | "Orthographic") => {
    const world = worldRef.current;
    if (!world) return;
    if (mode === projection) return;

    await world.camera.projection.set(mode);
    setProjection(mode);
    triggerToast(t("toast_projection", { mode }));
  };

  const handleNavigationChange = async (mode: "Orbit" | "FirstPerson" | "Plan") => {
    const world = worldRef.current;
    if (!world) return;
    if (mode === navigation) return;

    await world.camera.set(mode);
    setNavigation(mode);
    triggerToast(t("toast_navigation_mode", { mode: t(mode.toLowerCase()) }));
  };

  const handle2DView = async (
    orientation: "top" | "bottom" | "front" | "back" | "left" | "right"
  ) => {
    const world = worldRef.current;
    if (!world || !world.camera.hasCameraControls()) return;

    const boxer = world.components.get(OBC.BoundingBoxer);
    if (!boxer) return;

    const { position, target } = await boxer.getCameraOrientation(orientation);
    await world.camera.projection.set("Orthographic");
    await world.camera.controls.setLookAt(
      position.x,
      position.y,
      position.z,
      target.x,
      target.y,
      target.z,
      true
    );

    await world.camera.set("Plan");
    setNavigation("Plan");
    triggerToast(t("toast_2d_view", { orientation }));
  };

  const close2DView = async () => {
    const world = worldRef.current;
    if (!world) return;

    await world.camera.projection.set("Perspective");
    await world.camera.set("Orbit");
    setNavigation("Orbit");
    triggerToast(t("toast_closed_2d_view"));
  };

  return (
    <>
      <div
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-6 px-6 py-3 rounded-xl shadow-lg
          ${darkMode ? "bg-gray-800 text-amber-100" : "bg-white text-gray-900"}`}
      >
        {/* Projection */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-medium">{isClient ? t("projection") : "Projection"}</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleProjectionChange("Perspective")}
              disabled={projection === "Perspective"}
              className={`px-3 py-2 rounded-lg 
                ${projection === "Perspective"
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
            >
              {isClient ? t("perspective") : "Perspective"}
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
              {isClient ? t("orthographic") : "Orthographic"}
            </button>
          </div>
        </div>

        <div className={`w-px ${darkMode ? "bg-white" : "bg-gray-500"} opacity-50`}></div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-medium">{isClient ? t("navigation_mode") : "Navigation Mode"}</span>
          <div className="flex gap-2">
            {(["Orbit", "FirstPerson", "Plan"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleNavigationChange(mode)}
                disabled={mode === navigation || (mode === "FirstPerson" && projection === "Orthographic")}
                className={`px-3 py-2 rounded-lg 
                  ${mode === navigation || (mode === "FirstPerson" && projection === "Orthographic")
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"}`}
              >
                {isClient ? t(mode.toLowerCase()) : mode}
              </button>
            ))}
          </div>
        </div>

        <div className={`w-px ${darkMode ? "bg-white" : "bg-gray-500"} opacity-50`}></div>

        {/* 2D View Dropdown */}
        <div className="flex flex-col items-center gap-2 relative">
          <span className="font-medium">{isClient ? t("2d_views") : "2D Views"}</span>
          <button
            onClick={() => setShow2DMenu((prev) => !prev)}
            className="px-3 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700"
          >
            {isClient ? t("2d_view_menu") : "2D View Menu"}
          </button>

          {show2DMenu && (
            <div className="absolute top-18 left-0 flex flex-col gap-1 bg-gray-200 dark:bg-gray-700 p-2 rounded shadow-lg z-50">
              <button
                onClick={close2DView}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {isClient ? t("close_2d_view") : "Close 2D View"}
              </button>
              {["top", "bottom", "front", "back", "left", "right"].map((o) => (
                <button
                  key={o}
                  onClick={() => handle2DView(o as any)}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isClient ? t(o) : o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`w-px ${darkMode ? "bg-white" : "bg-gray-500"} opacity-50`}></div>

        {/* Fit to Model */}
        <div className="flex flex-col justify-center items-center gap-2">
          <button
            onClick={() => worldRef.current?.camera.fitToItems()}
            className="px-3 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700"
          >
            {isClient ? t("fit_to_model") : "Fit to Model"}
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
