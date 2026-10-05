import { useCallback, useEffect, useState } from "react";

// A boolean preference kept in this browser. Used for small display settings
// that don't need a database column.
export const useLocalPreference = (key: string, defaultValue: boolean) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(stored === "1");
    } catch {
      // ignore: fall back to the default
    }
  }, [key]);

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // ignore: the choice just won't persist
      }
    },
    [key]
  );

  return [value, update] as const;
};

export const PREFER_PANTRY_KEY = "nutrigen_prefer_pantry";
export const AUTOFILL_PANTRY_KEY = "nutrigen_autofill_pantry";
