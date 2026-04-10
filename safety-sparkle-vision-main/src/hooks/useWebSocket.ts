import { useEffect, useState, useCallback, useRef } from "react";

const WS_BASE_URL = "ws://localhost:8000";
const WS_RECONNECT_BASE_DELAY = 1000;
const WS_RECONNECT_MAX_DELAY = 30000;
const WS_RECONNECT_MAX_RETRIES = 5;

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  send: (data: unknown) => void;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const scheduleReconnect = () => {
      if (reconnectAttemptsRef.current >= WS_RECONNECT_MAX_RETRIES) {
        setError("Unable to reconnect. Please refresh the page.");
        return;
      }

      const attempt = reconnectAttemptsRef.current;
      const jitter = Math.floor(Math.random() * 250);
      const delay = Math.min(WS_RECONNECT_BASE_DELAY * 2 ** attempt + jitter, WS_RECONNECT_MAX_DELAY);
      reconnectAttemptsRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    try {
      const wsUrl = `${WS_BASE_URL}${url}`;
      const ws = new WebSocket(wsUrl);

      ws.addEventListener("open", () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      });

      ws.addEventListener("close", () => {
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.();
        scheduleReconnect();
      });

      ws.addEventListener("error", (event) => {
        setIsConnecting(false);
        setError("WebSocket connection error");
        onError?.(event);
      });

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setIsConnecting(false);
      setError(message);
      scheduleReconnect();
    }
  }, [url, onMessage, onOpen, onClose, onError]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    error,
    send,
  };
}
