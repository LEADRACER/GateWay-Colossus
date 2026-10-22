export const NUM_COLORS = 16

export const PAL: string[] = [
  /* 0  BG            */ '#050807',
  /* 1  FG default    */ '#a8b5aa',
  /* 2  FG bright     */ '#dff0e2',
  /* 3  FG muted      */ '#6e7a71',
  /* 4  FG dim        */ '#48524b',
  /* 5  FG ghost      */ '#2c332e',
  /* 6  green         */ '#33c75a',
  /* 7  green bright  */ '#5dff85',
  /* 8  green deep    */ '#1d7a35',
  /* 9  cyan          */ '#00d4ff',
  /* 10 amber         */ '#ffb64a',
  /* 11 red           */ '#ff5566',
  /* 12 magenta       */ '#d17dff',
  /* 13 blue          */ '#5a9dff',
  /* 14 gray          */ '#8a938c',
  /* 15 white         */ '#f2f7f2',
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
