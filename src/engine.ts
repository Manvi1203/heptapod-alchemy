export interface LexemeSegment {
  word: string;
  clean: string;
  idx: number;
  angle: number;
  weight: number;
  isEmotion: boolean;
  isTime: boolean;
  hasComma: boolean;
  seed: number;
  tendrils: number;
}

export interface SentenceAnalysis {
  text: string;
  words: string[];
  segments: LexemeSegment[];
  emotionCount: number;
  timeCount: number;
  seed: number;
  localSlopProb: number;
}

export const PRESETS = [
  {
    label: "Distance & Home",
    text: "I moved 8,000 miles away and still check the weather in my parents' city every morning.",
  },
  {
    label: "Ted Chiang",
    text: "From the beginning I knew my destination, and I chose my route accordingly.",
  },
  {
    label: "Monsoon Memory",
    text: "The rain hit the tin roof just before the power flickered out and she put ginger chai on the stove.",
  },
  {
    label: "Test AI Slop (Watch It Shatter)",
    text: "In today's rapidly evolving landscape, unlocking seamless synergy is a game-changing testament to human innovation.",
  },
];

const EMOTION_WORDS = new Set([
  "still", "never", "always", "home", "parents", "mother", "father", "love",
  "miss", "rain", "remember", "forgot", "knew", "chose", "alone", "quiet",
  "night", "morning", "wait", "waiting", "forgive", "goodbye", "stay", "leave",
  "moved", "away", "time", "beginning", "end", "light", "dark", "voice", "heart",
]);

const TIME_WORDS = new Set([
  "still", "always", "never", "before", "after", "beginning", "end", "morning",
  "night", "years", "yesterday", "tomorrow", "now", "when", "until", "again",
]);

const SLOP_MARKERS = [
  /\bin today'?s\b/i, /\brapidly evolving\b/i, /\bfast-paced\b/i, /\bunlock(ing)?\b/i,
  /\bsynergy\b/i, /\bgame[- ]changing\b/i, /\btestament to\b/i, /\btapestry\b/i,
  /\bdelve\b/i, /\bseamless\b/i, /\bholistic\b/i, /\bcomprehensive\b/i, /\belevat(e|ing)\b/i,
];

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function analyzeSentence(raw: string): SentenceAnalysis {
  const text = raw.trim();
  const words = text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  let slopHits = 0;
  for (const rx of SLOP_MARKERS) if (rx.test(text)) slopHits++;
  const localSlopProb = slopHits >= 2 ? 0.94 : slopHits === 1 ? 0.62 : 0.02;

  const segments: LexemeSegment[] = words.map((w, idx) => {
    const clean = w.toLowerCase().replace(/[^a-z0-9']/g, "");
    const angle = (idx / Math.max(1, words.length)) * Math.PI * 2 - Math.PI / 2;
    const isEmotion = EMOTION_WORDS.has(clean);
    const isTime = TIME_WORDS.has(clean);
    const hasComma = /[,;—:-]$/.test(w);
    const seed = hashStr(clean + idx);
    const weight = Math.min(1, 0.28 + clean.length * 0.065 + (isEmotion ? 0.38 : 0) + (isTime ? 0.2 : 0));
    return {
      word: w,
      clean,
      idx,
      angle,
      weight,
      isEmotion,
      isTime,
      hasComma,
      seed,
      tendrils: Math.max(1, Math.round(weight * 4.5)),
    };
  });

  return {
    text,
    words,
    segments,
    emotionCount: segments.filter((s) => s.isEmotion).length,
    timeCount: segments.filter((s) => s.isTime).length,
    seed: hashStr(text),
    localSlopProb,
  };
}
