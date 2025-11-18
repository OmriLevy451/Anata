// src/core/domain/commands.ts
import { Patch, invertPatches } from "./patches";
import { Doc } from "./doc";
import { Shape, Shape as AnyShape } from "./shapes";
import { ShapeID } from "./ids";

/**
 * Command interface: returns the patches it applied so the caller
 * can record them in history and also undo deterministically.
 */
export interface Command {
  readonly name: string;
  do(doc: Doc): Patch[];                 // apply and return patches (with oldValue filled)
  undo(doc: Doc, patches: Patch[]): void; // default implementation may use inverse patches
}

/**
 * Minimal patch applier for our in-memory Doc.
 * The paths are slash-delimited and index or keys (like JSONPointer-lite).
 */
export function applyPatches(doc: Doc, patches: Patch[]) {
  for (const p of patches) {
    const segs = p.path.split("/").filter(Boolean); // remove leading empty
    // Walk to parent container
    let parent: any = doc;
    for (let i = 0; i < segs.length - 1; i++) parent = parent[segs[i]];
    const key = segs[segs.length - 1];

    if (p.op === "add") {
      if (Array.isArray(parent)) parent.splice(Number(key), 0, p.value);
      else parent[key] = p.value;
    } else if (p.op === "remove") {
      if (Array.isArray(parent)) parent.splice(Number(key), 1);
      else delete parent[key];
    } else { // replace
      parent[key] = p.value;
    }
  }
}

/** Base class with a default undo using invertPatches */
export abstract class BaseCommand implements Command {
  abstract readonly name: string;
  abstract do(doc: Doc): Patch[];
  undo(doc: Doc, patches: Patch[]): void {
    const inverse = invertPatches(patches);
    applyPatches(doc, inverse);
  }
}

/** Insert a new shape into a layer + z-order */
export class InsertShapeCommand extends BaseCommand {
  readonly name = "InsertShape";
  constructor(
    private layerPath: string,          // e.g., "/layers/ly1"
    private zlistPath: string,          // e.g., "/layers/ly1/objectIds/0"
    private shape: Shape
  ) { super(); }

  do(doc: Doc): Patch[] {
    const patches: Patch[] = [];
    patches.push({
      op: "add",
      path: `${this.layerPath.replace(/\/$/, "")}/objectIds/${0}`,
      value: this.shape.id,
    });
    patches.push({
      op: "add",
      path: `/shapes/${this.shape.id}`,
      value: this.shape,
    });
    applyPatches(doc, patches);
    return patches;
  }
}

/** Update an existing shape (partial replace at path) */
export class UpdateShapeCommand extends BaseCommand {
  readonly name = "UpdateShape";
  constructor(private shapeId: ShapeID, private updates: Partial<AnyShape>) { super(); }

  do(doc: Doc): Patch[] {
    const shape = doc.shapes[this.shapeId];
    const next = { ...shape, ...this.updates };
    const patches: Patch[] = [{
      op: "replace",
      path: `/shapes/${this.shapeId}`,
      value: next,
      oldValue: shape,
    }];
    applyPatches(doc, patches);
    return patches;
  }
}

/** Delete a shape (removes from map; caller should also remove from layer z-order) */
export class DeleteShapeCommand extends BaseCommand {
  readonly name = "DeleteShape";
  constructor(private shapeId: ShapeID, private layerId: string, private indexInLayer: number) { super(); }

  do(doc: Doc): Patch[] {
    const shape = doc.shapes[this.shapeId];
    const patches: Patch[] = [
      { op: "remove", path: `/layers/${this.layerId}/objectIds/${this.indexInLayer}`, oldValue: this.shapeId },
      { op: "remove", path: `/shapes/${this.shapeId}`, oldValue: shape },
    ];
    applyPatches(doc, patches);
    return patches;
  }
}
