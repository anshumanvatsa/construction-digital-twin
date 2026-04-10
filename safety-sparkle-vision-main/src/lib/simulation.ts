// Construction Site Simulation Engine

export type WorkerRole = 'operator' | 'laborer' | 'engineer' | 'supervisor' | 'electrician';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type HazardType = 'crane_radius' | 'falling_object' | 'restricted' | 'electrical' | 'excavation';

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  fatigue: number; // 0-100
  riskScore: number; // 0-100
  heartRate: number;
  isAlert: boolean;
  color: string;
}

export interface HazardZone {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  radius: number;
  severity: number; // 0-100
  active: boolean;
  label: string;
}

export interface Alert {
  id: string;
  workerId?: string;
  type: 'warning' | 'danger' | 'critical' | 'info';
  message: string;
  timestamp: number;
}

export interface SimulationState {
  workers: Worker[];
  hazardZones: HazardZone[];
  alerts: Alert[];
  isRunning: boolean;
  tick: number;
  riskHistory: { tick: number; avgRisk: number; maxRisk: number }[];
  incidentsPredicted: number;
  safetyScore: number;
}

const WORKER_NAMES = [
  'James Rivera', 'Sarah Chen', 'Mike O\'Brien', 'Ana Kowalski', 'David Patel',
  'Elena Volkov', 'Carlos Ruiz', 'Fatima Hassan', 'Tom Anderson', 'Yuki Tanaka',
  'Raj Sharma', 'Olga Petrov', 'Luis Garcia', 'Aisha Mbeki', 'Kevin Zhang',
];

const ROLE_COLORS: Record<WorkerRole, string> = {
  operator: '#22d3ee',
  laborer: '#a78bfa',
  engineer: '#34d399',
  supervisor: '#fbbf24',
  electrician: '#f87171',
};

const GRID_SIZE = 40;

function randomRole(): WorkerRole {
  const roles: WorkerRole[] = ['operator', 'laborer', 'engineer', 'supervisor', 'electrician'];
  return roles[Math.floor(Math.random() * roles.length)];
}

export function createInitialState(workerCount = 12): SimulationState {
  const workers: Worker[] = Array.from({ length: workerCount }, (_, i) => {
    const role = randomRole();
    return {
      id: `w-${i}`,
      name: WORKER_NAMES[i % WORKER_NAMES.length],
      role,
      x: 2 + Math.random() * (GRID_SIZE - 4),
      y: 2 + Math.random() * (GRID_SIZE - 4),
      targetX: 2 + Math.random() * (GRID_SIZE - 4),
      targetY: 2 + Math.random() * (GRID_SIZE - 4),
      fatigue: Math.random() * 20,
      riskScore: Math.random() * 15,
      heartRate: 70 + Math.random() * 10,
      isAlert: false,
      color: ROLE_COLORS[role],
    };
  });

  const hazardZones: HazardZone[] = [
    { id: 'hz-1', type: 'crane_radius', x: 10, y: 10, radius: 5, severity: 70, active: true, label: 'Crane A Zone' },
    { id: 'hz-2', type: 'falling_object', x: 28, y: 8, radius: 4, severity: 85, active: true, label: 'Overhead Work' },
    { id: 'hz-3', type: 'restricted', x: 20, y: 25, radius: 3, severity: 60, active: true, label: 'Restricted Area' },
    { id: 'hz-4', type: 'excavation', x: 8, y: 30, radius: 4, severity: 75, active: true, label: 'Excavation' },
    { id: 'hz-5', type: 'electrical', x: 32, y: 28, radius: 3, severity: 90, active: true, label: 'Electrical Panel' },
  ];

  return {
    workers,
    hazardZones,
    alerts: [],
    isRunning: false,
    tick: 0,
    riskHistory: [],
    incidentsPredicted: 0,
    safetyScore: 92,
  };
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function calculateWorkerRisk(worker: Worker, zones: HazardZone[]): number {
  let zoneRisk = 0;
  for (const zone of zones) {
    if (!zone.active) continue;
    const dist = distance(worker.x, worker.y, zone.x, zone.y);
    if (dist < zone.radius) {
      const proximity = 1 - dist / zone.radius;
      zoneRisk = Math.max(zoneRisk, proximity * zone.severity);
    }
  }
  const fatigueRisk = worker.fatigue * 0.4;
  const heartRateRisk = Math.max(0, (worker.heartRate - 100) * 2);
  return Math.min(100, zoneRisk * 0.5 + fatigueRisk + heartRateRisk * 0.1);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'hsl(142, 70%, 45%)';
    case 'medium': return 'hsl(38, 92%, 55%)';
    case 'high': return 'hsl(25, 95%, 53%)';
    case 'critical': return 'hsl(0, 72%, 55%)';
  }
}

export function tickSimulation(state: SimulationState): SimulationState {
  const newAlerts: Alert[] = [];
  const tick = state.tick + 1;

  const workers = state.workers.map(w => {
    // Move toward target
    const dx = w.targetX - w.x;
    const dy = w.targetY - w.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let newX = w.x, newY = w.y, newTargetX = w.targetX, newTargetY = w.targetY;

    if (dist < 0.5) {
      newTargetX = 2 + Math.random() * (GRID_SIZE - 4);
      newTargetY = 2 + Math.random() * (GRID_SIZE - 4);
    } else {
      const speed = 0.15 + Math.random() * 0.1;
      newX += (dx / dist) * speed;
      newY += (dy / dist) * speed;
    }

    // Fatigue increases slowly
    const newFatigue = Math.min(100, w.fatigue + 0.02 + Math.random() * 0.03);
    const newHeartRate = 70 + newFatigue * 0.5 + Math.random() * 8;

    const updatedWorker = {
      ...w,
      x: newX,
      y: newY,
      targetX: newTargetX,
      targetY: newTargetY,
      fatigue: newFatigue,
      heartRate: Math.round(newHeartRate),
    };

    updatedWorker.riskScore = calculateWorkerRisk(updatedWorker, state.hazardZones);
    updatedWorker.isAlert = updatedWorker.riskScore > 60;

    // Generate alerts
    if (updatedWorker.riskScore > 75 && Math.random() < 0.02) {
      newAlerts.push({
        id: `alert-${tick}-${w.id}`,
        workerId: w.id,
        type: updatedWorker.riskScore > 85 ? 'critical' : 'danger',
        message: `${w.name} entering high-risk zone (Risk: ${Math.round(updatedWorker.riskScore)}%)`,
        timestamp: Date.now(),
      });
    }
    if (newFatigue > 70 && Math.random() < 0.01) {
      newAlerts.push({
        id: `alert-fatigue-${tick}-${w.id}`,
        workerId: w.id,
        type: 'warning',
        message: `${w.name} fatigue level critical (${Math.round(newFatigue)}%)`,
        timestamp: Date.now(),
      });
    }

    return updatedWorker;
  });

  // Hazard zone fluctuation
  const hazardZones = state.hazardZones.map(z => ({
    ...z,
    severity: Math.max(30, Math.min(100, z.severity + (Math.random() - 0.5) * 3)),
  }));

  const avgRisk = workers.reduce((s, w) => s + w.riskScore, 0) / workers.length;
  const maxRisk = Math.max(...workers.map(w => w.riskScore));

  const riskHistory = [...state.riskHistory, { tick, avgRisk, maxRisk }].slice(-100);
  const incidentsPredicted = state.incidentsPredicted + newAlerts.filter(a => a.type === 'critical').length;
  const safetyScore = Math.max(0, Math.min(100, 100 - avgRisk * 0.8));

  return {
    workers,
    hazardZones,
    alerts: [...newAlerts, ...state.alerts].slice(0, 50),
    isRunning: state.isRunning,
    tick,
    riskHistory,
    incidentsPredicted,
    safetyScore: Math.round(safetyScore),
  };
}

export const GRID_DIMENSIONS = GRID_SIZE;
