"use client";

import React, { useState, useEffect, useRef } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";

interface CollisionDetectorProps {
  isOpen: boolean;
  onClose: () => void;
  components: OBC.Components;
  world: OBC.World;
  darkMode: boolean;
}

type ItemWithBox = { modelId: string; itemId: string; box: THREE.Box3 };

const CollisionDetector: React.FC<CollisionDetectorProps> = ({ isOpen, onClose, components, world, darkMode }) => {
  const [results, setResults] = useState<{ item1: ItemWithBox; item2: ItemWithBox }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [itemsProcessed, setItemsProcessed] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const boxerRef = useRef<OBC.BoundingBoxer | null>(null);

  useEffect(() => {
    if (components) {
      boxerRef.current = components.get(OBC.BoundingBoxer);
    }
  }, [components]);

  const handleDetectCollision = async () => {
    if (!boxerRef.current) return;

    setIsLoading(true);
    setProgress(0);
    setItemsProcessed(0);
    setTotalItems(0);
    setResults([]);

    const fragments = components.get(OBC.FragmentsManager);
    const boxer = boxerRef.current;
    const highlighter = components.get(OBCF.Highlighter) as OBCF.Highlighter;

    if (!highlighter) {
      setIsLoading(false);
      return;
    }
    await highlighter.clear("select");

    //Step 1: Get all item IDs
    setStatus("Getting item IDs...");
    await new Promise(resolve => setTimeout(resolve, 0));

    const allItemsList: { modelId: string, itemId: string }[] = [];
    for (const model of fragments.list.values()) {
        const categories = await model.getItemsOfCategories([/.*/]);
        const ids = Object.values(categories).flat();
        for (const id of ids) {
            allItemsList.push({ modelId: model.modelId, itemId: id });
        }
    }

    if (allItemsList.length === 0) {
        setStatus("No items with geometry found.");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        return;
    }
    
    setTotalItems(allItemsList.length);

    //Step 2: Get bounding boxes for all items
    setStatus("Getting bounding boxes...");
    setProgress(0);
    await new Promise(resolve => setTimeout(resolve, 0));

    const itemsWithBoxes: ItemWithBox[] = [];
    for (let i = 0; i < allItemsList.length; i++) {
        const { modelId, itemId } = allItemsList[i];
        try {
            const numericId = parseInt(itemId, 10);
            if (isNaN(numericId)) {
                continue;
            }
            
            const modelIdMap: OBC.ModelIdMap = { [modelId]: new Set([numericId]) };
            
            boxer.list.clear();
            await boxer.addFromModelIdMap(modelIdMap);
            const box = boxer.get();
            boxer.list.clear();

            if (box && !box.isEmpty()) {
                itemsWithBoxes.push({ modelId, itemId, box });
            }
        } catch (error) {
            console.warn(`Could not get bounding box for item ${itemId} in model ${modelId}.`, error);
        }
        
        const currentProgress = Math.round(((i + 1) / allItemsList.length) * 100);
        setProgress(currentProgress);
        setItemsProcessed(i + 1);

        if (i % 20 === 0 || i === allItemsList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    if (itemsWithBoxes.length === 0) {
        setStatus("Could not get bounding boxes for any item.");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        return;
    }

    //Step 3: Compare items
    setStatus("Comparing items...");
    setProgress(0);
    setItemsProcessed(0);
    const totalComparisons = itemsWithBoxes.length * (itemsWithBoxes.length - 1) / 2;
    setTotalItems(totalComparisons);
    await new Promise(resolve => setTimeout(resolve, 0));

    const collisions: { item1: ItemWithBox; item2: ItemWithBox }[] = [];
    let comparisons = 0;

    for (let i = 0; i < itemsWithBoxes.length; i++) {
      for (let j = i + 1; j < itemsWithBoxes.length; j++) {
        const item1 = itemsWithBoxes[i];
        const item2 = itemsWithBoxes[j];

        if (item1.box.intersectsBox(item2.box)) {
          collisions.push({ item1, item2 });
        }

        comparisons++;
        if (comparisons % 10000 === 0 || comparisons === totalComparisons) {
          const currentProgress = totalComparisons > 0 ? Math.round((comparisons / totalComparisons) * 100) : 100;
          setProgress(currentProgress);
          setItemsProcessed(comparisons);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    setResults(collisions);
    
    setStatus(collisions.length > 0 ? `${collisions.length} collisions found.` : "No collisions found.");
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const boundingBoxHelpers = useRef<THREE.Box3Helper[]>([]);

  const handleCollisionClick = async (collision: { item1: ItemWithBox; item2: ItemWithBox }) => {
    const { item1, item2 } = collision;
    const fragments = components.get(OBC.FragmentsManager);
    const hider = components.get(OBC.Hider);
    if (!fragments || !hider) return;

    for (const helper of boundingBoxHelpers.current) {
      world.scene.three.remove(helper);
      helper.dispose();
    }
    boundingBoxHelpers.current = [];

    const selection: OBC.ModelIdMap = {};
    
    const id1 = parseInt(item1.itemId, 10);
    if (!selection[item1.modelId]) {
      selection[item1.modelId] = new Set();
    }
    selection[item1.modelId].add(id1);

    const id2 = parseInt(item2.itemId, 10);
    if (!selection[item2.modelId]) {
      selection[item2.modelId] = new Set();
    }
    selection[item2.modelId].add(id2);

    await hider.set(false);
    await hider.set(true, selection);
    
    const highlighter = components.get(OBCF.Highlighter);
    await highlighter.clear();

    await fragments.highlight(
      {
        color: new THREE.Color("red"),
        renderedFaces: FRAGS.RenderedFaces.ONE,
        opacity: 1,
        transparent: false,
      },
      { [item1.modelId]: new Set([parseInt(item1.itemId, 10)]) }
    );

    await fragments.highlight(
      {
        color: new THREE.Color("orange"),
        renderedFaces: FRAGS.RenderedFaces.ONE,
        opacity: 1,
        transparent: false,
      },
      { [item2.modelId]: new Set([parseInt(item2.itemId, 10)]) }
    );

    const helper1 = new THREE.Box3Helper(item1.box, new THREE.Color("red"));
    const helper2 = new THREE.Box3Helper(item2.box, new THREE.Color("orange"));
    world.scene.three.add(helper1, helper2);
    boundingBoxHelpers.current.push(helper1, helper2);

    await fragments.core.update(true);

    onClose();

    const unionBox = item1.box.clone().union(item2.box);
    const center = new THREE.Vector3();
    unionBox.getCenter(center);
    const size = new THREE.Vector3();
    unionBox.getSize(size);
    const camera = world.camera as OBC.OrthoPerspectiveCamera;
    const newPos = new THREE.Vector3(center.x + size.x, center.y + size.y, center.z + size.z);
    await camera.controls.setLookAt(newPos.x, newPos.y, newPos.z, center.x, center.y, center.z, true);       
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center">
      <div className={`p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"} w-full max-w-md`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Collision Detection</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={handleDetectCollision}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded text-white font-semibold ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Detecting..." : "Detect All Collisions"}
          </button>
          {isLoading && (
            <div>
              <p className="text-sm text-center mb-1">{status}</p>
              <div className="w-full bg-gray-600 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-sm text-center mt-1">{itemsProcessed} / {totalItems}</p>
            </div>
          )}
          <div className="overflow-y-auto max-h-60">
            <p>Results: {results.length} collisions found.</p>
            {results.map((collision, index) => (
              <div 
                key={index} 
                className="p-2 border-b border-gray-700 cursor-pointer hover:bg-gray-700"
                onClick={() => handleCollisionClick(collision)}
              >
                <p>Collision {index + 1}:</p>
                <p>Item 1: {collision.item1.itemId} (Model: {collision.item1.modelId})</p>
                <p>Item 2: {collision.item2.itemId} (Model: {collision.item2.modelId})</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollisionDetector;
