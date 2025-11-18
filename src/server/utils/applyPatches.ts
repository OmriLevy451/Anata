import { Patch } from "@/core/domain/patches";

/** Minimal JSON-pointer-ish applier for "add/replace/remove" at shallow paths. */
export function applyPatches<T extends object>(obj: T, patches: Patch[]): T {
  const clone = structuredClone(obj);
  for (const p of patches) {
    const segs = p.path.split("/").filter(Boolean); // "/a/b/c" -> ["a","b","c"]
    let parent: any = clone;
    for (let i = 0; i < segs.length - 1; i++) {
      const key = segs[i];
      parent[key] ??= {}; // create object if missing (simple)
      parent = parent[key];
    }
    const key = segs[segs.length - 1];
    if (p.op === "add" || p.op === "replace") parent[key] = p.value;
    else if (p.op === "remove") delete parent[key];
  }
  return clone;
}
