// app/page.tsx
"use client";
import Image from "next/image";
import * as React from "react";
import IFCViewer from "./IFCViewer";
import HeaderToggle from "./header";
import Sidebar from "./sidebar";
// import * as BUI from "@thatopen/ui";
// import * as CUI from "@thatopen/ui-obc";
import { ProjectsManager } from "./ProjectsManager";

// const IFCViewer = dynamic(() => import("./IFCViewer"), { ssr: false });

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       "bim-grid": any;
//       "bim-text-input": any;
//       "bim-button": any;
//       "bim-label": any;
//       "bim-panel": any;
//       "bim-panel-section": any;
//       "bim-table": any;
//       "bim-dropdown": any;
//       "bim-option": any;
//       "bim-toolbar": any;
//       "bim-toolbar-section": any;
//       "bim-toolbar-group": any;
//       "bim-viewport": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
//     }
//   }
// }

interface Props {
  projectsManager: ProjectsManager
}

export default function Home(props: Props) {
  // React.useEffect(() => {
  //   (async () => {
  //     const BUI = await import("@thatopen/ui");
  //     BUI.Manager.init(); 
  //   })();
  // }, []);
  
  // const onImportProject = () => {
  //   props.projectsManager.importFromJSON()
  // }

  // const importBtn = BUI.Component.create<BUI.Button>(() => {
  //   return BUI.html `
  //     <bim-button
  //       id="import-projects-btn"
  //       icon="iconoir:import"
  //       @click=${onImportProject}
  //     >
  //     </bim-button>
  //   `;
  // })

  // React.useEffect(() => {
  //   const projectControls = document.getElementById("project-page-controls")
  //   projectControls?.appendChild(importBtn)
    
  // }, [])

  return (
    <div className="font-sans min-h-screen gap-16 p-8">
      {/* <Sidebar /> */}
      <HeaderToggle />
      <main className="flex flex-col gap-[16px] ">
        <IFCViewer />  
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap ">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://gomore.com.tw/2015/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to Gomore Website →
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://gomore.com.tw/2015/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          2015 © Gomore Building Envelope Technology Co. Ltd | TEL:02 2797-9977 FAX:02 2797 2588
        </a>
        
      </footer>
    </div>
  );
}
