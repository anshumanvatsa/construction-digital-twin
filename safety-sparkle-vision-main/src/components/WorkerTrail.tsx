import { memo } from "react";

export type TrailPoint = {
  x: number;
  y: number;
  timestamp: number;
  riskScore: number;
};

interface WorkerTrailProps {
  positions: TrailPoint[];
  color: string;
  fadeMultiplier?: number;
}

export const WorkerTrail = memo(function WorkerTrail({ positions, color, fadeMultiplier = 1 }: WorkerTrailProps) {
  if (positions.length < 2) {
    return null;
  }

  if (fadeMultiplier <= 0) {
    return null;
  }

  const denominator = Math.max(positions.length - 1, 1);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {positions.map((point, index) => {
        const progress = index / denominator;
        const baseOpacity = 0.1 + progress * 0.5;
        const opacity = baseOpacity * fadeMultiplier;
        const size = 3 + progress * 2;

        return (
          <div
            key={`${point.timestamp}-${index}`}
            className="absolute rounded-full"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              opacity,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
});
