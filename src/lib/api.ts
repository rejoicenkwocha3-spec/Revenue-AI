import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { getAppContext, type AppContext } from "@/lib/session";
import { can, type Action } from "@/lib/permissions";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler with consistent error responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return json({ error: err.message, code: err.code }, err.status);
      if (err instanceof ZodError) {
        return json({ error: err.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") }, 400);
      }
      console.error("[api]", err);
      const message = err instanceof Error ? err.message : "Unexpected server error";
      return json({ error: message }, 500);
    }
  };
}

export async function requireUser(action?: Action): Promise<AppContext> {
  const ctx = await getAppContext();
  if (!ctx) throw new ApiError(401, "Sign in to continue.");
  if (action && !can(ctx.role, action)) {
    throw new ApiError(403, "Your role does not allow this action. Ask a workspace administrator for access.");
  }
  return ctx;
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.parse(raw);
}
