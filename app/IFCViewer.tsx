"use client";

import React, { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { PerspectiveCamera, OrthographicCamera } from "three";

export default function IFCViewer() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
  const worldRef = useRef<any>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!viewerRef.current) return;

    const init = async () => {
      // Initialize components
      const components = new OBC.Components();
      componentsRef.current = components;

      // Create world
      const worlds = components.get(OBC.Worlds);
      const world = worlds.create();
      worldRef.current = world;

      // Scene
      const scene = new OBC.SimpleScene(components);
      world.scene = scene;
      scene.setup();
      scene.three.background = null;

      // Renderer
      const renderer = new OBCF.PostproductionRenderer(components, viewerRef.current!);
      world.renderer = renderer;

      // Camera
      const camera = new OBC.OrthoPerspectiveCamera(components);
      world.camera = camera;
      await camera.controls.setLookAt(3, 3, 3, 0, 0, 0);
      camera.updateAspect();

      // Initialize components
      components.init();

      // Add grids
      components.get(OBC.Grids).create(world);

      // Setup IfcLoader with explicit WASM path
      const ifcLoader = components.get(OBC.IfcLoader);
      ifcLoaderRef.current = ifcLoader;

      await ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: "https://unpkg.com/web-ifc@0.0.70/",
          absolute: true,
        },
      });
      console.log("IfcLoader ready");

      // Setup FragmentsManager
      const githubUrl =
        "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
      const fetchedUrl = await fetch(githubUrl);
      const workerBlob = await fetchedUrl.blob();
      const workerFile = new File([workerBlob], "worker.mjs", { type: "text/javascript" });
      const workerUrl = URL.createObjectURL(workerFile);

      const fragments = components.get(OBC.FragmentsManager);
      fragments.init(workerUrl);
      fragmentsRef.current = fragments;

      // Attach fragment models to scene
      fragments.list.onItemSet.add(({ value: model }) => {
        const cam = world.camera.three as PerspectiveCamera | OrthographicCamera;
        model.useCamera(cam);
        world.scene.three.add(model.object);
        fragments.core.update(true);
      });

      // Highlighter
      const highlighter = components.get(OBCF.Highlighter);
      highlighter.setup({ world });
      highlighter.zoomToSelection = true;

      // Handle resize
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ifcLoaderRef.current || !fragmentsRef.current || !worldRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const modelId = `ifc_uploaded_${Date.now()}`;

      // Load IFC with proper arguments
      const fragModel = await ifcLoaderRef.current.load(
        uint8Array,   // file bytes
        false,        // coordinate flag
        modelId,      // model name
        {
          instanceCallback: (importer: any) => {
            console.log("IfcImporter instance ready:", importer);
          },
          userData: {},
        }
      );

      // Attach Fragment model to scene
      const cam = worldRef.current.camera.three as PerspectiveCamera | OrthographicCamera;
      fragModel.useCamera(cam);
      worldRef.current.scene.three.add(fragModel.object);
      fragmentsRef.current.core.update(true);

    } catch (err) {
      console.error("Failed to load IFC via IfcLoader:", err);
    }
  };

  return (
    <div className="view flex flex-col" style={{ width: "100%", height: "100vh" }}>
      <input
        title="Upload IFC File"
        className="ifc-upload-input"
        type="file"
        accept=".ifc"
        onChange={handleFileChange}
        style={{ margin: "10px" }}
      />
      <div ref={viewerRef} id="viewer-container" style={{ flex: 1 }} />
      <div style={{ padding: "10px" }}>IFC Loading Progress: {progress}%</div>
    </div>
  );
}
