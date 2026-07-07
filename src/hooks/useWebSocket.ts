import { useCallback, useEffect, useRef, useState } from "react";

export const useWebSocket = (url: string, onMessage?: (val: any) => void) => {
  const [isReady, setIsReady] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef<any>({
    readyState: WebSocket.CONNECTING,
  });

  // Hàm kết nối
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WS Connected");
      setIsReady(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage?.(data);
      setLastMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error("WS Error:", error);
    };

    ws.current.onclose = () => {
      console.log("WS Disconnected");
      setIsReady(false);
    };
  }, [url]);

  // Hàm gửi tin nhắn
  const sendMessage = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.error("WS is not connected");
    }
  }, []);

  // Hàm đóng kết nối
  const close = useCallback(() => {
    ws.current?.close?.();
  }, []);

  // Tự động dọn dẹp khi Component bị hủy (Unmount)
  useEffect(() => {
    return () => {
      ws.current?.close?.();
    };
  }, []);

  return { isReady, lastMessage, connect, sendMessage, close };
};
