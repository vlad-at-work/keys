import type { Token } from "./text";

export function Chunk({
  tokens,
  cursor,
  hasError,
}: {
  tokens: readonly Token[];
  cursor: number;
  hasError: boolean;
}) {
  const showEndCaret = cursor === tokens.length && !hasError;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="font-mono text-4xl leading-tight tracking-wide text-muted-foreground sm:text-5xl">
        {tokens.map((token, idx) => {
          const isCursor = idx === cursor;
          const showCaret = isCursor && !hasError;
          const cursorColor = showCaret ? "after:bg-primary/60" : "";
          const cursorText = hasError ? "text-destructive" : "text-foreground";
          const cursorEmphasis =
            isCursor && hasError
              ? "font-semibold"
              : isCursor
                ? "font-semibold origin-bottom transform-gpu -translate-y-[1px] scale-y-[1.08] transition-[transform,color] duration-150 ease-out"
                : "";
          const spaceStyle =
            token.kind === "space" && !isCursor
              ? "text-muted-foreground/25 text-[0.85em]"
              : "";

          return (
            <span
              key={idx}
              className={[
                "relative inline-block",
                spaceStyle,
                isCursor ? cursorText : "",
                isCursor ? cursorColor : "",
                cursorEmphasis,
                showCaret
                  ? "after:absolute after:-left-1 after:bottom-1 after:h-7 after:w-[2px] after:content-['']"
                  : "",
              ].join(" ")}
            >
              {token.display}
              <wbr />
            </span>
          );
        })}
        {showEndCaret ? (
          <span
            className={[
              "relative inline-block",
              "after:absolute after:-left-1 after:bottom-1 after:h-7 after:w-[2px] after:bg-primary/60 after:content-['']",
            ].join(" ")}
          >
            <wbr />
          </span>
        ) : null}
      </div>
    </div>
  );
}
