import { ensureSchema } from "../auth/auth.js";

let poolPromise;

async function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!poolPromise) {
    poolPromise = import("pg").then(({ Pool }) => new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    }));
  }
  return poolPromise;
}

const AXES = [
  "plot_situation",
  "character_detail",
  "narrator_pov",
  "space_time",
  "language_tone_symbol",
  "form_argument"
];

const DEFAULT_LEVELS = [
  { level: 1, label: "Chưa đạt", score: 1, description: "Nhận biết còn hạn chế", observableIndicators: [] },
  { level: 2, label: "Đạt", score: 2, description: "Xác định và giải thích được", observableIndicators: [] },
  { level: 3, label: "Khá", score: 3, description: "Phân tích có dẫn chứng và liên hệ", observableIndicators: [] },
  { level: 4, label: "Xuất sắc", score: 4, description: "Phân tích sâu, lập luận thuyết phục", observableIndicators: [] }
];

export function emptyDraft() {
  return Object.fromEntries(AXES.map(axisId => [axisId, { axisId, analysisText: "", evidenceQuotes: [] }]));
}

function wordCount(content) {
  return Object.values(content || {}).reduce((sum, item) => {
    const text = String(item?.analysisText || "").trim();
    return sum + (text ? text.split(/\s+/).length : 0);
  }, 0);
}

function clientIp(req) {
  return String(req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
}

export function assertSameOrigin(req) {
  const origin = String(req.headers?.origin || "");
  if (!origin) return;
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "");
  try {
    if (new URL(origin).host !== host) throw new Error("CSRF_ORIGIN_MISMATCH");
  } catch (error) {
    if (String(error?.message) === "CSRF_ORIGIN_MISMATCH") throw error;
    throw new Error("INVALID_ORIGIN");
  }
}

export async function ensureAcademicSchema() {
  await ensureSchema();
  const p = await db();
  const statements = [
    "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'",
    "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()",
    "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login timestamptz",
    `CREATE TABLE IF NOT EXISTS classes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text UNIQUE NOT NULL, name text NOT NULL,
      school_year text NOT NULL DEFAULT '2026-2027', created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS class_members (
      class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      member_role text NOT NULL CHECK (member_role IN ('student','teacher')), joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(class_id,user_id))`,
    `CREATE TABLE IF NOT EXISTS literature_texts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_id text UNIQUE NOT NULL, title text NOT NULL, author text NOT NULL,
      year_text text NOT NULL DEFAULT '', genre text NOT NULL DEFAULT '', synopsis text NOT NULL DEFAULT '', excerpt text NOT NULL DEFAULT '',
      full_content text NOT NULL DEFAULT '', historical_context text NOT NULL DEFAULT '', tags text[] NOT NULL DEFAULT '{}',
      created_by uuid REFERENCES app_users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS rubrics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_id text UNIQUE NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '',
      created_by uuid REFERENCES app_users(id) ON DELETE SET NULL, is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS rubric_criteria (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), rubric_id uuid NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE, public_id text NOT NULL,
      axis_id text NOT NULL CHECK (axis_id IN ('plot_situation','character_detail','narrator_pov','space_time','language_tone_symbol','form_argument')),
      title text NOT NULL, weight numeric NOT NULL DEFAULT 1, levels_json jsonb NOT NULL DEFAULT '[]'::jsonb, sort_order integer NOT NULL DEFAULT 0,
      UNIQUE(rubric_id,public_id))`,
    `CREATE TABLE IF NOT EXISTS assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), public_id text UNIQUE NOT NULL, class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
      text_id uuid REFERENCES literature_texts(id) ON DELETE SET NULL, rubric_id uuid REFERENCES rubrics(id) ON DELETE SET NULL, title text NOT NULL,
      assigned_at timestamptz NOT NULL DEFAULT now(), deadline timestamptz, difficulty text NOT NULL DEFAULT 'Cơ bản' CHECK (difficulty IN ('Cơ bản','Nâng cao','Chuyên sâu')),
      target_axes text[] NOT NULL DEFAULT '{}', prompt text NOT NULL DEFAULT '', guiding_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
      starter_template jsonb NOT NULL DEFAULT '{}'::jsonb, status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','closed')),
      created_by uuid REFERENCES app_users(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS portfolios (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting','v1_submitted','feedback_received','v2_in_revision','completed')),
      active_version text NOT NULL DEFAULT 'v1.0 (nháp)', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(assignment_id,student_id))`,
    `CREATE TABLE IF NOT EXISTS portfolio_drafts (
      portfolio_id uuid PRIMARY KEY REFERENCES portfolios(id) ON DELETE CASCADE, content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_by uuid REFERENCES app_users(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS portfolio_versions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      version_number text NOT NULL, content_json jsonb NOT NULL, change_summary text NOT NULL DEFAULT '',
      created_by uuid REFERENCES app_users(id) ON DELETE SET NULL, word_count integer NOT NULL DEFAULT 0,
      submitted_at timestamptz NOT NULL DEFAULT now(), UNIQUE(portfolio_id,version_number))`,
    `CREATE TABLE IF NOT EXISTS feedbacks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      version_id uuid REFERENCES portfolio_versions(id) ON DELETE SET NULL,
      axis_id text NOT NULL CHECK (axis_id IN ('plot_situation','character_detail','narrator_pov','space_time','language_tone_symbol','form_argument')),
      selected_snippet text NOT NULL DEFAULT '', comment text NOT NULL, author_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
      author_role text NOT NULL CHECK (author_role IN ('teacher','peer','ai')), resolved boolean NOT NULL DEFAULT false,
      resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS rubric_submissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      version_id uuid REFERENCES portfolio_versions(id) ON DELETE SET NULL, evaluator_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
      evaluator_role text NOT NULL CHECK (evaluator_role IN ('student','peer','teacher')), criterion_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
      overall_feedback text NOT NULL DEFAULT '', total_score numeric NOT NULL DEFAULT 0, max_score numeric NOT NULL DEFAULT 0,
      submitted_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS ai_review_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      version_id uuid NOT NULL REFERENCES portfolio_versions(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
      prompt text NOT NULL DEFAULT '', response text NOT NULL DEFAULT '', reviewer_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
      teacher_review_status text NOT NULL DEFAULT 'pending' CHECK (teacher_review_status IN ('pending','approved','revised','rejected')),
      teacher_note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, UNIQUE(version_id))`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES app_users(id) ON DELETE SET NULL, actor_role text NOT NULL,
      action text NOT NULL, target_type text NOT NULL DEFAULT '', target_id text NOT NULL DEFAULT '', before_json jsonb, after_json jsonb,
      ip_address text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS auth_rate_events (
      id bigserial PRIMARY KEY, event_key text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
    "CREATE INDEX IF NOT EXISTS idx_class_members_user ON class_members(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id,assigned_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_portfolios_student ON portfolios(student_id,updated_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_versions_portfolio ON portfolio_versions(portfolio_id,submitted_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_feedbacks_portfolio ON feedbacks(portfolio_id,created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_ai_reviews_status ON ai_review_requests(status,created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_auth_rate_events_key_time ON auth_rate_events(event_key,created_at DESC)"
  ];
  for (const statement of statements) await p.query(statement);

  await p.query(`CREATE OR REPLACE FUNCTION prevent_portfolio_version_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'portfolio_versions are immutable'; END $$`);
  await p.query("DROP TRIGGER IF EXISTS portfolio_versions_immutable_update ON portfolio_versions");
  await p.query("CREATE TRIGGER portfolio_versions_immutable_update BEFORE UPDATE OR DELETE ON portfolio_versions FOR EACH ROW EXECUTE FUNCTION prevent_portfolio_version_mutation()");

  await seedAcademicData(p);
}

async function seedAcademicData(p) {
  await p.query(`INSERT INTO classes(code,name,school_year,created_by)
    SELECT '11A1','Lớp 11A1','2026-2027',id FROM app_users WHERE role='teacher' ORDER BY created_at LIMIT 1
    ON CONFLICT(code) DO NOTHING`);
  await p.query(`INSERT INTO class_members(class_id,user_id,member_role)
    SELECT c.id,u.id,'teacher' FROM classes c JOIN app_users u ON u.role='teacher' WHERE c.code='11A1' ON CONFLICT DO NOTHING`);
  await p.query(`INSERT INTO class_members(class_id,user_id,member_role)
    SELECT c.id,u.id,'student' FROM classes c JOIN app_users u ON u.role='student' WHERE c.code='11A1' ON CONFLICT DO NOTHING`);
  await p.query(`INSERT INTO literature_texts(public_id,title,author,year_text,genre,synopsis,excerpt,historical_context,tags,created_by)
    SELECT 'vo-nhat','Vợ nhặt','Kim Lân','1954 (viết về nạn đói 1945)','Truyện ngắn hiện thực',
      'Câu chuyện về Tràng và người vợ nhặt giữa nạn đói, làm nổi bật tình người và khát vọng sống.',
      'Sáng hôm sau, mặt trời lên bằng con sào, Tràng mới trở dậy. Trong người êm ái lơ lửng như người vừa ở trong giấc mơ đi ra.',
      'Bối cảnh nạn đói năm 1945 và sức sống của người lao động nghèo.',ARRAY['Hiện thực','Nạn đói 1945','Tình người','Khát vọng sống'],id
    FROM app_users WHERE role='teacher' ORDER BY created_at LIMIT 1 ON CONFLICT(public_id) DO NOTHING`);
  await p.query(`INSERT INTO rubrics(public_id,title,description,created_by)
    SELECT 'rubric-poetics-std','Ma trận Rubric Đánh giá Năng lực Đọc hiểu theo 6 Trục Thi pháp',
      'Rubric 4 mức dùng cho đọc hiểu truyện ngắn hiện đại.',id FROM app_users WHERE role='teacher' ORDER BY created_at LIMIT 1
    ON CONFLICT(public_id) DO NOTHING`);
  const criteria = [
    ["criterion-plot","plot_situation","Tình huống – Cốt truyện"],
    ["criterion-character","character_detail","Nhân vật – Chi tiết nghệ thuật"],
    ["criterion-narrator","narrator_pov","Người kể chuyện – Điểm nhìn"],
    ["criterion-space","space_time","Không gian – Thời gian"],
    ["criterion-language","language_tone_symbol","Ngôn ngữ – Giọng điệu – Biểu tượng"],
    ["criterion-form","form_argument","Hình thức – Nội dung và Lập luận"]
  ];
  for (let i=0;i<criteria.length;i++) {
    const [publicId,axisId,title] = criteria[i];
    await p.query(`INSERT INTO rubric_criteria(rubric_id,public_id,axis_id,title,weight,levels_json,sort_order)
      SELECT id,$1,$2,$3,1,$4::jsonb,$5 FROM rubrics WHERE public_id='rubric-poetics-std'
      ON CONFLICT(rubric_id,public_id) DO NOTHING`,[publicId,axisId,title,JSON.stringify(DEFAULT_LEVELS),i+1]);
  }
  await p.query(`INSERT INTO assignments(public_id,class_id,text_id,rubric_id,title,assigned_at,deadline,difficulty,target_axes,prompt,guiding_steps,status,created_by)
    SELECT 'assign-vo-nhat',c.id,t.id,r.id,'Phân tích Vợ nhặt theo 6 trục thi pháp',now(),now()+interval '30 days','Nâng cao',$1,
      'Phân tích truyện ngắn Vợ nhặt theo 6 trục thi pháp, sử dụng dẫn chứng và lí giải rõ ràng.',$2::jsonb,'published',u.id
    FROM classes c,literature_texts t,rubrics r CROSS JOIN LATERAL (SELECT id FROM app_users WHERE role='teacher' ORDER BY created_at LIMIT 1) u
    WHERE c.code='11A1' AND t.public_id='vo-nhat' AND r.public_id='rubric-poetics-std' ON CONFLICT(public_id) DO NOTHING`,[
      AXES,
      JSON.stringify(["Đọc văn bản và xác định tình huống truyện","Phân tích nhân vật và chi tiết nghệ thuật","Xác định điểm nhìn trần thuật","Khảo sát không gian – thời gian","Phân tích ngôn ngữ, giọng điệu, biểu tượng","Tổng hợp thành lập luận hoàn chỉnh"])
    ]);
  await p.query(`INSERT INTO portfolios(assignment_id,student_id)
    SELECT a.id,u.id FROM assignments a JOIN class_members cm ON cm.class_id=a.class_id AND cm.member_role='student' JOIN app_users u ON u.id=cm.user_id
    WHERE a.status='published' ON CONFLICT(assignment_id,student_id) DO NOTHING`);
  await p.query(`INSERT INTO portfolio_drafts(portfolio_id,content_json,updated_by)
    SELECT p.id,$1::jsonb,p.student_id FROM portfolios p ON CONFLICT(portfolio_id) DO NOTHING`,[JSON.stringify(emptyDraft())]);
}

async function audit(p,user,action,targetType,targetId,beforeJson=null,afterJson=null,req=null) {
  await p.query(`INSERT INTO audit_logs(actor_id,actor_role,action,target_type,target_id,before_json,after_json,ip_address)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[user?.id||null,user?.role||"system",action,targetType||"",String(targetId||""),beforeJson,afterJson,req?clientIp(req):""]);
}

async function portfolioByPublicIds(p, assignmentPublicId, studentId) {
  const result = await p.query(`SELECT p.*,a.public_id assignment_public_id FROM portfolios p JOIN assignments a ON a.id=p.assignment_id
    WHERE a.public_id=$1 AND p.student_id=$2 LIMIT 1`,[assignmentPublicId,studentId]);
  return result.rows[0] || null;
}

function canSeeAll(role) { return ["teacher","admin","researcher","ai"].includes(role); }

export async function getAcademicSnapshot(user) {
  await ensureAcademicSchema();
  const p = await db();
  const assignmentsResult = user.role === "student"
    ? await p.query(`SELECT a.*,c.code class_code,t.public_id text_public_id,r.public_id rubric_public_id FROM assignments a
        LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN literature_texts t ON t.id=a.text_id LEFT JOIN rubrics r ON r.id=a.rubric_id
        JOIN class_members cm ON cm.class_id=a.class_id AND cm.user_id=$1 WHERE a.status<>'draft' ORDER BY a.assigned_at DESC`,[user.id])
    : await p.query(`SELECT a.*,c.code class_code,t.public_id text_public_id,r.public_id rubric_public_id FROM assignments a
        LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN literature_texts t ON t.id=a.text_id LEFT JOIN rubrics r ON r.id=a.rubric_id
        ORDER BY a.assigned_at DESC`);
  const texts = await p.query("SELECT * FROM literature_texts ORDER BY title");
  const rubricRows = await p.query(`SELECT r.public_id rubric_public_id,r.title rubric_title,rc.* FROM rubrics r
    LEFT JOIN rubric_criteria rc ON rc.rubric_id=r.id WHERE r.is_active=true ORDER BY rc.sort_order`);
  const portfoliosRows = canSeeAll(user.role)
    ? await p.query(`SELECT p.*,a.public_id assignment_public_id,u.name student_name,c.code class_code,d.content_json,d.updated_at draft_updated_at
        FROM portfolios p JOIN assignments a ON a.id=p.assignment_id JOIN app_users u ON u.id=p.student_id
        LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN portfolio_drafts d ON d.portfolio_id=p.id ORDER BY p.updated_at DESC`)
    : await p.query(`SELECT p.*,a.public_id assignment_public_id,u.name student_name,c.code class_code,d.content_json,d.updated_at draft_updated_at
        FROM portfolios p JOIN assignments a ON a.id=p.assignment_id JOIN app_users u ON u.id=p.student_id
        LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN portfolio_drafts d ON d.portfolio_id=p.id WHERE p.student_id=$1 ORDER BY p.updated_at DESC`,[user.id]);
  const portfolioIds = portfoliosRows.rows.map(row=>row.id);
  const versions = portfolioIds.length ? await p.query(`SELECT v.*,u.name author_name FROM portfolio_versions v LEFT JOIN app_users u ON u.id=v.created_by WHERE v.portfolio_id=ANY($1::uuid[]) ORDER BY v.submitted_at`,[portfolioIds]) : {rows:[]};
  const feedbacks = portfolioIds.length ? await p.query(`SELECT f.*,p.student_id,a.public_id assignment_public_id,v.version_number,u.name author_name
      FROM feedbacks f JOIN portfolios p ON p.id=f.portfolio_id JOIN assignments a ON a.id=p.assignment_id
      LEFT JOIN portfolio_versions v ON v.id=f.version_id LEFT JOIN app_users u ON u.id=f.author_id
      WHERE f.portfolio_id=ANY($1::uuid[]) ORDER BY f.created_at DESC`,[portfolioIds]) : {rows:[]};
  const subs = portfolioIds.length ? await p.query(`SELECT s.*,p.student_id,a.public_id assignment_public_id,v.version_number,u.name evaluator_name
      FROM rubric_submissions s JOIN portfolios p ON p.id=s.portfolio_id JOIN assignments a ON a.id=p.assignment_id
      LEFT JOIN portfolio_versions v ON v.id=s.version_id LEFT JOIN app_users u ON u.id=s.evaluator_id
      WHERE s.portfolio_id=ANY($1::uuid[]) ORDER BY s.submitted_at DESC`,[portfolioIds]) : {rows:[]};
  const classes = await p.query(`SELECT c.*,COUNT(*) FILTER(WHERE cm.member_role='student')::int student_count FROM classes c LEFT JOIN class_members cm ON cm.class_id=c.id GROUP BY c.id ORDER BY c.code`);
  const users = canSeeAll(user.role) ? await p.query(`SELECT u.id,u.email,u.name,u.role,u.account_status,u.must_change_password,u.created_at,u.last_login,c.code class_code
      FROM app_users u LEFT JOIN class_members cm ON cm.user_id=u.id AND cm.member_role='student' LEFT JOIN classes c ON c.id=cm.class_id ORDER BY u.name`) : {rows:[]};
  const aiReviews = ["ai","teacher","admin"].includes(user.role) ? await p.query(`SELECT ar.*,a.public_id assignment_id,u.id student_id,u.name student_name,v.version_number
      FROM ai_review_requests ar JOIN portfolio_versions v ON v.id=ar.version_id JOIN portfolios p0 ON p0.id=ar.portfolio_id
      JOIN assignments a ON a.id=p0.assignment_id JOIN app_users u ON u.id=p0.student_id ORDER BY ar.created_at DESC`) : {rows:[]};
  const logs = ["admin","researcher"].includes(user.role) ? await p.query(`SELECT l.*,u.name actor_name FROM audit_logs l LEFT JOIN app_users u ON u.id=l.actor_id ORDER BY l.created_at DESC LIMIT 200`) : {rows:[]};

  const versionsByPortfolio = new Map();
  for (const row of versions.rows) {
    if (!versionsByPortfolio.has(row.portfolio_id)) versionsByPortfolio.set(row.portfolio_id,[]);
    versionsByPortfolio.get(row.portfolio_id).push({
      id:row.id,versionNumber:row.version_number,createdAt:row.submitted_at,createdBy:row.created_by||"",authorName:row.author_name||"Hệ thống",
      changeSummary:row.change_summary,responses:row.content_json,isFrozen:true,isSubmitted:true
    });
  }
  const portfolios = {};
  for (const row of portfoliosRows.rows) {
    const id = `port-${row.student_id}-${row.assignment_public_id}`;
    portfolios[id] = { id,dbId:row.id,assignmentId:row.assignment_public_id,studentId:row.student_id,studentName:row.student_name,
      className:row.class_code||"",currentDraft:row.content_json||emptyDraft(),lastAutosavedAt:row.draft_updated_at||row.updated_at,
      versions:versionsByPortfolio.get(row.id)||[],currentActiveVersion:row.active_version,status:row.status };
  }
  const assignments = assignmentsResult.rows.map(row=>({
    id:row.public_id,title:row.title,textId:row.text_public_id||"",classId:row.class_code||"",assignedDate:row.assigned_at,
    deadline:row.deadline||"",difficulty:row.difficulty,targetAxes:row.target_axes||[],prompt:row.prompt,guidingSteps:row.guiding_steps||[],rubricId:row.rubric_public_id||"",starterTemplate:row.starter_template||{}
  }));
  const literatureTexts = texts.rows.map(row=>({id:row.public_id,title:row.title,author:row.author,year:row.year_text,genre:row.genre,synopsis:row.synopsis,excerpt:row.excerpt,fullContent:row.full_content,historicalContext:row.historical_context,tags:row.tags||[]}));
  const rubricGroups = new Map();
  for (const row of rubricRows.rows) {
    if (!rubricGroups.has(row.rubric_public_id)) rubricGroups.set(row.rubric_public_id,{id:row.rubric_public_id,title:row.rubric_title,criteria:[]});
    if (row.id) rubricGroups.get(row.rubric_public_id).criteria.push({id:row.public_id,axisId:row.axis_id,title:row.title,weight:Number(row.weight),levels:row.levels_json||DEFAULT_LEVELS});
  }
  const rubric = rubricGroups.values().next().value || {id:"rubric-poetics-std",title:"Rubric",criteria:[]};
  return {
    assignments,literatureTexts,rubric,portfolios,
    feedbacks:feedbacks.rows.map(row=>({id:row.id,assignmentId:row.assignment_public_id,studentId:row.student_id,versionNumber:row.version_number||"",axisId:row.axis_id,selectedSnippet:row.selected_snippet,comment:row.comment,authorId:row.author_id||"",authorName:row.author_name||"AI",authorRole:row.author_role,createdAt:row.created_at,resolved:row.resolved})),
    rubricSubmissions:subs.rows.map(row=>({id:row.id,assignmentId:row.assignment_public_id,studentId:row.student_id,versionNumber:row.version_number||"",evaluatorId:row.evaluator_id||"",evaluatorName:row.evaluator_name||"",evaluatorRole:row.evaluator_role,criterionScores:row.criterion_scores||{},overallFeedback:row.overall_feedback,totalScore:Number(row.total_score),maxScore:Number(row.max_score),submittedAt:row.submitted_at})),
    auditLogs:logs.rows.map(row=>({id:row.id,timestamp:row.created_at,actorName:row.actor_name||"Hệ thống",actorRole:row.actor_role,action:row.action,target:`${row.target_type}:${row.target_id}`,ipAddress:row.ip_address||""})),
    classes:classes.rows,users:users.rows,aiReviews:aiReviews.rows
  };
}

export async function academicAction(user,input,req) {
  await ensureAcademicSchema();
  assertSameOrigin(req);
  const p = await db();
  const action = String(input?.action||"");
  if (action === "save_draft") {
    if (user.role !== "student") throw new Error("FORBIDDEN");
    const portfolio = await portfolioByPublicIds(p,String(input.assignmentId),user.id);
    if (!portfolio) throw new Error("PORTFOLIO_NOT_FOUND");
    await p.query(`INSERT INTO portfolio_drafts(portfolio_id,content_json,updated_by,updated_at) VALUES($1,$2,$3,now())
      ON CONFLICT(portfolio_id) DO UPDATE SET content_json=EXCLUDED.content_json,updated_by=EXCLUDED.updated_by,updated_at=now()`,[portfolio.id,input.content||emptyDraft(),user.id]);
    await p.query("UPDATE portfolios SET updated_at=now() WHERE id=$1",[portfolio.id]);
    return {ok:true};
  }
  if (action === "create_version") {
    if (user.role !== "student") throw new Error("FORBIDDEN");
    const portfolio = await portfolioByPublicIds(p,String(input.assignmentId),user.id);
    if (!portfolio) throw new Error("PORTFOLIO_NOT_FOUND");
    const draft = await p.query("SELECT content_json FROM portfolio_drafts WHERE portfolio_id=$1",[portfolio.id]);
    const content = input.content || draft.rows[0]?.content_json || emptyDraft();
    const versionNumber = String(input.versionNumber||"").trim();
    if (!/^v\d+(\.\d+)?$/i.test(versionNumber)) throw new Error("INVALID_VERSION");
    const inserted = await p.query(`INSERT INTO portfolio_versions(portfolio_id,version_number,content_json,change_summary,created_by,word_count)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id,submitted_at`,[portfolio.id,versionNumber,content,String(input.changeSummary||""),user.id,wordCount(content)]);
    const version = inserted.rows[0];
    const status = /^v1(\.0)?$/i.test(versionNumber) ? "v1_submitted" : "v2_in_revision";
    await p.query("UPDATE portfolios SET active_version=$2,status=$3,updated_at=now() WHERE id=$1",[portfolio.id,versionNumber,status]);
    if (/^v1(\.0)?$/i.test(versionNumber)) {
      await p.query(`INSERT INTO ai_review_requests(portfolio_id,version_id,prompt) VALUES($1,$2,$3) ON CONFLICT(version_id) DO NOTHING`,[
        portfolio.id,version.id,"Phản hồi bài viết theo 6 trục thi pháp. Chỉ ra điểm mạnh, điểm cần sửa và gợi ý cải thiện có dẫn chứng."
      ]);
    }
    await audit(p,user,"CREATE_VERSION","portfolio",portfolio.id,null,{versionNumber},req);
    return {ok:true,version:{id:version.id,versionNumber,createdAt:version.submitted_at}};
  }
  if (action === "add_feedback") {
    if (!["teacher","peer","ai","admin"].includes(user.role)) throw new Error("FORBIDDEN");
    const studentId=String(input.studentId||"");
    const portfolio = await portfolioByPublicIds(p,String(input.assignmentId),studentId);
    if (!portfolio) throw new Error("PORTFOLIO_NOT_FOUND");
    const version = await p.query("SELECT id FROM portfolio_versions WHERE portfolio_id=$1 AND version_number=$2",[portfolio.id,String(input.versionNumber)]);
    const role = user.role === "admin" ? "teacher" : user.role;
    const inserted = await p.query(`INSERT INTO feedbacks(portfolio_id,version_id,axis_id,selected_snippet,comment,author_id,author_role)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,created_at`,[portfolio.id,version.rows[0]?.id||null,String(input.axisId),String(input.selectedSnippet||""),String(input.comment||""),user.id,role]);
    await p.query("UPDATE portfolios SET status='feedback_received',updated_at=now() WHERE id=$1",[portfolio.id]);
    await audit(p,user,"ADD_FEEDBACK","portfolio",portfolio.id,null,{feedbackId:inserted.rows[0].id},req);
    return {ok:true,id:inserted.rows[0].id,createdAt:inserted.rows[0].created_at};
  }
  if (action === "resolve_feedback") {
    const existing=await p.query(`SELECT f.*,p.student_id FROM feedbacks f JOIN portfolios p ON p.id=f.portfolio_id WHERE f.id=$1`,[String(input.feedbackId)]);
    const row=existing.rows[0]; if(!row) throw new Error("FEEDBACK_NOT_FOUND");
    if (user.role!=="admin" && row.student_id!==user.id) throw new Error("FORBIDDEN");
    await p.query("UPDATE feedbacks SET resolved=true,resolved_at=now() WHERE id=$1",[row.id]);
    await audit(p,user,"RESOLVE_FEEDBACK","feedback",row.id,null,{resolved:true},req);
    return {ok:true};
  }
  if (action === "submit_rubric") {
    if (!["student","teacher","peer","admin"].includes(user.role)) throw new Error("FORBIDDEN");
    const portfolio=await portfolioByPublicIds(p,String(input.assignmentId),String(input.studentId||user.id));
    if(!portfolio) throw new Error("PORTFOLIO_NOT_FOUND");
    const version=await p.query("SELECT id FROM portfolio_versions WHERE portfolio_id=$1 AND version_number=$2",[portfolio.id,String(input.versionNumber)]);
    const evaluatorRole=user.role==="admin"?"teacher":user.role;
    const inserted=await p.query(`INSERT INTO rubric_submissions(portfolio_id,version_id,evaluator_id,evaluator_role,criterion_scores,overall_feedback,total_score,max_score)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,submitted_at`,[portfolio.id,version.rows[0]?.id||null,user.id,evaluatorRole,input.criterionScores||{},String(input.overallFeedback||""),Number(input.totalScore||0),Number(input.maxScore||0)]);
    await audit(p,user,"SUBMIT_RUBRIC","portfolio",portfolio.id,null,{submissionId:inserted.rows[0].id},req);
    return {ok:true,id:inserted.rows[0].id,submittedAt:inserted.rows[0].submitted_at};
  }
  if (action === "create_assignment") {
    if (!["teacher","admin"].includes(user.role)) throw new Error("FORBIDDEN");
    const publicId=String(input.id||`assign-${Date.now()}`);
    const result=await p.query(`INSERT INTO assignments(public_id,class_id,text_id,rubric_id,title,assigned_at,deadline,difficulty,target_axes,prompt,guiding_steps,starter_template,status,created_by)
      SELECT $1,c.id,t.id,r.id,$2,now(),$3,$4,$5,$6,$7,$8,'published',$9 FROM classes c,literature_texts t,rubrics r
      WHERE c.code=$10 AND t.public_id=$11 AND r.public_id=$12 RETURNING id`,[publicId,String(input.title),input.deadline||null,String(input.difficulty||"Cơ bản"),input.targetAxes||AXES,String(input.prompt||""),JSON.stringify(input.guidingSteps||[]),JSON.stringify(input.starterTemplate||{}),user.id,String(input.classId||"11A1"),String(input.textId||"vo-nhat"),String(input.rubricId||"rubric-poetics-std")]);
    if(!result.rows[0]) throw new Error("ASSIGNMENT_REFERENCE_NOT_FOUND");
    await p.query(`INSERT INTO portfolios(assignment_id,student_id) SELECT $1,user_id FROM class_members WHERE class_id=(SELECT class_id FROM assignments WHERE id=$1) AND member_role='student' ON CONFLICT DO NOTHING`,[result.rows[0].id]);
    await p.query(`INSERT INTO portfolio_drafts(portfolio_id,content_json,updated_by) SELECT id,$1::jsonb,student_id FROM portfolios WHERE assignment_id=$2 ON CONFLICT(portfolio_id) DO NOTHING`,[JSON.stringify(emptyDraft()),result.rows[0].id]);
    await audit(p,user,"CREATE_ASSIGNMENT","assignment",publicId,null,{title:input.title},req);
    return {ok:true,id:publicId};
  }
  if (action === "ai_complete_review") {
    if (!["ai","admin"].includes(user.role)) throw new Error("FORBIDDEN");
    const review=await p.query(`SELECT ar.*,p.student_id,a.public_id assignment_id,v.version_number FROM ai_review_requests ar JOIN portfolios p ON p.id=ar.portfolio_id JOIN assignments a ON a.id=p.assignment_id JOIN portfolio_versions v ON v.id=ar.version_id WHERE ar.id=$1`,[String(input.reviewId)]);
    const row=review.rows[0]; if(!row) throw new Error("AI_REVIEW_NOT_FOUND");
    const response=String(input.response||"").trim(); if(!response) throw new Error("EMPTY_RESPONSE");
    await p.query("UPDATE ai_review_requests SET status='completed',response=$2,reviewer_id=$3,completed_at=now() WHERE id=$1",[row.id,response,user.id]);
    await p.query(`INSERT INTO feedbacks(portfolio_id,version_id,axis_id,selected_snippet,comment,author_id,author_role) VALUES($1,$2,$3,'',$4,$5,'ai')`,[row.portfolio_id,row.version_id,String(input.axisId||"form_argument"),response,user.id]);
    await p.query("UPDATE portfolios SET status='feedback_received',updated_at=now() WHERE id=$1",[row.portfolio_id]);
    await audit(p,user,"AI_REVIEW_COMPLETED","ai_review",row.id,null,{studentId:row.student_id},req);
    return {ok:true};
  }
  if (action === "teacher_review_ai") {
    if (!["teacher","admin"].includes(user.role)) throw new Error("FORBIDDEN");
    const status=String(input.status||""); if(!["approved","revised","rejected"].includes(status)) throw new Error("INVALID_STATUS");
    await p.query("UPDATE ai_review_requests SET teacher_review_status=$2,teacher_note=$3 WHERE id=$1",[String(input.reviewId),status,String(input.note||"")]);
    await audit(p,user,"TEACHER_REVIEW_AI","ai_review",String(input.reviewId),null,{status},req);
    return {ok:true};
  }
  throw new Error("UNKNOWN_ACTION");
}

export async function academicHealth() {
  await ensureAcademicSchema();
  const p=await db();
  const result=await p.query(`SELECT
    (SELECT count(*)::int FROM assignments) assignments,
    (SELECT count(*)::int FROM portfolios) portfolios,
    (SELECT count(*)::int FROM portfolio_versions) versions,
    (SELECT count(*)::int FROM ai_review_requests) ai_reviews`);
  return result.rows[0];
}
