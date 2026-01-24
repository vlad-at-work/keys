import React, { createContext, useContext, useMemo, useState } from "react";

export type TypingMode = "practice" | "free";

type TypingModeContextValue = {
  mode: TypingMode;
  setMode: (mode: TypingMode) => void;
};

const TypingModeContext = createContext<TypingModeContextValue | null>(null);

export function TypingModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TypingMode>("practice");

  const value = useMemo<TypingModeContextValue>(
    () => ({ mode, setMode }),
    [mode],
  );

  return (
    <TypingModeContext.Provider value={value}>
      {children}
    </TypingModeContext.Provider>
  );
}

export function useTypingMode(): TypingModeContextValue {
  const ctx = useContext(TypingModeContext);
  if (!ctx) throw new Error("useTypingMode must be used within TypingModeProvider.");
  return ctx;
}
