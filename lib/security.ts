import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { rpc } from "./supabase";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const newAccess = () => {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: hash(token),
    url: `${siteUrl()}/reservation/${token}`,
  };
};
export function siteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (process.env.NODE_ENV === "production" && !url.startsWith("https://"))
    throw new Error("A secure production URL is required.");
  return url.replace(/\/$/, "");
}
export function sameOrigin(request: Request) {
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
    .origin;
  if (request.headers.get("origin") !== expected)
    throw new Error("Request origin is not allowed.");
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw new Error("Use a JSON request.");
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16000) throw new Error("Request is too large.");
}
export async function limitedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Request is too large.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts).toString("utf8");
}
export async function jsonBody(request: Request) {
  return JSON.parse(await limitedBody(request, 16000));
}
export async function protect(
  request: Request,
  bot: string | undefined,
  scope: string,
  email = "",
) {
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  if (!process.env.RATE_LIMIT_SALT && process.env.NODE_ENV === "production")
    throw new Error("Submissions are temporarily unavailable.");
  const key = hash(
    `${process.env.RATE_LIMIT_SALT || "local-only"}:${scope}:${ip}`,
  );
  if (
    !(await rpc<boolean>("consume_rate_limit", {
      p_key: key,
      p_limit: scope === "availability" ? 120 : 8,
    }))
  )
    throw new Error("Too many attempts. Please try again later.");
  if (
    email &&
    !(await rpc<boolean>("consume_rate_limit", {
      p_key: hash(
        `${process.env.RATE_LIMIT_SALT || "local-only"}:${scope}:${email.toLowerCase()}`,
      ),
      p_limit: 5,
    }))
  )
    throw new Error("Too many attempts. Please try again later.");
  if (scope === "availability") return;
  if (process.env.TURNSTILE_SECRET_KEY) {
    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: bot || "",
          remoteip: ip,
        }),
      },
    ).then((r) => r.json());
    if (!result.success)
      throw new Error("Please complete the verification and try again.");
  } else if (process.env.NODE_ENV === "production")
    throw new Error("Submissions are temporarily unavailable.");
}
export function validCron(request: Request) {
  const expected = process.env.CRON_SECRET;
  const actual =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  return (
    !!expected &&
    Buffer.byteLength(actual) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  );
}
export function apiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Could not complete the request.";
  console.error("[LOVE API]", message);
  const safe =
    /not open|not configured|temporarily unavailable|Too many|verification|Request|Choose|bookable|available|deadline|capacity|Terms|permission|Sign in|expired|pending|hold|approved|secure|Only|Insufficient|not found/i.test(
      message,
    );
  return Response.json(
    {
      error: safe
        ? message
        : "We couldn’t complete this request. Please try again.",
    },
    { status: /not open|not configured|temporarily/.test(message) ? 503 : 400 },
  );
}
