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

function renderFrontendHTML() {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ClueWorth — Official Nonsense Valuations</title>
  <style>
    :root {
      --bg: #f8fafb;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --green-dark: #0f766e;
      --green-bg: #f0fdf4;
      --green-border: #bbf7d0;
      --yellow-bg: #fffbeb;
      --yellow-border: #fef08a;
      --radius: 16px;
      --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      margin: 0;
      padding: 32px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    .container {
      max-width: 500px;
      width: 100%;
    }

    /* Form Header */
    .hero {
      text-align: center;
      margin-bottom: 24px;
    }

    .logo {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }

    .logo span { color: var(--green-dark); }

    .subtitle {
      color: var(--text-muted);
      font-size: 15px;
      margin: 0;
    }

    /* Input Section */
    .input-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      margin-bottom: 24px;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="text"] {
      width: 100%;
      padding: 12px 14px;
      font-size: 16px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      outline: none;
      font-family: inherit;
    }

    input[type="text"]:focus {
      border-color: var(--green-dark);
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
    }

    button.submit-btn {
      width: 100%;
      margin-top: 12px;
      padding: 14px;
      background-color: var(--green-dark);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    button.submit-btn:hover {
      background-color: #0d655e;
    }

    button.submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Appraisal Card Container */
    .card-wrap {
      display: none;
      margin-top: 8px;
    }

    .appraisal-card {
      background: var(--card-bg);
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 32px 24px 24px 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      text-align: center;
      position: relative;
    }

    .card-brand {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .card-brand span { color: var(--green-dark); }

    .card-header {
      color: var(--green-dark);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .clue-quote {
      font-style: italic;
      color: #475569;
      font-size: 16px;
      margin-bottom: 24px;
      word-break: break-word;
    }

    .value-box {
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .value-box.everyday {
      background-color: var(--green-bg);
      border: 1px solid var(--green-border);
    }

    .value-box.impressive {
      background-color: var(--yellow-bg);
      border: 1px solid var(--yellow-border);
    }

    .value-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .value-text {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.3;
      color: var(--text);
      margin: 0;
    }

    .divider-or {
      font-size: 11px;
      font-weight: 800;
      color: #94a3b8;
      margin: 8px 0;
      letter-spacing: 1px;
    }

    .verdict-text {
      font-size: 13px;
      color: #475569;
      margin: 20px 0 12px 0;
    }

    .tagline {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 20px;
    }

    /* Permanent Watermark Badge */
    .watermark-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--text);
      color: #ffffff;
      padding: 8px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .watermark-badge span {
      color: #34d399;
      font-weight: 700;
    }

    /* Action Buttons */
    .action-group {
      margin-top: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .btn-action {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      border: none;
    }

    .btn-dl { background-color: var(--green-dark); color: white; }
    .btn-share { background-color: #e2e8f0; color: var(--text); }

    canvas { display: none; }
  </style>
</head>
<body>

  <div class="container">
    <div class="hero">
      <div class="logo">Clue<span>Worth</span></div>
      <p class="subtitle">Scientifically questionable appraisals since 2026.</p>
    </div>

    <div class="input-box">
      <label for="clueInput">Tell us one fact about yourself</label>
      <input type="text" id="clueInput" placeholder="e.g. Digging square holes" maxlength="240" />
      <button class="submit-btn" id="appraiseBtn" onclick="submitAppraisal()">Appraise Clue</button>
    </div>

    <!-- Output Appraisal Card -->
    <div class="card-wrap" id="cardWrap">
      <div class="appraisal-card" id="cardElement">
        <div class="card-brand">Clue<span>Worth</span></div>
        <div class="card-header">YOUR OFFICIAL CLUEWORTH</div>
        <div class="clue-quote" id="outClue">"..."</div>

        <div class="value-box everyday">
          <div class="value-label">YOUR EVERYDAY VALUE</div>
          <p class="value-text" id="outEveryday">-</p>
        </div>

        <div class="divider-or">OR</div>

        <div class="value-box impressive">
          <div class="value-label">YOUR UNNECESSARILY IMPRESSIVE VALUE</div>
          <p class="value-text" id="outImpressive">-</p>
        </div>

        <p class="verdict-text" id="outVerdict">-</p>
        <div class="tagline">Scientifically questionable since 2026</div>

        <!-- Watermark Pill for social shares -->
        <div class="watermark-badge">
          Try yours: <span>clueworth.co.uk</span>
        </div>
      </div>

      <div class="action-group">
        <button class="btn-action btn-dl" onclick="downloadCardImage()">📥 Download Card</button>
        <button class="btn-action btn-share" onclick="shareCard()">🔗 Share Result</button>
      </div>
    </div>
  </div>

  <canvas id="exportCanvas"></canvas>

  <script>
    let currentData = null;
    let currentClue = "";

    async function submitAppraisal() {
      const input = document.getElementById("clueInput");
      const btn = document.getElementById("appraiseBtn");
      const clue = input.value.trim();

      if (!clue) return alert("Please enter a clue first!");

      btn.disabled = true;
      btn.innerText = "Consulting Appraisal Dept...";

      try {
        const res = await fetch("/api/appraise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clue })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        currentData = data;
        currentClue = clue;

        document.getElementById("outClue").innerText = '"' + clue + '"';
        document.getElementById("outEveryday").innerText = data.everyday;
        document.getElementById("outImpressive").innerText = data.impressive;
        document.getElementById("outVerdict").innerText = data.verdict;

        document.getElementById("cardWrap").style.display = "block";
      } catch (err) {
        alert("Appraisal error: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = "Appraise Clue";
      }
    }

    function downloadCardImage() {
      if (!currentData) return;
      const canvas = document.getElementById('exportCanvas');
      const ctx = canvas.getContext('2d');
      const dpr = 2;
      const w = 500, h = 600;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Card Background
      ctx.fillStyle = "#ffffff";
      ctx.roundRect(0, 0, w, h, 16);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.stroke();

      // Brand Title
      ctx.textAlign = "center";
      ctx.font = "800 26px system-ui";
      ctx.fillStyle = "#0f172a";
      ctx.fillText("Clue", w / 2 - 30, 45);
      ctx.fillStyle = "#0f766e";
      ctx.fillText("Worth", w / 2 + 30, 45);

      ctx.font = "700 12px system-ui";
      ctx.fillText("YOUR OFFICIAL CLUEWORTH", w / 2, 68);

      ctx.fillStyle = "#475569";
      ctx.font = "italic 15px system-ui";
      ctx.fillText('"' + currentClue + '"', w / 2, 95);

      // Everyday Box
      ctx.fillStyle = "#f0fdf4";
      ctx.strokeStyle = "#bbf7d0";
      ctx.roundRect(25, 115, w - 50, 110, 12);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "700 11px system-ui";
      ctx.fillText("YOUR EVERYDAY VALUE", w / 2, 138);

      ctx.fillStyle = "#0f172a";
      ctx.font = "800 17px system-ui";
      ctx.fillText(currentData.everyday, w / 2, 175);

      // OR
      ctx.fillStyle = "#94a3b8";
      ctx.font = "800 11px system-ui";
      ctx.fillText("OR", w / 2, 245);

      // Impressive Box
      ctx.fillStyle = "#fffbeb";
      ctx.strokeStyle = "#fef08a";
      ctx.roundRect(25, 260, w - 50, 120, 12);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "700 11px system-ui";
      ctx.fillText("YOUR UNNECESSARILY IMPRESSIVE VALUE", w / 2, 283);

      ctx.fillStyle = "#0f172a";
      ctx.font = "800 17px system-ui";
      ctx.fillText(currentData.impressive, w / 2, 320);

      // Verdict & Tagline
      ctx.fillStyle = "#475569";
      ctx.font = "13px system-ui";
      ctx.fillText(currentData.verdict, w / 2, 415);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px system-ui";
      ctx.fillText("Scientifically questionable since 2026", w / 2, 450);

      // Watermark Badge
      ctx.fillStyle = "#0f172a";
      ctx.roundRect(w / 2 - 100, 490, 200, 36, 999);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 13px system-ui";
      ctx.fillText("Try yours: ", w / 2 - 30, 513);
      ctx.fillStyle = "#34d399";
      ctx.font = "700 13px system-ui";
      ctx.fillText("clueworth.co.uk", w / 2 + 35, 513);

      const link = document.createElement('a');
      link.download = 'clueworth-valuation.png';
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    async function shareCard() {
      if (!currentData) return;
      const shareData = {
        title: 'My ClueWorth Valuation',
        text: 'According to ClueWorth, my clue (' + currentClue + ') is worth: ' + currentData.impressive,
        url: 'https://clueworth.co.uk'
      };

      if (navigator.share) {
        try { await navigator.share(shareData); } catch (e) {}
      } else {
        navigator.clipboard.writeText(shareData.text + " https://clueworth.co.uk");
        alert("Result copied to clipboard!");
      }
    }
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(renderFrontendHTML(), {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname !== "/api/appraise") {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", {status: 404});
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
- NEVER use the word "damp" in a valuation.
- Do not begin a valuation with "Guaranteed", "Guaranteed entry", "Guaranteed immunity" or similar constructions.
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
