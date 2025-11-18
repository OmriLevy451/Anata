// src/core/domain/board.ts
import { BoardID, PageID, UserID, createId } from "./ids";

/**
 * A whiteboard project that contains one or more pages (canvas scenes).
 */
export interface Board {
  id: BoardID;
  title: string;
  pages: PageID[];         // ordered list of pages (back → front)
  ownerId: UserID;
  collaboratorIds: UserID[];
  createdAt: number;       // timestamp (ms)
  updatedAt: number;
  settings: BoardSettings;
}

/**
 * Visual and behavioral settings shared across the board.
 */
export interface BoardSettings {
  gridEnabled: boolean;
  snapToGrid: boolean;
  background: {
    color?: string;
    imageUrl?: string;
  };
  snapping: {
    pixel: number;         // e.g. 10px snap grid
    points: boolean;       // snap to other object centers
  };
}

/**
 * Factory function to create a new board in memory.
 */
export function createBoard(
  title: string,
  ownerId: UserID
): Board {
  const now = Date.now();
  return {
    id: createId<"board">(),
    title,
    pages: [],
    ownerId,
    collaboratorIds: [],
    createdAt: now,
    updatedAt: now,
    settings: {
      gridEnabled: true,
      snapToGrid: true,
      background: { color: "#ffffff" },
      snapping: { pixel: 10, points: true },
    },
  };
}

/**
 * Utility to update board timestamps or properties immutably.
 */
export function updateBoard(
  board: Board,
  updates: Partial<Omit<Board, "id">>
): Board {
  return {
    ...board,
    ...updates,
    updatedAt: Date.now(),
  };
}
