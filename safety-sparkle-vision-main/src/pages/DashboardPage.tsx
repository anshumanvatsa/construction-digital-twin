import { useSim } from '@/contexts/SimulationContext';
import { KPICard } from '@/components/KPICard';
import { SiteMap } from '@/components/SiteMap';
import { AlertFeed } from '@/components/AlertFeed';
import { RiskChart } from '@/components/RiskChart';
import { WorkerTable } from '@/components/WorkerTable';
import { Heatmap } from '@/components/Heatmap';
import { Shield, Users, AlertTriangle, Activity, Heart, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { state } = useSim();
  const avgFatigue = Math.round(state.workers.reduce((s, w) => s + w.fatigue, 0) / state.workers.length);
  const avgHR = Math.round(state.workers.reduce((s, w) => s + w.heartRate, 0) / state.workers.length);
  const highRiskCount = state.workers.filter(w => w.riskScore > 50).length;
  const activeHazards = state.hazardZones.filter(z => z.active).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Safety Score" value={`${state.safetyScore}%`} icon={<Shield className="w-4 h-4" />} color="success" subtitle="Overall rating" />
        <KPICard title="Workers" value={state.workers.length} icon={<Users className="w-4 h-4" />} color="primary" subtitle="On site" />
        <KPICard title="High Risk" value={highRiskCount} icon={<AlertTriangle className="w-4 h-4" />} color="destructive" subtitle="Workers at risk" />
        <KPICard title="Avg Fatigue" value={`${avgFatigue}%`} icon={<Activity className="w-4 h-4" />} color="warning" subtitle="Crew average" />
        <KPICard title="Avg HR" value={`${avgHR} bpm`} icon={<Heart className="w-4 h-4" />} color="primary" subtitle="Heart rate" />
        <KPICard title="Hazards" value={activeHazards} icon={<TrendingUp className="w-4 h-4" />} color="destructive" subtitle="Active zones" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 420 }}>
        <div className="lg:col-span-2">
          <SiteMap />
        </div>
        <AlertFeed />
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 320 }}>
        <div className="lg:col-span-2">
          <RiskChart />
        </div>
        <Heatmap />
      </div>

      <WorkerTable />
    </motion.div>
  );
}
