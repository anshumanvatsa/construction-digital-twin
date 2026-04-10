import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Monitor, Gauge } from 'lucide-react';

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold text-foreground">Settings</h2>
      
      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" /> Simulation Parameters
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-muted-foreground">Update Interval</span>
            <span className="font-mono text-foreground">200ms</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-muted-foreground">Max Workers</span>
            <span className="font-mono text-foreground">50</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-muted-foreground">Risk Calculation</span>
            <span className="font-mono text-foreground">Heuristic</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Grid Size</span>
            <span className="font-mono text-foreground">40×40</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary" /> Display
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-muted-foreground">Theme</span>
            <span className="font-mono text-foreground">Dark</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Animations</span>
            <span className="font-mono text-foreground">Enabled</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center font-mono">
        SafeSite Digital Twin v1.0 — Construction Safety Intelligence
      </p>
    </motion.div>
  );
}
