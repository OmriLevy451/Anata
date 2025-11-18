// src/core/domain/patches.ts
// Lightweight JSON-Patch-ish structures + helpers to invert.
export type PatchOp = "add" | "remove" | "replace";

export interface Patch {
  op: PatchOp;
  path: string;       // e.g., "/pages/pg1/layers/ly2/objectIds/3"
  value?: unknown;    // required for add/replace; absent for remove
  // For undo support we optionally carry the old value when generating patches.
  oldValue?: unknown;
}

export interface HistoryFrame {
  name: string;
  patches: Patch[];
}

export interface History {
  stack: HistoryFrame[];
  index: number; // -1 means nothing applied yet
}

/**
 * Compute inverse patches for undo (reverse order + op inversion).
 * Only works correctly if `oldValue` is recorded on creation.
 */
export function invertPatches(patches: Patch[]): Patch[] {
  return [...patches].reverse().map(p => {
    if (p.op === "add")   return { op: "remove", path: p.path, oldValue: p.value };
    if (p.op === "remove")return { op: "add", path: p.path, value: p.oldValue };
    return { op: "replace", path: p.path, value: p.oldValue, oldValue: p.value };
  });
}
