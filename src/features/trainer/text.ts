export const beginnerWords = [
  "и",
  "в",
  "не",
  "на",
  "как",
  "то",
  "это",
  "что",
] as const;

export type Token = {
  display: string;
  expected: string;
  kind: "char" | "space";
};

export function buildTokens(wordCount: number): Token[] {
  const words = Array.from(
    { length: wordCount },
    (_, i) => beginnerWords[i % beginnerWords.length],
  );

  const tokens: Token[] = [];
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    for (const char of word) {
      tokens.push({ display: char, expected: char, kind: "char" });
    }
    if (wordIndex < words.length - 1) {
      tokens.push({ display: "·", expected: " ", kind: "space" });
    }
  }

  return tokens;
}

export function buildTokensFromText(text: string): Token[] {
  const tokens: Token[] = [];

  for (const char of text) {
    if (/\s/.test(char)) {
      tokens.push({ display: "·", expected: " ", kind: "space" });
      continue;
    }
    tokens.push({ display: char, expected: char, kind: "char" });
  }

  return tokens;
}
