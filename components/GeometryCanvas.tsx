import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Point, GeometryState, AnimationState } from '../types';
import { getCirclePoint, calculateInscribedAngle, toDegrees, toRadians, normalizeAngle } from '../utils/math';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface GeometryCanvasProps {
  width: number;
  height: number;
}

export const GeometryCanvas: React.FC<GeometryCanvasProps> = ({ width, height }) => {
  const center: Point = { x: width / 2, y: height / 2 };
  
  // State
  const [state, setState] = useState<GeometryState>({
    radius: Math.min(width, height) * 0.35,
    chordSpread: 120, // Degrees between A and B
    pAngle: 90, // Start at top
  });
  
  const [animState, setAnimState] = useState<AnimationState>(AnimationState.PAUSED);
  const requestRef = useRef<number>();
  
  // Calculated Points
  // Let's orient the chord AB at the bottom for a classic view.
  // Center of chord is at 270 degrees (bottom).
  // A is at 270 - spread/2
  // B is at 270 + spread/2
  const angleA = 270 - state.chordSpread / 2;
  const angleB = 270 + state.chordSpread / 2;
  
  const A = getCirclePoint(center, state.radius, angleA);
  const B = getCirclePoint(center, state.radius, angleB);
  const P = getCirclePoint(center, state.radius, state.pAngle);
  
  // Calculate Inscribed Angle
  const currentAngle = calculateInscribedAngle(A, P, B);
  
  // Derived values for visualization
  const chordLength = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));

  // Animation Loop
  const animate = (time: number) => {
    if (animState === AnimationState.PLAYING) {
      setState(prev => {
        let nextAngle = prev.pAngle + 0.5; // Speed
        // Bounce logic or Wrap logic. Let's do Wrap but skip the chord section to keep it on major arc
        // The forbidden zone is roughly between angleA and angleB (the minor arc)
        // angleA is approx 210, angleB is approx 330.
        
        // Simple normalize
        const normNext = normalizeAngle(nextAngle);
        const normA = normalizeAngle(angleA);
        const normB = normalizeAngle(angleB);
        
        // Check if we are entering the "forbidden" minor arc zone
        // The minor arc is between A and B going counter-clockwise if B > A? 
        // A=210, B=330. Gap is 210->330.
        if (normNext > normA && normNext < normB) {
           // If we hit A, jump to B? Or reverse? Let's Reverse for smooth effect.
           // Actually, implementing reverse needs direction state. 
           // Simpler: Jump to start of major arc or just let it cross and show the angle change (supplementary).
           // Let's just let it spin. It demonstrates the cyclic quad property when it crosses!
        }
        
        return { ...prev, pAngle: nextAngle };
      });
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (animState === AnimationState.PLAYING) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animState]);

  // D3 Arc Generator for the angle marker at P
  const arcGenerator = d3.arc();
  const angleMarkerRadius = 30;
  
  // Calculate start and end angles for the arc at P
  // Vectors PA and PB
  const anglePA = Math.atan2(A.y - P.y, A.x - P.x); // Returns -PI to PI
  const anglePB = Math.atan2(B.y - P.y, B.x - P.x);
  
  // We need to draw an arc from min to max, but handled correctly for the "interior" angle
  // This can be tricky with simple atan2.
  // Using D3 path construction manually is sometimes easier for simple geometry markers.
  
  // Interactive Dragging for P (Simulated with click/touch on SVG for simplicity or Slider)
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const dx = clickX - center.x;
    const dy = -(clickY - center.y); // Invert Y for math calc
    let theta = toDegrees(Math.atan2(dy, dx)); 
    if (theta < 0) theta += 360;
    
    setState(prev => ({ ...prev, pAngle: theta }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Main Canvas Area */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">当前状态</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600">{currentAngle.toFixed(1)}°</span>
            <span className="text-xs text-slate-400 font-medium">
               圆周角 ∠APB
            </span>
          </div>
        </div>

        <svg 
          width={width} 
          height={height} 
          className="w-full h-auto touch-none cursor-crosshair"
          onClick={handleSvgClick}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Base Circle */}
          <circle 
            cx={center.x} 
            cy={center.y} 
            r={state.radius} 
            fill="none" 
            stroke="#e2e8f0" 
            strokeWidth="2" 
          />
          
          {/* Major Arc Highlight (optional context) */}
          <path
             d={d3.arc()({
               innerRadius: state.radius,
               outerRadius: state.radius,
               startAngle: toRadians(angleB + 90), // D3 0 is at 12 o'clock? No, 0 is 12 if computed correctly, usually 0 is 3 o'clock clockwise? 
               // d3.arc default: 0 is 12 o'clock, clockwise.
               // Standard Math: 0 is 3 o'clock, counter-clockwise.
               // Let's just stick to standard SVG lines, d3.arc is confusing with coordinate systems unless configured.
               // Using simple SVG path A rx ry ...
             }) || undefined}
             fill="none"
             stroke="#cbd5e1"
          />

          {/* Chord AB */}
          <line 
            x1={A.x} y1={A.y} 
            x2={B.x} y2={B.y} 
            stroke="#3b82f6" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
          
          {/* Dynamic Lines AP and BP */}
          <line 
            x1={P.x} y1={P.y} 
            x2={A.x} y2={A.y} 
            stroke="#6366f1" 
            strokeWidth="2" 
            strokeDasharray="5,5"
          />
          <line 
            x1={P.x} y1={P.y} 
            x2={B.x} y2={B.y} 
            stroke="#6366f1" 
            strokeWidth="2" 
            strokeDasharray="5,5"
          />

          {/* Angle Marker at P */}
          {/* A simple semi-transparent circle at P for visual effect instead of complex arc math for now */}
          <circle cx={P.x} cy={P.y} r={30} fill="#818cf8" fillOpacity="0.2" />

          {/* Points */}
          <g className="drop-shadow-md">
            <circle cx={A.x} cy={A.y} r={6} fill="#3b82f6" stroke="white" strokeWidth="2" />
            <text x={A.x - 20} y={A.y + 20} className="font-sans text-sm font-bold fill-slate-600">A</text>
            
            <circle cx={B.x} cy={B.y} r={6} fill="#3b82f6" stroke="white" strokeWidth="2" />
            <text x={B.x + 10} y={B.y + 20} className="font-sans text-sm font-bold fill-slate-600">B</text>

            <circle cx={P.x} cy={P.y} r={8} fill="#ef4444" stroke="white" strokeWidth="3" />
            <text x={P.x} y={P.y - 20} textAnchor="middle" className="font-sans text-sm font-bold fill-red-500">P</text>
          </g>
          
          {/* Center */}
          <circle cx={center.x} cy={center.y} r={3} fill="#94a3b8" />
        </svg>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            onClick={() => setAnimState(s => s === AnimationState.PLAYING ? AnimationState.PAUSED : AnimationState.PLAYING)}
            className="p-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors shadow-lg"
          >
            {animState === AnimationState.PLAYING ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button 
            onClick={() => setState(prev => ({ ...prev, pAngle: 90, chordSpread: 120 }))}
            className="p-3 bg-white text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex justify-between">
            <span>弦长 / 对应的圆心角</span>
            <span className="text-slate-400 font-mono">{state.chordSpread}°</span>
          </label>
          <input 
            type="range" 
            min="60" 
            max="160" 
            step="1"
            value={state.chordSpread}
            onChange={(e) => setState(prev => ({ ...prev, chordSpread: Number(e.target.value) }))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex justify-between">
            <span>点 P 的位置</span>
            <span className="text-slate-400 font-mono">{Math.round(state.pAngle)}°</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="360" 
            step="1"
            value={state.pAngle}
            onChange={(e) => {
                setAnimState(AnimationState.PAUSED);
                setState(prev => ({ ...prev, pAngle: Number(e.target.value) }));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>
    </div>
  );
};