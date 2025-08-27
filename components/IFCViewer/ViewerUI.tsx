import React from "react";

interface Props {
  darkMode: boolean;
  viewerRef: React.RefObject<HTMLDivElement>;
  uploadedModels: any[];
}

export default function IFCViewerUI({ darkMode, viewerRef, uploadedModels }: Props) {
  return (
    <div className="flex flex-col flex-1">
      {/* Viewer */}
      <div ref={viewerRef} className="flex-1" />

    </div>
  );
}

