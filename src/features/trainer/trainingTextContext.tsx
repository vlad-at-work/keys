import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_TRAINING_TEXT, getInitialTrainingText, normalizeTrainingText, TRAINING_TEXT_LOCALSTORAGE_KEY } from "./trainingTextStore";

type TrainingTextContextValue = {
  trainingText: string;
  trainingTextRaw: string;
  setTrainingTextRaw: (text: string) => void;
  resetTrainingText: () => void;
};

const TrainingTextContext = createContext<TrainingTextContextValue | null>(null);

export function TrainingTextProvider({ children }: { children: React.ReactNode }) {
  const [trainingTextRaw, setTrainingTextRawState] = useState(() => getInitialTrainingText());
  const [trainingText, setTrainingText] = useState(() => normalizeTrainingText(trainingTextRaw));
  const persistTimer = useRef<number | null>(null);

  const setTrainingTextRaw = (text: string) => {
    setTrainingTextRawState(text);
    setTrainingText(normalizeTrainingText(text));
  };

  const resetTrainingText = () => {
    setTrainingTextRaw(DEFAULT_TRAINING_TEXT);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(TRAINING_TEXT_LOCALSTORAGE_KEY, trainingTextRaw);
      persistTimer.current = null;
    }, 650);
    return () => {
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
    };
  }, [trainingTextRaw]);

  const value = useMemo<TrainingTextContextValue>(
    () => ({
      trainingText,
      trainingTextRaw,
      setTrainingTextRaw,
      resetTrainingText,
    }),
    [trainingText, trainingTextRaw],
  );

  return <TrainingTextContext.Provider value={value}>{children}</TrainingTextContext.Provider>;
}

export function useTrainingTextStore(): TrainingTextContextValue {
  const ctx = useContext(TrainingTextContext);
  if (!ctx) throw new Error("useTrainingTextStore must be used within TrainingTextProvider.");
  return ctx;
}
