import { createDBService } from "@/database";
import { useSQLiteContext } from "expo-sqlite";
import { useMemo } from "react";

export function useDBService() {
  const db = useSQLiteContext();

  return useMemo(() => {
    return createDBService(db);
  }, [db]);
}
