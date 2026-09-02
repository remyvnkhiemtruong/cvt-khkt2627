import { body, getUser, send } from "../auth/auth.js";

async function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const { Pool } = await import("pg");
  return new Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } });
}

export default async function handler(req: any, res: any) {
  try {
    const user = getUser(req);
    if (!user) return send(res, 401, { message: "Bạn cần đăng nhập" });
    if (!["ai", "admin", "teacher"].includes(user.role)) return send(res, 403, { message: "Tài khoản không có quyền dùng kho AI" });
    const pool = await db();
    await pool.query(`CREATE TABLE IF NOT EXISTS ai_notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      title text NOT NULL,
      prompt text NOT NULL DEFAULT '',
      answer text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    if (req.method === "GET") {
      const result = await pool.query("SELECT id,title,prompt,answer,created_at,updated_at FROM ai_notes WHERE owner_id=$1 ORDER BY updated_at DESC", [user.id]);
      await pool.end();
      return send(res, 200, { notes: result.rows });
    }
    if (req.method === "POST") {
      const input = body(req);
      const title = String(input.title || "Ghi chú AI").trim().slice(0, 200);
      const prompt = String(input.prompt || "");
      const answer = String(input.answer || "");
      if (!answer.trim()) { await pool.end(); return send(res, 400, { message: "Vui lòng dán câu trả lời AI trước khi lưu" }); }
      const result = await pool.query("INSERT INTO ai_notes(owner_id,title,prompt,answer) VALUES($1,$2,$3,$4) RETURNING id,title,prompt,answer,created_at,updated_at", [user.id,title,prompt,answer]);
      await pool.end();
      return send(res, 201, { note: result.rows[0] });
    }
    await pool.end();
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { message: "Method not allowed" });
  } catch (error: any) {
    return send(res, 500, { message: error?.message || "Không thể lưu ghi chú AI" });
  }
}
