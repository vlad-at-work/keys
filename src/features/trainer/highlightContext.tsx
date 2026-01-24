import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  HIGHLIGHT_LOCALSTORAGE_KEY,
  HIGHLIGHT_JSON_LOCALSTORAGE_KEYS,
  HIGHLIGHT_PRESET_LOCALSTORAGE_KEY,
  DEFAULT_HIGHLIGHT_PRESET,
  getDefaultHighlightJsonForPreset,
  getInitialHighlightState,
  parseHighlightJson,
  type HighlightMap,
  type HighlightPresetId,
} from "./highlightStore";

type HighlightContextValue = {
  highlightPreset: HighlightPresetId;
  highlightJsonText: string;
  highlightMap: HighlightMap;
  highlightJsonError: string | null;
  setHighlightPreset: (preset: HighlightPresetId) => void;
  setHighlightJsonText: (text: string) => void;
  resetHighlightJson: () => void;
};

const HighlightContext = createContext<HighlightContextValue | null>(null);

export function HighlightProvider({ children }: { children: React.ReactNode }) {
  const initialState = useMemo(() => getInitialHighlightState(), []);
  const [highlightPreset, setHighlightPresetState] =
    useState<HighlightPresetId>(() => initialState.preset ?? DEFAULT_HIGHLIGHT_PRESET);
  const [highlightJsonByPreset, setHighlightJsonByPreset] = useState<
    Record<HighlightPresetId, string>
  >(() => initialState.jsonByPreset);
  const highlightJsonText = highlightJsonByPreset[highlightPreset];

  const [highlightMap, setHighlightMap] = useState<HighlightMap>(() => {
    try {
      return parseHighlightJson(highlightJsonText);
    } catch {
      return {};
    }
  });
  const [highlightJsonError, setHighlightJsonError] = useState<string | null>(
    null,
  );

  const persistTimer = useRef<number | null>(null);

  const setHighlightPreset = (preset: HighlightPresetId) => {
    setHighlightPresetState(preset);
    const nextText =
      highlightJsonByPreset[preset] ?? getDefaultHighlightJsonForPreset(preset);
    try {
      const parsed = parseHighlightJson(nextText);
      setHighlightMap(parsed);
      setHighlightJsonError(null);
    } catch (err) {
      setHighlightJsonError(
        err instanceof Error ? err.message : "Invalid highlight JSON.",
      );
    }
  };

  const setHighlightJsonText = (text: string) => {
    setHighlightJsonByPreset((prev) => ({ ...prev, [highlightPreset]: text }));
    try {
      const parsed = parseHighlightJson(text);
      setHighlightMap(parsed);
      setHighlightJsonError(null);
    } catch (err) {
      setHighlightJsonError(
        err instanceof Error ? err.message : "Invalid highlight JSON.",
      );
    }
  };

  const resetHighlightJson = () => {
    setHighlightJsonText(getDefaultHighlightJsonForPreset(highlightPreset));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HIGHLIGHT_PRESET_LOCALSTORAGE_KEY, highlightPreset);
  }, [highlightPreset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(
        HIGHLIGHT_JSON_LOCALSTORAGE_KEYS[highlightPreset],
        highlightJsonText,
      );
      window.localStorage.setItem(HIGHLIGHT_LOCALSTORAGE_KEY, highlightJsonText);
      persistTimer.current = null;
    }, 650);
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [highlightJsonText, highlightPreset]);

  const value = useMemo<HighlightContextValue>(
    () => ({
      highlightPreset,
      highlightJsonText,
      highlightMap,
      highlightJsonError,
      setHighlightPreset,
      setHighlightJsonText,
      resetHighlightJson,
    }),
    [highlightJsonError, highlightJsonText, highlightMap, highlightPreset],
  );

  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlightStore(): HighlightContextValue {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error("useHighlightStore must be used within HighlightProvider.");
  return ctx;
}
