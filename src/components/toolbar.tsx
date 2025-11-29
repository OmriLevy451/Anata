import React from 'react';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Square, 
  Circle, 
  Heart, 
  MousePointer2 
} from 'lucide-react'; // If you didn't install lucide, remove this and use emojis below

interface ToolbarProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

const Toolbar = ({ activeTool, setActiveTool, selectedColor, setSelectedColor }: ToolbarProps) => {

  // A helper function to make button classes cleaner
  const getButtonClass = (toolName: string) => {
    const baseClass = "p-3 rounded-xl transition-all duration-200 flex items-center justify-center";
    const activeClass = "bg-blue-600 text-white shadow-lg scale-105";
    const inactiveClass = "bg-white text-gray-600 hover:bg-gray-100 hover:scale-105 shadow-sm border border-gray-200";

    return `${baseClass} ${activeTool === toolName ? activeClass : inactiveClass}`;
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-gray-200/50 z-50">
      
      {/* --- DRAWING TOOLS --- */}
      <div className="flex gap-2 pr-4 border-r border-gray-300">
        <button 
          onClick={() => setActiveTool('brush')}
          className={getButtonClass('brush')}
          title="Brush"
        >
          {/* If no lucide, use 🖌️ */}
          <Pencil size={20} />
        </button>

        <button 
          onClick={() => setActiveTool('fill')}
          className={getButtonClass('fill')}
          title="Fill Tool"
        >
          {/* If no lucide, use 🪣 */}
          <PaintBucket size={20} />
        </button>

        <button 
          onClick={() => setActiveTool('eraser')}
          className={getButtonClass('eraser')}
          title="Eraser"
        >
          {/* If no lucide, use 🧼 */}
          <Eraser size={20} />
        </button>
      </div>

      {/* --- SHAPE TOOLS --- */}
      <div className="flex gap-2 pr-4 border-r border-gray-300">
        <button 
          onClick={() => setActiveTool('rect')}
          className={getButtonClass('rect')}
          title="Rectangle"
        >
          {/* If no lucide, use ⬜ */}
          <Square size={20} />
        </button>

        <button 
          onClick={() => setActiveTool('circle')}
          className={getButtonClass('circle')}
          title="Circle"
        >
          {/* If no lucide, use ⭕ */}
          <Circle size={20} />
        </button>

        <button 
          onClick={() => setActiveTool('heart')}
          className={getButtonClass('heart')}
          title="Heart"
        >
          {/* If no lucide, use ❤️ */}
          <Heart size={20} />
        </button>
      </div>

      {/* --- COLOR PICKER --- */}
      <div className="flex flex-col items-center justify-center gap-1">
        <input 
          type="color" 
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 p-0 overflow-hidden"
          title="Choose Color"
        />
      </div>

    </div>
  );
};

export default Toolbar;