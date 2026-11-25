# ARRIVAL — Heptapod Alchemy

**Live App:** https://heptapod-alchemy.vercel.app/

> *Inspired by Denis Villeneuve's **Arrival** and Ted Chiang's **Story of Your Life** — built for the SF Non-Slop Hackathon.*

In *Arrival*, heptapods write in closed circular ink logograms because they perceive an entire thought simultaneously. Large language models do the opposite: they generate left-to-right, predicting the average next token.

**Heptapod Alchemy** is a playable 3D *Arrival* chamber where you co-invent a non-linear human lexicon behind the misty glass — and where **Pangram v4** acts as the physical law of the room. A machine cannot define a word it has never lived.

---

## How It Works

1. **Walk Into the Shell (`↑ / W`, `← →`, `↓`):**
   Step through the obsidian corridor up to the glowing glacier-teal misty glass barrier.
2. **Fuse Ink Radicals (4-Tier Discovery Tree):**
   Start with 6 base radicals (`TIME`, `LOSS`, `VOICE`, `DISTANCE`, `LIGHT`, `BODY`). Select any two glyphs to fuse them into deeper human concepts (`TIME + LOSS → NOSTALGIA`, `NOSTALGIA + DISTANCE → HOMESICKNESS`, `NOSTALGIA + TIME → ★ ARRIVAL`).
3. **Sculpt the Ink (3-Axis Physics + Live Pangram v4):**
   To claim a discovered word, define what it actually feels like in one human sentence. Your definition is scored across three axes that **physically sculpt the calligraphic ink ring**:
   - **Humanity (Live Pangram v4 API):** Gates whether the glyph holds. AI slop (`>= 50% AI`) bleaches the mist into cold sterile static and rejects the glyph.
   - **Concreteness:** Sensory and lived detail controls stroke weight and ring closure. Vague human answers produce thin, pale rings; vivid lived memories thicken into velvety sumi-e ink.
   - **Originality:** Lexical diversity and cliché avoidance grow dense Martine Bertrand-style ink crowns and curved brush tendrils.
4. **Re-Forge & Chain:**
   Click any claimed glyph twice to rewrite it with sharper sensory detail and raise your overall **Lexicon Resonance**, or fuse it with another glyph to climb toward **`★ ARRIVAL`**. Press **`H`** anytime for full-screen Cinema Mode.

---

## Stack

- **3D & Shaders:** Three.js WebGL + custom GLSL volumetric drifting-mist & sterile-static fragment shader + 420 floating 3D chamber dust particles
- **Ink Engine:** Multi-pass 240-puff liquid-smoke calligraphic renderer driven live by `(Humanity, Concreteness, Originality)`
- **Authenticity Gate:** Live **Pangram v4** (`pangram-4` task API) via Vercel Serverless Function (`/api/verify`)
- **Audio:** Web Audio API generative low cello/sub-bass drone + harmonic seal chimes

---

## Run Locally

```bash
npm install
npm run dev
```

Set `PANGRAM_API_KEY` in your Vercel Project Environment Variables (or local backend `.env`) to enable live Pangram v4 scoring on `/api/verify`.
