export function MetricsBar({
  wpm,
  accuracy,
}: {
  wpm: number;
  accuracy: number;
}) {
  return (
    <div className="mx-auto flex h-6 w-full max-w-5xl items-center justify-center gap-6 text-xs leading-none text-muted-foreground">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">Speed:</span>
        <span className="font-mono text-foreground/80 tabular-nums transition-colors duration-300 ease-out">
          {wpm.toFixed(1)} wpm
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-medium">Accuracy:</span>
        <span className="font-mono text-foreground/80 tabular-nums transition-colors duration-300 ease-out">
          {accuracy.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
