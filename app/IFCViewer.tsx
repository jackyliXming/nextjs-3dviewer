"use client";
import React, { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { PerspectiveCamera, OrthographicCamera } from "three";

export default function IFCViewer() {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
  const worldRef = useRef<OBC.World | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    const components = new OBC.Components();
    componentsRef.current = components;

    // 建立 World
    const worlds = components.get(OBC.Worlds);
    const world = worlds.create();
    worldRef.current = world;

    // Scene
    const scene = new OBC.SimpleScene(components);
    world.scene = scene;
    scene.setup();
    scene.three.background = null;

    // Renderer
    const renderer = new OBCF.PostproductionRenderer(components, viewerRef.current);
    world.renderer = renderer;

    // Camera
    const camera = new OBC.OrthoPerspectiveCamera(components);
    world.camera = camera;
    camera.controls.setLookAt(3, 3, 3, 0, 0, 0);
    camera.updateAspect();

    // 初始化 Components
    components.init();

    // Grid
    components.get(OBC.Grids).create(world);

    // IFC Loader
    const ifcLoader = components.get(OBC.IfcLoader);
    ifcLoader.setup();
    ifcLoaderRef.current = ifcLoader;

    // Fragments Manager
    const initFragments = async () => {
      const githubUrl =
        "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
      const workerUrl = URL.createObjectURL(workerFile);

      const fragments = components.get(OBC.FragmentsManager);
      fragments.init(workerUrl);
      fragmentsRef.current = fragments;

      // 當 IFC 載入完成時自動加入場景
      fragments.list.onItemSet.add(({ value: model }) => {
        const cam = world.camera.three as PerspectiveCamera | OrthographicCamera;
        model.useCamera(cam);
        world.scene.three.add(model.object);
        fragments.core.update(true);
      });
    };
    initFragments();

    // Highlighter (選取物件)
    const highlighter = components.get(OBCF.Highlighter);
    highlighter.setup({ world });
    highlighter.zoomToSelection = true;

    // Resize
    const handleResize = () => {
      renderer.resize();
      camera.updateAspect();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      components.dispose();
    };
  }, []);

  // 上傳 IFC
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ifcLoaderRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const modelId = `ifc_uploaded_${Date.now()}`;

      await ifcLoaderRef.current.load(uint8Array, false, modelId, {
        processData: {
          progressCallback: (progress: number) => {
            console.log("IFC Loading Progress:", progress);
          },
        },
      });
    } catch (err) {
      console.error("Failed to load IFC via IfcLoader:", err);
    }
  };

  return (
    <div className="view flex flex-col" style={{ width: "100%", height: "100vh" }}>
      <input
        title="Upload IFC File"
        className="ifc-upload-input h-5"
        type="file"
        accept=".ifc"
        onChange={handleFileChange}
      />
      <div ref={viewerRef} id="viewer-container" className="h-full" />
    </div>
  );
}
