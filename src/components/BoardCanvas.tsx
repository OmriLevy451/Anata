"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
// Optional: Icons (If you don't have lucide, delete these imports and use Emojis in the UI below)
import { MousePointer2, Pencil, Eraser, Square, Circle, Heart, PaintBucket } from 'lucide-react';

interface BoardCanvasProps {
  pageId: string;
  userId: string;
}

// Helper: Heart SVG Path
const HEART_SVG_PATH = 'M 272.70141,238.71731 C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731 C 152.70146,493.47281 288.63461,521.28716 396.70141,616.71731 C 504.76814,521.28716 640.70141,493.47281 640.70141,358.71731 C 640.70141,292.47731 586.94141,238.71731 520.70141,238.71731 C 491.81341,238.71731 466.06941,248.87481 445.70141,265.81106 C 425.33341,248.87481 399.58941,238.71731 370.70141,238.71731 z';

export default function BoardCanvas({ pageId, userId }: BoardCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  
  // 1. NEW STATE: Active Tool instead of isDrawing
  const [activeTool, setActiveTool] = useState("select"); // 'select' | 'brush' | 'eraser' | 'rect' | 'circle' | 'heart' | 'fill'
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(3);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "error">("loading");

  // Refs for Shape Creation
  const isDraggingShape = useRef(false);
  const shapeStartPos = useRef({ x: 0, y: 0 });
  const activeShapeRef = useRef<fabric.Object | null>(null);
  const pageVersionRef = useRef(1);

  // --- INITIALIZE CANVAS ---
  useEffect(() => {
    if (!canvasEl.current) return;

    const fabricCanvas = new fabric.Canvas(canvasEl.current, {
      width: 1200, 
      height: 800,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
    });

    // Setup Brush
    const brush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush = brush;
    setCanvas(fabricCanvas);

    return () => { fabricCanvas.dispose(); };
  }, []);

  // --- TOOL SWITCHING LOGIC ---
  useEffect(() => {
    if (!canvas) return;

    // A. Clean up previous listeners
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    // B. Handle Brush & Eraser
    if (activeTool === 'brush') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    } 
    else if (activeTool === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = "#ffffff"; // Simple white brush eraser
      canvas.freeDrawingBrush.width = 20;
    }
    else {
      // For shapes and select, turn off drawing mode
      canvas.isDrawingMode = false;
    }

    // C. Handle Shape Creation (Rect, Circle, Heart)
    if (['rect', 'circle', 'heart'].includes(activeTool)) {
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();
      canvas.requestRenderAll();

      // Mouse Down: Start Shape
      canvas.on('mouse:down', (o) => {
        isDraggingShape.current = true;
        const pointer = canvas.getPointer(o.e);
        shapeStartPos.current = { x: pointer.x, y: pointer.y };

        let shape: fabric.Object | null = null;
        const opts = { 
          left: pointer.x, top: pointer.y, 
          fill: brushColor, stroke: 'black', strokeWidth: 1,
          selectable: false, evented: false // Disable interaction while drawing
        };

        if (activeTool === 'rect') shape = new fabric.Rect({ ...opts, width: 0, height: 0 });
        if (activeTool === 'circle') shape = new fabric.Circle({ ...opts, radius: 0 });
        if (activeTool === 'heart') shape = new fabric.Path(HEART_SVG_PATH, { ...opts, scaleX: 0, scaleY: 0 });

        if (shape) {
          activeShapeRef.current = shape;
          canvas.add(shape);
        }
      });

      // Mouse Move: Resize Shape
      canvas.on('mouse:move', (o) => {
        if (!isDraggingShape.current || !activeShapeRef.current) return;
        const pointer = canvas.getPointer(o.e);
        const shape = activeShapeRef.current;
        const w = Math.abs(pointer.x - shapeStartPos.current.x);
        const h = Math.abs(pointer.y - shapeStartPos.current.y);

        if (activeTool === 'rect') { shape.set({ width: w, height: h }); }
        if (activeTool === 'circle') { (shape as fabric.Circle).set({ radius: w / 2 }); }
        if (activeTool === 'heart') { shape.set({ scaleX: w / 100, scaleY: h / 100 }); } // Approx scaling

        canvas.requestRenderAll();
      });

      // Mouse Up: Finalize Shape
      canvas.on('mouse:up', async () => {
        if (isDraggingShape.current && activeShapeRef.current) {
          const finishedShape = activeShapeRef.current;
          finishedShape.set({ selectable: true, evented: true });
          // Trigger Save
          await saveNewShape(finishedShape, activeTool);
        }
        isDraggingShape.current = false;
        activeShapeRef.current = null;
      });
    }

    // D. Handle Fill Tool
    if (activeTool === 'fill') {
      canvas.defaultCursor = 'cell';
      canvas.on('mouse:down', async (o) => {
        if (o.target) {
          o.target.set('fill', brushColor);
          canvas.requestRenderAll();
          // Trigger Update Save
          // Note: This requires a new generic update handler, defined below
          await handleObjectModified({ target: o.target }); 
        }
      });
    }

    if (activeTool === 'select') {
      canvas.defaultCursor = 'default';
    }

  }, [canvas, activeTool, brushColor, brushWidth]);


  // --- LOAD DATA (Keep existing logic mostly the same) ---
  useEffect(() => {
    if (!canvas || !pageId) return;

    const loadContent = async () => {
      try {
        setStatus("loading");
        const res = await fetch(`/api/pages/${pageId}`);
        const data = await res.json();
        
        if (data.version) pageVersionRef.current = data.version;

        const shapes = data.content?.shapes || {};
        canvas.clear(); 
        canvas.backgroundColor = "#ffffff"; 

        for (const shapeId in shapes) {
          const s = shapes[shapeId];
          let obj: fabric.Object | null = null;

          // Rehydrate based on kind
          if (s.kind === "path" && s.d) {
            obj = new fabric.Path(s.d, { ...s.style, left: s.x, top: s.y, fill: 'transparent' });
          } else if (s.kind === "rect") {
            obj = new fabric.Rect({ ...s.style, left: s.x, top: s.y, width: s.w, height: s.h });
          } else if (s.kind === "circle") {
            obj = new fabric.Circle({ ...s.style, left: s.x, top: s.y, radius: s.r });
          } else if (s.kind === "heart") {
             // For simplicity, rehydrating heart as path
             obj = new fabric.Path(HEART_SVG_PATH, { ...s.style, left: s.x, top: s.y, scaleX: s.scaleX, scaleY: s.scaleY });
          }

          if (obj) {
            (obj as any).id = shapeId;
            obj.set({ angle: s.rotation || 0 });
            canvas.add(obj);
          }
        }
        canvas.renderAll();
        setStatus("ready");
      } catch (err) { console.error(err); setStatus("error"); }
    };
    loadContent();
  }, [canvas, pageId]);


  // --- SAVE HANDLERS ---
  
  // 1. Shared Patch Sender
  const sendPatch = async (patchBody: any) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const result = await res.json();
      if (res.ok) {
        pageVersionRef.current = result.version;
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch (err) { setStatus("error"); }
  };

  // 2. Save New Shape (Rect, Circle, Heart)
  const saveNewShape = async (fabricObj: fabric.Object, type: string) => {
    setStatus("saving");
    const shapeId = `shape-${Date.now()}`;
    (fabricObj as any).id = shapeId; // Attach ID locally

    const dbShape: any = {
      id: shapeId,
      layerId: "layer-1",
      kind: type, // 'rect', 'circle', etc
      x: fabricObj.left,
      y: fabricObj.top,
      rotation: fabricObj.angle,
      style: { fill: fabricObj.fill, stroke: 'black', strokeWidth: 1 }
    };

    if (type === 'rect') { dbShape.w = fabricObj.width; dbShape.h = fabricObj.height; }
    if (type === 'circle') { dbShape.r = (fabricObj as fabric.Circle).radius; }
    if (type === 'heart') { dbShape.scaleX = fabricObj.scaleX; dbShape.scaleY = fabricObj.scaleY; }

    const patch = {
        baseVersion: pageVersionRef.current,
        userId,
        patches: [
          { op: "add", path: `/shapes/${shapeId}`, value: dbShape },
          { op: "add", path: `/layers/layer-1/objectIds/-`, value: shapeId }
        ]
    };
    await sendPatch(patch);
  };

  // 3. Save Freehand Brush (Path)
  const handlePathCreated = async (e: any) => {
    // Only run this if we are in brush mode (prevents double save with shapes)
    if (activeTool !== 'brush' && activeTool !== 'eraser') return;

    const pathObj = e.path;
    setStatus("saving");
    const shapeId = `shape-${Date.now()}`;
    (pathObj as any).id = shapeId;

    const dbShape = {
      id: shapeId,
      layerId: "layer-1",
      kind: "path",
      x: pathObj.left, 
      y: pathObj.top,
      d: pathObj.toSVG().match(/d="([^"]+)"/)?.[1] || "",
      style: { fill: "transparent", stroke: pathObj.stroke, strokeWidth: pathObj.strokeWidth }
    };

    await sendPatch({
      baseVersion: pageVersionRef.current,
      userId,
      patches: [
        { op: "add", path: `/shapes/${shapeId}`, value: dbShape },
        { op: "add", path: `/layers/layer-1/objectIds/-`, value: shapeId }
      ]
    });
  };

  // 4. Save Updates (Move/Rotate/Fill)
  const handleObjectModified = async (e: any) => {
    const target = e.target;
    if (!target || !(target as any).id) return;
    const shapeId = (target as any).id;
    setStatus("saving");

    // We send a generic replace for basic props
    const patches = [
      { op: "replace", path: `/shapes/${shapeId}/x`, value: target.left },
      { op: "replace", path: `/shapes/${shapeId}/y`, value: target.top },
      { op: "replace", path: `/shapes/${shapeId}/rotation`, value: target.angle },
      { op: "replace", path: `/shapes/${shapeId}/style/fill`, value: target.fill }, // For Fill Tool
    ];

    // If resized, update specific props
    if (target.type === 'rect') {
        patches.push({ op: "replace", path: `/shapes/${shapeId}/w`, value: target.width * target.scaleX });
        patches.push({ op: "replace", path: `/shapes/${shapeId}/h`, value: target.height * target.scaleY });
    } else if (target.type === 'circle') {
        patches.push({ op: "replace", path: `/shapes/${shapeId}/r`, value: target.radius * target.scaleX });
    }

    await sendPatch({ baseVersion: pageVersionRef.current, userId, patches });
  };

  // Bind Events
  useEffect(() => {
    if (!canvas) return;
    canvas.on("path:created", handlePathCreated);
    canvas.on("object:modified", handleObjectModified);
    return () => {
      canvas.off("path:created", handlePathCreated);
      canvas.off("object:modified", handleObjectModified);
    };
  }, [canvas, activeTool]); // Re-bind if tool changes to ensure correct logic


  // --- HELPER UI COMPONENT ---
  const ToolBtn = ({ name, icon, label }: { name: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTool(name)}
      title={label}
      className={`p-2 rounded-lg transition-all ${
        activeTool === name ? "bg-black text-white" : "hover:bg-gray-200 text-gray-700"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* TOOLBAR */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border-2 border-black shadow-md justify-between">
        
        {/* Left: Tools */}
        <div className="flex gap-1 items-center border-r border-gray-300 pr-4">
          <ToolBtn name="select" icon={<MousePointer2 size={20}/>} label="Select" />
          <ToolBtn name="brush" icon={<Pencil size={20}/>} label="Brush" />
          <ToolBtn name="fill" icon={<PaintBucket size={20}/>} label="Fill" />
          <ToolBtn name="eraser" icon={<Eraser size={20}/>} label="Eraser" />
        </div>

        {/* Middle: Shapes */}
        <div className="flex gap-1 items-center border-r border-gray-300 pr-4 pl-2">
          <ToolBtn name="rect" icon={<Square size={20}/>} label="Rectangle" />
          <ToolBtn name="circle" icon={<Circle size={20}/>} label="Circle" />
          <ToolBtn name="heart" icon={<Heart size={20}/>} label="Heart" />
        </div>

        {/* Right: Settings */}
        <div className="flex items-center gap-4 pl-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-500">Color</span>
            <input 
              type="color" 
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="h-8 w-8 cursor-pointer border-none bg-transparent"
            />
          </div>
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <div className="flex flex-col w-24">
               <span className="text-[10px] uppercase font-bold text-gray-500">Size</span>
               <input 
                type="range" min="1" max="50" 
                value={brushWidth}
                onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                className="accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-xs font-bold italic px-3 py-1 text-gray-600">
          {status === "loading" && "Loading..."}
          {status === "saving" && "Saving..."}
          {status === "ready" && "Saved"}
          {status === "error" && <span className="text-red-600">Error</span>}
        </div>
      </div>

      {/* CANVAS */}
      <div className="border-2 border-black rounded-xl shadow-xl bg-gray-100 overflow-auto relative flex-1">
        <canvas ref={canvasEl} />
      </div>
    </div>
  );
}