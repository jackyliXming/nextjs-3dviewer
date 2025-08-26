"use client";

import React, { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import { PerspectiveCamera, OrthographicCamera, Vector2, Color } from "three";
import { Spinner } from "@heroui/react";
import { ChevronLeft, ChevronRight, Eye, Focus, RefreshCcw, X } from "lucide-react";
import HeaderToggle from "@/components/header";

interface IFCViewerProps {
  darkMode: boolean;
}

interface UploadedModel {
  id: string;
  name: string;
  type: "ifc" | "frag" | "json";
  data?: ArrayBuffer;
}

type ItemProps = Record<string, any>;
type PsetDict = Record<string, Record<string, any>>;

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

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedLocalId, setSelectedLocalId] = useState<number | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<ItemProps | null>(null);
  const [selectedPsets, setSelectedPsets] = useState<PsetDict | null>(null);

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

      const renderer = new OBCF.PostproductionRenderer(components, viewerRef.current!);
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
        wasm: { path: "https://unpkg.com/web-ifc@0.0.70/", absolute: true },
      });

      const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
      const workerUrl = URL.createObjectURL(workerFile);

      const fragments = components.get(OBC.FragmentsManager);
      fragments.init(workerUrl);
      fragmentsRef.current = fragments;

      camera.controls.addEventListener("update", () => {
        fragments.core.update(true);
      });

      fragments.list.onItemSet.add(({ value: model }) => {
        const cam = world.camera.three as PerspectiveCamera | OrthographicCamera;
        model.useCamera(cam);
        world.scene.three.add(model.object);
        fragments.core.update(true);
      });

      const highlighter = components.get(OBCF.Highlighter);
      highlighter.setup({ world });
      highlighter.zoomToSelection = true;

      components.get(OBC.Hider);

      const handleClick = async (event: MouseEvent) => {
        if (!fragmentsRef.current || !worldRef.current?.renderer) return;

        const dom = worldRef.current.renderer.three.domElement as HTMLCanvasElement;
        const mouse = new Vector2(event.clientX, event.clientY);

        let hit: { modelId: string; localId: number } | null = null;
        for (const [id, model] of fragmentsRef.current.list) {
          const result = await model.raycast({
            camera: worldRef.current.camera.three,
            mouse,
            dom,
          });
          if (result) {
            hit = { modelId: id, localId: result.localId };
            break;
          }
        }

        if (!hit) {
          setInfoOpen(false);
          setSelectedModelId(null);
          setSelectedLocalId(null);
          setSelectedAttrs(null);
          setSelectedPsets(null);
          fragmentsRef.current.core.update(true);
          return;
        }

        const model = fragmentsRef.current.list.get(hit.modelId);
        if (!model) return;

        try {
          setInfoLoading(true);
          setInfoOpen(true);
          setSelectedModelId(hit.modelId);
          setSelectedLocalId(hit.localId);

          const [attrs] = await model.getItemsData([hit.localId], {
            attributesDefault: true,
          });
          setSelectedAttrs(attrs ?? null);

          const psetsRaw = await getItemPsets(model, hit.localId);
          setSelectedPsets(formatItemPsets(psetsRaw));

          fragmentsRef.current.core.update(true);
        } finally {
          setInfoLoading(false);
        }
      };

      viewerRef.current!.addEventListener("click", handleClick);

      const handleResize = () => {
        renderer.resize();
        camera.updateAspect();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        viewerRef.current?.removeEventListener("click", handleClick);
        window.removeEventListener("resize", handleResize);
        components.dispose();
      };
    };

    init();
  }, []);

  const getItemPsets = async (model: any, localId: number) => {
    const [data] = await model.getItemsData([localId], {
      attributesDefault: false,
      attributes: ["Name", "NominalValue"],
      relations: {
        IsDefinedBy: { attributes: true, relations: true },
        DefinesOcurrence: { attributes: false, relations: false },
      },
    });
    return (data?.IsDefinedBy as FRAGS.ItemData[]) ?? [];
  };

  const formatItemPsets = (raw: FRAGS.ItemData[]) => {
    const result: PsetDict = {};
    for (const pset of raw) {
      const { Name: psetName, HasProperties } = pset as any;
      if (!(psetName && "value" in psetName && Array.isArray(HasProperties))) continue;
      const props: Record<string, any> = {};
      for (const prop of HasProperties) {
        const { Name, NominalValue } = prop || {};
        if (!(Name && "value" in Name && NominalValue && "value" in NominalValue)) continue;
        props[Name.value] = NominalValue.value;
      }
      result[psetName.value] = props;
    }
    return result;
  };

  const onToggleVisibility = async () => {
    const highlighter = componentsRef.current?.get(OBCF.Highlighter);
    const hider = componentsRef.current?.get(OBC.Hider);
    if (!highlighter || !hider) return;

    const selection = highlighter.selection.select;
    if (!selection || Object.keys(selection).length === 0) return;

    for (const modelId in selection) {
      const localIds = Array.from(selection[modelId]);
      if (localIds.length === 0) continue;

      const fragments = componentsRef.current?.get(OBC.FragmentsManager);
      const model = fragments?.list.get(modelId);
      if (!model) continue;

      const visibility = await model.getVisible(localIds);
      const isAllVisible = visibility.every((v) => v);

      const modelIdMap: OBC.ModelIdMap = { [modelId]: new Set(localIds) };
      await hider.set(!isAllVisible, modelIdMap);
    }
  };

  const onIsolate = () => {
    const highlighter = componentsRef.current?.get(OBCF.Highlighter);
    const hider = componentsRef.current?.get(OBC.Hider);
    if (!highlighter || !hider) return;
    const selection = highlighter.selection.select;
    hider.isolate(selection);
  };

  const onShow = async () => {
    const hider = componentsRef.current?.get(OBC.Hider);
    if (!hider) return;
    await hider.set(true);
    setInfoOpen(false);
    setSelectedModelId(null);
    setSelectedLocalId(null);
    setSelectedAttrs(null);
    setSelectedPsets(null);
  };

  const IfcUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ifcLoaderRef.current || !fragmentsRef.current || !worldRef.current) return;

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

      const fragModel = await ifcLoaderRef.current.load(uint8Array, false, modelId, {
        instanceCallback: (importer: any) => console.log("IfcImporter ready", importer),
        userData: {},
      });

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      worldRef.current.scene.three.add(fragModel.object);
      fragmentsRef.current.core.update(true);
      fragModel.useCamera(worldRef.current.camera.three);

      setUploadedModels((prev) => [...prev, { id: modelId, name: file.name, type: "ifc", data: arrayBuffer }]);
    } catch (err) {
      console.error("Failed to load IFC:", err);
    } finally {
      setShowProgressModal(false);
    }
  };

  const handleFragmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fragmentsRef.current || !worldRef.current) return;

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
      const modelId = `frag_uploaded_${Date.now()}`;

      const fragModel = await fragmentsRef.current.core.load(arrayBuffer, { modelId });

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 500));

      fragModel.useCamera(worldRef.current.camera.three);
      worldRef.current.scene.three.add(fragModel.object);
      fragmentsRef.current.core.update(true);

      setUploadedModels((prev) => [...prev, { id: modelId, name: file.name, type: "frag", data: arrayBuffer }]);
    } finally {
      setShowProgressModal(false);
    }
  };

  const handleJSONUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProgress(0);
      setShowProgressModal(true);

      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += Math.random() * 5;
        if (simulatedProgress >= 98) simulatedProgress = 98;
        setProgress(Math.floor(simulatedProgress));
      }, 180);

      const text = await file.text();
      const data = JSON.parse(text);
      const modelId = `json_uploaded_${Date.now()}`;

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 700));

      console.log("Loaded JSON:", data);

      setUploadedModels((prev) => [...prev, { id: modelId, name: file.name, type: "json" }]);
    } finally {
      setShowProgressModal(false);
    }
  };

  const handleDownloadIFC = (model: UploadedModel) => {
    if (!model.data) return;
    const blob = new Blob([model.data], { type: "application/octet-stream" });
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
    const json = { id: model.id, name: model.name, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${model.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar */}
      <aside
        className={`transition-width duration-300 flex flex-col
          ${darkMode ? "bg-gray-900 text-white" : "bg-indigo-400 text-white"}`}
        style={{ width: sidebarCollapsed ? "64px" : "360px", minWidth: sidebarCollapsed ? "64px" : "360px" }}
      >
        {!sidebarCollapsed && <HeaderToggle darkMode={darkMode} />}

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="self-end m-1 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {!sidebarCollapsed && (
          <div className="flex flex-col justify-center items-center gap-2 mt-2">
            <label
              className={` w-5/6 flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
                ${darkMode ? "bg-blue-800 text-amber-100 hover:bg-blue-900" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              Upload IFC File
              <input type="file" accept=".ifc" onChange={IfcUpload} className="hidden" />
            </label>
            <label
              className={` w-5/6 flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
                ${darkMode ? "bg-green-800 text-amber-100 hover:bg-green-900" : "bg-green-600 text-white hover:bg-green-700"}`}
            >
              Upload Fragment File
              <input type="file" accept=".frag" onChange={handleFragmentUpload} className="hidden" />
            </label>
            <label
              className={` w-5/6 flex justify-center items-center font-medium px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200
                ${darkMode ? "bg-yellow-700 text-amber-100 hover:bg-yellow-800" : "bg-yellow-600 text-white hover:bg-yellow-700"}`}
            >
              Upload JSON File
              <input type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
            </label>
          </div>
        )}

        <br />

        {!sidebarCollapsed && (
          <h2 className={`text-lg font-semibold mb-4 px-4 ${darkMode ? "text-amber-100" : "text-white"}`}>Uploaded Models</h2>
        )}

        <hr />
        <br />

        <ul className="space-y-3 px-4 flex-1 overflow-auto">
          {!sidebarCollapsed &&
            uploadedModels.map((model) => (
              <li key={model.id}>
                <div className="flex flex-col gap-1">
                  <span className="cursor-pointer hover:underline">{model.name}</span>
                  <div className="flex space-x-1">
                    <button
                      className={`${darkMode ? "bg-blue-800 text-amber-100 hover:bg-blue-900" : "bg-blue-600 text-white hover:bg-blue-700"} px-2 py-1 rounded text-xs`}
                      onClick={() => handleDownloadIFC(model)}
                    >
                      IFC
                    </button>
                    <button
                      className={`${darkMode ? "bg-green-800 text-amber-100 hover:bg-green-900" : "bg-green-600 text-white hover:bg-green-700"} px-2 py-1 rounded text-xs`}
                      onClick={() => downloadFragments()}
                    >
                      Fragment
                    </button>
                    <button
                      className={`${darkMode ? "bg-yellow-700 text-amber-100 hover:bg-yellow-800" : "bg-yellow-600 text-white hover:bg-yellow-700"} px-2 py-1 rounded text-xs`}
                      onClick={() => handleDownloadJSON(model)}
                    >
                      JSON
                    </button>
                  </div>
                  <hr
                    style={{
                      height: "11px",
                      border: "none",
                      borderTop: `3px ridge ${darkMode ? "#fbbf29" : "#4cedef"}`,
                    }}
                  />
                </div>
              </li>
            ))}
        </ul>
      </aside>

      {/* Main Viewer */}
      <div className="flex flex-col flex-1">
        <div ref={viewerRef} id="viewer-container" className="flex-1" />

        <div
          className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 px-4 py-2 rounded-xl shadow-lg
            ${darkMode ? "bg-gray-800 text-amber-100" : "bg-white text-gray-900"}`}
        >
          <button
            onClick={onToggleVisibility}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
              ${darkMode ? "bg-blue-800 hover:bg-blue-900" : "bg-blue-600 hover:bg-blue-700"} text-white`}
          >
            <Eye size={18} />
            Toggle Visibility
          </button>

          <button
            onClick={onIsolate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
              ${darkMode ? "bg-green-800 hover:bg-green-900" : "bg-green-600 hover:bg-green-700"} text-white`}
          >
            <Focus size={18} />
            Isolate
          </button>

          <button
            onClick={onShow}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
              ${darkMode ? "bg-yellow-700 hover:bg-yellow-800" : "bg-yellow-600 hover:bg-yellow-700"} text-white`}
          >
            <RefreshCcw size={18} />
            Show All
          </button>
        </div>

        {/* info panel */}
        {infoOpen && (
          <div
            className={`absolute flex flex-col right-0 h-full w-[360px] border-l shadow-xl p-4 overflow-auto
              ${darkMode ? "bg-gray-900 text-amber-100 border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Element Info</h3>
              <button
                onClick={async () => {
                  setInfoOpen(false);
                  fragmentsRef.current?.core.update(true);
                }}
                className={`p-1 rounded ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                aria-label="Close info panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-sm opacity-80 mb-3">
              {selectedModelId ? `Model: ${selectedModelId}` : ""}
              <br/>
              {selectedLocalId !== null ? ` Local ID: ${selectedLocalId}` : ""}
            </div>

            {infoLoading ? (
              <div className="text-sm opacity-70">Loading properties…</div>
            ) : (
              <>
                <h4 className="font-semibold mb-1">Attributes</h4>
                {selectedAttrs ? (
                  <div className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2 mb-4`}>
                    <pre>{JSON.stringify(selectedAttrs, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="text-sm opacity-60 mb-4">No attributes.</div>
                )}

                <h4 className="font-semibold mb-1">Property Sets</h4>
                {selectedPsets && Object.keys(selectedPsets).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(selectedPsets).map(([pset, props]) => (
                      <div key={pset}>
                        <div className="font-medium">{pset}</div>
                        <div className={`text-xs ${darkMode ? "bg-gray-800" : "bg-gray-100"} rounded p-2`}>
                          <pre>{JSON.stringify(props, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm opacity-60">No property sets.</div>
                )}
              </>
            )}
          </div>
        )}

        {/* Loading modal */}
        {showProgressModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: darkMode ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
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
                boxShadow: darkMode ? "0 0 10px rgba(255,255,255,0.2)" : "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              <Spinner classNames={{ label: "text-foreground mt-4" }} variant="gradient" />
              <p>Loading: {progress}%</p>
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
