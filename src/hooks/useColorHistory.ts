import { useCallback, useEffect, useState } from "react";
import { COLOR_HISTORY_LIMIT, readColorHistory, pushColorHistory } from "../utils/color";

export function useColorHistory() {
  const [history, setHistory] = useState<string[]>(() => readColorHistory());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "hft-color-history") {
        setHistory(readColorHistory());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const record = useCallback((hex: string) => {
    const next = pushColorHistory(hex);
    setHistory(next);
  }, []);

  return { history, record, limit: COLOR_HISTORY_LIMIT };
}