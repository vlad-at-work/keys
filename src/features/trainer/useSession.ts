import { useEffect, useMemo, useRef, useState } from "react";

import type { KeyId } from "./keys";
import type { Token } from "./text";

export type SessionState = {
  cursor: number;
  hasError: boolean;
  expectedChar: string;
  lastAttempt: null | {
    seq: number;
    kind: "char" | "space";
    correct: boolean;
  };
  lastBlockResult: null | {
    seq: number;
    attempted: number;
    correct: number;
    accuracy: number;
  };
};

export type InputEvent = {
  seq: number;
  keyId: KeyId | null;
  mappedChar: string | null;
  rawChar: string | null;
};

export function useSession(
  tokens: readonly Token[],
  input: InputEvent,
  mappedChars: ReadonlySet<string>,
): SessionState {
  const [cursor, setCursor] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [lastAttempt, setLastAttempt] =
    useState<SessionState["lastAttempt"]>(null);
  const [lastBlockResult, setLastBlockResult] =
    useState<SessionState["lastBlockResult"]>(null);
  const lastProcessedSeq = useRef(0);
  const blockAttempted = useRef(0);
  const blockCorrect = useRef(0);

  useEffect(() => {
    setCursor(0);
    setHasError(false);
    setLastAttempt(null);
    setLastBlockResult(null);
    lastProcessedSeq.current = 0;
    blockAttempted.current = 0;
    blockCorrect.current = 0;
  }, [tokens]);

  useEffect(() => {
    if (tokens.length === 0) return;
    if (input.seq === 0) return;
    if (input.seq === lastProcessedSeq.current) return;
    lastProcessedSeq.current = input.seq;

    if (input.keyId === "keyBackspace") {
      if (hasError) {
        setHasError(false);
        setLastAttempt(null);
        return;
      }

      setHasError(false);
      setCursor((prev) => Math.max(0, prev - 1));
      setLastAttempt(null);
      return;
    }

    const currentToken = tokens[cursor];
    const expected = currentToken?.expected ?? "";
    if (expected.length === 0) return;

    if (expected === " ") {
      blockAttempted.current += 1;
      const correct = input.keyId === "keySpace";
      if (correct) blockCorrect.current += 1;
      setHasError(!correct);
      setLastAttempt({
        seq: input.seq,
        kind: currentToken?.kind ?? "space",
        correct,
      });
      if (!correct) return;
      setCursor((prev) => {
        const next = prev + 1;
        if (next >= tokens.length) {
          const attempted = blockAttempted.current;
          const correctCount = blockCorrect.current;
          setLastBlockResult({
            seq: input.seq,
            attempted,
            correct: correctCount,
            accuracy: attempted > 0 ? correctCount / attempted : 0,
          });
          blockAttempted.current = 0;
          blockCorrect.current = 0;
          return 0;
        }
        return next;
      });
      return;
    }

    const useMapped = mappedChars.has(expected);
    const typed = useMapped ? input.mappedChar : input.rawChar;
    if (!typed) return;

    blockAttempted.current += 1;
    const normalizedTyped =
      !useMapped && /^[A-Za-z]$/.test(expected) ? typed.toLowerCase() : typed;
    const normalizedExpected =
      !useMapped && /^[A-Za-z]$/.test(expected)
        ? expected.toLowerCase()
        : expected;

    if (normalizedTyped === normalizedExpected) {
      setHasError(false);
      blockCorrect.current += 1;
      setLastAttempt({
        seq: input.seq,
        kind: currentToken?.kind ?? "char",
        correct: true,
      });
      setCursor((prev) => {
        const next = prev + 1;
        if (next >= tokens.length) {
          const attempted = blockAttempted.current;
          const correctCount = blockCorrect.current;
          setLastBlockResult({
            seq: input.seq,
            attempted,
            correct: correctCount,
            accuracy: attempted > 0 ? correctCount / attempted : 0,
          });
          blockAttempted.current = 0;
          blockCorrect.current = 0;
          return 0;
        }
        return next;
      });
      return;
    }

    setHasError(true);
    setLastAttempt({
      seq: input.seq,
      kind: currentToken?.kind ?? "char",
      correct: false,
    });
  }, [
    cursor,
    input.keyId,
    input.mappedChar,
    input.rawChar,
    input.seq,
    mappedChars,
    hasError,
    tokens,
  ]);

  const expectedChar = tokens[cursor]?.expected ?? "";

  return useMemo(
    () => ({
      cursor,
      hasError,
      expectedChar,
      lastAttempt,
      lastBlockResult,
    }),
    [cursor, expectedChar, hasError, lastAttempt, lastBlockResult],
  );
}
