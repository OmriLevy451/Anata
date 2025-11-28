"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric"; // Fabric v6 import

interface BoardCanvasProps {
  pageId: string;
}

export default function BoardCanvas({ pageId }: BoardCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasEl.current) return;

    // 1. Initialize Fabric Canvas
    const fabricCanvas = new fabric.Canvas(canvasEl.current, {
      width: 800, // Default width
      height: 600, // Default height
      backgroundColor: "#f3f3f3",
    });

    setCanvas(fabricCanvas);

    // Cleanup on unmount
    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!canvas || !pageId) return;

    const loadContent = async () => {
      try {
        setLoading(true);
        // 2. Fetch data from your API
        const res = await fetch(`/api/pages/${pageId}`);
        const data = await res.json();

        // Resize canvas to match page settings
        canvas.setWidth(data.width || 800);
        canvas.setHeight(data.height || 600);

        const content = data.content || {};
        const shapes = content.shapes || {};

        // 3. Render Shapes
        // We iterate over the keys in your 'shapes' object
        Object.values(shapes).forEach((shape: any) => {
          let fabricObj: fabric.Object | null = null;

          // MAP DB SCHEMA -> FABRIC OBJECT
          if (shape.kind === "path") {
            // Create Path from SVG string (d)
            fabricObj = new fabric.Path(shape.d, {
              left: shape.x,
              top: shape.y,
              fill: shape.style?.fill || "transparent",
              stroke: shape.style?.stroke || "black",
              strokeWidth: shape.style?.strokeWidth || 1,
              angle: shape.rotation || 0,
            });
          } 
          // Add other shapes (rect, circle) here in the future...

          if (fabricObj) {
            // Disable editing for now (viewer mode)
            fabricObj.set({ selectable: false }); 
            canvas.add(fabricObj);
          }
        });

        canvas.renderAll();
      } catch (err) {
        console.error("Failed to load page content", err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [canvas, pageId]);

  return (
    <div className="border border-gray-300 rounded shadow-sm inline-block">
      {loading && <div className="absolute p-4">Loading Canvas...</div>}
      <canvas ref={canvasEl} />
    </div>
  );
}