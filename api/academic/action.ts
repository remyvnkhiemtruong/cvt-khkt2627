import { authenticate, body, send } from "../auth/auth.js";
import { academicAction } from "../_lib/academic.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return send(res, 405, { code: "METHOD_NOT_ALLOWED" });
  try {
    const user = await authenticate(req);
    if (!user) return send(res, 401, { code: "UNAUTHENTICATED" });
    const result = await academicAction(user, body(req), req);
    return send(res, 200, result);
  } catch (error: any) {
    const code = String(error?.message || "ACADEMIC_ACTION_ERROR");
    let status = 500;
    if (code === "FORBIDDEN" || code.endsWith("_FORBIDDEN") || code === "FORBIDDEN_STUDENT_RUBRIC") {
      status = 403;
    } else if (code.includes("NOT_FOUND")) {
      status = 404;
    } else if (code.startsWith("INVALID") || code === "EMPTY_RESPONSE" || code.includes("REQUIRED") || code === "CANNOT_PEER_REVIEW_SELF" || code === "VALIDATION_ERROR") {
      status = 400;
    }
    return send(res, status, { code, message: code });
  }
}
