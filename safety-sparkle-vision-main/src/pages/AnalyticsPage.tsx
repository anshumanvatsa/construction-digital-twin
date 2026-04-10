import { motion } from "framer-motion";
import { BarChart3, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/KPICard";
import { RiskChart } from '@/components/RiskChart';
import { WorkerTable } from '@/components/WorkerTable';
import { Heatmap } from '@/components/Heatmap';
import { useWorkers } from "@/hooks/useWorkers";
import { useSim } from "@/contexts/SimulationContext";

export default function AnalyticsPage() {
  const { workers } = useWorkers();
  const { state } = useSim();

  // Calculate analytics
  const avgFatigue = workers.length > 0 ? Math.round(workers.reduce((s, w) => s + w.fatigue_level, 0) / workers.length) : 0;
  const avgRisk = workers.length > 0 ? Math.round(workers.reduce((s, w) => s + w.risk_score, 0) / workers.length) : 0;
  const maxRisk = workers.length > 0 ? Math.max(...workers.map((w) => w.risk_score)) : 0;
  const minRisk = workers.length > 0 ? Math.min(...workers.map((w) => w.risk_score)) : 0;
  const highRiskCount = workers.filter((w) => w.risk_score > 60).length;
  const mediumRiskCount = workers.filter((w) => w.risk_score > 40 && w.risk_score <= 60).length;
  const lowRiskCount = workers.filter((w) => w.risk_score <= 40).length;

  // Worker distribution by role
  const roleDistribution: Record<string, number> = {};
  workers.forEach((w) => {
    roleDistribution[w.role] = (roleDistribution[w.role] ?? 0) + 1;
  });

  // Worker distribution by status
  const statusDistribution: Record<string, number> = {};
  workers.forEach((w) => {
    statusDistribution[w.status] = (statusDistribution[w.status] ?? 0) + 1;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor workforce safety metrics and risk trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Workers" value={workers.length} icon={<Users className="w-4 h-4" />} color="primary" subtitle="On site" />
        <KPICard title="Avg Risk" value={`${avgRisk}%`} icon={<TrendingUp className="w-4 h-4" />} color="warning" subtitle="All workers" />
        <KPICard title="Avg Fatigue" value={`${avgFatigue}%`} icon={<TrendingUp className="w-4 h-4" />} color="warning" subtitle="Crew average" />
        <KPICard title="High Risk" value={highRiskCount} icon={<AlertTriangle className="w-4 h-4" />} color="destructive" subtitle="Workers at risk" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: 300 }}>
        <RiskChart />
        <Heatmap />
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass border-border/20">
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Worker count by risk category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-success">Low Risk (&lt;40%)</span>
                  <span className="text-lg font-semibold text-success">{lowRiskCount}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all"
                    style={{ width: `${workers.length > 0 ? (lowRiskCount / workers.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-warning">Medium Risk (40-60%)</span>
                  <span className="text-lg font-semibold text-warning">{mediumRiskCount}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning transition-all"
                    style={{ width: `${workers.length > 0 ? (mediumRiskCount / workers.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-destructive">High Risk (&gt;60%)</span>
                  <span className="text-lg font-semibold text-destructive">{highRiskCount}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-destructive transition-all"
                    style={{ width: `${workers.length > 0 ? (highRiskCount / workers.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/20">
          <CardHeader>
            <CardTitle>Risk Statistics</CardTitle>
            <CardDescription>Risk score metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Lowest Risk</span>
                <span className="text-lg font-mono font-semibold text-success">{Math.round(minRisk)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Average Risk</span>
                <span className="text-lg font-mono font-semibold text-warning">{Math.round(avgRisk)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Highest Risk</span>
                <span className="text-lg font-mono font-semibold text-destructive">{Math.round(maxRisk)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                <span className="text-sm text-muted-foreground">Overall Safety</span>
                <span className="text-lg font-mono font-semibold text-success">{state.safetyScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass border-border/20">
          <CardHeader>
            <CardTitle>Workers by Role</CardTitle>
            <CardDescription>Workforce composition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(roleDistribution).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors">
                  <span className="text-sm capitalize font-medium text-foreground">{role}</span>
                  <span className="text-sm font-mono text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/20">
          <CardHeader>
            <CardTitle>Workers by Status</CardTitle>
            <CardDescription>Current activity state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-2 rounded-lg hover:bg-card/50 transition-colors">
                  <span className="text-sm capitalize font-medium text-foreground">{status.replace("_", " ")}</span>
                  <span className="text-sm font-mono text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <WorkerTable />
    </motion.div>
  );
}
