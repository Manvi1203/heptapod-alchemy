import React, { useEffect, useMemo, useRef, useState } from "react";

type InkScores = {
  humanity: number;
  concreteness: number;
  originality: number;
  density: number;
  isSlop: boolean;
};

type LexItem = {
  name: string;
  tier: number;
  isBase: boolean;
  definition: string;
  scores: InkScores;
};

type ActiveForge = {
  name: string;
  tier: number;
  vivid: string;
  a?: LexItem;
  b?: LexItem;
  existing?: LexItem;
};

const BASE_RADICALS: LexItem[] = ["TIME", "LOSS", "VOICE", "DISTANCE", "LIGHT", "BODY"].map((name) => ({
  name,
  tier: 1,
  isBase: true,
  definition: "",
  scores: { humanity: 100, concreteness: 86, originality: 88, density: 94, isSlop: false },
}));

const RECIPES: Record<string, { name: string; tier: number; vivid: string }> = {
  "LOSS+TIME": { name: "NOSTALGIA", tier: 2, vivid: "Smelling rain on hot pavement and suddenly being nine years old in my grandmother's driveway." },
  "DISTANCE+VOICE": { name: "ECHO", tier: 2, vivid: "Calling my mother from an empty airport gate at midnight and hearing the kitchen clock behind her." },
  "LIGHT+LOSS": { name: "DUSK", tier: 2, vivid: "The twenty minutes after sunset when streetlights hum on before the sky turns black." },
  "BODY+TIME": { name: "SCAR", tier: 2, vivid: "A pale crescent on my left knuckle from a bicycle spill I still feel when winter hits." },
  "LIGHT+VOICE": { name: "PROMISE", tier: 2, vivid: "Telling my sister I will fly back for her graduation before I even buy the ticket." },
  "BODY+DISTANCE": { name: "LONGING", tier: 2, vivid: "Reaching across the cold side of the mattress at 3am before remembering you moved away." },
  "LOSS+VOICE": { name: "GOODBYE", tier: 2, vivid: "Standing on the curb waving until your taillights turn the corner so you won't see me stop." },
  "BODY+LIGHT": { name: "SHADOW", tier: 2, vivid: "Two long silhouettes stretching across wet asphalt while we walk home without a word." },
  "LIGHT+TIME": { name: "DAWN", tier: 2, vivid: "Blue light slipping under the blinds while the bakery downstairs rattles metal trays." },
  "DISTANCE+TIME": { name: "PATIENCE", tier: 2, vivid: "Watching the kettle for four quiet minutes while snow piles up on the windowsill." },
  "BODY+LOSS": { name: "GRIEF", tier: 2, vivid: "Setting two mugs on the counter out of habit and leaving the second one empty all morning." },
  "BODY+VOICE": { name: "BREATH", tier: 2, vivid: "Fogging up the cold bus window just to draw a small circle before my stop." },
  "NOSTALGIA+VOICE": { name: "LULLABY", tier: 3, vivid: "Humming an off-key song my father used to whistle while locking the front door at night." },
  "DISTANCE+NOSTALGIA": { name: "HOMESICKNESS", tier: 3, vivid: "I moved 8,000 miles away and still check the morning weather in my parents' city." },
  "LIGHT+SCAR": { name: "FORGIVENESS", tier: 3, vivid: "Opening the old box of letters in July and realizing my hands aren't shaking anymore." },
  "ECHO+LOSS": { name: "SILENCE", tier: 3, vivid: "The heavy quiet in a house ten seconds after the last suitcase rolls down the porch steps." },
  "LONGING+TIME": { name: "MEMORY", tier: 3, vivid: "Keeping a faded train stub in my coat pocket three winters after we took that ride." },
  "GOODBYE+PROMISE": { name: "ARRIVAL", tier: 4, vivid: "From the beginning I knew my destination, and I chose my route accordingly." },
  "NOSTALGIA+TIME": { name: "ARRIVAL", tier: 4, vivid: "From the beginning I knew my destination, and I chose my route accordingly." },
  "MEMORY+TIME": { name: "ARRIVAL", tier: 4, vivid: "From the beginning I knew my destination, and I chose my route accordingly." },
  "FORGIVENESS+TIME": { name: "ARRIVAL", tier: 4, vivid: "From the beginning I knew my destination, and I chose my route accordingly." },
};

const SLOP_RX = [
  /\bin today'?s\b/i, /\brapidly evolving\b/i, /\bunlock(s|ing)?\b/i, /\bsynergy\b/i,
  /\bgame[- ]changing\b/i, /\btestament\b/i, /\btapestry\b/i, /\bdelve(d)?\b/i,
  /\bseamless(ly)?\b/i, /\bholistic\b/i, /\binnovation\b/i, /\belevat(e|ing)\b/i,
  /\bsentimental longing\b/i, /\bcherished memories\b/i,
];
const SENSORY_RX = [
  /\b\d+\b/, /\b(am|pm|morning|midnight|night|winter|summer|july|years?|minutes?|seconds?|miles?)\b/i,
  /\b(rain|snow|cold|warm|hot|wet|pavement|kitchen|window|door|curb|floor|hands?|knuckle|mug|smell|hum|clock|light|blinds|coat|pocket|driveway|porch|train|bus|sky)\b/i,
  /\b(i|my|me|we|our|mother|father|sister|grandmother|parents)\b/i,
];
const ABSTRACT_RX = [/\b(is defined as|refers to|concept|emotion|feeling|experience|journey|thing|stuff|very|really|just)\b/i];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function getFusion(a: string, b: string) {
  const key = [a, b].sort().join("+");
  if (RECIPES[key]) return RECIPES[key];
  const fallback = ["STILLNESS", "THRESHOLD", "HORIZON", "WEIGHT", "PASSAGE", "RETURN", "PRESENCE"];
  return {
    name: fallback[Math.floor(hashStr(key) * fallback.length)],
    tier: 3,
    vivid: "Standing still in the doorway for five seconds just to memorize how the afternoon light hits the floor.",
  };
}

function scoreCraft(text: string, overrideHumanity?: number): InkScores {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let slopHits = 0;
  for (const rx of SLOP_RX) if (rx.test(text)) slopHits++;
  const humanity =
    typeof overrideHumanity === "number"
      ? overrideHumanity
      : Math.round((1 - (slopHits >= 2 ? 0.96 : slopHits === 1 ? 0.74 : 0.02)) * 100);

  let sensory = 0;
  for (const w of words) for (const rx of SENSORY_RX) if (rx.test(w)) { sensory++; break; }
  let abs = 0;
  for (const rx of ABSTRACT_RX) if (rx.test(text)) abs++;
  const concreteness = Math.max(18, Math.min(98, Math.round(28 + sensory * 13 + Math.min(20, Math.max(0, (words.length - 6) * 2.2)) - abs * 14)));
  const clean = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")).filter((w) => w.length > 2);
  const uniq = clean.length ? new Set(clean).size / clean.length : 0.4;
  const originality = Math.max(20, Math.min(97, Math.round(uniq * 88 + (words.length >= 10 ? 10 : -8) - slopHits * 35 - abs * 10)));
  const density = Math.round(humanity * 0.5 + concreteness * 0.25 + originality * 0.25);
  return { humanity, concreteness, originality, density, isSlop: humanity < 50 };
}

export default function App() {
  const [atGlass, setAtGlass] = useState(false);
  const [lexicon, setLexicon] = useState<LexItem[]>(BASE_RADICALS);
  const [selectedA, setSelectedA] = useState<LexItem | null>(null);
  const [activeForge, setActiveForge] = useState<ActiveForge | null>(null);
  const [thought, setThought] = useState("");
  const [metrics, setMetrics] = useState<InkScores | null>(null);
  const [forgeStatus, setForgeStatus] = useState("Pangram v4 Ready");
  const [statusDanger, setStatusDanger] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [cinema, setCinema] = useState(false);

  const webglRef = useRef<HTMLDivElement | null>(null);
  const inkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; master: GainNode } | null>(null);

  const smokePuffs = useMemo(
    () =>
      Array.from({ length: 240 }, (_, i) => ({
        u: i / 240,
        radJ: (hashStr("rj" + i) - 0.5) * 22,
        size: 7 + hashStr("sz" + i) * 20,
        rise: hashStr("rs" + i),
        phase: hashStr("ph" + i) * Math.PI * 2,
      })),
    []
  );

  const simRef = useRef({
    atGlass: false,
    autoWalk: false,
    soundOn: false,
    slopPulse: 0,
    bloom: 0,
    vz: 0,
    vx: 0,
    bob: 0,
    lookX: 0,
    lookY: 0,
    keys: { up: false, down: false, left: false, right: false },
    lexicon: BASE_RADICALS,
    selectedA: null as LexItem | null,
    activeForge: null as ActiveForge | null,
    thought: "",
  });

  simRef.current.soundOn = soundOn;
  simRef.current.lexicon = lexicon;
  simRef.current.selectedA = selectedA;
  simRef.current.activeForge = activeForge;
  simRef.current.thought = thought;

  function playChime(ok: boolean, isArrival = false) {
    if (!simRef.current.soundOn) return;
    const ac = audioRef.current?.ctx || new AudioContext();
    if (ac.state === "suspended") ac.resume();
    const now = ac.currentTime;
    (isArrival ? [110, 164.81, 220, 329.63] : ok ? [146.83, 220, 293.66] : [92, 85]).forEach((f, i) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (ok ? 2.2 : 0.6));
      o.connect(g);
      g.connect(ac.destination);
      o.start(now);
      o.stop(now + 2.4);
    });
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      if (!audioRef.current) {
        const ctx = new AudioContext();
        const master = ctx.createGain();
        master.gain.value = 0.0001;
        master.connect(ctx.destination);
        [55, 82.41, 110].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = f;
          g.gain.value = i === 0 ? 0.4 : 0.15 / (i + 1);
          o.connect(g);
          g.connect(master);
          o.start();
        });
        audioRef.current = { ctx, master };
      }
      audioRef.current.ctx.resume();
      audioRef.current.master.gain.setTargetAtTime(0.085, audioRef.current.ctx.currentTime, 0.5);
    } else if (audioRef.current) {
      audioRef.current.master.gain.setTargetAtTime(0.0001, audioRef.current.ctx.currentTime, 0.35);
    }
  }

  function openForge(cfg: ActiveForge) {
    simRef.current.bloom = 0.12;
    setActiveForge(cfg);
    setThought(cfg.existing ? cfg.existing.definition : "");
    setMetrics(cfg.existing ? cfg.existing.scores : null);
    setForgeStatus("Pangram v4 Ready");
    setStatusDanger(false);
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  async function submitForge(raw: string) {
    const f = simRef.current.activeForge;
    if (!f) return;
    const txt = raw.trim();
    if (txt.length < 10) {
      setForgeStatus("Write a complete sentence");
      return;
    }

    setSubmitting(true);
    setForgeStatus("Pangram v4 Scanning…");
    setStatusDanger(false);

    let liveHumanity: number | undefined;
    let srcLabel = "Pangram";
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: txt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.aiProb === "number") {
          liveHumanity = Math.round((1 - data.aiProb) * 100);
          srcLabel = data.source === "pangram-4" ? "Pangram v4" : "Pangram";
        }
      }
    } catch {
      // Fallback handled cleanly
    }

    const res = scoreCraft(txt, liveHumanity);
    setMetrics(res);
    setSubmitting(false);

    if (res.isSlop) {
      simRef.current.slopPulse = 1.0;
      setForgeStatus(`Rejected · ${srcLabel} ${100 - res.humanity}% AI Slop`);
      setStatusDanger(true);
      playChime(false);
      return;
    }

    simRef.current.slopPulse = 0.0;
    setStatusDanger(false);
    setForgeStatus(`Sealed (${srcLabel}) · ${res.density}% Ink Density`);

    setLexicon((prev) => {
      const exists = prev.find((x) => x.name === f.name);
      if (exists) {
        return prev.map((x) => (x.name === f.name ? { ...x, definition: txt, scores: res } : x));
      }
      return [...prev, { name: f.name, tier: f.tier, isBase: false, definition: txt, scores: res }];
    });

    playChime(true, f.name === "ARRIVAL");
    setTimeout(() => setActiveForge(null), 1100);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { inputRef.current?.blur(); return; }
      if (document.activeElement === inputRef.current) return;
      if (e.key === "h" || e.key === "H") { setCinema((c) => !c); return; }
      const s = simRef.current;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { s.keys.up = true; s.autoWalk = false; e.preventDefault(); }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { s.keys.down = true; s.autoWalk = false; e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { s.keys.left = true; e.preventDefault(); }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { s.keys.right = true; e.preventDefault(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const s = simRef.current;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") s.keys.up = false;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") s.keys.down = false;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") s.keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") s.keys.right = false;
    };
    const onMove = (e: PointerEvent) => {
      simRef.current.lookX = e.clientX / Math.max(1, window.innerWidth) - 0.5;
      simRef.current.lookY = e.clientY / Math.max(1, window.innerHeight) - 0.5;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = () => {
      const THREE = (window as any).__THREE__;
      const mount = webglRef.current;
      const inkCanvas = inkCanvasRef.current;
      if (!THREE || !mount || !inkCanvas) return;
      const ictx = inkCanvas.getContext("2d")!;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x040708);
      const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 10.6);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      mount.replaceChildren(renderer.domElement);

      const plateTex = new THREE.TextureLoader().load("/chamber.jpg");
      plateTex.colorSpace = THREE.SRGBColorSpace;

      const plateUniforms = { uMap: { value: plateTex }, uTime: { value: 0 }, uSlop: { value: 0 } };
      const plateMat = new THREE.ShaderMaterial({
        uniforms: plateUniforms,
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D uMap;
          uniform float uTime;
          uniform float uSlop;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
          }
          void main() {
            vec2 uv = vUv;
            float inGlass = smoothstep(0.11, 0.14, uv.x) * smoothstep(0.89, 0.86, uv.x) * smoothstep(0.22, 0.26, uv.y) * smoothstep(0.84, 0.80, uv.y);
            float drift = (noise(uv * vec2(4.0, 3.0) + vec2(uTime * 0.06, -uTime * 0.03)) - 0.5) * 0.006 * inGlass;
            vec3 col = texture2D(uMap, uv + vec2(drift, drift * 0.5)).rgb;
            float fog = noise(uv * vec2(3.5, 2.5) + vec2(uTime * 0.04, 0.0)) * 0.09 * inGlass;
            col += vec3(0.82, 0.90, 0.91) * fog;
            if (uSlop > 0.01) {
              float lum = dot(col, vec3(0.299, 0.587, 0.114));
              float sn = (hash(floor(uv * 180.0) + fract(uTime)) - 0.5) * 0.14 * uSlop;
              col = mix(col, vec3(lum * 0.92, lum * 0.95, lum * 0.98) + sn, uSlop * 0.85 * inGlass);
            }
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(19.2, 10.8), plateMat));

      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(420 * 3);
      for (let i = 0; i < 420; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 14;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
        pPos[i * 3 + 2] = 0.8 + Math.random() * 9.5;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const dustPoints = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0xd4e6e8, size: 0.042, transparent: true, opacity: 0.36 })
      );
      scene.add(dustPoints);

      const drawBillowingInk = (
        cx: number,
        cy: number,
        radius: number,
        seedStr: string,
        scores: InkScores,
        t: number,
        bloom: number,
        slopAmt: number
      ) => {
        const seed = hashStr(seedStr);
        const concreteF = scores.concreteness / 100;
        const origF = scores.originality / 100;
        const crownAng = -Math.PI * 0.58 + (seed - 0.5) * 1.4;
        const gapAng = crownAng + Math.PI * 0.94;
        const rLive = radius * (0.25 + bloom * 0.75);
        const alphaBase = bloom * (0.45 + (scores.density / 100) * 0.55) * (1 - slopAmt * 0.55);

        ictx.save();
        for (const p of smokePuffs) {
          const ang = p.u * Math.PI * 2;
          const dGap = Math.abs(Math.atan2(Math.sin(ang - gapAng), Math.cos(ang - gapAng)));
          const gapSize = 0.4 - concreteF * 0.22;
          if (dGap < gapSize) continue;
          const gapFade = Math.min(1, (dGap - gapSize) / 0.38);
          const dCrown = Math.abs(Math.atan2(Math.sin(ang - crownAng), Math.cos(ang - crownAng)));
          const crownW = Math.exp(-Math.pow(dCrown / 0.56, 2)) * (0.35 + origF * 1.15);

          const swirl = Math.sin(ang * 3 + seed * 12 + t * 0.35) * 7 + Math.cos(ang * 7 - t * 0.45) * 3.5;
          const driftX = Math.sin(t * 0.5 + p.phase) * (4 + crownW * 8);
          const driftY = Math.cos(t * 0.45 + p.phase) * 4 - p.rise * crownW * 16;
          const scatter = slopAmt * 70 * (p.rise - 0.5);

          const px = cx + Math.cos(ang) * (rLive + swirl + p.radJ * (0.4 + crownW * 0.9)) + driftX + scatter;
          const py = cy + Math.sin(ang) * (rLive + swirl + p.radJ * (0.4 + crownW * 0.9)) + driftY;
          const pr = p.size * (0.55 + concreteF * 0.65 + crownW * 1.05) * gapFade * bloom;

          const grad = ictx.createRadialGradient(px, py, 0, px, py, pr);
          const a = alphaBase * (0.14 + crownW * 0.22) * gapFade;
          if (slopAmt > 0.35) {
            grad.addColorStop(0, `rgba(110, 118, 120, ${a.toFixed(3)})`);
            grad.addColorStop(1, "rgba(110, 118, 120, 0)");
          } else {
            grad.addColorStop(0, `rgba(5, 11, 14, ${(a * 1.35).toFixed(3)})`);
            grad.addColorStop(0.55, `rgba(12, 22, 26, ${(a * 0.55).toFixed(3)})`);
            grad.addColorStop(1, "rgba(12, 22, 26, 0)");
          }
          ictx.fillStyle = grad;
          ictx.beginPath();
          ictx.arc(px, py, pr, 0, Math.PI * 2);
          ictx.fill();
        }

        const segs = 150;
        for (let i = 0; i < segs; i++) {
          const f0 = i / segs, f1 = (i + 1) / segs;
          const a0 = f0 * Math.PI * 2, a1 = f1 * Math.PI * 2;
          const dGap = Math.abs(Math.atan2(Math.sin(a0 - gapAng), Math.cos(a0 - gapAng)));
          const gapSize = 0.4 - concreteF * 0.22;
          if (dGap < gapSize) continue;
          const gapTaper = Math.min(1, (dGap - gapSize) / 0.35);
          const dCrown = Math.abs(Math.atan2(Math.sin(a0 - crownAng), Math.cos(a0 - crownAng)));
          const crownW = Math.exp(-Math.pow(dCrown / 0.52, 2)) * (0.35 + origF * 1.1);

          const w0 = Math.sin(a0 * 3 + seed * 12 + t * 0.35) * 7 + Math.cos(a0 * 7 - t * 0.45) * 3.5;
          const w1 = Math.sin(a1 * 3 + seed * 12 + t * 0.35) * 7 + Math.cos(a1 * 7 - t * 0.45) * 3.5;
          const x0 = cx + Math.cos(a0) * (rLive + w0);
          const y0 = cy + Math.sin(a0) * (rLive + w0);
          const x1 = cx + Math.cos(a1) * (rLive + w1);
          const y1 = cy + Math.sin(a1) * (rLive + w1);

          ictx.beginPath();
          ictx.moveTo(x0, y0);
          ictx.lineTo(x1, y1);
          ictx.strokeStyle = slopAmt > 0.35 ? `rgba(115, 124, 126, ${(alphaBase * 0.6).toFixed(3)})` : `rgba(5, 11, 14, ${(alphaBase * 0.92).toFixed(3)})`;
          ictx.lineWidth = (1.8 + concreteF * 4.5 + crownW * 12.5) * gapTaper * bloom;
          ictx.lineCap = "round";
          ictx.stroke();

          if (crownW > 0.34 && origF > 0.4 && i % 4 === 0) {
            const len = (20 + hashStr(seedStr + i) * 52) * crownW * origF * bloom;
            const ang = a0 + (hashStr("ta" + seedStr + i) - 0.5) * 0.5;
            const ex = x0 + Math.cos(ang) * len;
            const ey = y0 + Math.sin(ang) * len;
            const mx = (x0 + ex) * 0.5 + Math.sin(i * 1.5 + t * 0.5) * 9;
            const my = (y0 + ey) * 0.5 + Math.cos(i * 1.5 + t * 0.5) * 9;
            ictx.beginPath();
            ictx.moveTo(x0, y0);
            ictx.quadraticCurveTo(mx, my, ex, ey);
            ictx.strokeStyle = `rgba(6, 12, 15, ${(alphaBase * 0.72).toFixed(3)})`;
            ictx.lineWidth = (1.3 + crownW * 2.4) * bloom;
            ictx.stroke();

            ictx.fillStyle = `rgba(6, 12, 15, ${(alphaBase * 0.55).toFixed(3)})`;
            ictx.beginPath();
            ictx.arc(ex + Math.cos(ang) * 6, ey + Math.sin(ang) * 6, 1.4 + hashStr("td" + i) * 2.4, 0, Math.PI * 2);
            ictx.fill();
          }
        }
        ictx.restore();
      };

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      const clock = new THREE.Clock();
      let smoothSlop = 0;
      let raf = 0;

      const animate = () => {
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const s = simRef.current;

        if (s.autoWalk) {
          if (camera.position.z > 6.4) s.vz -= 0.022;
          else s.autoWalk = false;
        }
        if (s.keys.up) s.vz -= 0.022;
        if (s.keys.down) s.vz += 0.022;
        if (s.keys.left) s.vx -= 0.015;
        if (s.keys.right) s.vx += 0.015;
        s.vz *= 0.86;
        s.vx *= 0.85;
        camera.position.z = Math.max(6.2, Math.min(11.4, camera.position.z + s.vz));
        camera.position.x = Math.max(-1.6, Math.min(1.6, camera.position.x + s.vx));
        const speed = Math.hypot(s.vz, s.vx);
        if (speed > 0.004) s.bob += speed * 2.2;
        camera.position.y = Math.sin(s.bob) * Math.min(0.08, speed * 0.6);
        camera.lookAt(camera.position.x * 0.4 + s.lookX * 0.75, -s.lookY * 0.4, 0);

        const nowAtGlass = camera.position.z <= 8.2;
        if (nowAtGlass !== s.atGlass) {
          s.atGlass = nowAtGlass;
          if (nowAtGlass) s.bloom = 0.08;
          setAtGlass(nowAtGlass);
        }

        s.slopPulse *= 0.985;
        smoothSlop += (s.slopPulse - smoothSlop) * 0.08;
        s.bloom += (1.0 - s.bloom) * 0.055;

        plateUniforms.uTime.value = t;
        plateUniforms.uSlop.value = smoothSlop;
        dustPoints.rotation.y = Math.sin(t * 0.08) * 0.06;
        dustPoints.position.y = Math.sin(t * 0.25) * 0.15;
        renderer.render(scene, camera);

        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth, h = window.innerHeight;
        if (inkCanvas.width !== Math.floor(w * dpr) || inkCanvas.height !== Math.floor(h * dpr)) {
          inkCanvas.width = Math.floor(w * dpr);
          inkCanvas.height = Math.floor(h * dpr);
        }
        ictx.save();
        ictx.scale(dpr, dpr);
        ictx.clearRect(0, 0, w, h);

        const vis = Math.max(0, Math.min(1, (8.8 - camera.position.z) / 2.0));
        if (vis > 0.02) {
          ictx.globalAlpha = vis;
          const cy = s.activeForge ? h * 0.36 : h * 0.45;
          const rad = Math.min(w, h) * (s.activeForge ? 0.165 : 0.185);

          if (s.activeForge) {
            const live = s.thought.trim().length >= 8
              ? scoreCraft(s.thought)
              : { humanity: 82, concreteness: 44, originality: 48, density: 62, isSlop: false };
            drawBillowingInk(w * 0.5, cy, rad, s.activeForge.name + s.thought, live, t, s.bloom, smoothSlop);
          } else if (s.selectedA) {
            drawBillowingInk(w * 0.5, cy, rad, s.selectedA.name + s.selectedA.definition, s.selectedA.scores, t, s.bloom, 0);
          } else {
            const latest = s.lexicon[s.lexicon.length - 1];
            drawBillowingInk(
              w * 0.41,
              cy,
              rad * 0.85,
              "ABBOTT_RING",
              { humanity: 100, concreteness: 92, originality: 94, density: 96, isSlop: false },
              t,
              s.bloom,
              0
            );
            drawBillowingInk(w * 0.59, cy + 10, rad * 0.82, latest.name + latest.definition, latest.scores, t, s.bloom, 0);
          }
        }
        ictx.restore();
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    };

    if ((window as any).__THREE__) init();
    else window.addEventListener("three-ready", init, { once: true });
    return () => {
      window.removeEventListener("three-ready", init);
      if (cleanup) cleanup();
    };
  }, [smokePuffs]);

  const claimed = lexicon.filter((g) => !g.isBase);
  const avgRes = claimed.length ? Math.round(claimed.reduce((a, b) => a + b.scores.density, 0) / claimed.length) : null;
  const hasArrival = lexicon.some((g) => g.name === "ARRIVAL");

  return (
    <div className="arrival-root">
      <div ref={webglRef} className="webgl-mount" />
      <canvas ref={inkCanvasRef} className="ink-canvas" />

      <div className={`layer top-bar ${cinema ? "hidden" : ""}`}>
        <div className="brand-group">
          <span className="brand-title">ARRIVAL</span>
          <span className="brand-sep" />
          <span className="brand-meta">
            {lexicon.length} / 18 GLYPHS
            {avgRes !== null ? ` · RESONANCE ${avgRes}%` : ""}
            {hasArrival ? " · ★ ARRIVAL" : ""}
          </span>
        </div>
        <div className="top-actions">
          <button type="button" className="pill-btn" onClick={toggleSound}>
            {soundOn ? "Sound On" : "Sound Off"}
          </button>
          <button type="button" className="pill-btn" onClick={() => setCinema((c) => !c)}>
            Hide UI (H)
          </button>
        </div>
      </div>

      <div className={`layer intro-overlay ${cinema || atGlass ? "hidden" : ""}`}>
        <div className="intro-card">
          <h1 className="intro-h1">ARRIVAL</h1>
          <div className="intro-sub">Hold ↑ / W to walk into the Shell · Fuse ink glyphs to sculpt a human lexicon</div>
          <button type="button" className="intro-btn" onClick={() => { simRef.current.autoWalk = true; }}>
            Step Up To The Glass →
          </button>
        </div>
      </div>

      <div className={`layer dock-wrap ${cinema || !atGlass || Boolean(activeForge) ? "hidden" : ""}`}>
        <div className="dock-hint">
          {selectedA
            ? `${selectedA.name} selected — click a second glyph to fuse${!selectedA.isBase ? " (or click again to re-forge)" : ""}`
            : "Select two glyphs to fuse them in the mist · Goal: discover ARRIVAL"}
        </div>
        <div className="dock-rail">
          {lexicon.map((g) => {
            const isSel = selectedA?.name === g.name;
            return (
              <button
                key={g.name}
                type="button"
                className={`glyph-tile${isSel ? " selected" : ""}${g.name === "ARRIVAL" ? " master" : ""}`}
                onClick={() => {
                  if (!selectedA) {
                    simRef.current.bloom = 0.25;
                    setSelectedA(g);
                  } else if (selectedA.name === g.name) {
                    if (!g.isBase) openForge({ name: g.name, tier: g.tier, vivid: g.definition, existing: g });
                    setSelectedA(null);
                  } else {
                    const f = getFusion(selectedA.name, g.name);
                    const a = selectedA;
                    setSelectedA(null);
                    openForge({ name: f.name, tier: f.tier, vivid: f.vivid, a, b: g });
                  }
                }}
              >
                <span className="tile-name">{g.name}</span>
                <span className="tile-sub">{g.isBase ? "RADICAL" : `${g.scores.density}% INK`}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`layer forge-wrap ${cinema || !activeForge ? "hidden" : ""}`}>
        {activeForge && (
          <form
            className="forge-card"
            onSubmit={(e) => {
              e.preventDefault();
              submitForge(thought);
            }}
          >
            <div className="forge-head">
              <div>
                <div className="forge-eq">
                  {activeForge.existing
                    ? `RE-FORGE · CURRENT ${activeForge.existing.scores.density}%`
                    : `${activeForge.a?.name} + ${activeForge.b?.name}`}
                </div>
                <div className="forge-word">
                  {activeForge.name.charAt(0) + activeForge.name.slice(1).toLowerCase()}
                </div>
              </div>
              <button type="button" className="forge-close" onClick={() => setActiveForge(null)}>
                Close ✕
              </button>
            </div>

            <div className="input-row">
              <input
                ref={inputRef}
                className="thought-input"
                type="text"
                maxLength={220}
                autoComplete="off"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="Define what this feels like in one concrete human sentence…"
              />
              <button type="submit" disabled={submitting} className="sculpt-btn">
                {submitting ? "…" : "Sculpt Ink"}
              </button>
            </div>

            <div className="metrics-row">
              <div className="metric">
                <div className="metric-head">
                  <span>Humanity</span>
                  <span className="metric-val">{metrics ? `${metrics.humanity}%` : "—"}</span>
                </div>
                <div className="metric-track">
                  <div
                    className={`metric-fill${metrics?.isSlop ? " danger" : ""}`}
                    style={{ width: `${metrics ? metrics.humanity : 0}%` }}
                  />
                </div>
              </div>
              <div className="metric">
                <div className="metric-head">
                  <span>Concreteness</span>
                  <span className="metric-val">{metrics ? `${metrics.concreteness}%` : "—"}</span>
                </div>
                <div className="metric-track">
                  <div className="metric-fill" style={{ width: `${metrics ? metrics.concreteness : 0}%` }} />
                </div>
              </div>
              <div className="metric">
                <div className="metric-head">
                  <span>Originality</span>
                  <span className="metric-val">{metrics ? `${metrics.originality}%` : "—"}</span>
                </div>
                <div className="metric-track">
                  <div className="metric-fill" style={{ width: `${metrics ? metrics.originality : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="forge-foot">
              <div className="presets">
                <button
                  type="button"
                  className="preset-link"
                  onClick={() => {
                    setThought(activeForge.vivid);
                    submitForge(activeForge.vivid);
                  }}
                >
                  Vivid Human
                </button>
                <button
                  type="button"
                  className="preset-link"
                  onClick={() => {
                    const v = "It is just a sad feeling you get when you miss old times and think about things.";
                    setThought(v);
                    submitForge(v);
                  }}
                >
                  Vague Human
                </button>
                <button
                  type="button"
                  className="preset-link"
                  onClick={() => {
                    const s = "Nostalgia is a holistic tapestry of sentimental longing that unlocks cherished memories in today's evolving landscape.";
                    setThought(s);
                    submitForge(s);
                  }}
                >
                  AI Slop
                </button>
              </div>
              <span className={`forge-status${statusDanger ? " danger" : ""}`}>{forgeStatus}</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
