import { trainerGeometry, type Finger } from "./geometry";
import { ALL_KEY_IDS, type KeyId } from "./keys";

export const HIGHLIGHT_LOCALSTORAGE_KEY = "keyshape.highlightJson.v1";
export const HIGHLIGHT_PRESET_LOCALSTORAGE_KEY = "keyshape.highlightPreset.v1";

export type HighlightPresetId = "angle" | "normal";

export const HIGHLIGHT_JSON_LOCALSTORAGE_KEYS: Record<HighlightPresetId, string> =
  {
    angle: "keyshape.highlightJson.angle.v1",
    normal: "keyshape.highlightJson.normal.v1",
  };

export const DEFAULT_HIGHLIGHT_PRESET: HighlightPresetId = "angle";

export type HighlightFinger =
  | "lp"
  | "lr"
  | "lm"
  | "li"
  | "ri"
  | "rm"
  | "rr"
  | "rp";

export type HighlightMap = Partial<Record<KeyId, HighlightFinger>>;

const keyIdSet = new Set<string>(ALL_KEY_IDS as readonly string[]);
const fingerSet = new Set<string>([
  "lp",
  "lr",
  "lm",
  "li",
  "ri",
  "rm",
  "rr",
  "rp",
]);

function findDuplicateTopLevelKeys(text: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  let depth = 0;
  let expectingKey = false;

  const readJsonString = (startIdx: number) => {
    let i = startIdx + 1;
    let isEscaped = false;
    while (i < text.length) {
      const ch = text[i];
      if (isEscaped) {
        isEscaped = false;
        i += 1;
        continue;
      }
      if (ch === "\\") {
        isEscaped = true;
        i += 1;
        continue;
      }
      if (ch === '"') {
        return { raw: text.slice(startIdx, i + 1), endIdx: i + 1 };
      }
      i += 1;
    }
    return null;
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (ch === '"') {
      const result = readJsonString(i);
      if (!result) return [];

      if (depth === 1 && expectingKey) {
        let j = result.endIdx;
        while (j < text.length && /\s/.test(text[j]!)) j += 1;
        if (text[j] === ":") {
          try {
            const key = JSON.parse(result.raw) as string;
            if (seen.has(key)) duplicates.add(key);
            else seen.add(key);
          } catch {
            return [];
          }
          expectingKey = false;
        }
      }

      i = result.endIdx;
      continue;
    }

    if (ch === "{") {
      depth += 1;
      if (depth === 1) expectingKey = true;
      i += 1;
      continue;
    }
    if (ch === "}") {
      if (depth === 1) expectingKey = false;
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    if (ch === "," && depth === 1) {
      expectingKey = true;
      i += 1;
      continue;
    }

    i += 1;
  }

  return [...duplicates];
}

export function validateKeyId(key: string): key is KeyId {
  return keyIdSet.has(key);
}

export function validateHighlightFinger(
  finger: string,
): finger is HighlightFinger {
  return fingerSet.has(finger);
}

function buildNormalHighlightMap(): HighlightMap {
  const map: HighlightMap = {};
  for (const row of trainerGeometry) {
    for (const keyDef of row) {
      const finger = keyDef.finger;
      if (finger === "mod" || finger === "spacer" || finger === "thumb") continue;
      map[keyDef.id] = finger;
    }
  }
  return map;
}

export const NORMAL_HIGHLIGHT_MAP: HighlightMap = buildNormalHighlightMap();

export const ANGLE_HIGHLIGHT_MAP: HighlightMap = (() => {
  const map: HighlightMap = { ...NORMAL_HIGHLIGHT_MAP };

  // Angle mod zones: shift left bottom row "inward" by one.
  map.keyZ = "lr";
  map.keyX = "lm";
  map.keyC = "li";

  // "Backslash" (key by return) is treated like right ring finger.
  map.keyBackslash = "rr";

  return map;
})();

export const NORMAL_HIGHLIGHT_JSON = JSON.stringify(NORMAL_HIGHLIGHT_MAP, null, 2);
export const ANGLE_HIGHLIGHT_JSON = JSON.stringify(ANGLE_HIGHLIGHT_MAP, null, 2);

export const DEFAULT_HIGHLIGHT_JSON = ANGLE_HIGHLIGHT_JSON;

export function getDefaultHighlightJsonForPreset(
  preset: HighlightPresetId,
): string {
  return preset === "normal" ? NORMAL_HIGHLIGHT_JSON : ANGLE_HIGHLIGHT_JSON;
}

export function getInitialHighlightJson(): string {
  if (typeof window === "undefined") return DEFAULT_HIGHLIGHT_JSON;
  const stored = window.localStorage.getItem(HIGHLIGHT_LOCALSTORAGE_KEY);
  return stored ?? DEFAULT_HIGHLIGHT_JSON;
}

function countHighlightDiffKeys(a: HighlightMap, b: HighlightMap): number {
  let count = 0;
  for (const keyId of ALL_KEY_IDS) {
    const av = a[keyId] ?? null;
    const bv = b[keyId] ?? null;
    if (av !== bv) count += 1;
  }
  return count;
}

function parseHighlightJsonSafe(text: string): HighlightMap | null {
  try {
    return parseHighlightJson(text);
  } catch {
    return null;
  }
}

function validateHighlightPresetId(text: string): text is HighlightPresetId {
  return text === "angle" || text === "normal";
}

export function getInitialHighlightState(): {
  preset: HighlightPresetId;
  jsonByPreset: Record<HighlightPresetId, string>;
} {
  const defaults: Record<HighlightPresetId, string> = {
    angle: ANGLE_HIGHLIGHT_JSON,
    normal: NORMAL_HIGHLIGHT_JSON,
  };

  if (typeof window === "undefined") {
    return { preset: DEFAULT_HIGHLIGHT_PRESET, jsonByPreset: defaults };
  }

  const jsonByPreset: Record<HighlightPresetId, string> = {
    angle:
      window.localStorage.getItem(HIGHLIGHT_JSON_LOCALSTORAGE_KEYS.angle) ??
      ANGLE_HIGHLIGHT_JSON,
    normal:
      window.localStorage.getItem(HIGHLIGHT_JSON_LOCALSTORAGE_KEYS.normal) ??
      NORMAL_HIGHLIGHT_JSON,
  };

  const storedPreset = window.localStorage.getItem(
    HIGHLIGHT_PRESET_LOCALSTORAGE_KEY,
  );
  if (storedPreset && validateHighlightPresetId(storedPreset)) {
    return { preset: storedPreset, jsonByPreset };
  }

  const legacyJson = window.localStorage.getItem(HIGHLIGHT_LOCALSTORAGE_KEY);
  if (!legacyJson) {
    return { preset: DEFAULT_HIGHLIGHT_PRESET, jsonByPreset };
  }

  if (legacyJson === ANGLE_HIGHLIGHT_JSON) {
    return { preset: "angle", jsonByPreset: { ...jsonByPreset, angle: legacyJson } };
  }
  if (legacyJson === NORMAL_HIGHLIGHT_JSON) {
    return { preset: "normal", jsonByPreset: { ...jsonByPreset, normal: legacyJson } };
  }

  const legacyMap = parseHighlightJsonSafe(legacyJson);
  const angleMap = parseHighlightJsonSafe(ANGLE_HIGHLIGHT_JSON);
  const normalMap = parseHighlightJsonSafe(NORMAL_HIGHLIGHT_JSON);
  if (!legacyMap || !angleMap || !normalMap) {
    return { preset: DEFAULT_HIGHLIGHT_PRESET, jsonByPreset: { ...jsonByPreset, angle: legacyJson } };
  }

  const angleDiff = countHighlightDiffKeys(legacyMap, angleMap);
  const normalDiff = countHighlightDiffKeys(legacyMap, normalMap);
  const preset = normalDiff < angleDiff ? "normal" : "angle";
  return { preset, jsonByPreset: { ...jsonByPreset, [preset]: legacyJson } };
}

export function parseHighlightJson(text: string): HighlightMap {
  const duplicates = findDuplicateTopLevelKeys(text);
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate key ids are not allowed: ${duplicates
        .sort()
        .map((d) => JSON.stringify(d))
        .join(", ")}.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to parse JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Highlight JSON must be an object mapping KeyId -> finger.");
  }

  const map: HighlightMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!validateKeyId(key)) {
      throw new Error(`Unknown key id: "${key}".`);
    }
    if (typeof value !== "string") {
      throw new Error(`Value for "${key}" must be a string.`);
    }
    if (!validateHighlightFinger(value)) {
      throw new Error(
        `Value for "${key}" must be one of: ${[...fingerSet]
          .sort()
          .map((f) => JSON.stringify(f))
          .join(", ")}.`,
      );
    }
    map[key] = value;
  }

  return map;
}

export function getHighlightedFinger(
  base: Finger,
  keyId: KeyId,
  highlightMap: HighlightMap,
): Finger {
  if (base === "spacer") return base;
  const override = highlightMap[keyId];
  return (override ?? base) as Finger;
}
