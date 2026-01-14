import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { LayoutMap } from "../keys";
import { staticaLayoutUnshifted } from "./statica";
import { DEFAULT_LAYOUT_JSON, getInitialLayoutJson, LOCALSTORAGE_KEY, parseLayoutJson } from "./layoutStore";

type LayoutContextValue = {
  layoutJsonText: string;
  layoutMap: LayoutMap;
  layoutJsonError: string | null;
  setLayoutJsonText: (text: string) => void;
  resetLayoutJson: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layoutJsonText, setLayoutJsonTextState] = useState(() => getInitialLayoutJson());
  const [layoutMap, setLayoutMap] = useState<LayoutMap>(() => {
    try {
      return parseLayoutJson(getInitialLayoutJson());
    } catch {
      return staticaLayoutUnshifted;
    }
  });
  const [layoutJsonError, setLayoutJsonError] = useState<string | null>(null);

  const persistTimer = useRef<number | null>(null);

  const setLayoutJsonText = (text: string) => {
    setLayoutJsonTextState(text);
    try {
      const parsed = parseLayoutJson(text);
      setLayoutMap(parsed);
      setLayoutJsonError(null);
    } catch (err) {
      setLayoutJsonError(err instanceof Error ? err.message : "Invalid layout JSON.");
    }
  };

  const resetLayoutJson = () => {
    setLayoutJsonText(DEFAULT_LAYOUT_JSON);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(LOCALSTORAGE_KEY, layoutJsonText);
      persistTimer.current = null;
    }, 650);
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [layoutJsonText]);

  const value = useMemo<LayoutContextValue>(
    () => ({
      layoutJsonText,
      layoutMap,
      layoutJsonError,
      setLayoutJsonText,
      resetLayoutJson,
    }),
    [layoutJsonError, layoutJsonText, layoutMap],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutStore(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayoutStore must be used within LayoutProvider.");
  return ctx;
}
