import { useEffect, useMemo, useRef, useState } from "react"

import { CurrentTracker } from "./currentTracker"

type Attempt = null | {
  seq: number
  t: number
  kind: "char" | "space"
  correct: boolean
}

type Metrics = {
  wpm: number
  accuracy: number
}

const SNAPSHOT_INTERVAL_MS = 1000

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function useCurrentTracker(attempt: Attempt): Metrics {
  const tracker = useMemo(() => new CurrentTracker(15_000), [])
  const lastSeq = useRef(0)

  const [target, setTarget] = useState<Metrics>({ wpm: 0, accuracy: 100 })
  const [display, setDisplay] = useState<Metrics>({ wpm: 0, accuracy: 100 })

  useEffect(() => {
    if (!attempt) return
    if (attempt.seq === lastSeq.current) return
    lastSeq.current = attempt.seq

    tracker.push({
      t: attempt.t,
      correct: attempt.correct,
      counted: true,
    })
  }, [attempt, tracker])

  useEffect(() => {
    if (typeof window === "undefined") return
    const intervalId = window.setInterval(() => {
      const snap = tracker.snapshot(performance.now())
      setTarget({
        wpm: snap.wpm,
        accuracy: snap.accuracy,
      })
    }, SNAPSHOT_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [tracker])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      setDisplay((prev) => {
        const wpm = prev.wpm + (target.wpm - prev.wpm) * 0.12
        const accuracy =
          prev.accuracy + (target.accuracy - prev.accuracy) * 0.12

        const done =
          Math.abs(target.wpm - wpm) < 0.05 && Math.abs(target.accuracy - accuracy) < 0.05

        if (!done) raf = requestAnimationFrame(tick)

        return {
          wpm: clamp(wpm, 0, 999),
          accuracy: clamp(accuracy, 0, 100),
        }
      })
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return display
}
