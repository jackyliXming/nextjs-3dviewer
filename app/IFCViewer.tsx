"use client";
import React, { useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import * as BUI from "@thatopen/ui";
import { PerspectiveCamera, OrthographicCamera } from "three";

export default function IFCViewer() {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const fragmentsRef = useRef<OBC.FragmentsManager | null>(null);
  const worldRef = useRef<any>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    const components = new OBC.Components();
    componentsRef.current = components;

    // world
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

    components.init();

    // Grids
    components.get(OBC.Grids).create(world);

    // IFC Loader
    const ifcLoader = components.get(OBC.IfcLoader);
    ifcLoader.setup();

    // initialize FragmentsManager
    const initFragments = async () => {
      const githubUrl = "https://thatopen.github.io/engine_fragment/resources/worker.mjs";
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

  // upload IFC → Fragment
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fragmentsRef.current || !componentsRef.current || !worldRef.current) return;

    const arrayBuffer = await file.arrayBuffer();
    const modelId = `ifc_uploaded_${Date.now()}`;

    // 型別斷言 camera
    const cam = worldRef.current.camera.three as PerspectiveCamera | OrthographicCamera;

    // use FragmentsManager to load
    await fragmentsRef.current.core.load(arrayBuffer, { modelId });
    const model = fragmentsRef.current.list.get(modelId);
    if (model) {
      model.useCamera(cam);
      worldRef.current.scene.three.add(model.object);
      fragmentsRef.current.core.update(true);
    }
  };

  // UI initialization
  useEffect(() => {
    BUI.Manager.init();

    const panel = BUI.Component.create<BUI.PanelSection>(() => {
      const onDisposeAll = () => {
        fragmentsRef.current?.list.forEach((_, id) => fragmentsRef.current?.core.disposeModel(id));
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
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <input
        type="file"
        accept=".ifc"
        onChange={handleFileChange}
        style={{
          position: "absolute",
          zIndex: 9999,
          top: 10,
          left: 10,
          padding: "5px 10px",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      />
      <div ref={viewerRef} id="viewer-container" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
