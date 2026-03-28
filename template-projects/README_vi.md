# Dự án Template

Thư mục này chứa **các dự án game template** — những ứng dụng web độc lập định nghĩa các trò chơi mà giáo viên có thể tạo với Minigame Builder.

## Tổng quan

Mỗi thư mục con ở đây là một ứng dụng web hoàn chỉnh, độc lập:

- Sử dụng **bất kỳ công cụ nào** bạn muốn (Vite, Webpack, Rollup, v.v.)
- Build thành một tệp **`index.html` duy nhất** (qua `vite-plugin-singlefile` hoặc tương đương)
- Đọc dữ liệu do giáo viên tạo từ `window.APP_DATA` tại runtime
- Hoạt động hoàn toàn ngoại tuyến trên bất kỳ trình duyệt nào

## Điểm Bắt đầu Khuyến nghị

**Sử dụng `group-sort/` làm template.** Nó được cấu hình với:

- ✅ Vite + React 19
- ✅ React Compiler (tự động memoization)
- ✅ `vite-plugin-singlefile` cho đầu ra một tệp
- ✅ Tích hợp `window.APP_DATA` đúng cách
- ✅ Các thực hành tốt nhất hiện đại

Copy để bắt đầu:

```bash
cp -r template-projects/group-sort template-projects/my-new-game
```

## Công cụ Không bị Giới hạn

Mặc dù `group-sort` sử dụng Vite + React, bạn có thể dùng **bất cứ thứ gì**:

- Vue, Svelte, Angular, Solid
- Vanilla JavaScript
- Preact, Alpine.js
- Bất kỳ công cụ build nào (Vite, Webpack, Parcel, esbuild)

**Chỉ đầu ra build là quan trọng** (xem yêu cầu bên dưới).

## Yêu cầu

### Đầu ra Build

Template của bạn phải tạo ra:

| Tệp                  | Yêu cầu                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `index.html`         | **HTML một tệp** — tất cả JS/CSS được nhúng trực tiếp. Dùng `vite-plugin-singlefile` hoặc tương đương. |
| `images/` (tùy chọn) | Các tài sản hình ảnh không thể nhúng trực tiếp. Giữ ở mức tối thiểu.                         |

> ⚠️ **Không có tài sản khác.** Font chữ, biểu tượng, SVG nhỏ nên được nhúng trực tiếp vào HTML.

### Hợp đồng Dữ liệu Runtime

Builder chèn dữ liệu của giáo viên trước thẻ `<script>` đầu tiên:

```html
<script>
  window.APP_DATA = {
    /* dữ liệu của giáo viên */
  };
  window.MY_APP_DATA = window.APP_DATA; // bí danh cũ
  window.win = { DATA: window.APP_DATA }; // bí danh cũ
</script>
```

Trò chơi của bạn đọc `window.APP_DATA` khi khởi động. Hình dạng đối tượng tùy thuộc vào bạn!

### `meta.json`

Mỗi template phải có `meta.json` ở cấp root:

```json
{
  "name": "Tên Trò Chơi Dễ Đọc",
  "description": "Một câu mô tả hiển thị trên màn hình chính.",
  "gameType": "your-game-id",
  "version": "1.0.0"
}
```

Có thể thêm `thumbnail.png` cho thẻ hiển thị trên màn hình chính.

## Cấu trúc Thư mục

```
my-new-game/
├── src/                    # Mã nguồn trò chơi của bạn
├── public/                 # Tài sản tĩnh (nếu cần)
├── images/                 # Hình ảnh trò chơi (được tham chiếu trong build)
├── index.html              # Điểm vào HTML
├── package.json            # Phụ thuộc và scripts
├── vite.config.ts          # Cấu hình build
├── meta.json               # ⭐ Metadata của template (BẮT BUỘC)
└── thumbnail.png           # Hình thu nhỏ màn hình chính (tùy chọn)
```

## Quy trình Build

Các template được build bởi `build-templates.sh` từ root dự án:

```bash
# Build tất cả templates
./build-templates.sh

# Build một template cụ thể
./build-templates.sh my-new-game
```

Đầu ra build được sao chép vào `builder-projects/electron-app-mui/templates/<game-id>/game/`.

## Quy trình Phát triển

### 1. Phát triển Trò chơi của Bạn

```bash
cd template-projects/my-new-game
yarn install
yarn dev
```

Trò chơi của bạn nên hoạt động độc lập trong trình duyệt trong quá trình phát triển.

### 2. Kiểm tra với Dữ liệu Mock

Trong console trình duyệt, đặt dữ liệu mock:

```javascript
window.APP_DATA = {
  // Cấu trúc dữ liệu trò chơi của bạn
  items: [{ id: "1", text: "Hello" }],
};
```

### 3. Build và Kiểm tra trong Builder

```bash
# Từ root dự án
./build-templates.sh my-new-game

# Chạy builder
cd builder-projects/electron-app-mui
yarn dev
```

### 4. Xác minh Tích hợp

- [ ] Trò chơi xuất hiện trên màn hình chính của builder
- [ ] Tạo dự án hoạt động
- [ ] Editor có thể sửa đổi dữ liệu
- [ ] Preview hiển thị trò chơi của bạn với dữ liệu
- [ ] Export tạo ra trò chơi độc lập hoạt động

## Thêm một Trò chơi Mới

Xem hướng dẫn đầy đủ trong [Root README](../../README_vi.md#thêm-trò-chơi-mới--khởi-động-nhanh).

Các bước nhanh:

1. Copy `group-sort/` để tạo template của bạn
2. Sửa `meta.json` với thông tin trò chơi của bạn
3. Cập nhật `build-templates.sh` để đăng ký trò chơi của bạn
4. Build và kiểm tra

## Dành cho AI Chatbots

**Ngữ cảnh**: Thư mục này (`template-projects/`) chứa **mã nguồn** cho tất cả các game template. Mỗi template là một ứng dụng web độc lập với `package.json`, phụ thuộc và quy trình build riêng.

**Quan trọng**: Đầu ra đã build nằm trong `builder-projects/electron-app-mui/templates/<game-id>/game/`. Các thư mục đó chỉ chứa **tệp `index.html` đã thu gọn/bundle** (và tùy chọn là thư mục `images/`). Không có mã nguồn hữu ích nào để đọc trong các thư mục đầu ra build đó — chúng chỉ tồn tại để sử dụng runtime bởi ứng dụng Electron. **Luôn đọc từ `template-projects/<game-id>/`** để hiểu logic trò chơi và mã nguồn. Đọc nội dung thư mục `game/` sẽ lãng phí bộ nhớ context của bạn với mã đã thu gọn.

**Các Tệp Chính** (trong mỗi thư mục `template-projects/<game-id>/`):

- `meta.json` — Đăng ký template (tên, mô tả, gameType)
- `vite.config.ts` — Cấu hình build
- `src/` — Mã nguồn trò chơi
- `images/` — Tài sản trò chơi

**Lệnh Build**: `yarn build` (trong mỗi thư mục template)

**Đầu ra**: Một tệp `index.html` + thư mục `images/` (được sao chép vào `builder-projects/electron-app-mui/templates/`)

## Khắc phục Sự cố

### Build thất bại với "Template not found"

Đảm bảo `meta.json` tồn tại ở root của template (không phải bên trong `src/`).

### Trò chơi không nhận `window.APP_DATA`

Kiểm tra xem build của bạn tạo ra một tệp HTML duy nhất. Builder chèn dữ liệu trước thẻ `<script>` đầu tiên.

### Hình ảnh không tải trong trò chơi đã xuất

Hình ảnh phải nằm trong thư mục `images/` ở root. Builder sao chép thư mục này cùng với HTML đã xuất.

### Đầu ra build là nhiều tệp

Sử dụng `vite-plugin-singlefile` hoặc tương đương để nhúng tất cả JS/CSS vào HTML.

## Ví dụ

Xem các template hiện có để tham khảo:

- `group-sort/` — React + Vite hiện đại (base khuyến nghị)
- `plane-quiz/` — Trò chơi quiz với nhiều lựa chọn
- `balloon-letter-picker/` — Trò chơi từ tương tác
- `pair-matching/` — Trò chơi ghép đôi trí nhớ
- `word-search/` — Trò chơi tìm từ cổ điển
- `whack-a-mole/` — Trò chơi phản xạ

---

**Bước tiếp theo**: Sẵn sàng tạo? Copy `group-sort/` và bắt đầu build! 🚀
