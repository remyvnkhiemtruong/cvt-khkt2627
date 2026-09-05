/// <reference types="node" />
import { randomUUID } from "node:crypto";
import { authenticate, send } from "../auth/auth.js";
import { getAcademicSnapshot } from "../_lib/academic-v3.js";

export default async function handler(req: any, res: any) {
  const startedAt = Date.now();
  const requestId = String(req.headers?.["x-vercel-id"] || req.headers?.["x-request-id"] || randomUUID());
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Request-Id", requestId);

  if (req.method !== "GET") return send(res, 405, { code: "METHOD_NOT_ALLOWED" });

  try {
    const authStartedAt = Date.now();
    const user = await authenticate(req);
    const authMs = Date.now() - authStartedAt;
    if (!user) {
      res.setHeader("Server-Timing", `auth;dur=${authMs}, total;dur=${Date.now() - startedAt}`);
      return send(res, 401, { code: "UNAUTHENTICATED" });
    }

    const dataStartedAt = Date.now();
    const snapshot = await getAcademicSnapshot(user);
    const dataMs = Date.now() - dataStartedAt;
    res.setHeader("Server-Timing", `auth;dur=${authMs}, data;dur=${dataMs}, total;dur=${Date.now() - startedAt}`);
    return send(res, 200, { snapshot, requestId });
  } catch (error: any) {
    const code = String(error?.message || "ACADEMIC_SNAPSHOT_ERROR");
    console.error("[academic/snapshot]", {
      requestId,
      code,
      route: "/api/academic/snapshot",
      region: process.env.VERCEL_REGION || "unknown",
      durationMs: Date.now() - startedAt,
      stack: process.env.NODE_ENV === "production" ? undefined : error?.stack
    });
    res.setHeader("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    return send(res, 500, { code: "ACADEMIC_SNAPSHOT_ERROR", message: "Không thể tải dữ liệu học tập.", requestId });
  }
}
