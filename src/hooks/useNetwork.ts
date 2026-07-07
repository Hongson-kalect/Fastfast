import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useState, useEffect } from "react";

export const useNetwork = () => {
  const [connection, setConnection] = useState<NetInfoState | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // 1. Lấy trạng thái mạng lần đầu khi app load
    NetInfo.fetch().then((state) => {
      setConnection(state);
      setIsOnline(state.isConnected ?? false);
    });

    // 2. Lắng nghe sự thay đổi trạng thái mạng (Real-time)
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnection(state);
      setIsOnline(state.isConnected ?? false);
      
      if (state.isConnected) {
        console.log("🌐 Đã có mạng - Kích hoạt Sync dữ liệu...");
        // Gọi hàm triggerSync() của bạn ở đây
      }
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, connection };
};