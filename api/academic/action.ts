/// <reference types="node" />
import { randomUUID } from "node:crypto";
import { authenticate, body, send } from "../auth/auth.js";
import { academicAction } from "../_lib/academic-v3.js";

const clientMessage = (code: string) => {
  const messages: Record<string, string> = {
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    TEACHER_CLASS_FORBIDDEN: "Bạn không được phân công lớp này.",
    PEER_ASSIGNMENT_FORBIDDEN: "Bài hoặc phiên bản này không được phân công cho bạn.",
    PORTFOLIO_NOT_FOUND: "Không tìm thấy hồ sơ phù hợp.",
    VERSION_NOT_FOUND: "Không tìm thấy phiên bản bất biến phù hợp.",
    VERSION_REQUIRED: "Cần chọn đúng phiên bản đã nộp.",
    SUBMISSION_KEY_REQUIRED: "Khóa nộp bài không hợp lệ. Vui lòng thử lại.",
    SCHEMA_MIGRATION_REQUIRED: "Hệ thống đang nâng cấp dữ liệu ngữ liệu. Vui lòng thử lại sau.",
    CSRF_ORIGIN_MISMATCH: "Yêu cầu không hợp lệ.",
    VALIDATION_ERROR: "Dữ liệu gửi lên không hợp lệ."
  };
  if (code.startsWith("INVALID_RUBRIC_LEVEL")) return "Mức rubric không hợp lệ.";
  return messages[code] || "Không thể thực hiện thao tác. Vui lòng thử lại.";
};

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
    if (code === "CSRF_ORIGIN_MISMATCH" || code === "FORBIDDEN" || code.endsWith("_FORBIDDEN") || code === "FORBIDDEN_STUDENT_RUBRIC") status = 403;
    else if (code.includes("NOT_FOUND")) status = 404;
    else if (code.startsWith("INVALID") || code.includes("REQUIRED") || code === "EMPTY_RESPONSE" || code === "CANNOT_PEER_REVIEW_SELF" || code === "VALIDATION_ERROR" || code === "PREDICTION_ALREADY_SUBMITTED" || code === "PEER_REVIEWER_INVALID" || code === "PEER_STUDENT_INVALID" || code === "CONTENT_TOO_LARGE" || code === "SCHEMA_MIGRATION_REQUIRED") status = 400;

    console.error("[academic/action]", {
      requestId,
      code,
      status,
      route: "/api/academic/action",
      region: process.env.VERCEL_REGION || "unknown",
      durationMs: Date.now() - startedAt
    });
    res.setHeader("Server-Timing", `total;dur=${Date.now() - startedAt}`);
    return send(res, status, { code, message: clientMessage(code), requestId });
  }
}
