import React, { createContext, useContext } from 'react';
import { useSimulation } from '@/hooks/useSimulation';

type SimContextType = ReturnType<typeof useSimulation>;

const SimulationContext = createContext<SimContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const sim = useSimulation(200);
  return <SimulationContext.Provider value={sim}>{children}</SimulationContext.Provider>;
}

export function useSim() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSim must be used within SimulationProvider');
  return ctx;
}
