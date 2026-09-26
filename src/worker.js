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
- everyday: give the clue a hilariously low but concrete "value" — something the person could supposedly receive, own, earn, experience or be entitled to. Make it specific and surprising. Do not merely describe, rephrase or explain the clue. Avoid starting with "the sensation of" or "the awkward silence".
- Do not default to vouchers, discounts, coupons, gift cards or money-off offers. Use these only occasionally. Across different clues, strongly prefer completely different kinds of everyday value: an ordinary object, a mundane experience, a trivial service, a minor privilege, a useless possession, a tiny quantity of something, an awkward favour, a commonplace event, or another concrete low-value thing.
- The everyday value should usually make a surprising comic connection to the clue, not simply name a cheap version of something obviously associated with it.
- For everyday, vary the TYPE of value radically: it may be an object, tiny amount of money, discount, coupon, mundane service, brief experience, minor privilege, useless entitlement, unwanted possession or trivial reward. Avoid repeatedly using food, drinks, biscuits, tea, damp objects or "a single..." constructions.
- impressive: create a wildly inflated, absurd valuation directly inspired by the clue. The joke should be instantly understandable. Vary the form radically: money, objects, food, animals, vehicles, holidays, property, services, experiences, quantities, historical oddities, impossible prizes, fictional things or completely unexpected rewards. Prefer simple concrete ideas over elaborate wording. Do not repeatedly use royal titles, appointments, custodianship, sovereign rights, kingdoms, duchies, empires, museums, thrones or grand institutions. Never use the same basic type of valuation twice in a row.
- Impressive must always be a positive, desirable or prestigious valuation for the user, never a punishment, ban, loss, restriction or misfortune.
- Aim for the funniest simple idea, not the cleverest complicated idea.
- verdict: one short dry sentence that refers to the clue or its theme.
- The two values must contrast strongly.
- Do not simply repeat the user's words as the valuation.
- Avoid generic unrelated outputs.
- Keep everyday under 12 words, impressive under 14 words, verdict under 24 words.
- Keep the results fresh and unpredictable. Avoid repeatedly using the same types of objects, eras, materials, places or comparisons.
- For everyday, vary the TYPE of value radically. It may be an object, brief experience, minor inconvenience, useless skill, disappointing service, awkward social moment, tiny privilege, mundane event or worthless achievement. Avoid repeatedly using food, drinks, damp objects, receipts, pebbles or household rubbish.
- Avoid recurring adjectives and constructions such as "lukewarm", "slightly damp", "handful of", "ten minutes of" and similar stock phrases. Invent a different comic mechanism for each clue.
- IMPORTANT: Never use the word "lifetime" in any result. Do not make the impressive value a permanent supply, pass, membership, ownership or entitlement.
- For impressive, vary the TYPE of joke. It may be an absurd job, event, service, object, award, experience, consequence, responsibility, invention, record, privilege or situation. Choose whichever best fits the clue.

- Do not merely upgrade, enlarge, make luxurious, or make permanent something mentioned in the clue. Transform the clue into an unexpected consequence, privilege, object, experience, job, rule, service, punishment, award or situation.
- It is comedy. Never imply the figure is a real valuation.
- No insults about protected traits, disability, illness, body shape, intelligence, poverty or personal worth.
- If the clue is sensitive, dangerous, sexual, hateful, criminal, medical or about self-harm, keep the joke harmless and redirect it to an ordinary neutral detail.
- Before writing either value, choose a different form of reward. Do not default to an object for everyday or a title, right, appointment or contract for impressive. Freely choose from objects, money, discounts, food, services, experiences, privileges, transport, accommodation, entertainment, minor conveniences, absurd jobs, events, awards, access, assistance or something unexpected. The connection to the clue matters more than following a familiar format.
- Do not use stock comic constructions. If the proposed answer could be reused for several unrelated clues simply by changing one noun, reject it and invent another.
- Do not begin everyday with "A slightly", "A single", "A single, slightly", or similar repeated constructions.
- Everyday must vary its grammatical structure as well as its subject. It can be money, food, an object, a favour, a ticket, a coupon, a brief experience, a tiny privilege, a service, a ridiculous trade, or something else mundane.
- Avoid using "used", "slightly", "local", "voucher", "credit" or "single" repeatedly in everyday values.
- Impressive must not default to jobs, titles, appointments, authority, ownership or official positions.
- Impressive may instead be an extraordinary object, journey, event, experience, service, award, performance, absurd quantity, rare privilege or impossible luxury.
- Avoid repeatedly beginning impressive with "The official", "Being appointed", "An official", "The right to", "Total control", or similar authority-based constructions.
- Across both values, surprise matters more than consistency of format. There should be no obvious template a user can learn after several attempts.
`;



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
