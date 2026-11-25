const SLOP_MARKERS = [
  /\bin today'?s\b/i, /\brapidly evolving\b/i, /\bfast-paced\b/i, /\bunlock(s|ing)?\b/i,
  /\bsynergy\b/i, /\bgame[- ]changing\b/i, /\btestament\b/i, /\btapestry\b/i,
  /\bdelve(d)?\b/i, /\bseamless(ly)?\b/i, /\bholistic\b/i, /\bcomprehensive\b/i,
  /\belevat(e|ing)\b/i, /\binnovation\b/i, /\brobust\b/i, /\bempowers?\b/i,
  /\bsentimental longing\b/i, /\bcherished memories\b/i,
];

function heuristicScore(text) {
  let hits = 0;
  for (const rx of SLOP_MARKERS) if (rx.test(text)) hits += 1;
  const aiProb = hits >= 3 ? 0.96 : hits === 2 ? 0.82 : hits === 1 ? 0.56 : 0.02;
  return {
    aiProb,
    isSlop: aiProb >= 0.5,
    source: "heuristic-fallback",
    headline: aiProb >= 0.5 ? "Synthetic Phrasing Detected" : "Verified Human Expression",
  };
}

async function scorePangram(text, apiKey) {
  const submit = await fetch("https://text.external-api.pangram.com/task", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      model: "pangram-4",
      public_dashboard_link: false,
    }),
  });
  if (!submit.ok) throw new Error(`Pangram HTTP ${submit.status}`);
  const { task_id: taskId } = await submit.json();

  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 350));
    const poll = await fetch(`https://text.external-api.pangram.com/task/${encodeURIComponent(taskId)}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!poll.ok) continue;
    const data = await poll.json();
    if (data.stage === "STAGE_SUCCESS" || typeof data.fraction_ai === "number") {
      const aiProb = Number(Math.max(data.fraction_ai || 0, data.fraction_ai_assisted || 0).toFixed(2));
      return {
        aiProb,
        isSlop: aiProb >= 0.5,
        source: "pangram-4",
        headline: data.headline || (aiProb >= 0.5 ? "AI-Generated" : "Human Written"),
      };
    }
  }
  throw new Error("Pangram polling timeout");
}

export default async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim().slice(0, 2000) : "";
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  const apiKey = process.env.PANGRAM_API_KEY || "";
  if (apiKey && text.split(/\s+/).length >= 4) {
    try {
      const result = await scorePangram(text, apiKey);
      return res.status(200).json(result);
    } catch {
      return res.status(200).json(heuristicScore(text));
    }
  }
  return res.status(200).json(heuristicScore(text));
}
