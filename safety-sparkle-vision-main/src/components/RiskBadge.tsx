import { AlertTriangle, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface RiskBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

function getRiskColor(level: ReturnType<typeof getRiskLevel>) {
  switch (level) {
    case "low":
      return "bg-success/20 text-success border-success/30 hover:bg-success/30";
    case "medium":
      return "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30";
    case "high":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30";
    case "critical":
      return "bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30";
  }
}

function getRiskIcon(level: ReturnType<typeof getRiskLevel>) {
  switch (level) {
    case "low":
      return <CheckCircle className="w-3.5 h-3.5" />;
    case "medium":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "high":
      return <Zap className="w-3.5 h-3.5" />;
    case "critical":
      return <AlertTriangle className="w-3.5 h-3.5" />;
  }
}

const sizeClasses = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-2.5 py-1.5",
  lg: "text-base px-3 py-2",
};

export function RiskBadge({ score, size = "md", showIcon = true }: RiskBadgeProps) {
  const level = getRiskLevel(score);
  const color = getRiskColor(level);
  const icon = getRiskIcon(level);

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors ${sizeClasses[size]} ${color}`}>
      {showIcon && icon}
      <span className="font-mono">{Math.round(score)}%</span>
    </div>
  );
}

export function getRiskLabel(score: number): string {
  const level = getRiskLevel(score);
  return level.charAt(0).toUpperCase() + level.slice(1);
}
