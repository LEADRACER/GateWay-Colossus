export const NUM_COLORS = 16

export const PAL: string[] = [
  /* 0  BG            */ '#0a0f0b',
  /* 1  FG default    */ '#b8c8b6',
  /* 2  FG bright     */ '#d8e4d6',
  /* 3  FG muted      */ '#8a9a86',
  /* 4  FG dim        */ '#5a685a',
  /* 5  FG ghost      */ '#2a3328',
  /* 6  green         */ '#4a7c53',
  /* 7  green bright  */ '#6cc47a',
  /* 8  green deep    */ '#2e4a33',
  /* 9  cyan          */ '#4db6c4',
  /* 10 amber (=gold) */ '#c8a96a',
  /* 11 red           */ '#c05b5b',
  /* 12 magenta       */ '#c489dc',
  /* 13 blue          */ '#6b9bd6',
  /* 14 gray          */ '#8a9a86',
  /* 15 white         */ '#dfe8df',
]

export const C = {
  BG: 0,
  FG: 1,
  FG_BRIGHT: 2,
  FG_MUTED: 3,
  FG_DIM: 4,
  FG_GHOST: 5,
  GREEN: 6,
  GREEN_BRIGHT: 7,
  GREEN_DEEP: 8,
  CYAN: 9,
  AMBER: 10,
  RED: 11,
  MAGENTA: 12,
  BLUE: 13,
  GRAY: 14,
  WHITE: 15,
} as const

export type ColorIndex = (typeof C)[keyof typeof C]

const LANGUAGE_PALETTE: Record<string, ColorIndex> = {
  TypeScript: C.BLUE,
  JavaScript: C.AMBER,
  Python: C.BLUE,
  Rust: C.AMBER,
  Go: C.CYAN,
  Java: C.AMBER,
  'C++': C.RED,
  C: C.FG_MUTED,
  'C#': C.GREEN,
  PHP: C.MAGENTA,
  Ruby: C.RED,
  Swift: C.AMBER,
  Kotlin: C.MAGENTA,
  Dart: C.CYAN,
  Vue: C.GREEN,
  Svelte: C.RED,
  HTML: C.AMBER,
  CSS: C.BLUE,
  Shell: C.GREEN,
}

export function languageColor(language: string | null | undefined): ColorIndex {
  if (!language) return C.FG_MUTED
  const mapped = LANGUAGE_PALETTE[language]
  if (mapped !== undefined) return mapped
  let hash = 0
  for (let i = 0; i < language.length; i++) hash = (hash * 31 + language.charCodeAt(i)) | 0
  const choices: ColorIndex[] = [C.GREEN, C.CYAN, C.AMBER, C.BLUE, C.MAGENTA]
  return choices[Math.abs(hash) % choices.length]
}

export const ATTR_BOLD = 1
export const ATTR_DIM = 2
