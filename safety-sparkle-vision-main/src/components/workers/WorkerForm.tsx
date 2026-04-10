import { FormEvent, useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Worker, WorkerCreatePayload } from "@/lib/workers-api";

interface WorkerFormProps {
  initialWorker?: Worker | null;
  onSubmit: (payload: WorkerCreatePayload) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

const ROLES = ["operator", "laborer", "engineer", "supervisor", "electrician"];
const STATUSES = ["active", "inactive", "on_break", "offline"];

export function WorkerForm({ initialWorker, onSubmit, isSubmitting = false, error }: WorkerFormProps) {
  const [formData, setFormData] = useState({
    name: initialWorker?.name ?? "",
    role: initialWorker?.role ?? "laborer",
    fatigue_level: initialWorker?.fatigue_level ?? 0,
    status: initialWorker?.status ?? "active",
    position_x: initialWorker?.position_x ?? 0,
    position_y: initialWorker?.position_y ?? 0,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit({
      name: formData.name,
      role: formData.role,
      fatigue_level: formData.fatigue_level,
      position: {
        x: formData.position_x,
        y: formData.position_y,
      },
      status: formData.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Name
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
          placeholder="e.g., John Smith"
          required
          minLength={2}
          maxLength={120}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Role
          </label>
          <div className="relative">
            <select
              value={formData.role}
              onChange={(e) => setFormData((s) => ({ ...s, role: e.target.value }))}
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <div className="relative">
            <select
              value={formData.status}
              onChange={(e) => setFormData((s) => ({ ...s, status: e.target.value }))}
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="fatigue" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fatigue %
          </label>
          <Input
            id="fatigue"
            type="number"
            min="0"
            max="100"
            step="1"
            value={formData.fatigue_level}
            onChange={(e) => setFormData((s) => ({ ...s, fatigue_level: parseFloat(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pos-x" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Position X
          </label>
          <Input
            id="pos-x"
            type="number"
            step="0.1"
            value={formData.position_x}
            onChange={(e) => setFormData((s) => ({ ...s, position_x: parseFloat(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pos-y" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Position Y
          </label>
          <Input
            id="pos-y"
            type="number"
            step="0.1"
            value={formData.position_y}
            onChange={(e) => setFormData((s) => ({ ...s, position_y: parseFloat(e.target.value) }))}
          />
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting} size="sm">
        {isSubmitting ? "Saving..." : initialWorker ? "Update Worker" : "Create Worker"}
      </Button>
    </form>
  );
}
