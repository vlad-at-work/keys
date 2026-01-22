export type AttemptEvent = {
  t: number
  correct: boolean
  counted: boolean
}

export type TrackerSnapshot = {
  windowMs: number
  correct: number
  attempted: number
  accuracy: number
  wpm: number
}

export class CurrentTracker {
  private readonly windowMs: number
  private readonly attempts: AttemptEvent[] = []

  constructor(windowMs = 15_000) {
    this.windowMs = windowMs
  }

  push(event: AttemptEvent) {
    this.attempts.push(event)
    this.prune(event.t)
  }

  snapshot(now: number): TrackerSnapshot {
    this.prune(now)
    let correct = 0
    let attempted = 0
    let oldestCountedT: number | null = null

    for (const attempt of this.attempts) {
      if (!attempt.counted) continue
      attempted += 1
      if (attempt.correct) correct += 1
      if (oldestCountedT === null) oldestCountedT = attempt.t
    }

    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 100
    const spanMs =
      oldestCountedT === null
        ? 0
        : Math.min(this.windowMs, Math.max(0, now - oldestCountedT))
    const minutes = spanMs / 60_000
    const words = correct / 5
    const wpm = minutes > 0 ? words / minutes : 0

    return {
      windowMs: this.windowMs,
      correct,
      attempted,
      accuracy,
      wpm,
    }
  }

  private prune(now: number) {
    const cutoff = now - this.windowMs
    while (this.attempts.length > 0 && this.attempts[0]!.t < cutoff) {
      this.attempts.shift()
    }
  }
}
