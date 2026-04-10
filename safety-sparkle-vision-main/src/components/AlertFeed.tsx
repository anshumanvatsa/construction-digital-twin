import { useSim } from '@/contexts/SimulationContext';
import { getRiskLevel, getRiskColor } from '@/lib/simulation';
import { motion, AnimatePresence } from 'framer-motion';

export function AlertFeed() {
  const { state } = useSim();
  const alerts = state.alerts.slice(0, 8);

  const typeStyles = {
    info: 'border-primary/30 bg-primary/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
    critical: 'border-destructive/50 bg-destructive/10 glow-danger',
  };

  const typeDots = {
    info: 'bg-primary',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    critical: 'bg-destructive animate-pulse',
  };

  return (
    <div className="glass rounded-xl p-4 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        Live Alerts
      </h3>
      <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20 }}
              className={`rounded-lg border p-3 ${typeStyles[alert.type]}`}
            >
              <div className="flex items-start gap-2">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${typeDots[alert.type]}`} />
                <div className="min-w-0">
                  <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {alerts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No active alerts</p>
        )}
      </div>
    </div>
  );
}
