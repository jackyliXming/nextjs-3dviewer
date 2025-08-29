// Viewpoints.tsx
"use client";

import React, { useState } from "react";
import * as OBC from "@thatopen/components";

interface StoredViewpoint {
  id: string;
  title: string;
  snapshot: string | null;
  viewpoint: OBC.Viewpoint;
}

interface ViewpointsProps {
  darkMode: boolean;
  createViewpoint: () => Promise<OBC.Viewpoint | null>;
  updateViewpointCamera: (viewpoint: OBC.Viewpoint) => Promise<void>;
  setWorldCamera: (viewpoint: OBC.Viewpoint) => Promise<void>;
  getViewpointSnapshotData: (viewpoint: OBC.Viewpoint) => string | null;
  storedViews: StoredViewpoint[];
  setStoredViews: React.Dispatch<React.SetStateAction<StoredViewpoint[]>>;
}

export default function Viewpoints({
  darkMode,
  createViewpoint,
  updateViewpointCamera,
  setWorldCamera,
  getViewpointSnapshotData,
  storedViews,
  setStoredViews,
}: ViewpointsProps) {
  const [currentView, setCurrentView] = useState<StoredViewpoint | null>(null);

  const handleAddViewpoint = async () => {
    const vp = await createViewpoint();
    if (!vp) return;
    const snapshot = getViewpointSnapshotData(vp);

    const newView: StoredViewpoint = {
      id: vp.guid,
      title: `Viewpoint ${storedViews.length + 1}`,
      snapshot,
      viewpoint: vp,
    };
    setCurrentView(newView);
  };

  const deleteViewpoint = (id: string) => {
    setStoredViews(prev => prev.filter(v => v.id !== id));
    if (currentView?.id === id) setCurrentView(null);
  };

  const selectViewpoint = (view: StoredViewpoint) => {
    setCurrentView(view);
    view.viewpoint.go();
  };

  const refreshSnapshot = async (view?: StoredViewpoint) => {
    const vp = view || currentView;
    if (!vp) return;

    await vp.viewpoint.takeSnapshot?.();
    const snapshot = getViewpointSnapshotData(vp.viewpoint);
    const updatedView = { ...vp, snapshot };

    setCurrentView(updatedView);
    setStoredViews(prev =>
      prev.map(v => (v.id === vp.id ? updatedView : v))
    );
  };

  const renameViewpoint = (id: string, newTitle: string) => {
    setStoredViews(prev =>
      prev.map(v => (v.id === id ? { ...v, title: newTitle } : v))
    );
    if (currentView?.id === id) {
      setCurrentView(prev => (prev ? { ...prev, title: newTitle } : prev));
    }
  };

  return (
    <div className={`p-4 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"} w-70`}>
      <h2 className="text-lg font-bold mb-2">Viewpoints</h2>

      <button
        className="w-full py-2 mb-2 bg-blue-600 text-white rounded"
        onClick={handleAddViewpoint}
      >
        Create Viewpoint
      </button>

      {currentView && (
        <div className="mb-2 flex flex-col gap-1">
          <button
            className="py-1 bg-indigo-600 text-white rounded"
            onClick={async () => {
              await updateViewpointCamera(currentView.viewpoint);
              await refreshSnapshot(currentView);
            }}
          >
            Update Camera & Snapshot
          </button>
          <button
            className="py-1 bg-purple-600 text-white rounded"
            onClick={() => setWorldCamera(currentView.viewpoint)}
          >
            Set World Camera
          </button>
        </div>
      )}

      <h3 className="font-semibold mt-4 mb-2">Stored Viewpoints</h3>
      <div className="flex flex-col gap-2 max-h-150 overflow-y-auto">
        {storedViews.map(view => (
          <div
            key={view.id}
            className={`p-2 border rounded cursor-pointer ${
              currentView?.id === view.id
                ? "border-blue-500 bg-blue-100 dark:bg-blue-200"
                : "border-gray-300 dark:border-gray-600"
            }`}
            onClick={() => selectViewpoint(view)}
          >
            <div className="flex justify-between items-center gap-2">
              <img
                src={`data:image/png;base64,${view.snapshot}`}
                alt={view.title}
                className="w-28 h-32 object-cover"
              />
              <input
                type="text"
                value={view.title}
                onChange={e => renameViewpoint(view.id, e.target.value)}
                className="border rounded p-1 text-sm flex-1 w-22"
              />
              <button
                className="text-red-500 font-bold ml-2 hover:bg-gray-200"
                onClick={e => {
                  e.stopPropagation();
                  deleteViewpoint(view.id);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
