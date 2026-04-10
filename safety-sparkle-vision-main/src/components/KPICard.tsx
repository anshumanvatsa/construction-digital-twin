import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'warning' | 'destructive' | 'success';
}

const colorMap = {
  primary: 'glow-primary',
  warning: '',
  destructive: 'glow-danger',
  success: '',
};

const borderMap = {
  primary: 'border-primary/20',
  warning: 'border-warning/20',
  destructive: 'border-destructive/20',
  success: 'border-success/20',
};

export function KPICard({ title, value, subtitle, icon, color = 'primary' }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-5 ${colorMap[color]} ${borderMap[color]} transition-all hover:scale-[1.02] cursor-default`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="animate-counter-up">
        <span className="text-3xl font-bold text-foreground tracking-tight font-mono">{value}</span>
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}
