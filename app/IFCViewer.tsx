"use client";
import React, { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import { PerspectiveCamera, OrthographicCamera } from "three";

export default function IFCViewer() {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);
  const worldRef = useRef<any>(null);

  // 初始化 Viewer
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

    // Grids
    components.get(OBC.Grids).create(world);

    // IFC Loader
    const ifcLoader = components.get(OBC.IfcLoader);
    ifcLoader.setup();
    ifcLoaderRef.current = ifcLoader;

    // FragmentsManager 初始化
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

      fragments.list.onItemSet.add(({ value: model }) => {
        const cam = world.camera.three as PerspectiveCamera | OrthographicCamera;
        model.useCamera(cam);
        world.scene.three.add(model.object);
        fragments.core.update(true);
      });
    };
    initFragments();

    // Highlighter
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

  // 上傳 IFC → Fragment
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ifcLoaderRef.current || !fragmentsRef.current || !worldRef.current) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const modelId = `ifc_uploaded_${Date.now()}`;

      // 直接使用 arrayBuffer
      await fragmentsRef.current.core.load(arrayBuffer, { modelId });

      const fragModel = fragmentsRef.current.list.get(modelId);
      if (fragModel) {
        const cam = worldRef.current.camera.three as PerspectiveCamera | OrthographicCamera;
        fragModel.useCamera(cam);
        worldRef.current.scene.three.add(fragModel.object);
        fragmentsRef.current.core.update(true);
      }
    } catch (err) {
      console.error("Failed to load IFC and convert to Fragment:", err);
    }
  };

  // UI 面板初始化
  useEffect(() => {
    BUI.Manager.init();

    const panel = BUI.Component.create<BUI.PanelSection>(() => {
      const onDisposeAll = () => {
        fragmentsRef.current?.list.forEach((_, id) =>
          fragmentsRef.current?.core.disposeModel(id)
        );
      };

      const onExportAll = async () => {
        for (const [, model] of fragmentsRef.current?.list ?? []) {
          const buffer = await model.getBuffer(false);
          const file = new File([buffer], `${model.modelId}.frag`);
          const a = document.createElement("a");
          a.href = URL.createObjectURL(file);
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(a.href);
        }
      };

      return BUI.html`
        <bim-panel active label="FragmentsManager Controls" class="options-menu">
          <bim-panel-section label="Controls">
            <bim-button label="Dispose All Models" @click=${onDisposeAll}></bim-button>
            <bim-button label="Export All Models" @click=${onExportAll}></bim-button>
          </bim-panel-section>
        </bim-panel>
      `;
    });
    document.body.append(panel);

    const button = BUI.Component.create<BUI.PanelSection>(() => {
      return BUI.html`
        <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
          @click=${() => {
            if (panel.classList.contains("options-menu-visible")) {
              panel.classList.remove("options-menu-visible");
            } else {
              panel.classList.add("options-menu-visible");
            }
          }}>
        </bim-button>
      `;
    });
    document.body.append(button);
  }, []);

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
