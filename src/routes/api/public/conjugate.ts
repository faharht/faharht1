import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { conjugate } from "@/lib/conjugator";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const Input = z.object({ infinitive: z.string().trim().min(1).max(60) });

// Best-effort in-memory rate limiter (per worker instance).
const hits = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, limit = 120, windowMs = 60_000): boolean {
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

function ipOf(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown"
  );
}

function run(infinitive: string) {
  const parsed = Input.safeParse({ infinitive });
  if (!parsed.success) return json({ error: "Invalid infinitive" }, 400);
  try {
    const result = conjugate(parsed.data.infinitive);
    return json(result, 200, { "Cache-Control": "public, max-age=86400" });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}

export const Route = createFileRoute("/api/public/conjugate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const verb = url.searchParams.get("verb") ?? url.searchParams.get("infinitive");
        if (!verb) {
          return json({
            name: "RussianFlow Conjugation API",
            usage: {
              GET: "/api/public/conjugate?verb=делать",
              POST: "/api/public/conjugate  body: { \"infinitive\": \"делать\" }",
            },
            engine: "rule-based (no AI)",
            rate_limit: "120 requests / minute / IP",
            license: "Free for any use. Attribution appreciated: https://faharht1.lovable.app",
          });
        }
        if (!rateLimit(ipOf(request))) return json({ error: "Rate limit exceeded" }, 429);
        return run(verb);
      },
      POST: async ({ request }) => {
        if (!rateLimit(ipOf(request))) return json({ error: "Rate limit exceeded" }, 429);
        let body: unknown;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
        const parsed = Input.safeParse(body);
        if (!parsed.success) return json({ error: "Body must be { infinitive: string }" }, 400);
        return run(parsed.data.infinitive);
      },
    },
  },
});
