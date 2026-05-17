import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Context, Next } from "hono";

export const corsMiddleware = cors({
  origin: [
    process.env.FRONTEND_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
  maxAge: 600,
  credentials: true,
});

export const loggerMiddleware = logger();

// Global error handler
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error("[Error]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return c.json({ success: false, error: message }, 500);
  }
}

export async function userIdMiddleware(c: Context, next: Next) {
  const userId = c.req.header("X-User-Id");
  if (!userId || userId.trim() === "") {
    return c.json(
      { success: false, error: "X-User-Id header is required" },
      401,
    );
  }
  c.set("userId", userId.trim());
  await next();
}
