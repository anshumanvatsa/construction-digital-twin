import { apiRequest } from "@/lib/api";

export interface Position {
  x: number;
  y: number;
}

export interface Worker {
  id: number;
  name: string;
  role: string;
  fatigue_level: number;
  risk_score: number;
  position_x: number;
  position_y: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerCreatePayload {
  name: string;
  role: string;
  fatigue_level: number;
  position: Position;
  status: string;
}

export interface WorkerUpdatePayload {
  fatigue_level?: number;
  risk_score?: number;
  position?: Position;
  status?: string;
}

export interface WorkerBulkCreatePayload {
  workers: WorkerCreatePayload[];
}

export interface WorkerResetResponse {
  success: boolean;
  deleted_count: number;
}

export async function listWorkers(): Promise<Worker[]> {
  return apiRequest<Worker[]>("/workers", {
    method: "GET",
  });
}

export async function createWorker(payload: WorkerCreatePayload): Promise<Worker> {
  return apiRequest<Worker>("/workers/add", {
    method: "POST",
    body: payload,
  });
}

export async function updateWorker(workerId: number, payload: WorkerUpdatePayload): Promise<Worker> {
  return apiRequest<Worker>(`/workers/${workerId}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteWorker(workerId: number): Promise<void> {
  return apiRequest<void>(`/workers/${workerId}`, {
    method: "DELETE",
  });
}

export async function bulkCreateWorkers(payload: WorkerBulkCreatePayload): Promise<Worker[]> {
  return apiRequest<Worker[]>("/workers/bulk", {
    method: "POST",
    body: payload,
  });
}

export async function resetWorkersRequest(): Promise<WorkerResetResponse> {
  return apiRequest<WorkerResetResponse>("/workers/reset", {
    method: "POST",
  });
}
