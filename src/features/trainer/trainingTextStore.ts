export const TRAINING_TEXT_LOCALSTORAGE_KEY = "keyshape.trainingText.v1";
export const MAX_TRAINING_TEXT_LEN = 10000;

export const DEFAULT_TRAINING_TEXT =
  "в это не это а то не это в это не то а это не в это";

export function normalizeTrainingText(raw: string): string {
  const capped = raw.slice(0, MAX_TRAINING_TEXT_LEN);
  const collapsedWhitespace = capped.replace(/\s+/g, " ").trim();
  return collapsedWhitespace.length > 0
    ? collapsedWhitespace
    : DEFAULT_TRAINING_TEXT;
}

export function getInitialTrainingText(): string {
  if (typeof window === "undefined") return DEFAULT_TRAINING_TEXT;
  const stored = window.localStorage.getItem(TRAINING_TEXT_LOCALSTORAGE_KEY);
  return normalizeTrainingText(stored ?? DEFAULT_TRAINING_TEXT);
}
