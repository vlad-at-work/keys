import { useEffect, useMemo, useRef } from "react";

import { Chunk } from "@/features/trainer/chunk";
import { Keyboard } from "@/features/trainer/keyboard";
import { MetricsBar } from "@/features/trainer/metrics";
import { useTypingMode } from "@/features/trainer/modeContext";
import type { Token } from "@/features/trainer/text";
import { buildTokensFromText } from "@/features/trainer/text";
import { useCurrentTracker } from "@/features/trainer/useCurrentTracker";
import { useFreeTyping } from "@/features/trainer/useFreeTyping";
import { useHighlightStore } from "@/features/trainer/highlightContext";
import { useSession } from "@/features/trainer/useSession";
import { useTypingEngine } from "@/features/trainer/useTypingEngine";
import { useLayoutStore } from "@/features/trainer/layouts/layoutContext";
import { useTrainingTextStore } from "@/features/trainer/trainingTextContext";

function buildMappedCharSet(
  layoutMap: Record<string, string>,
): ReadonlySet<string> {
  const set = new Set<string>();
  for (const value of Object.values(layoutMap)) {
    if (typeof value !== "string") continue;
    if (value.length === 1) set.add(value);
  }
  return set;
}

function addPageEndSpaces(tokens: readonly Token[]): Token[] {
  const WINDOW = 80;
  const out: Token[] = [];
  let idx = 0;

  const spaceToken: Token = { display: "·", expected: " ", kind: "space" };

  while (idx < tokens.length) {
    const remaining = tokens.length - idx;
    const take = Math.min(WINDOW, remaining);
    const slice = tokens.slice(idx, idx + take);

    if (slice.length < WINDOW) {
      out.push(...slice);
      const last = slice[slice.length - 1];
      if (last?.expected !== " ") out.push(spaceToken);
      break;
    }

    const last = slice[WINDOW - 1];
    if (last?.expected === " ") {
      out.push(...slice);
      idx += WINDOW;
      continue;
    }

    out.push(...tokens.slice(idx, idx + WINDOW - 1));
    out.push(spaceToken);
    idx += WINDOW - 1;
  }

  return out;
}

function getViewport<T>(tokens: readonly T[], cursor: number) {
  const WINDOW = 80;
  if (tokens.length === 0)
    return { viewTokens: [] as readonly T[], viewCursor: 0 };

  const start = Math.floor(cursor / WINDOW) * WINDOW;
  const end = Math.min(tokens.length, start + WINDOW);
  return { viewTokens: tokens.slice(start, end), viewCursor: cursor - start };
}

export function TrainerPage() {
  const { mode } = useTypingMode();
  const { layoutMap } = useLayoutStore();
  const { trainingText } = useTrainingTextStore();
  const { highlightMap } = useHighlightStore();
  const { activeKeyIds, input } = useTypingEngine(layoutMap);
  const ignorePracticeSeq = useRef<number | null>(null);
  const lastMode = useRef(mode);

  if (lastMode.current !== mode) {
    lastMode.current = mode;
    if (mode === "practice") {
      ignorePracticeSeq.current = input.seq;
    }
  }

  const tokens = useMemo(
    () => buildTokensFromText(trainingText),
    [trainingText],
  );
  const pagedTokens = useMemo(() => addPageEndSpaces(tokens), [tokens]);
  const mappedChars = useMemo(() => buildMappedCharSet(layoutMap), [layoutMap]);

  const sessionInput = useMemo(() => {
    if (mode !== "practice") {
      return {
        seq: 0,
        t: 0,
        altKey: false,
        keyId: null,
        mappedChar: null,
        rawChar: null,
      };
    }
    if (ignorePracticeSeq.current === input.seq) {
      return {
        seq: 0,
        t: 0,
        altKey: false,
        keyId: null,
        mappedChar: null,
        rawChar: null,
      };
    }
    return input;
  }, [
    input.altKey,
    input.keyId,
    input.mappedChar,
    input.rawChar,
    input.seq,
    input.t,
    mode,
  ]);

  useEffect(() => {
    if (mode !== "practice") return;
    const ignore = ignorePracticeSeq.current;
    if (ignore == null) return;
    if (input.seq !== ignore) ignorePracticeSeq.current = null;
  }, [input.seq, mode]);

  const session = useSession(pagedTokens, sessionInput, mappedChars);
  const metrics = useCurrentTracker(mode === "practice" ? session.lastAttempt : null);
  const viewport = useMemo(
    () => getViewport(pagedTokens, session.cursor),
    [pagedTokens, session.cursor],
  );
  const freeTyping = useFreeTyping({ input, enabled: mode === "free", windowSize: 80 });
  const lastPerfectSeq = useRef<number>(0);

  useEffect(() => {
    if (mode !== "practice") return;
    const result = session.lastBlockResult;
    if (!result) return;
    if (result.attempted === 0) return;
    if (result.accuracy !== 1) return;
    if (result.seq === lastPerfectSeq.current) return;
    lastPerfectSeq.current = result.seq;

    window.dispatchEvent(
      new CustomEvent("keyshape:perfect-block", {
        detail: { seq: result.seq },
      }),
    );
  }, [mode, session.lastBlockResult]);

  return (
    <div className="mx-auto w-full px-6 py-10">
      <div className="grid min-h-[calc(100vh-10rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-10">
        <div />

        <main className="flex min-h-0 items-center">
          {mode === "practice" ? (
            <Chunk
              tokens={viewport.viewTokens}
              cursor={viewport.viewCursor}
              hasError={session.hasError}
            />
          ) : (
            <Chunk tokens={freeTyping.tokens} cursor={freeTyping.cursor} hasError={false} />
          )}
        </main>

        <footer className="pb-2">
          <Keyboard
            layout={layoutMap}
            highlightMap={highlightMap}
            activeKeyIds={activeKeyIds}
          />
          {mode === "practice" ? (
            <div className="mt-4">
              <MetricsBar wpm={metrics.wpm} accuracy={metrics.accuracy} />
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
