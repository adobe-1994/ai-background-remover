# 🌟 Ứng Dụng Tách Nền AI (Background Remover) - DeepInfra Bria RMBG 2.0

Ứng dụng web hiện đại, tốc độ cao giúp tách nền ảnh tự động bằng trí tuệ nhân tạo, liên kết trực tiếp với API **Bria RMBG 2.0 (`Bria/remove_background`)** trên nền tảng **DeepInfra**.

---

## ✨ Tính Năng Nổi Bật

1. **Liên kết trực tiếp DeepInfra API**:
   - Sử dụng mô hình chuyên nghiệp **Bria RMBG 2.0** (`Bria/remove_background`) với chi phí cực rẻ (~$0.018 / ảnh).
   - Lưu trữ API Key an toàn trong trình duyệt (`localStorage`), không lo bị lộ.
   - Hỗ trợ công cụ kiểm tra kết nối (Test connection) tức thì.

2. **Tải & Nhập ảnh linh hoạt**:
   - **Kéo & Thả (Drag & Drop)** ảnh vào trình duyệt.
   - Hỗ trợ phím tắt **`Ctrl + V` (Dán từ Clipboard)**: Chụp màn hình hoặc copy ảnh từ web rồi paste trực tiếp vào app.
   - Tích hợp sẵn **Ảnh mẫu demo** (chân dung, giày sneaker, thú cưng, đồng hồ) để thử nghiệm chỉ bằng 1 cú nhấp chuột.

3. **Xử lý hàng loạt (Batch Processing)**:
   - Tải lên nhiều ảnh cùng lúc.
   - Hàng đợi xử lý thông minh với thanh tiến trình trực quan.
   - **Tải toàn bộ kết quả dạng file `.ZIP`** chỉ với 1 cú click.

4. **Trình so sánh & Chỉnh sửa hậu kỳ**:
   - **Thanh trượt Trước / Sau (Before / After Slider)**: Kéo trượt mượt mà để so sánh độ chính xác của đường cắt.
   - **Chế độ xem đa dạng**: Thanh trượt, Xem song song 2 bên (Side-by-side), hoặc Xem riêng kết quả.
   - Phóng to / Thu nhỏ (Zoom & Pan), Toàn màn hình.
   - **Đổi màu nền**: Trong suốt (PNG), màu đơn sắc (Palette + Color picker tùy chọn), Gradient thời thượng, hoặc tải ảnh nền phong cảnh riêng.
   - **Làm mờ nền gốc (Bokeh Blur)**: Giữ nền gốc nhưng làm mờ tạo hiệu ứng chụp ảnh chân dung xóa phông.
   - **Hiệu ứng Đổ bóng 3D (Drop Shadow)**: Thêm bóng đổ mềm mại cho vật thể.

5. **Xuất ảnh chất lượng cao**:
   - Tải file **PNG** trong suốt giữ nguyên độ phân giải gốc.
   - Tải file **JPG** với màu nền tùy chọn.
   - Nút **Sao chép vào Clipboard** để dán ngay sang Photoshop, Canva, Word, PowerPoint hoặc Zalo.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Khởi chạy ứng dụng
Trong thư mục dự án, chạy lệnh:
```bash
npm run dev
```
Trình duyệt sẽ mở tại địa chỉ: **`http://localhost:5173`**

### 2. Cấu hình API Key DeepInfra
1. Nhấp vào nút **`Nhập API Key`** ở góc trên bên phải màn hình.
2. Dán khóa API của bạn từ [DeepInfra Dashboard](https://deepinfra.com/dash/api_keys).
3. Nhấn **`Kiểm tra kết nối`** -> Nhấn **`Lưu cấu hình`**.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Hiệu ứng & Tiện ích**: Canvas-confetti, JSZip, File-saver.
- **AI Inference Engine**: DeepInfra Serverless API (`Bria/remove_background`).
