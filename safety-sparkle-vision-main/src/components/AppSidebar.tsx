import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, BarChart3, Settings, Activity, FlaskConical, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSim } from '@/contexts/SimulationContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/map', icon: Map, label: 'Site Map' },
  { to: '/workers', icon: Users, label: 'Workers' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/simulation', icon: FlaskConical, label: 'Simulation' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSim();

  return (
    <aside className="w-[220px] shrink-0 h-screen sticky top-0 flex flex-col border-r border-border/30 bg-card/40 backdrop-blur-xl">
      {/* Logo */}
      <div className="p-5 border-b border-border/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">SafeSite</h1>
            <p className="text-[10px] text-muted-foreground">Digital Twin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className="w-4 h-4" />
              {item.label}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-border/20">
        <div className="glass rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">System</span>
            <span className={`flex items-center gap-1 font-medium ${state.isRunning ? 'text-success' : 'text-warning'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${state.isRunning ? 'bg-success animate-pulse' : 'bg-warning'}`} />
              {state.isRunning ? 'Active' : 'Paused'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Workers</span>
            <span className="text-foreground font-mono">{state.workers.length}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Safety</span>
            <span className={`font-mono font-semibold ${state.safetyScore > 70 ? 'text-success' : state.safetyScore > 40 ? 'text-warning' : 'text-destructive'}`}>
              {state.safetyScore}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
