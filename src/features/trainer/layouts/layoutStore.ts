import { ALL_KEY_IDS, type KeyId, type LayoutMap } from "../keys";
import { graphiteLayoutUnshifted } from "./graphite";
import { staticaLayoutUnshifted } from "./statica";

export const LOCALSTORAGE_KEY = "keyshape.layoutJson.v1";
export const LAYOUT_PRESET_LOCALSTORAGE_KEY = "keyshape.layoutPreset.v1";

export type LayoutPresetId = "statica" | "graphite";

export const LAYOUT_JSON_LOCALSTORAGE_KEYS: Record<LayoutPresetId, string> = {
  statica: "keyshape.layoutJson.statica.v1",
  graphite: "keyshape.layoutJson.graphite.v1",
};

export const DEFAULT_LAYOUT_PRESET: LayoutPresetId = "statica";

const keyIdSet = new Set<string>(ALL_KEY_IDS as readonly string[]);

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

export const DEFAULT_LAYOUT_JSON = JSON.stringify(
  staticaLayoutUnshifted,
  null,
  2,
);

export const GRAPHITE_LAYOUT_JSON = JSON.stringify(
  graphiteLayoutUnshifted,
  null,
  2,
);

export function getDefaultLayoutJsonForPreset(preset: LayoutPresetId): string {
  return preset === "graphite" ? GRAPHITE_LAYOUT_JSON : DEFAULT_LAYOUT_JSON;
}

export function getInitialLayoutJson(): string {
  if (typeof window === "undefined") return DEFAULT_LAYOUT_JSON;
  const stored = window.localStorage.getItem(LOCALSTORAGE_KEY);
  return stored ?? DEFAULT_LAYOUT_JSON;
}

function countLayoutDiffKeys(a: LayoutMap, b: LayoutMap): number {
  let count = 0;
  for (const keyId of ALL_KEY_IDS) {
    const av = a[keyId] ?? null;
    const bv = b[keyId] ?? null;
    if (av !== bv) count += 1;
  }
  return count;
}

function parseLayoutJsonSafe(text: string): LayoutMap | null {
  try {
    return parseLayoutJson(text);
  } catch {
    return null;
  }
}

function validateLayoutPresetId(text: string): text is LayoutPresetId {
  return text === "statica" || text === "graphite";
}

export function getInitialLayoutState(): {
  preset: LayoutPresetId;
  jsonByPreset: Record<LayoutPresetId, string>;
} {
  const defaults: Record<LayoutPresetId, string> = {
    statica: DEFAULT_LAYOUT_JSON,
    graphite: GRAPHITE_LAYOUT_JSON,
  };

  if (typeof window === "undefined") {
    return { preset: DEFAULT_LAYOUT_PRESET, jsonByPreset: defaults };
  }

  const jsonByPreset: Record<LayoutPresetId, string> = {
    statica:
      window.localStorage.getItem(LAYOUT_JSON_LOCALSTORAGE_KEYS.statica) ??
      DEFAULT_LAYOUT_JSON,
    graphite:
      window.localStorage.getItem(LAYOUT_JSON_LOCALSTORAGE_KEYS.graphite) ??
      GRAPHITE_LAYOUT_JSON,
  };

  const storedPreset = window.localStorage.getItem(
    LAYOUT_PRESET_LOCALSTORAGE_KEY,
  );
  if (storedPreset && validateLayoutPresetId(storedPreset)) {
    return { preset: storedPreset, jsonByPreset };
  }

  const legacyJson = window.localStorage.getItem(LOCALSTORAGE_KEY);
  if (!legacyJson) {
    return { preset: DEFAULT_LAYOUT_PRESET, jsonByPreset };
  }

  if (legacyJson === DEFAULT_LAYOUT_JSON) {
    return { preset: "statica", jsonByPreset: { ...jsonByPreset, statica: legacyJson } };
  }
  if (legacyJson === GRAPHITE_LAYOUT_JSON) {
    return { preset: "graphite", jsonByPreset: { ...jsonByPreset, graphite: legacyJson } };
  }

  const legacyMap = parseLayoutJsonSafe(legacyJson);
  const staticaMap = parseLayoutJsonSafe(DEFAULT_LAYOUT_JSON);
  const graphiteMap = parseLayoutJsonSafe(GRAPHITE_LAYOUT_JSON);
  if (!legacyMap || !staticaMap || !graphiteMap) {
    return { preset: DEFAULT_LAYOUT_PRESET, jsonByPreset: { ...jsonByPreset, statica: legacyJson } };
  }

  const staticaDiff = countLayoutDiffKeys(legacyMap, staticaMap);
  const graphiteDiff = countLayoutDiffKeys(legacyMap, graphiteMap);
  const preset = graphiteDiff < staticaDiff ? "graphite" : "statica";
  return { preset, jsonByPreset: { ...jsonByPreset, [preset]: legacyJson } };
}

export function parseLayoutJson(text: string): LayoutMap {
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
    throw new Error(
      err instanceof Error ? err.message : "Failed to parse JSON.",
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Layout JSON must be an object mapping KeyId -> string.");
  }

  const map: LayoutMap = {};
  for (const [key, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (!validateKeyId(key)) {
      throw new Error(`Unknown key id: "${key}".`);
    }
    if (typeof value !== "string") {
      throw new Error(`Value for "${key}" must be a string.`);
    }
    map[key] = value;
  }

  return { ...staticaLayoutUnshifted, ...map };
}
