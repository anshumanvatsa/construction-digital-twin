import { useSim } from '@/contexts/SimulationContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, AlertTriangle, Users, Cpu, Heart, LogOut, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function TopBar() {
  const { state } = useSim();
  const { user, logout } = useAuth();
  const { isConnected, isConnecting } = useRealtime();
  const navigate = useNavigate();
  const criticalWorkers = state.workers.filter(w => w.riskScore > 60).length;

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 shrink-0 border-b border-border/20 glass-strong flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-mono">Tick #{state.tick}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${state.isRunning ? 'bg-success animate-pulse' : 'bg-warning'}`} />
          <span className="text-muted-foreground">{state.isRunning ? 'Simulation Running' : 'Paused'}</span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-foreground font-mono">{state.workers.length}</span>
          <span className="text-muted-foreground">active</span>
        </div>
        {criticalWorkers > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-mono">{criticalWorkers}</span>
            <span>at risk</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <Shield className="w-3.5 h-3.5 text-success" />
          <span className={`font-mono font-semibold ${state.safetyScore > 70 ? 'text-success' : state.safetyScore > 40 ? 'text-warning' : 'text-destructive'}`}>
            {state.safetyScore}%
          </span>
        </div>
        {user && (
          <div className="hidden md:flex items-center gap-2 rounded-md border border-border/30 bg-card/50 px-2.5 py-1 text-xs">
            <span className="text-muted-foreground">Signed in:</span>
            <span className="font-medium text-foreground">{user.email}</span>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {user.role}
            </span>
          </div>
        )}
        <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
          isConnected ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'
        }`}>
          {isConnecting && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Offline'}
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/30 bg-card/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-card"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
