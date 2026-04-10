import { motion } from "framer-motion";
import { useState } from "react";
import { Play, Pause, RotateCcw, TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { SimulationControls } from '@/components/SimulationControls';
import { WorkerMap } from '@/components/WorkerMap';
import { RiskChart } from '@/components/RiskChart';
import { AlertFeed } from '@/components/AlertFeed';
import { useSim } from "@/contexts/SimulationContext";
import { startSimulationRequest, stopSimulationRequest } from "@/lib/simulation-api";
import { toast } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";

export default function SimulationPage() {
  const { state, start, stop, reset } = useSim();
  const [isToggling, setIsToggling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const avgRisk = state.workers.length > 0 ? Math.round(state.workers.reduce((s, w) => s + w.riskScore, 0) / state.workers.length) : 0;
  const maxRisk = state.workers.length > 0 ? Math.max(...state.workers.map((w) => w.riskScore)) : 0;
  const highRiskCount = state.workers.filter((w) => w.riskScore > 60).length;

  const onToggleSimulation = async () => {
    setIsToggling(true);
    try {
      if (state.isRunning) {
        await stopSimulationRequest();
        stop();
      } else {
        await startSimulationRequest();
        start();
      }
      toast.success(`Simulation ${state.isRunning ? "paused" : "started"}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : `Failed to ${state.isRunning ? "pause" : "start"} simulation`;
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  };

  const onReset = async () => {
    setIsResetting(true);
    try {
      reset();
      toast.success("Simulation reset successfully");
    } catch (error) {
      toast.error("Failed to reset simulation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Simulation Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor and manage the construction site simulation in real-time</p>
      </div>

      {/* Status Card */}
      <Card className="glass border-border/20 bg-gradient-to-r from-card to-card/50">
        <CardHeader>
          <CardTitle>Simulation Status</CardTitle>
          <CardDescription>Current operational state and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${state.isRunning ? 'bg-success' : 'bg-warning'}`} />
                <span className="text-lg font-semibold text-foreground">{state.isRunning ? 'Running' : 'Paused'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Simulation Tick</p>
              <p className="text-lg font-mono font-semibold text-foreground">{state.tick.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Workers</p>
              <p className="text-lg font-semibold text-primary">{state.workers.length}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Predicted Incidents</p>
              <p className="text-lg font-mono font-semibold text-destructive">{state.incidentsPredicted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={onToggleSimulation}
          disabled={isToggling}
          size="lg"
          className="gap-2 h-12"
          variant={state.isRunning ? "destructive" : "default"}
        >
          {state.isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              {isToggling ? "Pausing..." : "Pause Simulation"}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {isToggling ? "Starting..." : "Start Simulation"}
            </>
          )}
        </Button>

        <Button
          onClick={onReset}
          disabled={isResetting}
          size="lg"
          variant="secondary"
          className="gap-2 h-12"
        >
          <RotateCcw className="w-4 h-4" />
          {isResetting ? "Resetting..." : "Reset Simulation"}
        </Button>

        <div className="flex items-center justify-center rounded-lg border border-border/20 bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 mr-2" />
          Tick rate: 200ms
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Avg Risk" value={`${avgRisk}%`} icon={<TrendingUp className="w-4 h-4" />} color="warning" subtitle="All workers" />
        <KPICard title="Max Risk" value={`${maxRisk}%`} icon={<BarChart3 className="w-4 h-4" />} color="destructive" subtitle="Highest worker" />
        <KPICard title="High Risk" value={highRiskCount} icon={<AlertCircle className="w-4 h-4" />} color="destructive" subtitle="Workers at risk" />
        <KPICard title="Safety Score" value={`${state.safetyScore}%`} icon={<TrendingUp className="w-4 h-4" />} color="success" subtitle="Overall rating" />
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2" style={{ minHeight: 420 }}>
          <WorkerMap />
        </div>
        <div className="space-y-4">
          <SimulationControls />
          <Card className="glass border-border/20">
            <CardHeader>
              <CardTitle>Live Monitor</CardTitle>
              <CardDescription>Operational intensity snapshot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tick</span>
                <span className="font-mono text-foreground">#{state.tick}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Workers</span>
                <span className="font-semibold text-foreground">{state.workers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">High Risk Workers</span>
                <span className="font-semibold text-destructive">{highRiskCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Safety Score</span>
                <span className="font-semibold text-success">{state.safetyScore}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 300 }}>
        <RiskChart />
        <AlertFeed />
      </div>
    </motion.div>
  );
}
