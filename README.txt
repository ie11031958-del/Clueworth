CLUEWORTH — AI NONSENSE APPRAISAL ENGINE

This package contains:
- public/index.html — the ClueWorth page
- src/worker.js — the AI appraisal endpoint
- wrangler.jsonc — Cloudflare configuration, including the Workers AI binding

What this version does
1. The visitor types one clue.
2. The page sends it to /api/appraise.
3. Cloudflare Workers AI creates a clue-specific comedy valuation.
4. The page displays an everyday value, an exaggerated value and a dry verdict.
5. Share My Valuation creates a 1080x1920 share card.

IMPORTANT
This is a full Cloudflare Worker + static-assets project, not a static-site-only ZIP.
The AI binding is declared as AI in wrangler.jsonc, so there is no API key in the browser.

Cloudflare's current documentation says Workers AI requires an AI binding and exposes it
to the Worker as env.AI. Static assets can be bundled with Worker code using the assets
configuration in wrangler.jsonc.

Do not upload this ZIP into the old "Upload your static files" screen expecting the AI
Worker to be created automatically. That screen is for static assets only.
