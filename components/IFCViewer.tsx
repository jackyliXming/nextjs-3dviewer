"use client";

import React, { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { PerspectiveCamera, OrthographicCamera } from "three";
import { Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface IFCViewerProps {
  darkMode: boolean;
}

interface UploadedModel {
  id: string;
  name: string;
}

export default function IFCViewer({ darkMode }: IFCViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
  const worldRef = useRef<any>(null);
  const cameraRef = useRef<OBC.OrthoPerspectiveCamera | null>(null);

  const [progress, setProgress] = useState<number>(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadedModels, setUploadedModels] = useState<UploadedModel[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!viewerRef.current) return;

    const init = async () => {
      const components = new OBC.Components();
      componentsRef.current = components;

      const worlds = components.get(OBC.Worlds);
      const world = worlds.create();
      worldRef.current = world;

      const scene = new OBC.SimpleScene(components);
      world.scene = scene;
      scene.setup();
      scene.three.background = null;

      const renderer = new OBCF.PostproductionRenderer(
        components,
        viewerRef.current!
      );
      world.renderer = renderer;

      const camera = new OBC.OrthoPerspectiveCamera(components);
      world.camera = camera;
      await camera.controls.setLookAt(3, 3, 3, 0, 0, 0);
      camera.updateAspect();
      cameraRef.current = camera;

      components.init();
      components.get(OBC.Grids).create(world);

      const ifcLoader = components.get(OBC.IfcLoader);
      ifcLoaderRef.current = ifcLoader;

      await ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: "https://unpkg.com/web-ifc@0.0.70/",
          absolute: true,
        },
      });

      const githubUrl =
        "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", {
        type: "text/javascript",
      });
      const workerUrl = URL.createObjectURL(workerFile);

      const fragments = components.get(OBC.FragmentsManager);
      fragments.init(workerUrl);
      fragmentsRef.current = fragments;

      camera.controls.addEventListener("update", () => {
        fragments.core.update(true);
      });

      fragments.list.onItemSet.add(({ value: model }) => {
        const cam =
          world.camera.three as PerspectiveCamera | OrthographicCamera;
        model.useCamera(cam);
        world.scene.three.add(model.object);
        fragments.core.update(true);
      });

      const highlighter = components.get(OBCF.Highlighter);
      highlighter.setup({ world });
      highlighter.zoomToSelection = true;

      const handleResize = () => {
        renderer.resize();
        camera.updateAspect();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        components.dispose();
      };
    };

    init();
  }, []);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !ifcLoaderRef.current || !fragmentsRef.current || !worldRef.current)
      return;

    try {
      setProgress(0);
      setShowProgressModal(true);

      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += Math.random() * 5;
        if (simulatedProgress >= 98) simulatedProgress = 98;
        setProgress(Math.floor(simulatedProgress));
      }, 180);

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const modelId = `ifc_uploaded_${Date.now()}`;

      const fragModel = await ifcLoaderRef.current.load(
        uint8Array,
        false,
        modelId,
        {
          instanceCallback: (importer: any) =>
            console.log("IfcImporter ready", importer),
          userData: {},
        }
      );

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 200));

      worldRef.current.scene.three.add(fragModel.object);
      fragmentsRef.current.core.update(true);
      fragModel.useCamera(
        worldRef.current.camera.three as PerspectiveCamera | OrthographicCamera
      );

      setUploadedModels((prev) => [
        ...prev,
        { id: modelId, name: file.name },
      ]);
    } catch (err) {
      console.error("Failed to load IFC via IfcLoader:", err);
    } finally {
      setShowProgressModal(false);
    }
  };

  const handleDownloadIFC = (model: UploadedModel) => {
    const data = (ifcLoaderRef.current as any).getData?.(model.id);
    if (!data) return;
    const blob = new Blob([data], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = model.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFragments = async () => {
    for (const [, model] of fragmentsRef.current!.list) {
      const fragsBuffer = await model.getBuffer(false);
      const file = new File([fragsBuffer], `${model.modelId}.frag`);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const handleDownloadJSON = (model: UploadedModel) => {
    const json = {
      id: model.id,
      name: model.name,
      date: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${model.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex w-full h-screen">
      <aside
        className={`transition-all duration-300 flex flex-col
          ${sidebarCollapsed ? "w-16" : "w-60"}
          ${darkMode ? "bg-gray-900 text-white" : "bg-blue-400 text-white"}`}
      >
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="self-end m-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {!sidebarCollapsed && (
          <h2 className="text-lg font-semibold mb-4 px-4">Uploaded Models</h2>
        )}
        <hr/>
        <br/>
        <ul className="space-y-3 px-4 flex-1 overflow-auto">
          {!sidebarCollapsed &&
            uploadedModels.map((model) => (
              <li key={model.id}>
                <div className="flex flex-col gap-1">
                  <span className="cursor-pointer hover:underline">{model.name}</span>
                  <div className="flex space-x-1">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDownloadIFC(model)}
                    >
                      IFC
                    </button>
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => downloadFragments()}
                    >
                      Fragment
                    </button>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDownloadJSON(model)}
                    >
                      JSON
                    </button>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </aside>


      {/* Main Viewer */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-center items-center gap-2 mt-2">
          <label
          className="flex justify-center items-center
            w-1/3
            bg-blue-600 text-white font-medium
            px-6 py-2
            rounded-lg
            cursor-pointer
            hover:bg-blue-700
            transition-colors duration-200
            "
          >
            Upload IFC File
            <input
              type="file"
              accept=".ifc"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <label
            className="flex justify-center items-center
                  w-1/3 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
            onClick={() => console.log("Button 1 clicked")}
          >
            Upload Fragment File
          </label>
          <label
            className="flex justify-center items-center
                  w-1/3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
            onClick={() => console.log("Button 2 clicked")}
          >
            Upload Json File
          </label>
        </div>
        
        <div ref={viewerRef} id="viewer-container" className="flex-1" />

        {showProgressModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: darkMode
                ? "rgba(0,0,0,0.7)"
                : "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                width: "300px",
                background: darkMode ? "#1f2937" : "#fff",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                color: darkMode ? "#facc15" : "#111",
                boxShadow: darkMode
                  ? "0 0 10px rgba(255,255,255,0.2)"
                  : "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <Spinner classNames={{ label: "text-foreground mt-4" }} variant="gradient" />

              <p>Loading IFC: {progress}%</p>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: darkMode ? "#374151" : "#eee",
                  borderRadius: "5px",
                  overflow: "hidden",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: darkMode ? "#fbbf24" : "#3b82f6",
                    transition: "width 0.2s",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
