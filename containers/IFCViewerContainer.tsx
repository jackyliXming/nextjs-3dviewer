"use client";

import React, { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import { PerspectiveCamera, OrthographicCamera, Vector2, Object3D, Mesh, Color, Vector3 } from "three";
import IFCViewerUI from "@/components/IFCViewer/ViewerUI";
import IFCInfoPanel from "@/components/IFCViewer/InfoPanel";
import ModelManager from "@/components/IFCViewer/ModelManager";
import LoadingModal from "@/components/IFCViewer/LoadingModal";
import ActionButtons from "@/components/IFCViewer/ActionButtons";
import CameraControls from "@/components/IFCViewer/CameraControls";
import ToolBar from "@/components/IFCViewer/ToolBar";
import Viewpoints from "@/components/IFCViewer/Viewpoints";
import ViewOrientation from "@/components/IFCViewer/ViewOrientation";
import BCFTopics from "@/components/IFCViewer/BCFTopics";
import CollisionDetector from "@/components/IFCViewer/CollisionDetector";

interface UploadedModel {
  id: string;
  name: string;
  type: "ifc" | "frag" | "json";
  data?: ArrayBuffer;
}

interface StoredViewpoint {
  id: string;
  title: string;
  viewpoint: OBC.Viewpoint;
  snapshot: string | null;
}

type ItemProps = Record<string, any>;
type PsetDict = Record<string, Record<string, any>>;

export default function IFCViewerContainer({ darkMode }: { darkMode: boolean }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
  const worldRef = useRef<any>(null);
  const cameraRef = useRef<OBC.OrthoPerspectiveCamera | null>(null);
  const clipperRef = useRef<OBC.Clipper | null>(null);
  const measurerRef = useRef<OBCF.LengthMeasurement | null>(null);
  const areaMeasurerRef = useRef<OBCF.AreaMeasurement | null>(null);
  const viewpointsRef = useRef<OBC.Viewpoints | null>(null);
  const colorizeRef = useRef<{ enabled: boolean }>({ enabled: false });
  const coloredElements = useRef<Record<string, Set<number>>>({});

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
  const [projection, setProjection] = useState<"Perspective" | "Orthographic">("Perspective");
  const [navigation, setNavigation] = useState<"Orbit" | "FirstPerson" | "Plan">("Orbit");
  const [isGhost, setIsGhost] = useState(false);  
  const [activeTool, setActiveTool] = useState<"clipper" | "length" | "area" | "colorize" | "collision" | null>(null);  
  const [lengthMode, setLengthMode] = useState<"free" | "edge">("free");
  const [areaMode, setAreaMode] = useState<"free" | "square">("free");
  const [currentViewpoint, setCurrentViewpoint] = useState<OBC.Viewpoint | null>(null);
  const [storedViews, setStoredViews] = useState<StoredViewpoint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [components, setComponents] = useState<OBC.Components | null>(null);
  const [isCollisionModalOpen, setIsCollisionModalOpen] = useState(false);

  const [selectedColor, setSelectedColor] = useState<string>("#ffa500");
  const selectedColorRef = useRef(selectedColor);

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
        wasm: { path: "https://unpkg.com/web-ifc@0.0.71/", absolute: true },
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

      const casters = components.get(OBC.Raycasters);
      casters.get(world);

      const viewpoints = components.get(OBC.Viewpoints);
      viewpoints.world = world;
      viewpointsRef.current = viewpoints;

      const clipper = components.get(OBC.Clipper);
      clipper.enabled = false;
      clipperRef.current = clipper;

      const highlighter = components.get(OBCF.Highlighter);
      highlighter.setup({ world });
      highlighter.zoomToSelection = true;

      if (!highlighter.styles.has("colorize")) {
        highlighter.styles.set("colorize", {
          color: new Color(selectedColorRef.current),
          opacity: 1,
          transparent: false,
          renderedFaces: FRAGS.RenderedFaces.ONE,
        });
      }

      components.get(OBC.Hider);

      setComponents(components);

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
          if (activeTool === "colorize") return;
          setInfoOpen(false);
          setSelectedModelId(null);
          setSelectedLocalId(null);
          setSelectedAttrs(null);
          setSelectedPsets(null);
          fragmentsRef.current.core.update(true);
          return;
        }

        if (colorizeRef.current.enabled && hit) {
          await handleClickColorizeElement(hit.modelId, hit.localId);
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

  useEffect(() => {
    if (!componentsRef.current || !worldRef.current) return;

    const length = componentsRef.current.get(OBCF.LengthMeasurement);
    length.world = worldRef.current;
    length.color = new Color("#494cb6");
    length.enabled = false;
    measurerRef.current = length;

    if (measurerRef.current) {
      measurerRef.current.world = worldRef.current;
      measurerRef.current.color = new Color("#494cb6");
      measurerRef.current.enabled = false;
      measurerRef.current.mode = lengthMode;
    }

    const area = componentsRef.current.get(OBCF.AreaMeasurement);
    area.world = worldRef.current;
    area.color = new Color("#494cb6");
    area.enabled = false;
    areaMeasurerRef.current = area;

    const handleDblClick = () => {
      if (activeTool === "length" && measurerRef.current?.enabled) {
        measurerRef.current.create();
      } else if (activeTool === "area" && areaMeasurerRef.current?.enabled) {
        areaMeasurerRef.current.create();
      } else if (activeTool === "clipper" && clipperRef.current?.enabled) {
        clipperRef.current.create(worldRef.current);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTool === "area" && areaMeasurerRef.current?.enabled) {
        if (e.code === "Enter" || e.code === "NumpadEnter") {
          areaMeasurerRef.current.endCreation();
        } else if (e.code === "Delete" || e.code === "Backspace") {
          areaMeasurerRef.current.delete();
        }
      }
      if (activeTool === "length" && measurerRef.current?.enabled) {
        if (e.code === "Delete" || e.code === "Backspace") {
          measurerRef.current.delete();
        }
      }
      if (activeTool === "clipper" && clipperRef.current?.enabled) {
        if (e.code === "Delete" || e.code === "Backspace") {
          clipperRef.current.delete(worldRef.current);
        }
      }
    };

    viewerRef.current?.addEventListener("dblclick", handleDblClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      viewerRef.current?.removeEventListener("dblclick", handleDblClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [componentsRef.current, worldRef.current, activeTool]);

  useEffect(() => {
    if (!measurerRef.current || !areaMeasurerRef.current || !clipperRef.current || !colorizeRef.current) return;

    clipperRef.current.enabled = false;
    measurerRef.current.enabled = false;
    areaMeasurerRef.current.enabled = false;
    colorizeRef.current.enabled = false;

    const highlighter = componentsRef.current?.get(OBCF.Highlighter);

    switch (activeTool) {
      case "length":
        measurerRef.current.enabled = true;
        if (highlighter) highlighter.enabled = false;
        break;
      case "area":
        areaMeasurerRef.current.enabled = true;
        if (highlighter) highlighter.enabled = false;
        break;
      case "clipper":
        clipperRef.current.enabled = true;
        if (highlighter) highlighter.enabled = false;
        break;
      case "colorize":
        colorizeRef.current.enabled = true;
        if (highlighter) highlighter.enabled = false;
        break;
      case "collision":
        setIsCollisionModalOpen(true);
        if (highlighter) highlighter.enabled = true;
        break;
      default:
        if (highlighter) highlighter.enabled = true;
        break;
    }

  }, [activeTool]);

  useEffect(() => {
    if (measurerRef.current) {
      measurerRef.current.mode = lengthMode;
    }
  }, [lengthMode]);

  useEffect(() => {
    if (areaMeasurerRef.current) {
      areaMeasurerRef.current.mode = areaMode;
    }
  }, [areaMode]);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

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

      fragmentsRef.current.list.set(modelId, fragModel);   

      worldRef.current.scene.three.add(fragModel.object);
      fragmentsRef.current.core.update(true);
      fragModel.useCamera(worldRef.current.camera.three);

      setUploadedModels((prev) => [...prev, { id: modelId, name: file.name, type: "ifc", data: arrayBuffer }]);

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 300));

      await loadCategoriesFromAllModels();
    } catch (err) {
      console.error("Failed to load IFC:", err);
    } finally {
      setShowProgressModal(false);
      event.target.value = "";
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
      event.target.value = "";
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
      event.target.value = "";
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
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(a.href);
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
  
  const onIsolate = async () => {
    const highlighter = componentsRef.current?.get(OBCF.Highlighter);
    const hider = componentsRef.current?.get(OBC.Hider);
    if (!highlighter || !hider) return;
    const selection = highlighter.selection.select;
    await hider.set(false);
    await hider.set(true, selection);
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

  const originalColors  = useRef(new Map<
    FRAGS.BIMMaterial, 
    { color: number; transparent: boolean; opacity: number }
  >());

  const setModelTransparent = (components: OBC.Components) => {
    const fragments = components.get(OBC.FragmentsManager);

    const materials = [...fragments.core.models.materials.list.values()];
    for (const material of materials) {
      if (material.userData.customId) continue;

      if (!originalColors.current.has(material)) {
        let color: number;
        if ('color' in material) {
          color = material.color.getHex();
        } else {
          color = material.lodColor.getHex();
        }

        originalColors.current.set(material, {
          color,
          transparent: material.transparent,
          opacity: material.opacity,
        });
      }

      material.transparent = true;
      material.opacity = 0.6;
      material.needsUpdate = true;

      if ('color' in material) material.color.setRGB(0.2, 0.2, 0.2);
      else material.lodColor.setRGB(0.5, 0.5, 0.5);
    }
  };

  const restoreModelMaterials = () => {
    for (const [material, data] of originalColors.current) {
      material.transparent = data.transparent;
      material.opacity = data.opacity;
      if ('color' in material) material.color.setHex(data.color);
      else material.lodColor.setHex(data.color);
      material.needsUpdate = true;
    }
    originalColors.current.clear();
  };

  const handleGhost = () => {
    if (!componentsRef.current) return;

    if (isGhost) {
      restoreModelMaterials();
      setIsGhost(false);
    } else {
      setModelTransparent(componentsRef.current);
      setIsGhost(true);
    }
  };

  const handleClipper = () => {
    if (!clipperRef.current) return;

    const isActive = activeTool === "clipper";
    setActiveTool(isActive ? null : "clipper");

    clipperRef.current.enabled = !isActive;

    if (measurerRef.current) 
      measurerRef.current.list.clear();
    if (areaMeasurerRef.current) 
      areaMeasurerRef.current.list.clear();
    if (isActive) 
      clipperRef.current.list.clear();
  };

  const handleLength = () => {
    if (!measurerRef.current) return;

    const isActive = activeTool === "length";
    setActiveTool(isActive ? null : "length");

    measurerRef.current.enabled = !isActive;

    if (clipperRef.current) 
      clipperRef.current.list.clear();
    if (areaMeasurerRef.current) 
      areaMeasurerRef.current.list.clear();  
    if (isActive) 
      measurerRef.current.list.clear();
  };

  const handleArea = () => {
    if (!areaMeasurerRef.current) return;

    const isActive = activeTool === "area";
    setActiveTool(isActive ? null : "area");

    areaMeasurerRef.current.enabled = !isActive;

    if (clipperRef.current) 
      clipperRef.current.list.clear();
    if (measurerRef.current)
      measurerRef.current.list.clear();
    if (isActive) 
      areaMeasurerRef.current.list.clear();
  };

  const deleteSelectedModel = (model: UploadedModel) => {
    if (!fragmentsRef.current) return;

    fragmentsRef.current.core.disposeModel(model.id);

    if (selectedModelId === model.id) {
      setSelectedModelId(null);
      setSelectedLocalId(null);
      setSelectedAttrs(null);
      setSelectedPsets(null);
    }

    setUploadedModels((prev) => prev.filter((m) => m.id !== model.id));
  };

  const deleteAllModels = () => {
    if (!fragmentsRef.current) return;
    
    for (const [modelId] of fragmentsRef.current.list) {
      fragmentsRef.current.core.disposeModel(modelId);
    }

    setSelectedModelId(null);
    setSelectedLocalId(null);
    setSelectedAttrs(null);
    setSelectedPsets(null);

    setUploadedModels([]);
  };

  const createViewpoint = async (): Promise<OBC.Viewpoint | null> => {
    if (!viewpointsRef.current) return null;

    const vp = viewpointsRef.current.create();
    if (!vp) return null;

    vp.title = `Viewpoint ${storedViews.length + 1}`;
    await vp.updateCamera();

    const snapshotData = getViewpointSnapshotData(vp) || "";

    setStoredViews((prev) => [
      ...prev,
      {
        id: vp.guid,
        title: vp.title || `Viewpoint ${prev.length + 1}`,
        viewpoint: vp,
        snapshot: snapshotData,
      },
    ]);

    setCurrentViewpoint(vp);
    return vp;
  };

  const updateViewpointCamera = async () => {
    if (!currentViewpoint) return;
    await currentViewpoint.updateCamera();
  };

  const setWorldCamera = async () => {
    if (!currentViewpoint || !worldRef.current) return;
    await currentViewpoint.go();
  };

  const getViewpointSnapshotData = (vp: OBC.Viewpoint): string | null => {
    if (!vp || !viewpointsRef.current) return null;

    const data = viewpointsRef.current.snapshots.get(vp.guid);
    if (!data) return null;

    if (data instanceof Uint8Array) {
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
      }
      return btoa(binary);
    }

    return String(data);
  };

  const loadCategoriesFromAllModels = async () => {
    if (!fragmentsRef.current) return;

    const allCats: Set<string> = new Set();

    for (const model of fragmentsRef.current.list.values()) {
      const cats = await model.getItemsOfCategories([/.*/]);
      Object.keys(cats).forEach((c) => allCats.add(c));
    }

    setCategories(Array.from(allCats).sort());
  };


  const isolateCategory = async (category: string | null) => {
    if (!category || !fragmentsRef.current) return;

    const fragments = fragmentsRef.current;
    const hider = componentsRef.current?.get(OBC.Hider);
    if (!hider) return;

    const selection: Record<string, Set<number>> = {};

    for (const [, model] of fragments.list) {
      try {
        const categoryItems = await model.getItemsOfCategories([new RegExp(`^${category}$`)]);
        const localIds = Object.values(categoryItems).flat();

        if (localIds.length > 0) {
          selection[model.modelId] = new Set(localIds);
        }
      } catch (err) {
        console.warn(`Failed to get category items for model ${model.modelId}`, err);
      }
    }

    await hider.set(false);
    await hider.set(true, selection);

    fragments.core.update(true);
  };

  const onCategorySelect = (cat: string | null) => {
    setSelectedCategory(cat);

    setTimeout(() => {
      isolateCategory(cat).catch(console.warn);
    }, 100);
  };

  const handleColorize = (color?: string) => {
    if (!color) return;
    setSelectedColor(color);
  };

  const handleClickColorizeElement = async (modelId: string, localId: number) => {
    if (!fragmentsRef.current || !colorizeRef.current.enabled) return;

    if (!coloredElements.current[modelId]) coloredElements.current[modelId] = new Set();

    if (coloredElements.current[modelId].has(localId)) return;

    coloredElements.current[modelId].add(localId);

    const modelIdMap: Record<string, Set<number>> = {
      [modelId]: new Set([localId])
    };

    await fragmentsRef.current.highlight(
      {
        color: new Color(selectedColorRef.current),
        renderedFaces: FRAGS.RenderedFaces.ONE,
        opacity: 1,
        transparent: false,
      },
      modelIdMap
    );

    await fragmentsRef.current.core.update(true);
  };

  const handleColorizeToggle = () => {
    if (!componentsRef.current || !fragmentsRef.current) return;

    const isActive = activeTool === "colorize";
    setActiveTool(isActive ? null : "colorize");

    colorizeRef.current.enabled = !isActive;

    if (clipperRef.current) clipperRef.current.enabled = false;
    if (measurerRef.current) measurerRef.current.enabled = false;
    if (areaMeasurerRef.current) areaMeasurerRef.current.enabled = false;

    if (isActive)
      restoreModelMaterials();
  };

  const handleClearColor = async () => {
    if (!componentsRef.current) return;

    const highlighter = componentsRef.current.get(OBCF.Highlighter);
    if (!highlighter) return;

    const styleName = "colorize";

    if (highlighter.styles.has(styleName)) {
      await highlighter.clear(styleName);
    }

    coloredElements.current = {};
  };

  const goToTopicViewpoint = async (topic: OBC.Topic) => {
    if (!componentsRef.current || !topic.viewpoints.size) return;

    const viewpoints = componentsRef.current.get(OBC.Viewpoints);
    const highlighter = componentsRef.current.get(OBCF.Highlighter);
    const fragments = componentsRef.current.get(OBC.FragmentsManager);

    if (!viewpoints || !highlighter || !fragments) return;

    const firstViewpointGuid = topic.viewpoints.values().next().value;

    if (firstViewpointGuid) {
      const viewpoint = viewpoints.list.get(firstViewpointGuid);
      if (viewpoint) {
        await viewpoint.go();

        await highlighter.clear();

        if (viewpoint.selectionComponents.size > 0) {
          const guidArray = Array.from(viewpoint.selectionComponents);
          console.log("GoToTopic - Loaded GUIDs from Viewpoint:", guidArray );

          const selection = await fragments.guidsToModelIdMap(guidArray);
          console.log("GoToTopic - Converted ModelIdMap:", selection);

          highlighter.selection.select = selection;
          await highlighter.highlight("select");
        }
      }
    }
  };

  return (
    <div className="flex w-full h-screen">
       {/* Sidebar */}
      <aside className={`transition-width duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-indigo-400 text-white"}`}>
        <ModelManager
          darkMode={darkMode}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          uploadedModels={uploadedModels}
          IfcUpload={IfcUpload}
          handleFragmentUpload={handleFragmentUpload}
          handleJSONUpload={handleJSONUpload}
          handleDownloadIFC={handleDownloadIFC}
          downloadFragments={downloadFragments}
          handleDownloadJSON={handleDownloadJSON}
          deleteAllModels={deleteAllModels}
          deleteSelectedModel={deleteSelectedModel}
        />
      </aside>

      {/* Main UI */}
      <IFCViewerUI
        darkMode={darkMode}
        viewerRef={viewerRef}
        uploadedModels={uploadedModels}
      />

      <ToolBar
        darkMode={darkMode}
        activeTool={activeTool}
        onSelectTool={(tool) => {
          if (tool === "length") handleLength();
          else if (tool === "clipper") handleClipper();
          else if (tool === "area") handleArea();
          else if (tool === "colorize") handleColorizeToggle();
          else if (tool === "collision") {
            setActiveTool(tool);
            setIsCollisionModalOpen(true);
          }
        }}
        lengthMode={lengthMode}
        setLengthMode={setLengthMode}
        areaMode={areaMode}
        setAreaMode={setAreaMode}
        onColorize={handleColorize}
        onClearColor={handleClearColor}
      />

      <CameraControls
        darkMode={darkMode}
        projection={projection}
        navigation={navigation}
        setProjection={setProjection}
        setNavigation={setNavigation}
        worldRef={worldRef}
      />

      <Viewpoints
        darkMode={darkMode}
        createViewpoint={createViewpoint}
        updateViewpointCamera={updateViewpointCamera}
        setWorldCamera={setWorldCamera}
        getViewpointSnapshotData={getViewpointSnapshotData}
        storedViews={storedViews}
        setStoredViews={setStoredViews}
      />

      {componentsRef.current && fragmentsRef.current && worldRef.current && (
        <ViewOrientation
          components={componentsRef.current}
          fragments={fragmentsRef.current}
          world={worldRef.current}
        />
      )}

      <ActionButtons
        darkMode={darkMode}
        onToggleVisibility={onToggleVisibility}
        onIsolate={onIsolate}
        onShow={onShow}
        onGhost={handleGhost}
        isGhost={isGhost}
      />

      {components && (
        <BCFTopics 
          components={components} 
          world={worldRef.current} 
          darkMode={darkMode} 
          onTopicClick={goToTopicViewpoint}
        />
      )}

      {components && worldRef.current && (
        <CollisionDetector
          isOpen={isCollisionModalOpen}
          onClose={() => {
            setIsCollisionModalOpen(false);
            setActiveTool(null);
          }}
          components={components}
          world={worldRef.current}
          darkMode={darkMode}
        />
      )}

      {/* Info Panel */}
      {infoOpen && (
        <IFCInfoPanel
          darkMode={darkMode}
          infoLoading={infoLoading}
          modelId={selectedModelId}
          localId={selectedLocalId}
          attrs={selectedAttrs}
          psets={selectedPsets}
          onClose={() => setInfoOpen(false)}
          categories={categories}
          selectedCategory={selectedCategory ?? undefined}
          isolateCategory={onCategorySelect}
        />
      )}

      <LoadingModal darkMode={darkMode} progress={progress} show={showProgressModal} />

    </div>
  );
}
