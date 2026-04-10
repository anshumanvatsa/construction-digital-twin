import { useSim } from '@/contexts/SimulationContext';
import { GRID_DIMENSIONS, getRiskLevel, getRiskColor } from '@/lib/simulation';
import { motion } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';

export function SiteMap() {
  const { state } = useSim();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const cellSize = 16;
  const svgSize = GRID_DIMENSIONS * cellSize;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.5, Math.min(3, s - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan(p => ({
      x: p.x + (e.clientX - lastPos.current.x),
      y: p.y + (e.clientY - lastPos.current.y),
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  return (
    <div className="glass rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Site Map — Live View</h3>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>Zoom: {(scale * 100).toFixed(0)}%</span>
          <button onClick={() => setScale(1)} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Reset</button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg bg-background/50 border border-border/20 cursor-grab active:cursor-grabbing"
        style={{ height: 'calc(100% - 40px)' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          style={{ transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)` }}
          className="transition-transform duration-75"
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
              <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="hsl(225 15% 14%)" strokeWidth="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width={svgSize} height={svgSize} fill="url(#grid)" />

          {/* Building outlines */}
          <rect x={cellSize * 15} y={cellSize * 15} width={cellSize * 10} height={cellSize * 8} rx="4" fill="none" stroke="hsl(225 15% 20%)" strokeWidth="1" strokeDasharray="4 2" />
          <text x={cellSize * 20} y={cellSize * 19.5} textAnchor="middle" fill="hsl(215 15% 35%)" fontSize="8" fontFamily="Plus Jakarta Sans">BUILDING A</text>

          <rect x={cellSize * 2} y={cellSize * 18} width={cellSize * 8} height={cellSize * 6} rx="4" fill="none" stroke="hsl(225 15% 20%)" strokeWidth="1" strokeDasharray="4 2" />
          <text x={cellSize * 6} y={cellSize * 21.5} textAnchor="middle" fill="hsl(215 15% 35%)" fontSize="8" fontFamily="Plus Jakarta Sans">STORAGE</text>

          {/* Hazard zones */}
          {state.hazardZones.filter(z => z.active).map(zone => (
            <g key={zone.id}>
              <circle
                cx={zone.x * cellSize}
                cy={zone.y * cellSize}
                r={zone.radius * cellSize}
                fill={zone.type === 'crane_radius' ? 'rgba(251, 191, 36, 0.08)' :
                      zone.type === 'electrical' ? 'rgba(248, 113, 113, 0.1)' :
                      'rgba(248, 113, 113, 0.06)'}
                stroke={zone.severity > 80 ? 'rgba(248, 113, 113, 0.4)' : 'rgba(251, 191, 36, 0.3)'}
                strokeWidth="1"
                strokeDasharray="4 4"
                className="animate-hazard-pulse"
              />
              <text
                x={zone.x * cellSize}
                y={(zone.y - zone.radius - 0.5) * cellSize}
                textAnchor="middle"
                fill="hsl(215 15% 50%)"
                fontSize="7"
                fontFamily="Plus Jakarta Sans"
              >
                {zone.label}
              </text>
            </g>
          ))}

          {/* Workers */}
          {state.workers.map(worker => {
            const riskLevel = getRiskLevel(worker.riskScore);
            const color = worker.isAlert ? getRiskColor(riskLevel) : worker.color;
            return (
              <g key={worker.id}>
                {worker.isAlert && (
                  <circle
                    cx={worker.x * cellSize}
                    cy={worker.y * cellSize}
                    r={8}
                    fill="none"
                    stroke={getRiskColor(riskLevel)}
                    strokeWidth="1.5"
                    opacity="0.5"
                    className="animate-hazard-pulse"
                  />
                )}
                <circle
                  cx={worker.x * cellSize}
                  cy={worker.y * cellSize}
                  r={4}
                  fill={color}
                  filter="url(#glow)"
                  className="transition-all duration-200"
                />
                <text
                  x={worker.x * cellSize}
                  y={worker.y * cellSize - 7}
                  textAnchor="middle"
                  fill="hsl(210 20% 70%)"
                  fontSize="5"
                  fontFamily="Plus Jakarta Sans"
                >
                  {worker.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
