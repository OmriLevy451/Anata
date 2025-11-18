// src/core/domain/page.ts
import { LayerID, PageID, createId } from "./ids";

export interface Viewport {
  x: number;
  y: number;
  zoom: number; // 1.0 = 100%
}

export interface Page {
  id: PageID;
  boardId: string; // BoardID as string to avoid circular import at type level
  width: number;   // logical units
  height: number;
  layers: LayerID[];  // z-order back → front
  viewport: Viewport; // last-viewed state
  name: string;
  createdAt: number;
  updatedAt: number;
}

export function createPage(boardId: string, opts?: Partial<Omit<Page, "id"|"boardId"|"createdAt"|"updatedAt"|"layers"|"viewport">> & {
  width?: number; height?: number; name?: string;
}): Page {
  const now = Date.now();
  return {
    id: createId<"page">(),
    boardId,
    width: opts?.width ?? 1920,
    height: opts?.height ?? 1080,
    name: opts?.name ?? "Page 1",
    layers: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: now,
    updatedAt: now,
  };
}

export function touchPage(page: Page): Page {
  return { ...page, updatedAt: Date.now() };
}
