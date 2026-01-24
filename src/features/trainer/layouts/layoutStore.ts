import { ALL_KEY_IDS, type KeyId, type LayoutLayers, type LayoutMap } from "../keys";
import { graphiteLayoutShiftedOverrides, graphiteLayoutUnshifted } from "./graphite";
import { staticaLayoutShiftedOverrides, staticaLayoutUnshifted } from "./statica";

export const LOCALSTORAGE_KEY = "keyshape.layoutJson.v1";
export const LAYOUT_PRESET_LOCALSTORAGE_KEY = "keyshape.layoutPreset.v1";

export type LayoutPresetId = "statica" | "graphite";

export const LAYOUT_JSON_LOCALSTORAGE_KEYS: Record<LayoutPresetId, string> = {
  statica: "keyshape.layoutJson.statica.v1",
  graphite: "keyshape.layoutJson.graphite.v1",
};

export const DEFAULT_LAYOUT_PRESET: LayoutPresetId = "statica";

const keyIdSet = new Set<string>(ALL_KEY_IDS as readonly string[]);

const DEFAULT_SHIFTED_CHAR_MAP: Record<string, string> = {
  "`": "~",
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
  "-": "_",
  "=": "+",
  "[": "{",
  "]": "}",
  "\\": "|",
  ";": ":",
  "'": '"',
  ",": "<",
  ".": ">",
  "/": "?",
  " ": " ",
};

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

function deriveShiftedFromUnshifted(unshifted: LayoutMap): LayoutMap {
  const shifted: LayoutMap = {};
  for (const [keyId, value] of Object.entries(unshifted) as Array<
    [KeyId, string]
  >) {
    if (typeof value !== "string" || value.length === 0) continue;
    const mapped =
      DEFAULT_SHIFTED_CHAR_MAP[value] ?? (value.length === 1 ? value.toUpperCase() : value);
    shifted[keyId] = mapped;
  }
  return shifted;
}

export const DEFAULT_LAYOUT_JSON = JSON.stringify(
  { unshifted: staticaLayoutUnshifted, shifted: staticaLayoutShiftedOverrides },
  null,
  2,
);

export const GRAPHITE_LAYOUT_JSON = JSON.stringify(
  { unshifted: graphiteLayoutUnshifted, shifted: graphiteLayoutShiftedOverrides },
  null,
  2,
);

export function getDefaultLayoutJsonForPreset(preset: LayoutPresetId): string {
  return preset === "graphite" ? GRAPHITE_LAYOUT_JSON : DEFAULT_LAYOUT_JSON;
}

function getDefaultShiftedOverridesForPreset(preset: LayoutPresetId): LayoutMap {
  return preset === "graphite"
    ? graphiteLayoutShiftedOverrides
    : staticaLayoutShiftedOverrides;
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

function parseLayoutUnshiftedOnlySafe(text: string): LayoutMap | null {
  try {
    return parseLayoutJson(text).unshifted;
  } catch {
    return null;
  }
}

function validateLayoutPresetId(text: string): text is LayoutPresetId {
  return text === "statica" || text === "graphite";
}

function normalizeLayoutJsonText(text: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return text;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return text;
  const obj = parsed as Record<string, unknown>;
  if ("unshifted" in obj || "shifted" in obj) return text;
  return JSON.stringify({ unshifted: obj, shifted: {} }, null, 2);
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
    statica: normalizeLayoutJsonText(
      window.localStorage.getItem(LAYOUT_JSON_LOCALSTORAGE_KEYS.statica) ??
        DEFAULT_LAYOUT_JSON,
    ),
    graphite: normalizeLayoutJsonText(
      window.localStorage.getItem(LAYOUT_JSON_LOCALSTORAGE_KEYS.graphite) ??
        GRAPHITE_LAYOUT_JSON,
    ),
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

  const legacyMap = parseLayoutUnshiftedOnlySafe(legacyJson);
  if (!legacyMap) {
    return {
      preset: DEFAULT_LAYOUT_PRESET,
      jsonByPreset: { ...jsonByPreset, statica: normalizeLayoutJsonText(legacyJson) },
    };
  }

  const staticaDiff = countLayoutDiffKeys(legacyMap, staticaLayoutUnshifted);
  const graphiteDiff = countLayoutDiffKeys(legacyMap, graphiteLayoutUnshifted);
  const preset = graphiteDiff < staticaDiff ? "graphite" : "statica";
  return {
    preset,
    jsonByPreset: { ...jsonByPreset, [preset]: normalizeLayoutJsonText(legacyJson) },
  };
}

function parseLayerMap(value: unknown, label: string): LayoutMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object mapping KeyId -> string.`);
  }

  const map: LayoutMap = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (!validateKeyId(key)) {
      throw new Error(`Unknown key id: "${key}" in ${label}.`);
    }
    if (typeof val !== "string") {
      throw new Error(`Value for "${key}" in ${label} must be a string.`);
    }
    map[key] = val;
  }

  return map;
}

export function parseLayoutJson(text: string): LayoutLayers {
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
    throw new Error(
      'Layout JSON must be either {"unshifted": {...}, "shifted": {...}} or a legacy object mapping KeyId -> string.',
    );
  }

  const obj = parsed as Record<string, unknown>;
  if ("unshifted" in obj || "shifted" in obj) {
    const unshifted = "unshifted" in obj ? parseLayerMap(obj.unshifted, "unshifted") : {};
    const shifted = "shifted" in obj ? parseLayerMap(obj.shifted, "shifted") : {};
    return { unshifted, shifted };
  }

  return { unshifted: parseLayerMap(obj, "unshifted"), shifted: {} };
}

export function getEffectiveLayoutLayersForPreset(
  preset: LayoutPresetId,
  text: string,
): LayoutLayers {
  const overrides = parseLayoutJson(text);
  const unshifted = { ...(preset === "graphite" ? graphiteLayoutUnshifted : staticaLayoutUnshifted), ...overrides.unshifted };
  const derivedShifted = deriveShiftedFromUnshifted(unshifted);
  const shifted = {
    ...derivedShifted,
    ...getDefaultShiftedOverridesForPreset(preset),
    ...overrides.shifted,
  };
  return { unshifted, shifted };
}
