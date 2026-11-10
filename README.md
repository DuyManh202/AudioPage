# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Thiết lập backend quản trị

1. Tạo `server/.env` từ `server/.env.example`, điền thông tin PostgreSQL, đặt `JWT_SECRET` ngẫu nhiên tối thiểu 32 ký tự và cấu hình `CORS_ORIGINS` theo domain frontend.
2. Chạy `npm run migrate` trong thư mục `server` để tạo/cập nhật schema. Migration vô hiệu hóa tài khoản seed cũ dùng mật khẩu công khai.
3. Đặt `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_PASSWORD` (tối thiểu 12 ký tự), `BOOTSTRAP_ADMIN_FULL_NAME` và `BOOTSTRAP_ADMIN_PHONE`; chạy `npm run admin:create` đúng một lần để tạo `SUPER_ADMIN`. Xóa các biến bootstrap sau khi tạo xong.
4. Chạy backend bằng `npm start` trong thư mục `server`.

### Vai trò

- `SUPER_ADMIN`: toàn quyền, gồm tạo/khóa tài khoản và đổi vai trò nhân viên.
- `SALES`: dashboard, khách hàng, đơn hàng và yêu cầu thu cũ đổi mới.
- `INVENTORY`: quản lý sản phẩm và gói dàn.

Vai trò được kiểm tra ở cả router giao diện và từng API backend. Backend đọc trạng thái tài khoản từ cơ sở dữ liệu ở mỗi yêu cầu; khóa tài khoản hoặc đổi vai trò có hiệu lực ngay. JWT hết hạn sau 8 giờ.

## Deploy Vercel + Render

- Import repository vào Render bằng Blueprint tại `render.yaml`. Nhập `DATABASE_URL` của Aiven và `CORS_ORIGINS`; Render sinh `JWT_SECRET`.
- Chạy migration `npm run migrate` với đúng `DATABASE_URL` trước khi backend nhận traffic. Tạo `SUPER_ADMIN` một lần bằng lệnh `npm run admin:create` với các biến bootstrap.
- Import cùng repository vào Vercel, giữ Root Directory ở repository root, đặt biến build `VITE_API_URL=https://<Render-service>.onrender.com/api/v1`, rồi deploy.
- Sau khi Vercel cấp URL, cập nhật `CORS_ORIGINS` trên Render thành origin chính xác của frontend (ví dụ `https://<project>.vercel.app`) và redeploy backend.
- Dùng `/api/v1/health` để kiểm tra backend kết nối cơ sở dữ liệu. Không đưa `server/.env` lên GitHub.
