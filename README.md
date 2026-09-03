# Học tốt Ngữ Văn

Nền tảng học tập Ngữ văn THPT hỗ trợ đọc hiểu theo 6 trục thi pháp, viết theo phiên bản, phản hồi AI/giáo viên, rubric và phân tích tiến bộ dựa trên dữ liệu thật.

## Trạng thái

- **Phiên bản:** Production V2
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Vercel Functions + PostgreSQL/Neon
- **Xác thực:** tài khoản thật, cookie HttpOnly + JWT, RBAC theo vai trò
- **AI hiện tại:** học sinh nộp V1 → hàng đợi AI → tài khoản AI dán phản hồi thủ công → giáo viên duyệt
- **Production:** https://cvt-khkt2627.vercel.app

Tên sản phẩm chính thức là **Học tốt Ngữ Văn**. Slug hạ tầng GitHub/Vercel hiện được giữ nguyên để không làm gián đoạn URL production và integration đang hoạt động.

## Vai trò hệ thống

- `student` — Học sinh
- `teacher` — Giáo viên
- `peer` — Người phản biện bạn học
- `researcher` — Giám khảo / nghiên cứu
- `admin` — Quản trị hệ thống
- `ai` — Người nhập phản hồi AI thủ công

## Hồ sơ cá nhân

Thông tin tài khoản được lưu trong PostgreSQL. Ngoài họ tên, email, vai trò, lớp và trạng thái tài khoản, người dùng có thể tự cập nhật các trường không bắt buộc:

- số điện thoại;
- ngày sinh;
- trường / đơn vị;
- năm học, khối / cấp học;
- mã học sinh hoặc mã cán bộ;
- tổ / bộ môn;
- giới thiệu ngắn;
- mục tiêu học Ngữ văn;
- thể loại, tác giả và tác phẩm yêu thích.

Lớp và vai trò là dữ liệu quản trị, không cho người dùng tự sửa trong hồ sơ cá nhân.

## Luồng học thuật chính

1. Giáo viên tạo lớp, gán thành viên và xuất bản nhiệm vụ.
2. Backend tạo portfolio cho học sinh thuộc lớp được giao.
3. Học sinh viết theo 6 trục; autosave chỉ báo thành công sau khi PostgreSQL xác nhận.
4. Học sinh nộp `v1.0`; version được đóng băng bất biến và tạo `ai_review_request`.
5. Tài khoản AI nhập phản hồi thủ công vào đúng version.
6. Giáo viên duyệt / yêu cầu sửa / từ chối phản hồi AI và tiếp tục feedback chuyên môn.
7. Học sinh chỉnh sửa và tạo các phiên bản tiếp theo.
8. Rubric, version history và feedback được dùng cho Student Analytics, Class Analytics và nghiên cứu ẩn danh.

## Các phân hệ chính

### Học sinh

- Nhiệm vụ Ngữ văn
- Không gian viết & phân tích theo 6 trục thi pháp
- Autosave server-side
- Version snapshot bất biến
- So sánh phiên bản từ dữ liệu thật
- Feedback và rubric
- Báo cáo tiến bộ

### Giáo viên

- Bàn làm việc từ portfolio/version thật
- Hàng đợi bài nộp thật, không dùng học sinh giả
- Chấm bài và phản hồi neo ngữ cảnh
- Duyệt phản hồi AI
- Tạo nhiệm vụ theo lớp thật
- Quản lý rubric version
- Kho tác phẩm PostgreSQL
- Heatmap lớp từ rubric submissions thật

### Admin

- Tạo tài khoản và mật khẩu tạm
- Đổi role / khóa / mở tài khoản
- Reset mật khẩu bắt buộc đổi lại
- Tạo lớp và gán thành viên
- Audit log thật

### Nghiên cứu

- Cohort ẩn danh từ dữ liệu thật
- Pre/post dựa trên rubric submissions đầu/cuối
- Truy vết version / feedback / rubric
- Không tạo số liệu nghiên cứu giả khi dữ liệu chưa đủ

## Backend API

- `GET /api/health` — kiểm tra backend và schema học thuật
- `POST /api/auth/login` — đăng nhập
- `POST /api/auth/register` — đăng ký tài khoản học sinh
- `GET /api/auth/me` — phục hồi phiên và đọc hồ sơ
- `PATCH /api/auth/me` — cập nhật hồ sơ cá nhân
- `POST /api/auth/logout` — đăng xuất
- `POST /api/auth/change-password` — đổi mật khẩu
- `GET /api/academic/snapshot` — snapshot dữ liệu học thuật theo role
- `POST /api/academic/action` — draft/version/feedback/rubric/assignment/AI review actions
- `GET /api/admin/users` — danh sách tài khoản thật, chỉ admin
- `POST /api/admin/manage` — quản trị user/lớp/thành viên, chỉ admin

## PostgreSQL V2

Các bảng chính: `app_users`, `classes`, `class_members`, `literature_texts`, `rubrics`, `rubric_criteria`, `assignments`, `portfolios`, `portfolio_drafts`, `portfolio_versions`, `feedbacks`, `rubric_submissions`, `ai_review_requests`, `audit_logs`, `auth_rate_events`.

`app_users.profile_json` lưu hồ sơ mở rộng. `portfolio_versions` có database trigger chặn UPDATE/DELETE để giữ tính toàn vẹn.

## Biến môi trường

Production cần cấu hình tại Vercel Project Settings:

- `DATABASE_URL`
- `JWT_SECRET` — khuyến nghị; nếu không đặt backend dẫn xuất server-side từ `DATABASE_URL`

Bootstrap tùy chọn:

- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_TEACHER_PASSWORD`
- `BOOTSTRAP_STUDENT_PASSWORD`
- `BOOTSTRAP_AI_PASSWORD`

Tài khoản bootstrap: `admin@cvt.edu.vn`, `giaovien@cvt.edu.vn`, `hocsinh@cvt.edu.vn`, `ai@cvt.edu.vn`.

## Chạy local

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Build chạy invariant tests trước TypeScript/Vite.

## CI & Deploy Vercel

Mỗi commit vào `main` tạo production deployment. Pipeline:

1. `npm test`
2. TypeScript build
3. Vite build
4. Vercel Functions packaging

Dự án giữ trong giới hạn 12 Serverless Functions của Vercel Hobby bằng cách gom academic actions vào route chung.

## Nguyên tắc production

- Không lưu JWT trong localStorage.
- Session dùng cookie HttpOnly và API nhạy cảm xác thực lại trạng thái tài khoản từ PostgreSQL.
- Không dùng localStorage làm database.
- Không dùng dữ liệu giả cho editor, version diff, teacher review, backup, audit hoặc analytics.
- Mọi write học thuật quan trọng đi qua backend và PostgreSQL.
- Editor chỉ cho học sinh ghi draft; giáo viên/peer dùng review flow.
- Version đã nộp là bất biến.
- AI tự động vẫn tắt; hiện dùng manual review queue có giáo viên duyệt.
