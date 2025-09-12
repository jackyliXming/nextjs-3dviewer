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
  categories: string[];
}

type ItemWithBox = { modelId: string; itemId: string; box: THREE.Box3 };
type Group = { [modelId: string]: Set<string> };
type SelectedCategory = { name: string; count: number };

const CollisionDetector: React.FC<CollisionDetectorProps> = ({ isOpen, onClose, components, world, darkMode, categories }) => {
  const [results, setResults] = useState<{ item1: ItemWithBox; item2: ItemWithBox }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [itemsProcessed, setItemsProcessed] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [groupA, setGroupA] = useState<Group>({});
  const [groupB, setGroupB] = useState<Group>({});
  const [selectedCategoriesA, setSelectedCategoriesA] = useState<SelectedCategory[]>([]);
  const [selectedCategoriesB, setSelectedCategoriesB] = useState<SelectedCategory[]>([]);
  const boxerRef = useRef<OBC.BoundingBoxer | null>(null);
  const selectARef = useRef<HTMLSelectElement>(null);
  const selectBRef = useRef<HTMLSelectElement>(null);
  const boundingBoxHelpers = useRef<THREE.Box3Helper[]>([]);

  useEffect(() => {
    if (components) {
      boxerRef.current = components.get(OBC.BoundingBoxer);
    }
  }, [components]);

  const cleanupHelpers = () => {
    for (const helper of boundingBoxHelpers.current) {
      world.scene.three.remove(helper);
      helper.dispose();
    }
    boundingBoxHelpers.current = [];
  };

  const getGroupItemCount = (group: Group) => {
    return Object.values(group).reduce((count, ids) => count + ids.size, 0);
  };

  const handleAddSelectionToGroup = async (
    groupSetter: React.Dispatch<React.SetStateAction<Group>>,
    catSetter: React.Dispatch<React.SetStateAction<SelectedCategory[]>>
  ) => {
    const highlighter = components.get(OBCF.Highlighter) as OBCF.Highlighter;
    if (!highlighter) return;

    const selection = highlighter.selection.select;
    if (Object.keys(selection).length === 0) {
      setStatus("No items selected.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
    
    const selectionCount = Object.values(selection).reduce((acc, set) => acc + set.size, 0);

    groupSetter(prevGroup => {
      const newGroup = { ...prevGroup };
      for (const modelId in selection) {
        if (!newGroup[modelId]) {
          newGroup[modelId] = new Set();
        }
        for (const id of selection[modelId]) {
          newGroup[modelId].add(id.toString());
        }
      }
      return newGroup;
    });
    
    catSetter(prev => [...prev, { name: `Selection`, count: selectionCount }])

    await highlighter.clear("select");
  };

  const handleAddCategoryToGroup = async (
    category: string, 
    groupSetter: React.Dispatch<React.SetStateAction<Group>>,
    catSetter: React.Dispatch<React.SetStateAction<SelectedCategory[]>>
  ) => {
    if (!category) return;
    const fragments = components.get(OBC.FragmentsManager);

    setStatus(`Adding ${category} to group...`);
    await new Promise(resolve => setTimeout(resolve, 0));

    const newItems: Group = {};
    let itemsCount = 0;
    for (const model of fragments.list.values()) {
      const categories = await model.getItemsOfCategories([new RegExp(`^${category}$`)]);
      const ids = Object.values(categories).flat();
      if (ids.length > 0) {
        itemsCount += ids.length;
        if (!newItems[model.modelId]) {
          newItems[model.modelId] = new Set();
        }
        for (const id of ids) {
          newItems[model.modelId].add(id.toString());
        }
      }
    }

    groupSetter(prevGroup => {
      const newGroup = { ...prevGroup };
      for (const modelId in newItems) {
        if (!newGroup[modelId]) {
          newGroup[modelId] = new Set();
        }
        for (const id of newItems[modelId]) {
          newGroup[modelId].add(id);
        }
      }
      return newGroup;
    });
    
    catSetter(prev => [...prev, { name: category, count: itemsCount }]);

    setStatus(`Added ${itemsCount} items from ${category}.`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const getItemsWithBoxes = async (group: Group): Promise<ItemWithBox[]> => {
    const boxer = boxerRef.current;
    if (!boxer) return [];

    const itemsWithBoxes: ItemWithBox[] = [];
    const groupItems: { modelId: string, itemId: string }[] = [];
    for (const modelId in group) {
      for (const itemId of group[modelId]) {
        groupItems.push({ modelId, itemId });
      }
    }

    setTotalItems(groupItems.length);
    setItemsProcessed(0);

    for (let i = 0; i < groupItems.length; i++) {
      const { modelId, itemId } = groupItems[i];
      try {
        const numericId = parseInt(itemId, 10);
        if (isNaN(numericId)) continue;

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
      
      const currentProgress = Math.round(((i + 1) / groupItems.length) * 100);
      setProgress(currentProgress);
      setItemsProcessed(i + 1);
      if (i % 20 === 0 || i === groupItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    return itemsWithBoxes;
  };

  const handleDetectCollision = async () => {
    cleanupHelpers();
    const countA = getGroupItemCount(groupA);
    const countB = getGroupItemCount(groupB);

    if (!boxerRef.current || countA === 0 || countB === 0) {
      setStatus("Please add items to both groups.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setItemsProcessed(0);
    setTotalItems(0);
    setResults([]);

    const areGroupsEqual = groupA === groupB;

    setStatus("Getting bounding boxes for Group A...");
    await new Promise(resolve => setTimeout(resolve, 0));
    const itemsA = await getItemsWithBoxes(groupA);

    let itemsB = itemsA;
    if (!areGroupsEqual) {
      setStatus("Getting bounding boxes for Group B...");
      await new Promise(resolve => setTimeout(resolve, 0));
      itemsB = await getItemsWithBoxes(groupB);
    }

    if (itemsA.length === 0 || itemsB.length === 0) {
      setStatus("Could not get bounding boxes for items.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsLoading(false);
      return;
    }

    setStatus("Comparing items...");
    setProgress(0);
    setItemsProcessed(0);
    
    const collisions: { item1: ItemWithBox; item2: ItemWithBox }[] = [];
    const foundPairs = new Set<string>();
    let comparisons = 0;
    let totalComparisons = 0;

    if (areGroupsEqual) {
      totalComparisons = itemsA.length * (itemsA.length - 1) / 2;
      setTotalItems(totalComparisons);
      for (let i = 0; i < itemsA.length; i++) {
        for (let j = i + 1; j < itemsA.length; j++) {
          const item1 = itemsA[i];
          const item2 = itemsA[j];
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
    } else {
      totalComparisons = itemsA.length * itemsB.length;
      setTotalItems(totalComparisons);
      for (const item1 of itemsA) {
        for (const item2 of itemsB) {
          if (item1.modelId === item2.modelId && item1.itemId === item2.itemId) {
            // Skip self-comparison if an item is in both groups
            continue;
          }

          if (item1.box.intersectsBox(item2.box)) {
            const key1 = `${item1.modelId}-${item1.itemId}`;
            const key2 = `${item2.modelId}-${item2.itemId}`;
            const pairKey = [key1, key2].sort().join('|');
            
            if (!foundPairs.has(pairKey)) {
              collisions.push({ item1, item2 });
              foundPairs.add(pairKey);
            }
          }
          comparisons++;
          if (comparisons % 1000 === 0 || comparisons === totalComparisons) {
            const currentProgress = totalComparisons > 0 ? Math.round((comparisons / totalComparisons) * 100) : 100;
            setProgress(currentProgress);
            setItemsProcessed(comparisons);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
    }
    
    setResults(collisions);
    
    setStatus(collisions.length > 0 ? `${collisions.length} collisions found.` : "No collisions found.");
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  const handleCollisionClick = async (collision: { item1: ItemWithBox; item2: ItemWithBox }) => {
    const { item1, item2 } = collision;
    const fragments = components.get(OBC.FragmentsManager);
    const hider = components.get(OBC.Hider);
    if (!fragments || !hider) return;

    cleanupHelpers();

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
      { [item1.modelId]: new Set([id1]) }
    );

    await fragments.highlight(
      {
        color: new THREE.Color("orange"),
        renderedFaces: FRAGS.RenderedFaces.ONE,
        opacity: 1,
        transparent: false,
      },
      { [item2.modelId]: new Set([id2]) }
    );

    handleClose();

    const helper1 = new THREE.Box3Helper(item1.box, new THREE.Color("red"));
    const helper2 = new THREE.Box3Helper(item2.box, new THREE.Color("orange"));
    world.scene.three.add(helper1, helper2);
    boundingBoxHelpers.current.push(helper1, helper2);

    await fragments.core.update(true);

    const unionBox = item1.box.clone().union(item2.box);
    const center = new THREE.Vector3();
    unionBox.getCenter(center);
    const size = new THREE.Vector3();
    unionBox.getSize(size);
    const camera = world.camera as OBC.OrthoPerspectiveCamera;
    const newPos = new THREE.Vector3(center.x + size.x, center.y + size.y, center.z + size.z);
    await camera.controls.setLookAt(newPos.x, newPos.y, newPos.z, center.x, center.y, center.z, true);       
  };

  const handleClose = () => {
    cleanupHelpers();
    onClose();
  };

  if (!isOpen) return null;

  const availableCategoriesA = categories.filter(cat => !selectedCategoriesA.some(sc => sc.name === cat));
  const availableCategoriesB = categories.filter(cat => !selectedCategoriesB.some(sc => sc.name === cat));

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 z-50 flex justify-center items-center">
      <div className={`p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"} w-full max-w-3xl`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Collision Detection</h2>
          <button onClick={handleClose} className="text-2xl font-bold">&times;</button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Group A */}
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"} flex flex-col gap-2`}>
              <h3 className="font-bold">Group A ({getGroupItemCount(groupA)} items)</h3>
              <div className="flex flex-col gap-1 text-sm">
                {selectedCategoriesA.map(sc => (
                  <div key={sc.name} className="flex justify-between">
                    <span>{sc.name}</span>
                    <span>{sc.count} items</span>
                  </div>
                ))}
              </div>
              <select
                ref={selectARef}
                onChange={(e) => handleAddCategoryToGroup(e.target.value, setGroupA, setSelectedCategoriesA)}
                disabled={isLoading}
                className={`w-full p-1 rounded text-sm ${darkMode ? "bg-gray-600 text-white" : "bg-white text-black"}`}
              >
                <option value="">Add category to group...</option>
                {availableCategoriesA.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddSelectionToGroup(setGroupA, setSelectedCategoriesA)}
                  disabled={isLoading}
                  className={`w-full px-3 py-1 rounded text-white text-sm font-semibold ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Add Selection
                </button>
                <button
                  onClick={() => {
                    setGroupA({});
                    setSelectedCategoriesA([]);
                    if(selectARef.current) selectARef.current.selectedIndex = 0;
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-1 rounded text-white text-sm font-semibold ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Group B */}
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-200"} flex flex-col gap-2`}>
              <h3 className="font-bold">Group B ({getGroupItemCount(groupB)} items)</h3>
              <div className="flex flex-col gap-1 text-sm">
                {selectedCategoriesB.map(sc => (
                  <div key={sc.name} className="flex justify-between">
                    <span>{sc.name}</span>
                    <span>{sc.count} items</span>
                  </div>
                ))}
              </div>
              <select
                ref={selectBRef}
                onChange={(e) => handleAddCategoryToGroup(e.target.value, setGroupB, setSelectedCategoriesB)}
                disabled={isLoading}
                className={`w-full p-1 rounded text-sm ${darkMode ? "bg-gray-600 text-white" : "bg-white text-black"}`}
              >
                <option value="">Add category to group...</option>
                {availableCategoriesB.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddSelectionToGroup(setGroupB, setSelectedCategoriesB)}
                  disabled={isLoading}
                  className={`w-full px-3 py-1 rounded text-white text-sm font-semibold ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Add Selection
                </button>
                <button
                  onClick={() => {
                    setGroupB({});
                    setSelectedCategoriesB([]);
                    if(selectBRef.current) selectBRef.current.selectedIndex = 0;
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-1 rounded text-white text-sm font-semibold ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleDetectCollision}
            disabled={isLoading || getGroupItemCount(groupA) === 0 || getGroupItemCount(groupB) === 0}
            className={`w-full px-4 py-2 rounded text-white font-semibold ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} ${isLoading || getGroupItemCount(groupA) === 0 || getGroupItemCount(groupB) === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Detecting..." : "Detect Collisions"}
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
                className={`p-2 border-b cursor-pointer ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-100"}`}
                onClick={() => handleCollisionClick(collision)}
              >
                <p>Collision {index + 1}:</p>
                <p className="text-sm">Item A: {collision.item1.itemId} (Model: {collision.item1.modelId})</p>
                <p className="text-sm">Item B: {collision.item2.itemId} (Model: {collision.item2.modelId})</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollisionDetector;
