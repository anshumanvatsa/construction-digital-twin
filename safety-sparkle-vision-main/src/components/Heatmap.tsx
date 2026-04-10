import { useSim } from '@/contexts/SimulationContext';
import { GRID_DIMENSIONS } from '@/lib/simulation';

export function Heatmap() {
  const { state } = useSim();
  const gridRes = 20;
  const cellSize = 100 / gridRes;

  // Build density grid
  const grid: number[][] = Array.from({ length: gridRes }, () => Array(gridRes).fill(0));
  state.workers.forEach(w => {
    const gx = Math.min(gridRes - 1, Math.floor((w.x / GRID_DIMENSIONS) * gridRes));
    const gy = Math.min(gridRes - 1, Math.floor((w.y / GRID_DIMENSIONS) * gridRes));
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = gx + dx, ny = gy + dy;
        if (nx >= 0 && nx < gridRes && ny >= 0 && ny < gridRes) {
          grid[ny][nx] += dx === 0 && dy === 0 ? 1 : 0.3;
        }
      }
    }
  });

  const maxDensity = Math.max(1, ...grid.flat());

  return (
    <div className="glass rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">Worker Density Heatmap</h3>
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border/20 bg-background/50">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {grid.map((row, y) =>
            row.map((val, x) => {
              const intensity = val / maxDensity;
              if (intensity < 0.05) return null;
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * cellSize}
                  y={y * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={intensity > 0.7 ? `rgba(248, 113, 113, ${intensity * 0.6})` :
                        intensity > 0.4 ? `rgba(251, 191, 36, ${intensity * 0.5})` :
                        `rgba(52, 211, 153, ${intensity * 0.4})`}
                  rx="1"
                />
              );
            })
          )}
        </svg>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-muted-foreground font-mono bg-background/80 px-2 py-1 rounded">
          <span className="w-3 h-2 rounded-sm bg-success/40" /> Low
          <span className="w-3 h-2 rounded-sm bg-warning/50 ml-1" /> Med
          <span className="w-3 h-2 rounded-sm bg-destructive/60 ml-1" /> High
        </div>
      </div>
    </div>
  );
}
