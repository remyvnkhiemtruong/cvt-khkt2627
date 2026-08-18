# Hệ Thống Hồ Sơ Đọc Số Có Lưu Phiên Bản Theo Trục Thi Pháp
### *Phát triển năng lực đọc hiểu truyện ngắn hiện đại cho học sinh THPT (Chương trình GDPT 2018)*

---

## 🌟 Giới Thiệu Đề Tài
Dự án Nghiên cứu Khoa học Kỹ thuật Sư phạm Ứng dụng: **Xây dựng không gian tài liệu học thuật cộng tác (Collaborative Academic Document Workspace)** hỗ trợ học sinh THPT đọc hiểu truyện ngắn hiện đại qua **6 trục thi pháp**, đóng băng snapshot phiên bản bất biến ($v1.0 \rightarrow v2.0 \rightarrow v3.0$), tiếp thu phản hồi neo ngữ cảnh và đánh giá định lượng qua ma trận Rubric 4 mức độ.

---

## 🚀 6 Tính Năng Cốt Lõi (Signature Features)

1. **Portfolio Editor (Không Gian Soạn Thảo 3 Cột / Full-Bleed)**:
   - Điều hướng 6 trục thi pháp: *Tình huống, Nhân vật, Điểm nhìn, Không - Thời gian, Ngôn ngữ & Biểu tượng, Luận đề & Lập luận*.
   - Khung khối giàn giáo (Scaffolding): `TextBlock`, `EvidenceBlock` (2 vùng Dẫn chứng & Lí giải), `TableBlock`, `TimelineBlock`.
   - Lưu nháp tự động ngầm (`Autosave != Create Version`).

2. **Immutable Version Snapshots (Lưu Phiên Bản Bất Biến)**:
   - Đóng băng mốc snapshot $v1.0, v2.0, v3.0$ kèm mốc thời gian server và nhãn lí do sư phạm (*Bổ sung dẫn chứng, Lí giải sâu hơn...*).
   - Thống kê delta thời gian thực: `+126 từ, -32 từ, ~4 đoạn sửa`.

3. **Signature Visual Diff Viewer (Trình So Sánh Phiên Bản)**:
   - 2 chế độ hiển thị: *Unified Diff Stream* (chuẩn cho Mobile) và *Side-by-Side* (Desktop).
   - Ký hiệu ngữ nghĩa không phụ thuộc màu sắc: `+` (Thêm), `−` (Xóa), `✎` (Sửa đổi lập luận).

4. **Contextual Anchored Feedback (Phản Hồi Neo Ngữ Cảnh)**:
   - Bôi đen câu văn bất kỳ $\rightarrow$ Floating Toolbar `[+ Phản hồi câu đã chọn]`.
   - Nhận xét neo chặt vào phiên bản hiện hành, không bị trôi lệch khi học sinh tạo bản mới.
   - Tiếp thu phản hồi: Đánh dấu `✓ Đã xử lý trong v2.0` (bảo toàn 100% lịch sử nhận xét).

5. **Traceable Learning Analytics (Tiến Bộ Có Giải Trình)**:
   - Biểu đồ tiến độ đường 6 trục, bảng số liệu thay thế (Accessible Table), khuyến nghị bài tập có giải trình logic, không dùng AI thần bí (Black-box).

6. **Classroom Heatmap & 3-Pane Continuous Review**:
   - Bản đồ nhiệt $36 \times 6$ trục có click xem dẫn chứng câu chữ thực tế (*Deep-link Evidence*).
   - Phòng chấm bài 3-Pane liên tục với phím tắt `Alt + Left/Right` chuyển học sinh siêu tốc.

---

## 🛠️ Công Nghệ & Tiêu Chuẩn

- **Frontend Core**: React 19, TypeScript, Tailwind CSS, Vite.
- **Biểu Đồ & Trực Quan Hóa**: Chart.js, React-ChartJS-2.
- **Tiêu Chuẩn Tiếp Cận**: Đạt chuẩn **WCAG 2.1/2.2 AA** (Skip-link, Landmarks, Aria-live, Touch targets $\ge 44\text{px}$).
- **Độ Tin Cậy Ngoại Tuyến**: Máy trạng thái **PWA / Offline Resilience** 4 pha (*Online, Offline, Syncing, Conflict*).
- **Kiểm Thử Tự Động**: 16/16 Test cases đạt chuẩn 100% PASS (`npm run test`).

---

## 📦 Cài Đặt & Chạy Thử Nghiệm

```bash
# 1. Clone repository
git clone https://github.com/remyvnkhiemtruong/cvt-khkt2627.git
cd cvt-khkt2627

# 2. Cài đặt dependencies
npm install

# 3. Chạy môi trường phát triển (Local Dev Server)
npm run dev

# 4. Chạy bộ kiểm thử tự động
npm run test

# 5. Build bản phát hành (Production Build)
npm run build
```

---

## 👥 Tài Khoản & Kịch Bản Trình Diễn Mẫu (Demo Sandbox)

- **Học sinh demo**: `HS-DEMO-01` (*Nguyễn Minh - Lớp 10A2 - Demo*)
- **Tác phẩm mẫu**: *Người ở bến sông Châu* (Sương Nguyệt Minh)
- **Chuỗi phiên bản**: $v1.0$ (Sơ thảo) $\rightarrow$ Phản hồi của cô Mai $\rightarrow$ $v2.0$ (Lí giải sâu hơn) $\rightarrow$ $v3.0$ (Bổ sung dẫn chứng).
