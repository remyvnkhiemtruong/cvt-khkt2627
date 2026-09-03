# Hồ Sơ Đọc Số THPT

Nền tảng hỗ trợ phát triển năng lực đọc hiểu truyện ngắn hiện đại theo 6 trục thi pháp, lưu tiến trình phiên bản, phản hồi neo ngữ cảnh, rubric và phân tích học tập.

## Trạng thái

- **Phiên bản:** Production V2
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Vercel Functions + PostgreSQL/Neon
- **Xác thực:** tài khoản thật, cookie HttpOnly + JWT, RBAC theo vai trò
- **AI giai đoạn hiện tại:** chưa gọi API AI tự động; học sinh nộp V1 → hàng đợi AI → tài khoản AI dán phản hồi thủ công → giáo viên duyệt
- **Production:** https://cvt-khkt2627.vercel.app

## Vai trò hệ thống

- `student` — Học sinh
- `teacher` — Giáo viên
- `peer` — Người phản biện bạn học
- `researcher` — Giám khảo / nghiên cứu
- `admin` — Quản trị hệ thống
- `ai` — Người nhập phản hồi AI thủ công

Frontend chỉ hiển thị phân hệ phù hợp với role hiện tại; không còn user switcher/role simulation trên production.

## Luồng học thuật chính

1. Giáo viên tạo lớp, gán thành viên và xuất bản nhiệm vụ.
2. Backend tạo portfolio cho học sinh thuộc lớp được giao.
3. Học sinh soạn bài theo 6 trục; autosave chỉ báo thành công sau khi PostgreSQL xác nhận.
4. Khi nộp một version, backend đóng băng version đó; `portfolio_versions` là bất biến.
5. Khi học sinh nộp V1, hệ thống tạo `ai_review_request`.
6. Tài khoản AI mở hàng đợi, dán phản hồi AI đã tra cứu thủ công và lưu vào version tương ứng.
7. Giáo viên duyệt / yêu cầu sửa / từ chối phản hồi AI và tiếp tục feedback chuyên môn.
8. Rubric submissions, version history và feedback được dùng cho Student Analytics, Class Analytics và dữ liệu nghiên cứu ẩn danh.

## Các phân hệ chính

### Học sinh

- Nhiệm vụ đọc hiểu
- Hồ sơ đọc số theo 6 trục thi pháp
- Autosave server-side
- Version snapshot bất biến
- Visual Diff
- Feedback và rubric
- Báo cáo tiến bộ dựa trên dữ liệu thật

### Giáo viên

- Bàn làm việc giáo viên từ portfolio/version thật
- Chấm bài và neo nhận xét
- Duyệt phản hồi AI
- Tạo nhiệm vụ theo lớp thật
- Quản lý rubric version
- Kho tác phẩm PostgreSQL
- Heatmap lớp từ rubric submissions thật

### Admin

- Tạo tài khoản và mật khẩu tạm
- Đổi role / khóa / mở tài khoản
- Reset mật khẩu bắt buộc đổi lại
- Tạo lớp
- Gán học sinh / giáo viên vào lớp
- Audit log thật cho thay đổi quản trị

### Nghiên cứu

- Cohort ẩn danh tạo từ dữ liệu thật
- Pre/post dựa trên rubric submissions đầu/cuối
- Truy vết version / feedback / rubric
- Không tạo số liệu nghiên cứu giả khi dữ liệu chưa đủ

## Backend API

Các endpoint chính:

- `GET /api/health` — kiểm tra backend và schema học thuật
- `POST /api/auth/login` — đăng nhập
- `POST /api/auth/register` — đăng ký tài khoản học sinh
- `GET /api/auth/me` — phục hồi phiên cookie
- `POST /api/auth/logout` — đăng xuất
- `POST /api/auth/change-password` — đổi mật khẩu
- `GET /api/academic/snapshot` — snapshot dữ liệu học thuật theo role
- `POST /api/academic/action` — draft/version/feedback/rubric/assignment/AI review actions
- `GET /api/admin/users` — danh sách tài khoản thật, chỉ admin
- `POST /api/admin/manage` — quản trị user/lớp/thành viên, chỉ admin

Backend V2 dùng migration idempotent khi API học thuật chạy. Constraint role hỗ trợ đủ `student`, `teacher`, `peer`, `researcher`, `admin`, `ai`.

## PostgreSQL V2

Các bảng chính:

- `app_users`
- `classes`
- `class_members`
- `literature_texts`
- `rubrics`
- `rubric_criteria`
- `assignments`
- `portfolios`
- `portfolio_drafts`
- `portfolio_versions`
- `feedbacks`
- `rubric_submissions`
- `ai_review_requests`
- `audit_logs`
- `auth_rate_events`

`portfolio_versions` có database trigger chặn UPDATE/DELETE để giữ tính toàn vẹn nghiên cứu.

## Biến môi trường

Không commit secret vào Git. Production bắt buộc phải cấu hình tại **Vercel → Project Settings → Environment Variables**:

- `DATABASE_URL` — chuỗi kết nối PostgreSQL/Neon, target Production (nên thêm Preview nếu cần test preview)
- `JWT_SECRET` — khuyến nghị; nếu không đặt, backend dẫn xuất server-side từ `DATABASE_URL`

Bootstrap tùy chọn:

- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_TEACHER_PASSWORD`
- `BOOTSTRAP_STUDENT_PASSWORD`
- `BOOTSTRAP_AI_PASSWORD`

Các tài khoản bootstrap mặc định:

- `admin@cvt.edu.vn`
- `giaovien@cvt.edu.vn`
- `hocsinh@cvt.edu.vn`
- `ai@cvt.edu.vn`

Seed lớp chỉ dành cho tài khoản học sinh bootstrap. Tài khoản học sinh đăng ký mới không tự động bị đưa vào 11A1; Admin phải gán lớp rõ ràng.

## Chạy local

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Build luôn chạy invariant tests trước TypeScript/Vite.

```bash
npm test
```

## CI & Deploy Vercel

Repository kết nối Git Deployment với Vercel. Mỗi commit vào `main` tạo production deployment mới. Build production chạy:

1. `npm test`
2. TypeScript build
3. Vite build
4. Vercel Functions packaging

Dự án được giữ trong giới hạn 12 Serverless Functions của Vercel Hobby bằng cách gom các academic actions vào route chung thay vì tạo một function cho từng thao tác.

## Nguyên tắc production

- Không lưu JWT trong localStorage.
- Session chỉ dùng cookie HttpOnly và được xác thực lại bằng `/api/auth/me` khi reload.
- Không dùng localStorage làm database.
- Không giả lập backup, audit, network delay, analytics hoặc trạng thái lưu thành công.
- Mọi write học thuật quan trọng đi qua backend và PostgreSQL.
- Route và API đều kiểm tra role.
- Version đã nộp là bất biến.
- AI tự động vẫn tắt cho tới giai đoạn tích hợp API; hiện dùng manual review queue có giáo viên duyệt.
