import { memo } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, CheckCircle, Circle, Pause } from "lucide-react";
import { Worker } from "@/lib/workers-api";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";

interface WorkerListTableProps {
  workers: Worker[];
  isLoading?: boolean;
  canManage?: boolean;
  onEdit?: (worker: Worker) => void;
  onDelete?: (worker: Worker) => void;
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <CheckCircle className="w-4 h-4 text-success" />;
    case "inactive":
      return <Circle className="w-4 h-4 text-muted-foreground" />;
    case "on_break":
      return <Pause className="w-4 h-4 text-warning" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
}

export const WorkerListTable = memo(function WorkerListTable({ workers, isLoading = false, canManage = true, onEdit, onDelete }: WorkerListTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="rounded-lg border border-border/20 bg-card/50 p-12 text-center">
        <p className="text-sm text-muted-foreground">No workers yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/20">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/20 bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Fatigue</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {workers.map((worker, idx) => (
              <motion.tr
                key={worker.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card/40 hover:bg-card/60 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-sm text-foreground">{worker.name}</div>
                  <div className="text-xs text-muted-foreground">#ID-{worker.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs capitalize text-muted-foreground">{worker.role}</span>
                </td>
                <td className="px-4 py-3">
                  <RiskBadge score={worker.risk_score} size="sm" showIcon={worker.risk_score > 60} />
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-mono">{Math.round(worker.fatigue_level)}%</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-mono text-muted-foreground">
                    ({Math.round(worker.position_x)}, {Math.round(worker.position_y)})
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(worker.status)}
                    <span className="text-xs capitalize text-muted-foreground">{worker.status.replace("_", " ")}</span>
                  </div>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit?.(worker)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete?.(worker)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
