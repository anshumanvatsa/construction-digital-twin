import { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialState, tickSimulation, SimulationState, Worker } from '@/lib/simulation';

export function useSimulation(intervalMs = 200) {
  const [state, setState] = useState<SimulationState>(createInitialState);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    setState(s => ({ ...s, isRunning: true }));
  }, []);

  const stop = useCallback(() => {
    setState(s => ({ ...s, isRunning: false }));
  }, []);

  const toggle = useCallback(() => {
    setState(s => ({ ...s, isRunning: !s.isRunning }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setState(createInitialState());
  }, []);

  const addWorker = useCallback(() => {
    setState(s => {
      const id = `w-${s.workers.length + Date.now()}`;
      const roles = ['operator', 'laborer', 'engineer', 'supervisor', 'electrician'] as const;
      const role = roles[Math.floor(Math.random() * roles.length)];
      const colors: Record<string, string> = { operator: '#22d3ee', laborer: '#a78bfa', engineer: '#34d399', supervisor: '#fbbf24', electrician: '#f87171' };
      const newWorker: Worker = {
        id, name: `Worker ${s.workers.length + 1}`, role,
        x: 2 + Math.random() * 36, y: 2 + Math.random() * 36,
        targetX: 2 + Math.random() * 36, targetY: 2 + Math.random() * 36,
        fatigue: 0, riskScore: 0, heartRate: 72, isAlert: false,
        color: colors[role],
      };
      return { ...s, workers: [...s.workers, newWorker] };
    });
  }, []);

  const removeWorker = useCallback(() => {
    setState(s => ({ ...s, workers: s.workers.slice(0, -1) }));
  }, []);

  const toggleHazard = useCallback((id: string) => {
    setState(s => ({
      ...s,
      hazardZones: s.hazardZones.map(z => z.id === id ? { ...z, active: !z.active } : z),
    }));
  }, []);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = window.setInterval(() => {
        setState(s => tickSimulation(s));
      }, intervalMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isRunning, intervalMs]);

  // Auto-start
  useEffect(() => { start(); }, [start]);

  return { state, start, stop, toggle, reset, addWorker, removeWorker, toggleHazard };
}
