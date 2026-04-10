import { useSim } from '@/contexts/SimulationContext';
import { Play, Pause, RotateCcw, UserPlus, UserMinus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { startSimulationRequest, stopSimulationRequest } from '@/lib/simulation-api';

export function SimulationControls() {
  const { state, toggle, reset, addWorker, removeWorker, toggleHazard } = useSim();
  const { user } = useAuth();
  const [isToggling, setIsToggling] = useState(false);
  const canControlSimulation = user?.role === 'admin' || user?.role === 'manager';

  const onToggleSimulation = async () => {
    setIsToggling(true);
    try {
      if (state.isRunning) {
        await stopSimulationRequest();
      } else {
        await startSimulationRequest();
      }
      toggle();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update simulation state.';
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="glass rounded-xl p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Simulation Controls</h3>
        <div className="flex gap-2">
          <button
            onClick={onToggleSimulation}
            disabled={isToggling || !canControlSimulation}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              state.isRunning
                ? 'bg-warning/20 text-warning hover:bg-warning/30'
                : 'bg-primary/20 text-primary hover:bg-primary/30'
            }`}
          >
            {state.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isToggling ? 'Syncing...' : state.isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={reset} disabled={!canControlSimulation} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Workers ({state.workers.length})</h4>
        <div className="flex gap-2">
          <button onClick={addWorker} disabled={!canControlSimulation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/15 text-success hover:bg-success/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <UserPlus className="w-3.5 h-3.5" /> Add
          </button>
          <button onClick={removeWorker} disabled={state.workers.length <= 1 || !canControlSimulation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-destructive/15 text-destructive hover:bg-destructive/25 transition-all disabled:opacity-30">
            <UserMinus className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Hazard Zones</h4>
        <div className="space-y-1.5">
          {state.hazardZones.map(zone => (
            <button
              key={zone.id}
              onClick={() => toggleHazard(zone.id)}
              disabled={!canControlSimulation}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                zone.active
                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                  : 'bg-secondary/50 text-muted-foreground border border-border/20'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                {zone.label}
              </span>
              <span className="text-[10px] font-mono">{zone.active ? 'ON' : 'OFF'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-border/20">
        <p className="text-[10px] text-muted-foreground font-mono">
          Tick: {state.tick} | Predicted Incidents: {state.incidentsPredicted}
        </p>
        {!canControlSimulation && (
          <p className="mt-1 text-[10px] text-warning">Viewer role: simulation controls are read-only.</p>
        )}
      </div>
    </div>
  );
}
