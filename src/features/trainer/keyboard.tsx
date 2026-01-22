import { trainerGeometry, type Finger, type KeyDef } from "./geometry";
import type { KeyId, LayoutMap } from "./keys";

const fingerColorVar: Record<Finger, string> = {
  lp: "--chart-1",
  lr: "--chart-2",
  lm: "--chart-3",
  li: "--chart-4",
  ri: "--chart-4",
  rm: "--chart-3",
  rr: "--chart-2",
  rp: "--chart-1",
  thumb: "--destructive",
  mod: "--muted",
  spacer: "--background",
};

const fingerOverridesByLabel: Partial<Record<string, Finger>> = {
  // Statica finger zones (incl. "Angle Mod"):
  // ьи: left pinky
  // уеэ: left ring
  // аоы: left middle
  // жюкяпй: left index
  // гбмтдв: right index
  // рсч: right middle
  // лнш: right ring
  // хщфз.ц: right pinky
  //
  // Notes:
  // - "," is commonly hit with either index depending on context; both index
  //   fingers share the same color, so we mark it as index here.
  ь: "lp",
  и: "lp",

  у: "lr",
  е: "lr",
  э: "lr",

  а: "lm",
  о: "lm",
  ы: "lm",
  ъ: "lm",
  Ъ: "lm",

  ж: "li",
  ю: "li",
  к: "li",
  я: "li",
  п: "li",
  й: "li",
  ",": "li",

  г: "ri",
  б: "ri",
  м: "ri",
  т: "ri",
  д: "ri",
  в: "ri",

  р: "rm",
  с: "rm",
  ч: "rm",

  л: "rr",
  н: "rr",
  ш: "rr",

  х: "rp",
  щ: "rp",
  ф: "rp",
  з: "rp",
  ".": "rp",
  ц: "rp",
};

function mixed(colorVar: string, weight: number) {
  return `color-mix(in oklch, var(${colorVar}) ${weight}%, var(--background))`;
}

function keyBg(finger: Finger) {
  if (finger === "spacer") return "transparent";
  const varName = fingerColorVar[finger];
  if (finger === "mod") return mixed(varName, 42);
  if (finger === "thumb") return mixed(varName, 65);
  return mixed(varName, 65);
}

function keyText(finger: Finger) {
  if (finger === "thumb") return "var(--destructive-foreground)";
  if (finger === "mod")
    return "color-mix(in oklch, var(--muted-foreground) 85%, var(--foreground))";
  return "color-mix(in oklch, var(--foreground) 78%, var(--background))";
}

function Keycap({
  keyDef,
  layout,
  isActive,
}: {
  keyDef: KeyDef;
  layout: LayoutMap;
  isActive: boolean;
}) {
  const isSpacer = keyDef.finger === "spacer";
  const label = keyDef.fixedLabel ?? layout[keyDef.id] ?? "";
  const finger =
    keyDef.finger === "mod" || keyDef.finger === "spacer"
      ? keyDef.finger
      : (fingerOverridesByLabel[label] ?? keyDef.finger);

  return (
    <div
      className={[
        "flex h-12 select-none items-center justify-center rounded-md border shadow-sm",
        "border-border/30 font-mono leading-none",
        label.length > 1 ? "px-2 text-[12px]" : "text-[26px]",
        isSpacer ? "border-transparent" : "",
        isActive
          ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "",
      ].join(" ")}
      style={{
        gridColumn: `span ${keyDef.widthQ} / span ${keyDef.widthQ}`,
        backgroundColor: keyBg(finger),
        color: keyText(finger),
        opacity: isSpacer ? 0 : 1,
      }}
      aria-hidden={isSpacer ? true : undefined}
    >
      {label}
    </div>
  );
}

export function Keyboard({
  layout,
  activeKeyIds,
}: {
  layout: LayoutMap;
  activeKeyIds: ReadonlySet<KeyId>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-3xl border border-border/25 bg-muted/10 p-6 shadow-sm">
        <div className="grid gap-2">
          {trainerGeometry.map((row, idx) => {
            const totalQ = row.reduce((acc, key) => acc + key.widthQ, 0);
            return (
              <div
                key={idx}
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${totalQ}, minmax(0, 1fr))`,
                }}
              >
                {row.map((keyDef) => (
                  <Keycap
                    key={keyDef.id}
                    keyDef={keyDef}
                    layout={layout}
                    isActive={activeKeyIds.has(keyDef.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
