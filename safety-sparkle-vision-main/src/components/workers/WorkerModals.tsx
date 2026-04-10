import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/workers/WorkerForm";
import { Worker, WorkerCreatePayload, WorkerUpdatePayload } from "@/lib/workers-api";

interface WorkerModalBackdropProps {
  children: React.ReactNode;
  onClose: () => void;
}

function WorkerModalBackdrop({ children, onClose }: WorkerModalBackdropProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface CreateWorkerModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: WorkerCreatePayload) => Promise<void>;
}

export function CreateWorkerModal({ isOpen, isSubmitting = false, error, onClose, onSubmit }: CreateWorkerModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (payload: WorkerCreatePayload) => {
    await onSubmit(payload);
    onClose();
  };

  return (
    <WorkerModalBackdrop onClose={onClose}>
      <Card className="glass-strong w-full max-w-md border-border/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Create Worker</CardTitle>
              <CardDescription>Add a new worker to the construction site</CardDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <WorkerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
        </CardContent>
      </Card>
    </WorkerModalBackdrop>
  );
}

interface EditWorkerModalProps {
  isOpen: boolean;
  worker: Worker | null;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: WorkerUpdatePayload) => Promise<void>;
}

export function EditWorkerModal({ isOpen, worker, isSubmitting = false, error, onClose, onSubmit }: EditWorkerModalProps) {
  if (!isOpen || !worker) return null;

  const handleSubmit = async (payload: WorkerCreatePayload) => {
    await onSubmit({
      fatigue_level: payload.fatigue_level,
      position: payload.position,
      status: payload.status,
    });
    onClose();
  };

  return (
    <WorkerModalBackdrop onClose={onClose}>
      <Card className="glass-strong w-full max-w-md border-border/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Edit Worker</CardTitle>
              <CardDescription>Update {worker.name}'s information</CardDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <WorkerForm initialWorker={worker} onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
        </CardContent>
      </Card>
    </WorkerModalBackdrop>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  worker: Worker | null;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({ isOpen, worker, isDeleting = false, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !worker) return null;

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete worker");
    }
  };

  return (
    <WorkerModalBackdrop onClose={onClose}>
      <Card className="glass-strong w-full max-w-sm border-border/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/20 p-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle>Delete Worker?</CardTitle>
              <CardDescription>This action cannot be undone.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong>{worker.name}</strong>? All related data will be removed.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </WorkerModalBackdrop>
  );
}
