import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const Input = z.object({ infinitive: z.string().trim().min(1).max(60) });

const Schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    infinitive: { type: "string" },
    aspect: { type: "string" },
    present: {
      type: "object",
      additionalProperties: false,
      properties: {
        ya: { type: "string" },
        ty: { type: "string" },
        on: { type: "string" },
        my: { type: "string" },
        vy: { type: "string" },
        oni: { type: "string" },
      },
      required: ["ya", "ty", "on", "my", "vy", "oni"],
    },
    past: {
      type: "object",
      additionalProperties: false,
      properties: {
        m: { type: "string" },
        f: { type: "string" },
        n: { type: "string" },
        pl: { type: "string" },
      },
      required: ["m", "f", "n", "pl"],
    },
    imperative: {
      type: "object",
      additionalProperties: false,
      properties: { sg: { type: "string" }, pl: { type: "string" } },
      required: ["sg", "pl"],
    },
  },
  required: ["infinitive", "aspect", "present", "past", "imperative"],
};

// Naive in-memory rate limiter (per worker instance). Best-effort, not strict.
const hits = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || e.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (e.count >= limit) return false;
  e.count++;
  return true;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extra },
  });
}

async function conjugate(infinitive: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Server not configured");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Conjugate the given Russian verb. Return JSON with: infinitive, aspect (imperfective|perfective), present (я/ты/он/мы/вы/они) — for perfective verbs, fill present with the simple-future forms; past (m/f/n/pl); imperative (sg/pl). Use stress marks (combining acute U+0301) on stressed vowels.",
        },
        { role: "user", content: `Verb: ${infinitive}` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "out", strict: true, schema: Schema } },
    }),
  });
  if (resp.status === 429) {
    const err: Error & { status?: number } = new Error("Upstream rate limited");
    err.status = 429;
    throw err;
  }
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`AI error ${resp.status}: ${t.slice(0, 200)}`);
  }
  const j = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = j.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(raw);
}

export const Route = createFileRoute("/api/public/conjugate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const infinitive = url.searchParams.get("verb") ?? url.searchParams.get("infinitive");
        if (!infinitive) {
          return json(
            {
              name: "RussianFlow Conjugation API",
              usage: {
                GET: "/api/public/conjugate?verb=делать",
                POST: "/api/public/conjugate  body: { \"infinitive\": \"делать\" }",
              },
              rate_limit: "30 requests / minute / IP",
              license: "Free for any use. Attribution appreciated: https://faharht1.lovable.app",
            },
            200,
          );
        }
        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
        if (!rateLimit(ip)) return json({ error: "Rate limit exceeded" }, 429);
        const parsed = Input.safeParse({ infinitive });
        if (!parsed.success) return json({ error: "Invalid 'verb' parameter" }, 400);
        try {
          const result = await conjugate(parsed.data.infinitive);
          return json(result, 200, { "Cache-Control": "public, max-age=86400" });
        } catch (e) {
          const err = e as Error & { status?: number };
          return json({ error: err.message }, err.status ?? 500);
        }
      },
      POST: async ({ request }) => {
        const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
        if (!rateLimit(ip)) return json({ error: "Rate limit exceeded" }, 429);
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const parsed = Input.safeParse(body);
        if (!parsed.success) return json({ error: "Body must be { infinitive: string }" }, 400);
        try {
          const result = await conjugate(parsed.data.infinitive);
          return json(result, 200, { "Cache-Control": "public, max-age=86400" });
        } catch (e) {
          const err = e as Error & { status?: number };
          return json({ error: err.message }, err.status ?? 500);
        }
      },
    },
  },
});
