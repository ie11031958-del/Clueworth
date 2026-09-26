const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers});
}

function cleanObject(text) {
  let s = String(text || "").trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

function valid(o) {
  return o && typeof o.everyday === "string" &&
    typeof o.impressive === "string" && typeof o.verdict === "string" &&
    o.everyday.length <= 100 && o.impressive.length <= 120 && o.verdict.length <= 180;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/appraise") {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "POST") return json({error:"Method not allowed"},405);

    let body;
    try { body = await request.json(); } catch { return json({error:"Invalid request"},400); }
    const clue = String(body?.clue || "").replace(/\s+/g," ").trim().slice(0,240);
    if (!clue) return json({error:"A clue is required"},400);

    const system = `You write results for ClueWorth, a British comedy "nonsense appraisal" website.
The user gives one irrelevant fact or clue about themselves. Create a funny valuation that CLEARLY relates to that exact clue.

Return ONLY valid JSON with exactly these keys:
{"everyday":"...","impressive":"...","verdict":"..."}

Rules:
- British English and £ where money appears.
- everyday: create a funny, disappointingly ordinary value connected to the clue. Vary the FORM radically between answers: it may be a tiny amount of money, a mundane object, a quantity of something, a minor service, a brief experience, something borrowed, something found, something used, a trivial privilege, an everyday chore, or another low-stakes comparison. Do not default to describing one shabby object. Avoid repeatedly starting with "a single", "a slightly", "a half-eaten", "a used", "a packet of" or similar formulas.
- impressive: create a wildly inflated, absurd and clue-related valuation. Vary the FORM radically: it may be an impossible amount of money, ownership of something extraordinary, a ridiculous title or honour, a historical treasure, an extravagant service, an impossible experience, a vast quantity, a famous landmark, a fictional asset, an institution, a bizarre privilege, or something completely unexpected. Do not default to luxury possessions, private experiences, kingdoms, empires, thrones, museums or enormous versions of the clue. The connection to the clue should be recognisable but surprising.
- verdict: one short dry sentence that refers to the clue or its theme.
- The two values must contrast strongly.
- Do not simply repeat the user's words as the valuation.
- Avoid generic unrelated outputs.
- Keep everyday under 12 words, impressive under 14 words, verdict under 24 words.
- Keep the results fresh and unpredictable. Avoid repeatedly using the same types of objects, eras, materials, places or comparisons.
- It is comedy. Never imply the figure is a real valuation.
- No insults about protected traits, disability, illness, body shape, intelligence, poverty or personal worth.
- If the clue is sensitive, dangerous, sexual, hateful, criminal, medical or about self-harm, keep the joke harmless and redirect it to an ordinary neutral detail.`;

    try {
      const response = await env.AI.run(MODEL, {
        messages: [
          {role:"system", content:system},
          {role:"user", content:`Clue: ${JSON.stringify(clue)}`}
        ],
        max_tokens: 220,
        temperature: 1.05,
        chat_template_kwargs: {enable_thinking:false}
      });

      const text = response?.choices?.[0]?.message?.content ?? response?.response ?? "";
      const out = cleanObject(text);
      if (!valid(out)) throw new Error("Bad model output");
      return json(out);
    } catch (e) {
      console.error("ClueWorth appraisal error", e);
      return json({error:"The appraisal department is temporarily unavailable."},500);
    }
  }
};
