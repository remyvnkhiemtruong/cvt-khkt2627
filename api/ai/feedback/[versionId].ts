export default function handler(req: any, res: any) { res.status(503).json({ code:"AI_FEEDBACK_DISABLED", message:"AI feedback is intentionally disabled in the current research phase." }); }
