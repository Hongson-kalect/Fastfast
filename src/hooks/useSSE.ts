import { useCallback, useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";

export type SSEStatus =
  | "idle"
  | "connecting"
  | "open"
  | "retrying"
  | "closed"
  | "failed";

interface SSEOptions {
  onMessage: (raw: string, parsed?: any) => void;
  onOpen?: () => void;
  onError?: (error: any) => void;
  maxRetries?: number;
}

export function useSSE(url: string | null, options: SSEOptions) {
  const { onMessage, onOpen, onError, maxRetries = 5 } = options;

  const esRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const unmountedRef = useRef(false);

  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<SSEStatus>("idle");

  const cleanup = useCallback(() => {
    retryTimeoutRef.current && clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = null;

    esRef.current?.removeAllEventListeners();
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (!url || unmountedRef.current) return;

    cleanup();
    setStatus("connecting");

    const es = new EventSource(url);
    esRef.current = es;
    alert("connect");

    es.addEventListener("open", () => {
      alert("open");
      retryCountRef.current = 0;
      setStatus("open");
      onOpen?.();
    });

    es.addEventListener("message", (event: any) => {
      if (!event?.data) return;
      alert("message");

      //   let parsed: any
      //   try {
      //     parsed = JSON.parse(event.data)
      //   } catch {
      //     parsed = undefined
      //   }

      setData(event.data);
      onMessage(event.data, event.data);
    });

    es.addEventListener("error", (err: any) => {
      if (unmountedRef.current) return;
      alert("error");

      onError?.(err);
      cleanup();

      const statusCode = err?.status;

      // ❌ Auth error → stop luôn
      if (statusCode === 401 || statusCode === 403) {
        setStatus("failed");
        return;
      }

      // ❌ Retry quá số lần
      if (retryCountRef.current >= maxRetries) {
        setStatus("failed");
        return;
      }

      retryCountRef.current++;
      setStatus("retrying");

      // ⏳ Backoff + tôn trọng Retry-After nếu có
      const retryAfter =
        typeof err?.retryAfter === "number"
          ? err.retryAfter * 1000
          : Math.min(1000 * 2 ** (retryCountRef.current - 1), 15000);

      retryTimeoutRef.current = setTimeout(connect, retryAfter);
    });
  }, [url, onMessage, onOpen, onError, maxRetries, cleanup]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      setStatus("closed");
      cleanup();
    };
  }, [connect, cleanup]);

  const disconnect = useCallback(() => {
    setStatus("closed");
    cleanup();
  }, [cleanup]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    connect();
  }, [connect]);

  return {
    data,
    status, // idle | connecting | open | retrying | closed | failed
    disconnect, // chủ động đóng
    retry, // user bấm "Try again"
  };
}
