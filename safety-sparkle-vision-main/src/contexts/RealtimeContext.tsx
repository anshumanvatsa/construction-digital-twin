import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import { useWebSocket } from "@/hooks/useWebSocket";

interface RealtimeMessage {
  type: string;
  timestamp?: string;
  payload?: unknown;
}

interface RealtimeContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: RealtimeMessage | null;
  latestWorkers: Array<Record<string, unknown>>;
  recentAlerts: Array<Record<string, unknown>>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [latestWorkers, setLatestWorkers] = useState<Array<Record<string, unknown>>>([]);
  const [recentAlerts, setRecentAlerts] = useState<Array<Record<string, unknown>>>([]);

  const { isConnected, isConnecting, error } = useWebSocket({
    url: "/ws/simulation",
    onMessage: (data) => {
      if (typeof data === "object" && data !== null) {
        const message = data as RealtimeMessage;
        setLastMessage(message);

        if (message.type === "simulation_snapshot") {
          const payload = (message.payload ?? {}) as { workers?: Array<Record<string, unknown>> };
          if (Array.isArray(payload.workers)) {
            setLatestWorkers(payload.workers);
          }
        }

        if (message.type === "alert") {
          const payload = (message.payload ?? {}) as Record<string, unknown>;
          setRecentAlerts((prev) => [payload, ...prev].slice(0, 20));
          const alertMessage = typeof payload.message === "string" ? payload.message : "New safety alert received";
          toast.warning(alertMessage);
        }
      }
    },
    onOpen: () => {
      console.log("WebSocket connected");
    },
    onClose: () => {
      console.log("WebSocket closed");
    },
    onError: (err) => {
      console.error("WebSocket error:", err);
    },
  });

  const value = useMemo<RealtimeContextValue>(
    () => ({
      isConnected,
      isConnecting,
      error,
      lastMessage,
      latestWorkers,
      recentAlerts,
    }),
    [error, isConnected, isConnecting, lastMessage, latestWorkers, recentAlerts],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return context;
}
