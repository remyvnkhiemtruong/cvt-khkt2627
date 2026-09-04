-- Học tốt Ngữ Văn — demo academic seed
-- Idempotent, additive, production-safe. Does not create submitted versions,
-- AI review requests, feedbacks, or rubric submissions.
-- Runtime/deploy code must never embed credentials in this file.

BEGIN;

-- Allow this controlled seed to create class membership without being affected
-- by the legacy bootstrap guard.
SELECT set_config('app.class_member_write', 'admin', true);

-- 1) Demo class
INSERT INTO classes(code, name, school_year, created_by)
SELECT '11A1-MAU', 'Lớp mẫu 11A1', '2026-2027', id
FROM app_users
WHERE lower(email) = 'giaovien@cvt.edu.vn'
LIMIT 1
ON CONFLICT(code) DO NOTHING;

-- 2) Reuse bootstrap teacher/student accounts; never change their credentials.
INSERT INTO class_members(class_id, user_id, member_role)
SELECT c.id, u.id, 'teacher'
FROM classes c
JOIN app_users u ON lower(u.email) = 'giaovien@cvt.edu.vn'
WHERE c.code = '11A1-MAU'
ON CONFLICT(class_id, user_id) DO NOTHING;

INSERT INTO class_members(class_id, user_id, member_role)
SELECT c.id, u.id, 'student'
FROM classes c
JOIN app_users u ON lower(u.email) = 'hocsinh@cvt.edu.vn'
WHERE c.code = '11A1-MAU'
ON CONFLICT(class_id, user_id) DO NOTHING;

-- 3) Sample assignment. Reuse the existing Vợ nhặt literature entry and
-- standard six-axis rubric, so this seed does not duplicate catalog data.
INSERT INTO assignments(
  public_id, class_id, text_id, rubric_id, title,
  assigned_at, deadline, difficulty, target_axes,
  prompt, guiding_steps, starter_template, status,
  ai_guidance, common_mistakes, reference_guide,
  prediction_template, workflow_config, created_by
)
SELECT
  'demo-vo-nhat-01',
  c.id,
  t.id,
  r.id,
  'Bài mẫu: Phân tích tình huống truyện trong Vợ nhặt',
  now(),
  now() + interval '45 days',
  'Cơ bản',
  ARRAY['plot_situation','character_detail','narrator_pov']::text[],
  'Phân tích tình huống truyện trong “Vợ nhặt” và làm rõ cách tình huống ấy góp phần bộc lộ nhân vật, hoàn cảnh và giá trị nhân đạo của tác phẩm.',
  '["Xác định tình huống truyện trung tâm","Chọn chi tiết tiêu biểu về Tràng và người vợ nhặt","Phân tích tác dụng của tình huống đối với nhân vật và chủ đề","Hoàn thiện lập luận bằng dẫn chứng"]'::jsonb,
  '{}'::jsonb,
  'published',
  'Ưu tiên nhận xét mức độ bám văn bản, quan hệ giữa tình huống truyện và sự bộc lộ nhân vật. Chỉ đưa ra đề xuất để giáo viên duyệt trước khi học sinh nhận phản hồi.',
  'Kể lại cốt truyện thay vì phân tích; nhận xét chung chung không có dẫn chứng; nhầm lẫn giữa người kể chuyện và điểm nhìn.',
  'Tập trung vào tình huống “nhặt vợ” giữa nạn đói và cách nghịch cảnh làm nổi bật khát vọng sống, tình người.',
  '{"enabled":true,"question":"Trước khi đọc sâu, em dự đoán tình huống nhặt vợ sẽ cho thấy điều gì về con người trong nạn đói?","confidenceScale":[1,2,3,4,5]}'::jsonb,
  '{"predictionEnabled":true,"aiReviewRequired":true,"teacherApprovalRequired":true,"officialRubricRequired":true}'::jsonb,
  u.id
FROM classes c
JOIN literature_texts t ON t.public_id = 'vo-nhat'
JOIN rubrics r ON r.public_id = 'rubric-poetics-std'
CROSS JOIN LATERAL (
  SELECT id FROM app_users WHERE lower(email) = 'giaovien@cvt.edu.vn' LIMIT 1
) u
WHERE c.code = '11A1-MAU'
ON CONFLICT(public_id) DO NOTHING;

-- 4) Authorized sample student's portfolio + blank draft.
INSERT INTO portfolios(assignment_id, student_id)
SELECT a.id, u.id
FROM assignments a
JOIN app_users u ON lower(u.email) = 'hocsinh@cvt.edu.vn'
WHERE a.public_id = 'demo-vo-nhat-01'
ON CONFLICT(assignment_id, student_id) DO NOTHING;

INSERT INTO portfolio_drafts(portfolio_id, content_json, updated_by)
SELECT
  p.id,
  jsonb_build_object(
    'plot_situation', jsonb_build_object('axisId','plot_situation','analysisText','','evidenceQuotes','[]'::jsonb),
    'character_detail', jsonb_build_object('axisId','character_detail','analysisText','','evidenceQuotes','[]'::jsonb),
    'narrator_pov', jsonb_build_object('axisId','narrator_pov','analysisText','','evidenceQuotes','[]'::jsonb),
    'space_time', jsonb_build_object('axisId','space_time','analysisText','','evidenceQuotes','[]'::jsonb),
    'language_tone_symbol', jsonb_build_object('axisId','language_tone_symbol','analysisText','','evidenceQuotes','[]'::jsonb),
    'form_argument', jsonb_build_object('axisId','form_argument','analysisText','','evidenceQuotes','[]'::jsonb)
  ),
  p.student_id
FROM portfolios p
JOIN assignments a ON a.id = p.assignment_id
WHERE a.public_id = 'demo-vo-nhat-01'
ON CONFLICT(portfolio_id) DO NOTHING;

-- Keep one audit marker only; repeated seed runs do not spam the audit log.
INSERT INTO audit_logs(actor_id, actor_role, action, target_type, target_id, after_json, ip_address)
SELECT
  u.id,
  'teacher',
  'SEED_DEMO_ACADEMIC_DATA',
  'assignment',
  'demo-vo-nhat-01',
  jsonb_build_object('classCode','11A1-MAU','assignmentId','demo-vo-nhat-01'),
  'seed'
FROM app_users u
WHERE lower(u.email) = 'giaovien@cvt.edu.vn'
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs
    WHERE action = 'SEED_DEMO_ACADEMIC_DATA'
      AND target_id = 'demo-vo-nhat-01'
  )
LIMIT 1;

COMMIT;
