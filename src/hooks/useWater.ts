import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export const WATER_GOAL = 8;

// Glasses of water for today, kept in this browser per user and per day (there
// is no water table in the database). Resets automatically each new day.
export const useWater = () => {
  const { user } = useAuth();
  const key = `nutrigen_water_${user?.id ?? "anon"}_${format(new Date(), "yyyy-MM-dd")}`;
  const [glasses, setGlasses] = useState(0);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(key));
      setGlasses(Number.isFinite(stored) ? Math.max(0, Math.min(stored, 20)) : 0);
    } catch {
      setGlasses(0);
    }
  }, [key]);

  const update = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, 20));
      setGlasses(clamped);
      try {
        localStorage.setItem(key, String(clamped));
      } catch {
        // ignore: the count just won't persist
      }
    },
    [key]
  );

  return {
    glasses,
    add: () => update(glasses + 1),
    remove: () => update(glasses - 1),
  };
};
