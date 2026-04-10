import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useSim } from "@/contexts/SimulationContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrailPoint, WorkerTrail } from "@/components/WorkerTrail";

type ZoneType = "hazard" | "safe" | "restricted";

type MapZone = {
  id: string;
  label: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
};

type MapWorker = {
  id: string;
  name: string;
  riskScore: number;
  fatigue: number;
  x: number;
  y: number;
};

type AlertRecord = {
  worker_id?: number;
  workerId?: string;
  severity?: string;
  message?: string;
  timestamp?: string;
};

const MAP_WIDTH = 600;
const MAP_HEIGHT = 400;
const ALERT_HIGHLIGHT_MS = 7000;
const TRAIL_LIMIT = 10;
const TRAIL_RETENTION_MS = 10000;
const FADE_DURATION_MS = 1500;

const ZONES: MapZone[] = [
  { id: "hz-1", label: "Crane Swing", type: "hazard", x: 8, y: 10, width: 26, height: 24 },
  { id: "hz-2", label: "Excavation", type: "hazard", x: 58, y: 54, width: 25, height: 28 },
  { id: "safe-1", label: "Safe Assembly", type: "safe", x: 4, y: 72, width: 26, height: 20 },
  { id: "rz-1", label: "Restricted Access", type: "restricted", x: 70, y: 10, width: 24, height: 22 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRiskColor(risk: number): string {
  if (risk < 40) return "#22c55e";
  if (risk < 70) return "#eab308";
  return "#ef4444";
}

function getZoneStyles(type: ZoneType): { fill: string; border: string; text: string } {
  if (type === "safe") {
    return {
      fill: "rgba(34, 197, 94, 0.18)",
      border: "rgba(34, 197, 94, 0.55)",
      text: "text-green-300",
    };
  }

  if (type === "restricted") {
    return {
      fill: "rgba(234, 179, 8, 0.18)",
      border: "rgba(234, 179, 8, 0.6)",
      text: "text-yellow-300",
    };
  }

  return {
    fill: "rgba(239, 68, 68, 0.2)",
    border: "rgba(239, 68, 68, 0.65)",
    text: "text-red-300",
  };
}

function getInitials(name: string, id: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const numericId = id.replace(/\D/g, "");
  return numericId.length > 0 ? numericId.slice(-2) : "WK";
}

function normalizeRealtimeWorker(row: Record<string, unknown>): MapWorker | null {
  const rawPosition = row.position;
  const position = typeof rawPosition === "object" && rawPosition !== null ? (rawPosition as { x?: unknown; y?: unknown }) : null;

  const rawId = row.id;
  const id = typeof rawId === "number" || typeof rawId === "string" ? String(rawId) : "";
  if (!id) return null;

  const name = typeof row.name === "string" ? row.name : `Worker ${id}`;
  const riskScore = typeof row.risk_score === "number" ? row.risk_score : 0;
  const fatigue = typeof row.fatigue_level === "number" ? row.fatigue_level : 0;

  const x = typeof position?.x === "number" ? clamp(position.x, 0, 100) : 0;
  const y = typeof position?.y === "number" ? clamp(position.y, 0, 100) : 0;

  return {
    id,
    name,
    riskScore,
    fatigue,
    x,
    y,
  };
}

const WorkerDot = memo(function WorkerDot({
  worker,
  showLabels,
  isAlerted,
  isHovered,
  onHover,
}: {
  worker: MapWorker;
  showLabels: boolean;
  isAlerted: boolean;
  isHovered: boolean;
  onHover: (workerId: string | null) => void;
}) {
  const workerColor = getRiskColor(worker.riskScore);

  return (
    <motion.div
      className="absolute z-20"
      style={{ left: `${worker.x}%`, top: `${worker.y}%` }}
      animate={{ left: `${worker.x}%`, top: `${worker.y}%` }}
      transition={{ type: "spring", damping: 22, stiffness: 140, mass: 0.8 }}
      onMouseEnter={() => onHover(worker.id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2"
        animate={isAlerted ? { scale: [1, 1.25, 1], boxShadow: ["0 0 0px rgba(239,68,68,0)", "0 0 24px rgba(239,68,68,0.9)", "0 0 0px rgba(239,68,68,0)"] } : { scale: 1 }}
        transition={isAlerted ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      >
        <div
          className="h-8 w-8 rounded-full border-2 grid place-items-center text-[10px] font-bold text-black"
          style={{ backgroundColor: workerColor, borderColor: "rgba(255,255,255,0.9)" }}
        >
          {getInitials(worker.name, worker.id)}
        </div>

        {showLabels && (
          <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
            {worker.name}
          </div>
        )}

        {isAlerted && (
          <div className="pointer-events-none absolute left-1/2 -top-8 -translate-x-1/2 rounded-md border border-red-400/50 bg-red-500/20 px-2 py-1 text-[10px] font-semibold text-red-100 whitespace-nowrap">
            High Risk Detected
          </div>
        )}

        {isHovered && (
          <div className="pointer-events-none absolute left-1/2 -top-20 z-30 w-40 -translate-x-1/2 rounded-lg border border-border/40 bg-card/95 p-2 text-xs text-foreground shadow-lg backdrop-blur">
            <p className="font-semibold">#{worker.id} {worker.name}</p>
            <p className="text-muted-foreground">Risk: {Math.round(worker.riskScore)}%</p>
            <p className="text-muted-foreground">Fatigue: {Math.round(worker.fatigue)}%</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

export function WorkerMap() {
  const { latestWorkers, recentAlerts } = useRealtime();
  const { state } = useSim();

  const [showZones, setShowZones] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [hoveredWorkerId, setHoveredWorkerId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [trailVersion, setTrailVersion] = useState(0);
  const trailsRef = useRef<Record<string, TrailPoint[]>>({});
  const lastSeenRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const realtimeMappedWorkers = useMemo(() => {
    return latestWorkers
      .map((row) => normalizeRealtimeWorker(row))
      .filter((worker): worker is MapWorker => worker !== null);
  }, [latestWorkers]);

  const fallbackWorkers = useMemo<MapWorker[]>(() => {
    return state.workers.map((worker) => ({
      id: worker.id,
      name: worker.name,
      x: clamp(worker.x, 0, 100),
      y: clamp(worker.y, 0, 100),
      riskScore: worker.riskScore,
      fatigue: worker.fatigue,
    }));
  }, [state.workers]);

  const workers = realtimeMappedWorkers.length > 0 ? realtimeMappedWorkers : fallbackWorkers;

  useEffect(() => {
    if (workers.length === 0) {
      return;
    }

    let changed = false;
    const nextNow = Date.now();

    for (const worker of workers) {
      const existing = trailsRef.current[worker.id] ?? [];
      const last = existing[existing.length - 1];
      const moved = !last || Math.abs(last.x - worker.x) > 0.15 || Math.abs(last.y - worker.y) > 0.15;

      if (moved) {
        const nextTrail = [
          ...existing,
          {
            x: worker.x,
            y: worker.y,
            timestamp: nextNow,
            riskScore: worker.riskScore,
          },
        ].slice(-TRAIL_LIMIT);
        trailsRef.current[worker.id] = nextTrail;
        changed = true;
      } else if (last && last.riskScore !== worker.riskScore) {
        trailsRef.current[worker.id] = [...existing.slice(0, -1), { ...last, riskScore: worker.riskScore }];
        changed = true;
      }

      lastSeenRef.current[worker.id] = nextNow;
    }

    if (changed) {
      setTrailVersion((v) => v + 1);
    }
  }, [workers]);

  useEffect(() => {
    const ids = Object.keys(trailsRef.current);
    if (ids.length === 0) {
      return;
    }

    let changed = false;
    for (const id of ids) {
      const lastSeen = lastSeenRef.current[id] ?? 0;
      if (nowMs - lastSeen > TRAIL_RETENTION_MS) {
        delete trailsRef.current[id];
        delete lastSeenRef.current[id];
        changed = true;
      }
    }

    if (changed) {
      setTrailVersion((v) => v + 1);
    }
  }, [nowMs]);

  const trailLayers = useMemo(() => {
    const ids = Object.keys(trailsRef.current);
    return ids
      .map((id) => {
        const positions = trailsRef.current[id];
        if (!positions || positions.length < 2) {
          return null;
        }
        const latest = positions[positions.length - 1];
        const lastSeen = lastSeenRef.current[id] ?? nowMs;
        const ageMs = Math.max(0, nowMs - lastSeen);
        const fadeStartMs = Math.max(0, TRAIL_RETENTION_MS - FADE_DURATION_MS);
        const fadeProgress = ageMs <= fadeStartMs
          ? 0
          : Math.min(1, (ageMs - fadeStartMs) / FADE_DURATION_MS);
        const fadeMultiplier = 1 - fadeProgress;

        return {
          id,
          positions,
          color: getRiskColor(latest.riskScore),
          fadeMultiplier,
        };
      })
      .filter((layer): layer is { id: string; positions: TrailPoint[]; color: string; fadeMultiplier: number } => layer !== null);
  }, [trailVersion, nowMs]);

  const highlightedWorkers = useMemo(() => {
    const highlighted = new Set<string>();

    for (const record of recentAlerts as AlertRecord[]) {
      const rawWorkerId = typeof record.worker_id === "number" ? String(record.worker_id) : typeof record.workerId === "string" ? record.workerId : null;
      if (!rawWorkerId) continue;

      const rawTimestamp = record.timestamp;
      const timestampMs = typeof rawTimestamp === "string" ? Date.parse(rawTimestamp) : nowMs;
      if (Number.isNaN(timestampMs)) continue;

      const isRecent = nowMs - timestampMs <= ALERT_HIGHLIGHT_MS;
      if (isRecent) {
        highlighted.add(rawWorkerId);
      }
    }

    return highlighted;
  }, [recentAlerts, nowMs]);

  const highRiskCount = useMemo(() => workers.filter((w) => w.riskScore >= 70).length, [workers]);
  const mediumRiskCount = useMemo(() => workers.filter((w) => w.riskScore >= 40 && w.riskScore < 70).length, [workers]);
  const lowRiskCount = useMemo(() => workers.filter((w) => w.riskScore < 40).length, [workers]);

  return (
    <Card className="glass border-border/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Live Worker Map</CardTitle>
            <CardDescription>Real-time site occupancy, risk levels, and alert hotspots</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showZones ? "default" : "outline"}
              className="gap-1"
              onClick={() => setShowZones((prev) => !prev)}
            >
              {showZones ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Zones
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showLabels ? "default" : "outline"}
              className="gap-1"
              onClick={() => setShowLabels((prev) => !prev)}
            >
              {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Labels
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showTrails ? "default" : "outline"}
              className="gap-1"
              onClick={() => setShowTrails((prev) => !prev)}
            >
              {showTrails ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Trails
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="relative overflow-hidden rounded-xl border border-border/30 bg-[#0f172a]"
          style={{ width: "100%", maxWidth: MAP_WIDTH, height: MAP_HEIGHT }}
        >
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.22),transparent_45%),radial-gradient(circle_at_75%_75%,rgba(16,185,129,0.15),transparent_40%)]" />

          {showZones && (
            <>
              {ZONES.map((zone) => {
                const zoneStyle = getZoneStyles(zone.type);
                return (
                  <div
                    key={zone.id}
                    className="absolute rounded-md border backdrop-blur-[1px]"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      backgroundColor: zoneStyle.fill,
                      borderColor: zoneStyle.border,
                    }}
                  >
                    <span className={`absolute left-2 top-1 text-[10px] font-semibold ${zoneStyle.text}`}>{zone.label}</span>
                  </div>
                );
              })}
            </>
          )}

          {showTrails &&
            trailLayers.map((layer) => (
              <WorkerTrail key={layer.id} positions={layer.positions} color={layer.color} fadeMultiplier={layer.fadeMultiplier} />
            ))}

          {workers.map((worker) => (
            <WorkerDot
              key={worker.id}
              worker={worker}
              showLabels={showLabels}
              isAlerted={highlightedWorkers.has(worker.id)}
              isHovered={hoveredWorkerId === worker.id}
              onHover={setHoveredWorkerId}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-border/30 bg-card/50 p-2">
            <p className="text-muted-foreground">Workers</p>
            <p className="text-sm font-semibold text-foreground">{workers.length}</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2">
            <p className="text-red-200">High Risk</p>
            <p className="text-sm font-semibold text-red-100">{highRiskCount}</p>
          </div>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2">
            <p className="text-yellow-200">Medium Risk</p>
            <p className="text-sm font-semibold text-yellow-100">{mediumRiskCount}</p>
          </div>
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-2">
            <p className="text-green-200">Low Risk</p>
            <p className="text-sm font-semibold text-green-100">{lowRiskCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Low Risk</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Medium Risk</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High Risk</span>
          <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-red-400" /> Hazard Zone</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-400" /> Safe Zone</span>
          <span className="inline-flex items-center gap-1.5"><TriangleAlert className="h-3.5 w-3.5 text-yellow-300" /> Restricted Zone</span>
        </div>
      </CardContent>
    </Card>
  );
}
