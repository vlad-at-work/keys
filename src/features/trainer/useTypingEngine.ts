import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { KeyId, LayoutLayers } from "./keys";
import { keyIdFromEventCode } from "./keys";

type TypingEngineState = {
  lastChar: string;
  activeKeyIds: ReadonlySet<KeyId>;
  shiftHeld: boolean;
  input: {
    seq: number;
    t: number;
    altKey: boolean;
    keyId: KeyId | null;
    mappedChar: string | null;
    rawChar: string | null;
  };
};

export function useTypingEngine(layout: LayoutLayers): TypingEngineState {
  const [lastChar, setLastChar] = useState("");
  const [activeKeyIds, setActiveKeyIds] = useState<Set<KeyId>>(() => new Set());
  const [shiftHeld, setShiftHeld] = useState(false);
  const [seq, setSeq] = useState(0);
  const [lastInputT, setLastInputT] = useState(0);
  const [lastInputAltKey, setLastInputAltKey] = useState(false);
  const [lastMappedChar, setLastMappedChar] = useState<string | null>(null);
  const [lastRawChar, setLastRawChar] = useState<string | null>(null);
  const [lastInputKeyId, setLastInputKeyId] = useState<KeyId | null>(null);
  const timeoutsByKey = useRef<Map<KeyId, number>>(new Map());
  const shiftDown = useRef({ left: false, right: false });

  const flashKey = useCallback((keyId: KeyId) => {
    setActiveKeyIds((prev) => {
      const next = new Set(prev);
      next.add(keyId);
      return next;
    });

    const existing = timeoutsByKey.current.get(keyId);
    if (existing) window.clearTimeout(existing);

    const timeoutId = window.setTimeout(() => {
      setActiveKeyIds((prev) => {
        const next = new Set(prev);
        next.delete(keyId);
        return next;
      });
      timeoutsByKey.current.delete(keyId);
    }, 140);

    timeoutsByKey.current.set(keyId, timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of timeoutsByKey.current.values()) {
        window.clearTimeout(timeoutId);
      }
      timeoutsByKey.current.clear();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;
      if (isEditable) return;

      // Allow common browser/app shortcuts (Cmd+L, Cmd+R, Cmd+J, etc).
      if (event.metaKey || event.ctrlKey) {
        return;
      }

      const keyId = keyIdFromEventCode(event.code);
      if (!keyId) return;

      const t = performance.now();
      const altKey = event.altKey === true;
      if (keyId === "keyLshift") shiftDown.current.left = true;
      if (keyId === "keyRshift") shiftDown.current.right = true;
      if (event.shiftKey) setShiftHeld(true);

      if (
        keyId === "keyTab" ||
        keyId === "keySpace" ||
        keyId === "keyBackspace"
      ) {
        event.preventDefault();
        event.stopPropagation();
      }

      flashKey(keyId);

      const activeLayer = event.shiftKey ? layout.shifted : layout.unshifted;
      const mapped = activeLayer[keyId];
      const raw =
        typeof event.key === "string" && event.key.length === 1
          ? event.key
          : null;

      setLastInputT(t);
      setLastInputAltKey(altKey);
      setLastInputKeyId(keyId);
      if (typeof mapped === "string" && mapped.length > 0) {
        setLastChar(mapped);
        setLastMappedChar(mapped);
        setLastRawChar(raw);
        setSeq((s) => s + 1);
      } else {
        setLastMappedChar(null);
        setLastRawChar(raw);
        setSeq((s) => s + 1);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const keyId = keyIdFromEventCode(event.code);
      if (keyId === "keyLshift") shiftDown.current.left = false;
      if (keyId === "keyRshift") shiftDown.current.right = false;
      if (keyId === "keyLshift" || keyId === "keyRshift") {
        setShiftHeld(shiftDown.current.left || shiftDown.current.right);
      } else if (!event.shiftKey) {
        setShiftHeld(false);
        shiftDown.current.left = false;
        shiftDown.current.right = false;
      }
    };

    const onBlur = () => {
      setShiftHeld(false);
      shiftDown.current.left = false;
      shiftDown.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [flashKey, layout]);

  return useMemo(
    () => ({
      lastChar,
      activeKeyIds,
      shiftHeld,
      input: {
        seq,
        t: lastInputT,
        altKey: lastInputAltKey,
        keyId: lastInputKeyId,
        mappedChar: lastMappedChar,
        rawChar: lastRawChar,
      },
    }),
    [
      activeKeyIds,
      lastChar,
      lastInputT,
      lastInputAltKey,
      lastMappedChar,
      lastInputKeyId,
      lastRawChar,
      seq,
      shiftHeld,
    ],
  );
}
