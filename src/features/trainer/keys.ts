export const ALL_KEY_IDS = [
  "keyBackquote",
  "key1",
  "key2",
  "key3",
  "key4",
  "key5",
  "key6",
  "key7",
  "key8",
  "key9",
  "key0",
  "keyMinus",
  "keyEqual",
  "keyBackspace",
  "keyTab",
  "keyQ",
  "keyW",
  "keyE",
  "keyR",
  "keyT",
  "keyY",
  "keyU",
  "keyI",
  "keyO",
  "keyP",
  "keyLbracket",
  "keyRbracket",
  "keyBackslash",
  "keyEnter",
  "keyCaps",
  "keyA",
  "keyS",
  "keyD",
  "keyF",
  "keyG",
  "keyH",
  "keyJ",
  "keyK",
  "keyL",
  "keySemicolon",
  "keyQuote",
  "keyLshift",
  "keyZ",
  "keyX",
  "keyC",
  "keyV",
  "keyB",
  "keyN",
  "keyM",
  "keyComma",
  "keyPeriod",
  "keySlash",
  "keyRshift",
  "keyFn",
  "keyLctrl",
  "keyLalt",
  "keyLmeta",
  "keySpace",
  "keyRmeta",
  "keyRalt",
  "keyRctrl",
] as const;

export type KeyId = (typeof ALL_KEY_IDS)[number];

export type LayoutMap = Partial<Record<KeyId, string>>;
export type LayoutLayers = { unshifted: LayoutMap; shifted: LayoutMap };

export function keyIdFromEventCode(code: string): KeyId | null {
  if (code.startsWith("Key") && code.length === 4) {
    return `key${code[3]}` as KeyId;
  }

  if (code.startsWith("Digit") && code.length === 6) {
    return `key${code[5]}` as KeyId;
  }

  switch (code) {
    case "Backquote":
      return "keyBackquote";
    case "Minus":
      return "keyMinus";
    case "Equal":
      return "keyEqual";
    case "Backspace":
      return "keyBackspace";
    case "Tab":
      return "keyTab";
    case "BracketLeft":
      return "keyLbracket";
    case "BracketRight":
      return "keyRbracket";
    case "Enter":
      return "keyEnter";
    case "CapsLock":
      return "keyCaps";
    case "Semicolon":
      return "keySemicolon";
    case "Quote":
      return "keyQuote";
    case "Backslash":
      return "keyBackslash";
    case "ShiftLeft":
      return "keyLshift";
    case "ShiftRight":
      return "keyRshift";
    case "MetaLeft":
      return "keyLmeta";
    case "ControlLeft":
      return "keyLctrl";
    case "AltLeft":
      return "keyLalt";
    case "Space":
      return "keySpace";
    case "MetaRight":
      return "keyRmeta";
    case "AltRight":
      return "keyRalt";
    case "ControlRight":
      return "keyRctrl";
    case "Comma":
      return "keyComma";
    case "Period":
      return "keyPeriod";
    case "Slash":
      return "keySlash";
    default:
      return null;
  }
}
