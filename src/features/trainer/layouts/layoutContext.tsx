import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { LayoutMap } from "../keys";
import { staticaLayoutUnshifted } from "./statica";
import {
  DEFAULT_LAYOUT_PRESET,
  getDefaultLayoutJsonForPreset,
  getInitialLayoutState,
  LAYOUT_JSON_LOCALSTORAGE_KEYS,
  LAYOUT_PRESET_LOCALSTORAGE_KEY,
  LOCALSTORAGE_KEY,
  parseLayoutJson,
  type LayoutPresetId,
} from "./layoutStore";

type LayoutContextValue = {
  layoutPreset: LayoutPresetId;
  layoutJsonText: string;
  layoutMap: LayoutMap;
  layoutJsonError: string | null;
  setLayoutPreset: (preset: LayoutPresetId) => void;
  setLayoutJsonText: (text: string) => void;
  resetLayoutJson: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const initialState = useMemo(() => getInitialLayoutState(), []);
  const [layoutPreset, setLayoutPresetState] = useState<LayoutPresetId>(
    () => initialState.preset ?? DEFAULT_LAYOUT_PRESET,
  );
  const [layoutJsonByPreset, setLayoutJsonByPreset] = useState<
    Record<LayoutPresetId, string>
  >(() => initialState.jsonByPreset);
  const layoutJsonText = layoutJsonByPreset[layoutPreset];

  const [layoutMap, setLayoutMap] = useState<LayoutMap>(() => {
    try {
      return parseLayoutJson(layoutJsonText);
    } catch {
      return staticaLayoutUnshifted;
    }
  });
  const [layoutJsonError, setLayoutJsonError] = useState<string | null>(null);

  const persistTimer = useRef<number | null>(null);

  const setLayoutPreset = (preset: LayoutPresetId) => {
    setLayoutPresetState(preset);
    const nextText = layoutJsonByPreset[preset] ?? getDefaultLayoutJsonForPreset(preset);
    try {
      const parsed = parseLayoutJson(nextText);
      setLayoutMap(parsed);
      setLayoutJsonError(null);
    } catch (err) {
      setLayoutJsonError(err instanceof Error ? err.message : "Invalid layout JSON.");
    }
  };

  const setLayoutJsonText = (text: string) => {
    setLayoutJsonByPreset((prev) => ({ ...prev, [layoutPreset]: text }));
    try {
      const parsed = parseLayoutJson(text);
      setLayoutMap(parsed);
      setLayoutJsonError(null);
    } catch (err) {
      setLayoutJsonError(err instanceof Error ? err.message : "Invalid layout JSON.");
    }
  };

  const resetLayoutJson = () => {
    setLayoutJsonText(getDefaultLayoutJsonForPreset(layoutPreset));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAYOUT_PRESET_LOCALSTORAGE_KEY, layoutPreset);
  }, [layoutPreset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(
        LAYOUT_JSON_LOCALSTORAGE_KEYS[layoutPreset],
        layoutJsonText,
      );
      window.localStorage.setItem(LOCALSTORAGE_KEY, layoutJsonText);
      persistTimer.current = null;
    }, 650);
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [layoutJsonText, layoutPreset]);

  const value = useMemo<LayoutContextValue>(
    () => ({
      layoutPreset,
      layoutJsonText,
      layoutMap,
      layoutJsonError,
      setLayoutPreset,
      setLayoutJsonText,
      resetLayoutJson,
    }),
    [layoutJsonError, layoutJsonText, layoutMap, layoutPreset],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutStore(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayoutStore must be used within LayoutProvider.");
  return ctx;
}
