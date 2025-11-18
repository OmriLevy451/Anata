// src/core/domain/shapes.ts
import { LayerID, ShapeID, createId } from "./ids";

export type ShapeKind =
  | "rect" | "ellipse" | "line" | "arrow" | "path"
  | "text" | "image" | "group" | "sticky";

export interface FontStyle {
  family: string;
  size: number;
  weight?: number; // 100..900
  italic?: boolean;
  align?: "left" | "center" | "right";
  lineHeight?: number; // e.g., 1.2
}

export interface Shadow {
  blur: number;
  color: string;
  offsetX: number;
  offsetY: number;
}

export interface Style {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: number[];
  shadow?: Shadow;
  font?: FontStyle; // used by text; safe to keep here for uniformity
}

export interface BaseShape {
  id: ShapeID;
  layerId: LayerID;
  kind: ShapeKind;
  x: number; y: number;
  w: number; h: number;
  rotation: number;
  style: Style;
  meta?: Record<string, unknown>;
}

export interface RectShape extends BaseShape {
  kind: "rect";
  rx?: number; ry?: number; // corner radii
}

export interface EllipseShape extends BaseShape {
  kind: "ellipse";
}

export interface LineShape extends BaseShape {
  kind: "line" | "arrow";
  points: [number, number, number, number]; // x1,y1,x2,y2
  markerEnd?: "arrow" | "circle" | null;
}

export interface PathShape extends BaseShape {
  kind: "path";
  d: string; // SVG path data
  closed?: boolean;
}

export interface TextShape extends BaseShape {
  kind: "text";
  text: string;
  autoResize?: boolean;
  maxWidth?: number;
}

export interface ImageShape extends BaseShape {
  kind: "image";
  src: string;
  naturalW: number;
  naturalH: number;
}

export interface GroupShape extends BaseShape {
  kind: "group";
  children: ShapeID[];
}

export type Shape =
  | RectShape | EllipseShape | LineShape | PathShape
  | TextShape | ImageShape | GroupShape;

/** Factories */
const base = (layerId: LayerID, kind: ShapeKind, x=0, y=0, w=100, h=100): Omit<BaseShape, "id"|"kind"|"layerId"> => ({
  x, y, w, h, rotation: 0, style: {}, meta: {},
});

export function createRect(layerId: LayerID, opts?: Partial<RectShape>): RectShape {
  return { id: createId<"shape">(), layerId, kind: "rect", ...base(layerId, "rect"), ...opts };
}

export function createEllipse(layerId: LayerID, opts?: Partial<EllipseShape>): EllipseShape {
  return { id: createId<"shape">(), layerId, kind: "ellipse", ...base(layerId, "ellipse"), ...opts };
}

export function createLine(layerId: LayerID, opts?: Partial<LineShape>): LineShape {
  return {
    id: createId<"shape">(),
    layerId, kind: "line",
    ...base(layerId, "line"),
    points: [0, 0, 100, 0],
    ...opts,
  };
}

export function createArrow(layerId: LayerID, opts?: Partial<LineShape>): LineShape {
  return { ...createLine(layerId, opts), kind: "arrow", markerEnd: "arrow" };
}

export function createPath(layerId: LayerID, d = "M0 0 L100 0", opts?: Partial<PathShape>): PathShape {
  return { id: createId<"shape">(), layerId, kind: "path", ...base(layerId, "path"), d, ...opts };
}

export function createText(layerId: LayerID, text="Text", opts?: Partial<TextShape>): TextShape {
  return {
    id: createId<"shape">(),
    layerId, kind: "text",
    ...base(layerId, "text"),
    text,
    style: { ...base(layerId, "text").style, font: { family: "Inter", size: 18 } },
    ...opts,
  };
}

export function createImage(layerId: LayerID, src: string, naturalW: number, naturalH: number, opts?: Partial<ImageShape>): ImageShape {
  return { id: createId<"shape">(), layerId, kind: "image", ...base(layerId, "image"), src, naturalW, naturalH, ...opts };
}

export function createGroup(layerId: LayerID, children: ShapeID[], opts?: Partial<GroupShape>): GroupShape {
  return { id: createId<"shape">(), layerId, kind: "group", ...base(layerId, "group"), children, ...opts };
}
