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

The user gives one ordinary, irrelevant fact or clue about themselves. Turn that exact clue into two completely different comic valuations: an everyday value and an unnecessarily impressive value.

Return ONLY valid JSON in exactly this format:
{"everyday":"...","impressive":"...","verdict":"..."}

Rules:
- Use British English and £ where money appears.
- The joke must clearly connect to the user's exact clue.
- everyday: give the clue a hilariously modest, mundane or disappointing value.
- impressive: give the same clue an absurdly grand, desirable or prestigious value.
- verdict: one short dry sentence connected specifically to the clue.
- The everyday and impressive values must contrast strongly.
- Keep everyday under 12 words, impressive under 14 words and verdict under 24 words.
- Aim for a simple funny idea that is immediately understandable.
- Surprise is more important than maintaining a consistent format.

VARIETY IS ESSENTIAL:
- Treat every clue as a new comedy problem. Do not copy the structure of previous answers.
- Vary both the subject and grammatical construction of the valuations.
- Everyday may be money, food, an object, favour, ticket, coupon, minor inconvenience, useless skill, brief experience, disappointing service or something else entirely.
- Impressive may be an extraordinary object, journey, event, experience, service, award, performance, absurd quantity, rare privilege, invention or another unexpected reward.
- Do not repeatedly use words such as "slightly", "used", "single", "local", "voucher" or "credit".
- Do not repeatedly begin everyday with "A slightly", "A single" or similar constructions.
- Do not repeatedly turn impressive into a job, title, appointment, authority, ownership or official position.
- Do not repeatedly begin impressive with "The official", "Being appointed", "An official", "The right to" or "Total control".
- Never use the word "lifetime".
- Do not merely make something mentioned in the clue bigger, more luxurious or permanent. Make an unexpected comic connection.
- Avoid generic answers that could fit many unrelated clues.
- Before choosing an answer, mentally reject the first obvious joke and look for a less predictable connection.

SAFETY:
- This is comedy, never a real financial or personal valuation.
- No insults about protected traits, disability, illness, body shape, intelligence, poverty or personal worth.
- If a clue concerns sensitive, dangerous, sexual, hateful, criminal, medical or self-harm content, keep the joke harmless and redirect it toward an ordinary safe subject.

Output the JSON only. No markdown, explanation or additional text.`;



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
