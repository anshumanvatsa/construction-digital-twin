import { useState, useCallback, useEffect } from "react";
import { ApiError } from "@/lib/api";
import {
  Worker,
  WorkerCreatePayload,
  WorkerUpdatePayload,
  listWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  bulkCreateWorkers,
  resetWorkersRequest,
} from "@/lib/workers-api";
import { toast } from "@/components/ui/sonner";

interface UseWorkersState {
  workers: Worker[];
  isLoading: boolean;
  error: string | null;
}

interface UseWorkersReturn extends UseWorkersState {
  refetch: () => Promise<void>;
  addWorker: (payload: WorkerCreatePayload) => Promise<void>;
  bulkAddWorkers: (payload: WorkerCreatePayload[]) => Promise<void>;
  resetWorkers: () => Promise<void>;
  updateWorkerRecord: (id: number, payload: WorkerUpdatePayload) => Promise<void>;
  removeWorker: (id: number) => Promise<void>;
}

export function useWorkers(): UseWorkersReturn {
  const [state, setState] = useState<UseWorkersState>({
    workers: [],
    isLoading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await listWorkers();
      setState((s) => ({ ...s, workers: data, isLoading: false }));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load workers";
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, []);

  const addWorker = useCallback(async (payload: WorkerCreatePayload) => {
    try {
      const newWorker = await createWorker(payload);
      setState((s) => ({ ...s, workers: [...s.workers, newWorker] }));
      toast.success("Worker added successfully");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to add worker";
      toast.error(message);
      throw error;
    }
  }, []);

  const updateWorkerRecord = useCallback(async (id: number, payload: WorkerUpdatePayload) => {
    try {
      const updated = await updateWorker(id, payload);
      setState((s) => ({
        ...s,
        workers: s.workers.map((w) => (w.id === id ? updated : w)),
      }));
      toast.success("Worker updated successfully");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to update worker";
      toast.error(message);
      throw error;
    }
  }, []);

  const bulkAddWorkers = useCallback(async (payload: WorkerCreatePayload[]) => {
    try {
      const created = await bulkCreateWorkers({ workers: payload });
      setState((s) => ({
        ...s,
        workers: [...s.workers, ...created],
      }));
      toast.success(`${created.length} workers added successfully`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to add workers";
      toast.error(message);
      throw error;
    }
  }, []);

  const resetWorkers = useCallback(async () => {
    try {
      const response = await resetWorkersRequest();
      setState((s) => ({ ...s, workers: [] }));
      toast.success(`Workers reset successfully (${response.deleted_count} removed)`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to reset workers";
      toast.error(message);
      throw error;
    }
  }, []);

  const removeWorker = useCallback(async (id: number) => {
    try {
      await deleteWorker(id);
      setState((s) => ({
        ...s,
        workers: s.workers.filter((w) => w.id !== id),
      }));
      toast.success("Worker deleted successfully");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to delete worker";
      toast.error(message);
      throw error;
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
    addWorker,
    bulkAddWorkers,
    resetWorkers,
    updateWorkerRecord,
    removeWorker,
  };
}
