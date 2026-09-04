import { randomUUID } from "node:crypto";
import { authenticate, body, send } from "../auth/auth.js";
import { academicAction } from "../_lib/academic-v2.js";

export default async function handler(req: any, res: any) {
  const startedAt = Date.now();
  const requestId = String(req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"] || randomUUID());
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "POST") return send(res, 405, { code: "METHOD_NOT_ALLOWED" });

  try {
    const authStartedAt = Date.now();
    const user = await authenticate(req);
    const authMs = Date.now() - authStartedAt;
    if (!user) {
      res.setHeader("Server-Timing", `auth;dur=${authMs}, total;dur=${Date.now() - startedAt}`);
      return send(res, 401, { code: "UNAUTHENTICATED" });
    }

    const actionStartedAt = Date.now();
    const result = await academicAction(user, body(req), req);
    const actionMs = Date.now() - actionStartedAt;
    res.setHeader("Server-Timing", `auth;dur=${authMs}, action;dur=${actionMs}, total;dur=${Date.now() - startedAt}`);
    return send(res, 200, result);
  } catch (error: any) {
    const code = String(error?.message || "ACADEMIC_ACTION_ERROR");
    let status = 500;
    if (
      code === "FORBIDDEN" ||
      code.endsWith("_FORBIDDEN") ||
      code === "FORBIDDEN_STUDENT_RUBRIC"
    ) {
      status = 403;
    } else if (code.includes("NOT_FOUND")) {
      status = 404;
    } else if (
      code.startsWith("INVALID") ||
      code === "EMPTY_RESPONSE" ||
      code.includes("REQUIRED") ||
      code === "CANNOT_PEER_REVIEW_SELF" ||
      code === "VALIDATION_ERROR" ||
      code === "PREDICTION_ALREADY_SUBMITTED" ||
      code === "PEER_REVIEWER_INVALID" ||
      code === "PEER_STUDENT_INVALID"
    ) {
      status = 400;
    }

    console.error("[academic/action]", {
      requestId,
      code,
      status,
      route: "/api/academic/action",
      region: process.env.VERCEL_REGION || "unknown",
      durationMs: Date.now() - startedAt
    });
    res.setHeader("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    return send(res, status, { code, message: code, requestId });
  }
}
