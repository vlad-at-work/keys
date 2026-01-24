import { useEffect, useMemo, useRef, useState } from "react";

import { buildTokensFromText, type Token } from "./text";
import type { InputEvent } from "./useSession";

export type FreeTypingState = {
  text: string;
  tokens: readonly Token[];
  cursor: number;
  reset: () => void;
};

function pushCharWithWindowLimit(text: string, ch: string, windowSize: number) {
  const normalized = /\s/.test(ch) ? " " : ch;
  if (text.length >= windowSize) return normalized;
  return text + normalized;
}

function dropLastCodepoint(text: string): string {
  const chars = Array.from(text);
  chars.pop();
  return chars.join("");
}

function dropWord(text: string): string {
  let out = text;
  while (out.length > 0 && /\s/.test(out[out.length - 1]!)) out = out.slice(0, -1);
  while (out.length > 0 && !/\s/.test(out[out.length - 1]!)) out = out.slice(0, -1);
  return out;
}

export function useFreeTyping({
  input,
  enabled,
  windowSize = 80,
}: {
  input: InputEvent;
  enabled: boolean;
  windowSize?: number;
}): FreeTypingState {
  const [text, setText] = useState("");
  const lastProcessedSeq = useRef(0);
  const wasEnabled = useRef(false);

  useEffect(() => {
    if (!enabled) {
      wasEnabled.current = false;
      lastProcessedSeq.current = input.seq;
      return;
    }
    if (!wasEnabled.current) {
      wasEnabled.current = true;
      lastProcessedSeq.current = input.seq;
      setText("");
    }
  }, [enabled, input.seq]);

  useEffect(() => {
    if (!enabled) return;
    if (input.seq === 0) return;
    if (input.seq === lastProcessedSeq.current) return;
    lastProcessedSeq.current = input.seq;

    if (input.keyId === "keyBackspace") {
      setText((prev) => {
        if (prev.length === 0) return prev;
        return input.altKey ? dropWord(prev) : dropLastCodepoint(prev);
      });
      return;
    }

    if (input.keyId === "keySpace") {
      setText((prev) => pushCharWithWindowLimit(prev, " ", windowSize));
      return;
    }

    const typed =
      (typeof input.mappedChar === "string" && input.mappedChar.length > 0
        ? input.mappedChar
        : input.rawChar) ?? null;
    if (!typed) return;

    const chars = Array.from(typed);
    setText((prev) => {
      let next = prev;
      for (const ch of chars) {
        next = pushCharWithWindowLimit(next, ch, windowSize);
      }
      return next;
    });
  }, [
    enabled,
    input.altKey,
    input.keyId,
    input.mappedChar,
    input.rawChar,
    input.seq,
    windowSize,
  ]);

  const tokens = useMemo(() => buildTokensFromText(text), [text]);
  const cursor = tokens.length;

  return useMemo(
    () => ({
      text,
      tokens,
      cursor,
      reset: () => setText(""),
    }),
    [cursor, text, tokens],
  );
}
