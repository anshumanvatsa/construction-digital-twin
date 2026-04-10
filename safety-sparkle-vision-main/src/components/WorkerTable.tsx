import { useSim } from '@/contexts/SimulationContext';
import { getRiskLevel, getRiskColor } from '@/lib/simulation';
import { motion } from 'framer-motion';

export function WorkerTable() {
  const { state } = useSim();
  const workers = [...state.workers].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="glass rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-3">Worker Status</h3>
      <div className="overflow-auto max-h-[400px] scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border/30">
              <th className="text-left py-2 font-medium">Worker</th>
              <th className="text-left py-2 font-medium">Role</th>
              <th className="text-right py-2 font-medium">Fatigue</th>
              <th className="text-right py-2 font-medium">HR</th>
              <th className="text-right py-2 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w, i) => {
              const level = getRiskLevel(w.riskScore);
              const color = getRiskColor(level);
              return (
                <motion.tr
                  key={w.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/10 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-foreground">{w.name}</span>
                  </td>
                  <td className="py-2 capitalize text-muted-foreground">{w.role}</td>
                  <td className="py-2 text-right font-mono">
                    <span style={{ color: w.fatigue > 70 ? 'hsl(0, 72%, 55%)' : w.fatigue > 40 ? 'hsl(38, 92%, 55%)' : 'hsl(142, 70%, 45%)' }}>
                      {Math.round(w.fatigue)}%
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono text-muted-foreground">{w.heartRate}</td>
                  <td className="py-2 text-right">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {Math.round(w.riskScore)}%
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
