import { apiRequest } from "@/lib/api";

export interface SimulationControlResponse {
  status: "running" | "stopped";
  message: string;
}

export function startSimulationRequest() {
  return apiRequest<SimulationControlResponse>("/simulation/start", {
    method: "POST",
  });
}

export function stopSimulationRequest() {
  return apiRequest<SimulationControlResponse>("/simulation/stop", {
    method: "POST",
  });
}
