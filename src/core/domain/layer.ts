// src/core/domain/layer.ts
import { LayerID, PageID, ShapeID, createId } from "./ids";

export interface Layer {
  id: LayerID;
  pageId: PageID;
  name: string;
  visible: boolean;
  locked: boolean;
  objectIds: ShapeID[]; // z-order within layer: back → front
  createdAt: number;
  updatedAt: number;
}

export function createLayer(pageId: PageID, name = "Layer 1"): Layer {
  const now = Date.now();
  return {
    id: createId<"layer">(),
    pageId,
    name,
    visible: true,
    locked: false,
    objectIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function touchLayer(layer: Layer): Layer {
  return { ...layer, updatedAt: Date.now() };
}
