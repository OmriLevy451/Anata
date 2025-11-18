// src/core/domain/selection.ts
import { PageID, ShapeID, CommentID, UserID, createId } from "./ids";

export interface SelectionState {
  pageId: PageID;
  objectIds: ShapeID[];
  primary?: ShapeID;
  handle?: string | null; // e.g., "nw", "se", "rotate"
}

export type Guide = { type: "x" | "y" | "snap"; value: number };

export interface Comment {
  id: CommentID;
  targetId: ShapeID;
  authorId: UserID;
  text: string;
  createdAt: number;
  resolved: boolean;
}

export function createComment(targetId: ShapeID, authorId: UserID, text: string): Comment {
  return {
    id: createId<"comment">(),
    targetId,
    authorId,
    text,
    createdAt: Date.now(),
    resolved: false,
  };
}
