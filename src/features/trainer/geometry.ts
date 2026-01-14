import type { KeyId } from "./keys";

export type Finger =
  | "lp"
  | "lr"
  | "lm"
  | "li"
  | "ri"
  | "rm"
  | "rr"
  | "rp"
  | "thumb"
  | "mod"
  | "spacer";

export type KeyDef = {
  id: KeyId;
  widthQ: number;
  finger: Finger;
  fixedLabel?: string;
};

export type KeyRow = KeyDef[];

const q = (units: number) => Math.round(units * 4);

export const trainerGeometry: KeyRow[] = [
  [
    { id: "keyBackquote", widthQ: q(1), finger: "lp" },
    { id: "key1", widthQ: q(1), finger: "lp" },
    { id: "key2", widthQ: q(1), finger: "lr" },
    { id: "key3", widthQ: q(1), finger: "lm" },
    { id: "key4", widthQ: q(1), finger: "li" },
    { id: "key5", widthQ: q(1), finger: "li" },
    { id: "key6", widthQ: q(1), finger: "ri" },
    { id: "key7", widthQ: q(1), finger: "ri" },
    { id: "key8", widthQ: q(1), finger: "rm" },
    { id: "key9", widthQ: q(1), finger: "rr" },
    { id: "key0", widthQ: q(1), finger: "rp" },
    { id: "keyMinus", widthQ: q(1), finger: "rp" },
    { id: "keyEqual", widthQ: q(1), finger: "rp" },
    {
      id: "keyBackspace",
      widthQ: q(2),
      finger: "mod",
      fixedLabel: "delete",
    },
  ],
  [
    { id: "keyTab", widthQ: q(1.5), finger: "mod", fixedLabel: "tab" },
    { id: "keyQ", widthQ: q(1), finger: "lp" },
    { id: "keyW", widthQ: q(1), finger: "lr" },
    { id: "keyE", widthQ: q(1), finger: "lm" },
    { id: "keyR", widthQ: q(1), finger: "li" },
    { id: "keyT", widthQ: q(1), finger: "li" },
    { id: "keyY", widthQ: q(1), finger: "ri" },
    { id: "keyU", widthQ: q(1), finger: "ri" },
    { id: "keyI", widthQ: q(1), finger: "rm" },
    { id: "keyO", widthQ: q(1), finger: "rr" },
    { id: "keyP", widthQ: q(1), finger: "rp" },
    { id: "keyLbracket", widthQ: q(1), finger: "rp" },
    { id: "keyRbracket", widthQ: q(1), finger: "rp" },
    { id: "keyBackslash", widthQ: q(1.5), finger: "rp" },
  ],
  [
    {
      id: "keyCaps",
      widthQ: q(1.75),
      finger: "mod",
      fixedLabel: "caps lock",
    },
    { id: "keyA", widthQ: q(1), finger: "lp" },
    { id: "keyS", widthQ: q(1), finger: "lr" },
    { id: "keyD", widthQ: q(1), finger: "lm" },
    { id: "keyF", widthQ: q(1), finger: "li" },
    { id: "keyG", widthQ: q(1), finger: "li" },
    { id: "keyH", widthQ: q(1), finger: "ri" },
    { id: "keyJ", widthQ: q(1), finger: "ri" },
    { id: "keyK", widthQ: q(1), finger: "rm" },
    { id: "keyL", widthQ: q(1), finger: "rr" },
    { id: "keySemicolon", widthQ: q(1), finger: "rp" },
    { id: "keyQuote", widthQ: q(1), finger: "rp" },
    { id: "keyEnter", widthQ: q(2.25), finger: "mod", fixedLabel: "return" },
  ],
  [
    {
      id: "keyLshift",
      widthQ: q(2.25),
      finger: "mod",
      fixedLabel: "shift",
    },
    { id: "keyZ", widthQ: q(1), finger: "lp" },
    { id: "keyX", widthQ: q(1), finger: "lr" },
    { id: "keyC", widthQ: q(1), finger: "lm" },
    { id: "keyV", widthQ: q(1), finger: "li" },
    { id: "keyB", widthQ: q(1), finger: "li" },
    { id: "keyN", widthQ: q(1), finger: "ri" },
    { id: "keyM", widthQ: q(1), finger: "ri" },
    { id: "keyComma", widthQ: q(1), finger: "rm" },
    { id: "keyPeriod", widthQ: q(1), finger: "rr" },
    { id: "keySlash", widthQ: q(1), finger: "rp" },
    {
      id: "keyRshift",
      widthQ: q(2.75),
      finger: "mod",
      fixedLabel: "shift",
    },
  ],
  [
    { id: "keyFn", widthQ: q(1), finger: "mod", fixedLabel: "fn" },
    { id: "keyLctrl", widthQ: q(1.25), finger: "mod", fixedLabel: "control" },
    { id: "keyLalt", widthQ: q(1.25), finger: "mod", fixedLabel: "option" },
    { id: "keyLmeta", widthQ: q(1.5), finger: "mod", fixedLabel: "command" },
    { id: "keySpace", widthQ: q(7.25), finger: "mod", fixedLabel: "" },
    { id: "keyRmeta", widthQ: q(1.5), finger: "mod", fixedLabel: "command" },
    { id: "keyRalt", widthQ: q(1.25), finger: "mod", fixedLabel: "option" },
  ],
];
