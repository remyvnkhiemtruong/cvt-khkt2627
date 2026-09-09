# KHKT 2026–2027 — source question-bank ingestion

Ngày nạp production: 2026-09-10 (UTC+7).

Bộ câu hỏi được đọc từ các tài liệu nguồn của dự án và nạp trực tiếp vào PostgreSQL/Neon theo assignment. Không nhập toàn văn tác phẩm vào seed.

## Nguồn và số lượng

| Assignment | Tài liệu nguồn | V0 | Câu hỏi theo trục | Trục có bộ câu hỏi |
|---|---|---:|---:|---:|
| `11a1-vo-nhat` | `QUY TRÌNH LƯU PHIÊN BẢN HỒ SƠ ĐỌC SỐ.docx` | 12 | 42 | 5 |
| `11a1-chi-pheo` | `2. LƯU PHIÊN BẢN CHÍ PHÈO.docx` | 12 | 41 | 5 |
| `11a1-xuan-toc-do` | `3. LƯU PHIÊN BẢN SỐ ĐỎ(2).docx` | 10 | 28 | 5 |
| `11a1-mua-la-rung` | `4. LƯU PHIÊN BẢN MÙA LÁ RỤNG TRONG VƯỜN(2).docx` | 14 | 52 | 6 |

## Cách lưu production

Mỗi assignment có ba bề mặt đồng bộ:

1. `workflow_config.questionBank`: bản có cấu trúc gồm nguồn, V0, câu hỏi theo từng trục, yêu cầu V2 và REF1.
2. `guiding_steps`: bản hiển thị trực tiếp trong khu vực Yêu cầu nhiệm vụ của học sinh, để bộ câu hỏi dùng được ngay với UI hiện tại.
3. `reference_guide`: bản đối chiếu dành cho tài khoản AI/giáo viên; AI Workspace dùng phần này khi người vận hành copy response từ ChatGPT và dán vào hệ thống.

Nguyên tắc V0 được giữ đúng tài liệu: ghi nhận nhận thức ban đầu, căn cứ và mức tự tin; không chấm đúng/sai tuyệt đối; V0 bị khóa sau khi nộp.

Luồng nghiệp vụ production vẫn là:

`V0 → V1 → phản hồi AI/GV → V2 → REF1 → Rubric giáo viên → FINAL`.

AI là luồng thủ công: không gọi API AI trả phí; response ChatGPT được dán bằng tài khoản AI và khi gửi thì học sinh thấy ngay. Giáo viên vẫn giữ quyền đánh giá chính thức.

## Rollback / baseline

Neon branch sao lưu sau khi nạp hoàn chỉnh: `baseline-complete-questions-20260910` (`br-icy-base-aw8fydeg`).

Không lưu mật khẩu, password hash, JWT secret hay DATABASE_URL trong tài liệu này.
