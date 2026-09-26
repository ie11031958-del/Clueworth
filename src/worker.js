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
- Treat every clue as a completely new comedy problem.
- NEVER use the words "slightly", "used", "local", "voucher", "credit" or "single" in either valuation.
- Do not simply describe, resize, improve, worsen, prolong or make prestigious the thing mentioned in the clue.
- Do not turn a physical characteristic into a matching miniature, enormous, luxury or specially fitted object.
- Do not simply give the user a job, title, appointment, authority, ownership, official position or special status.
- Do not begin impressive with "The official", "Being appointed", "An official", "The right to", "Total control" or similar constructions.
- Never use the word "lifetime".
- Avoid generic rewards that could work for many unrelated clues.
- The two valuations must use TWO DIFFERENT comic ideas, not two versions of the same joke.

COMEDY METHOD:
- First identify the most obvious joke suggested by the clue. REJECT IT.
- Identify a second obvious joke. REJECT THAT TOO.
- Now make an unexpected sideways connection using a different subject.
- Look for consequences, misunderstandings, obscure uses, bureaucracy, history, science, animals, transport, food, household life, geography, sport, culture or everyday social situations.
- The connection must still make sense when the reader remembers the original clue.
- Prefer a specific surprising image over a generic reward.
- Absurdity should come from the connection, not merely from making something expensive, tiny, huge, royal or luxurious.

EVERYDAY VALUE:
- Make this genuinely mundane, inconvenient, cheap, petty or disappointingly useful.
- It can be an action, consequence, privilege, object, quantity, service, avoidance or tiny practical advantage.
- Do not default to an object with an adjective in front of it.

IMPRESSIVE VALUE:
- Take the clue somewhere the reader is unlikely to predict.
- It may involve an extraordinary event, discovery, object, journey, historical consequence, scientific breakthrough, impossible service, performance or absurd achievement.
- Grandeur alone is not enough. The comic connection must be unexpected.

VERDICT:
- The verdict must add a THIRD joke.
- Do not merely explain either valuation.
- Keep it dry, short and specifically connected to the clue or the absurd consequences above.

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
