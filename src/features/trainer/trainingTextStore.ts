export const TRAINING_TEXT_LOCALSTORAGE_KEY = "keyshape.trainingText.v1";
export const MAX_TRAINING_TEXT_LEN = 10000;

export const DEFAULT_TRAINING_TEXT =
  "и в и в и в и в в и в и в и в и не на не на не на на не на не на не и не и не и не не и не и не и в не в не в не не в не в не в";

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
