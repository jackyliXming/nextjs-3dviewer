// app/page.tsx
"use client";
import Image from "next/image";
import * as React from "react";
import IFCViewer from "./IFCViewer";
// import  { IFCViewer }  from "./IFCViewer";
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
      <main className="flex flex-col gap-[32px] ">
        <IFCViewer />  
        {/* <Image
          className="dark:invert "
          src="/gomore.png"
          alt="Gomore logo"
          width={180}
          height={16}
          priority
        /> */}


        {/* <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Join Us
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div> */}
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
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
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
      {/* <div id="viewer-container" className="fixed top-0 right-0 z-10 w-[800px] h-full bg-white shadow-lg" >        
      </div>     */}
      
    </div>
  );
}
