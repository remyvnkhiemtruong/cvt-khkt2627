# Hồ Sơ Đọc Số THPT

Nền tảng hỗ trợ phát triển năng lực đọc hiểu truyện ngắn hiện đại theo 6 trục thi pháp, lưu tiến trình phiên bản, phản hồi neo ngữ cảnh, rubric và phân tích học tập.

## Trạng thái

- **Phiên bản:** chính thức
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Vercel Functions + PostgreSQL/Neon
- **Xác thực:** tài khoản thật, cookie HttpOnly + JWT, phân quyền theo vai trò
- **AI giai đoạn hiện tại:** chưa gọi API AI tự động; tài khoản AI dùng để lưu thủ công câu hỏi/câu trả lời AI theo đúng kế hoạch triển khai hiện tại
- **Production:** https://cvt-khkt2627.vercel.app

## Vai trò hệ thống

- `student` — Học sinh
- `teacher` — Giáo viên
- `peer` — Người phản biện bạn học
- `researcher` — Giám khảo / nghiên cứu
- `admin` — Quản trị hệ thống
- `ai` — Kho phản hồi AI thủ công

Frontend chỉ hiển thị các phân hệ phù hợp với role hiện tại; không còn chức năng chuyển vai trò mô phỏng trong giao diện production.

## Các phân hệ chính

1. **Học sinh**
   - Nhiệm vụ đọc hiểu
   - Hồ sơ đọc số
   - Soạn thảo theo 6 trục thi pháp
   - Lưu phiên bản và Visual Diff
   - Báo cáo tiến bộ

2. **Giáo viên**
   - Bàn làm việc giáo viên
   - Chấm bài và neo nhận xét
   - Tạo nhiệm vụ
   - Quản lý Rubric
   - Kho tác phẩm
   - Phân tích lớp

3. **Nghiên cứu / quản trị**
   - Dữ liệu và báo cáo nghiên cứu
   - Danh sách tài khoản thật từ PostgreSQL ở phân hệ Admin
   - Các phân hệ học thuật được cấp quyền

4. **AI thủ công**
   - Lưu câu hỏi/prompt đã tra cứu
   - Dán và lưu câu trả lời AI
   - Xem lại lịch sử đã lưu theo tài khoản

## Backend API

Các endpoint production hiện có:

- `GET /api/health` — trạng thái backend
- `POST /api/auth/login` — đăng nhập
- `POST /api/auth/register` — đăng ký tài khoản học sinh
- `GET /api/auth/me` — kiểm tra phiên đăng nhập
- `POST /api/auth/logout` — đăng xuất
- `GET /api/ai/notes` — đọc lịch sử AI
- `POST /api/ai/notes` — lưu ghi chú AI
- `GET /api/admin/users` — danh sách tài khoản thật, chỉ role `admin`

Auth schema tự kiểm tra/migrate danh sách role để tương thích với database đã được tạo trước khi role `ai` xuất hiện. Backend cũng bổ sung `last_login` theo migration idempotent để Admin hiển thị thời điểm đăng nhập thật.

## Biến môi trường

Sao chép `.env.example` thành `.env.local` khi chạy local và điền giá trị thật. Không commit secret vào Git.

Biến bắt buộc cho backend:

- `DATABASE_URL`
- `JWT_SECRET` — khuyến nghị thiết lập riêng trên Vercel; nếu chưa có, backend tạo khóa dẫn xuất server-side từ `DATABASE_URL` thay vì dùng secret công khai trong source

Biến bootstrap tùy chọn cho database mới:

- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_TEACHER_PASSWORD`
- `BOOTSTRAP_STUDENT_PASSWORD`
- `BOOTSTRAP_AI_PASSWORD`

Các biến bootstrap chỉ dùng để tạo tài khoản còn thiếu trên database mới; không ghi đè mật khẩu của tài khoản đã tồn tại.

## Chạy local

```bash
npm install
npm run dev
```

Build production luôn chạy test trước:

```bash
npm run build
```

Chạy riêng bộ production invariant tests:

```bash
npm test
```

## CI & Deploy Vercel

Repository có GitHub Actions CI để chạy `npm test` và `npm run build` cho `main`/pull request. Ngoài ra, `npm run build` tự chạy test trước TypeScript/Vite nên chính Vercel deployment cũng bị chặn nếu core invariant test fail.

Repository được kết nối Git Deployment với Vercel. Mỗi commit vào `main` tạo production deployment mới; chỉ deployment build thành công mới nhận production alias.

Cấu hình secrets tại **Vercel → Project Settings → Environment Variables**. Không đưa secret vào `.env`, README hoặc source code.

## Nguyên tắc phiên bản chính thức

- Không dùng user switcher / role simulation trên production.
- Không hiển thị trạng thái đồng bộ, backup, audit hoặc số liệu vận hành giả.
- Không để navigation dẫn tới view chưa tồn tại hoặc role không được phép.
- Session lưu ở client phải được xác thực lại bằng `/api/auth/me` khi tải ứng dụng.
- Đăng xuất xóa trạng thái local và cookie server.
- Các route được kiểm tra theo role trước khi render.
- Admin chỉ hiển thị dữ liệu vận hành có nguồn backend thật; chức năng chưa có API ghi an toàn được trình bày là read-only thay vì giả lập thành công.
- AI API tự động vẫn tắt cho tới giai đoạn tích hợp API; workflow hiện tại là người dùng/giáo viên phản hồi trước, sau đó mới tích hợp AI tự động.
