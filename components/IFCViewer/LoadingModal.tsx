"use client";

import React from "react";
import { Spinner } from "@heroui/react";

interface LoadingModalProps {
  darkMode: boolean;
  progress: number;
  show: boolean;
}

export default function LoadingModal({ darkMode, progress, show }: LoadingModalProps) {
  if (!show) return null;

  return (
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
  );
}
