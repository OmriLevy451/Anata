// src/core/domain/doc.ts
// Central in-memory document model used by commands and patches.
// (Separated to avoid circular deps)
import { Board } from "./board";
import { Page } from "./page";
import { Layer } from "./layer";
import { ShapeID } from "./ids";
import { Shape } from "./shapes";
import { Comment } from "./selection";

export interface Doc {
  board: Board;
  pages: Record<string, Page>;
  layers: Record<string, Layer>;
  shapes: Record<ShapeID, Shape>;
  comments: Record<string, Comment>;
  currentPageId: string | null;
}
