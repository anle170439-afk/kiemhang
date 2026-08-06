# Coffee Stock ERP

Bản nâng cấp gồm:
- Phiếu nhân viên kiểm hàng.
- Báo cáo sếp tự động tính.
- Danh mục nguyên vật liệu: thêm, sửa, xóa, ngừng sử dụng.
- Khai báo quy cách đóng gói.
- Khai báo khối lượng vỏ.
- Tự trừ khối lượng vỏ khi cân hàng lẻ.
- Tự lấy tồn cuối ngày trước thành tồn đầu ngày sau.
- Cảnh báo tồn thấp và số âm bất thường.
- Xuất/nhập toàn bộ dữ liệu JSON.

## Công thức hàng lẻ
Khối lượng thực = Khối lượng cân cả hộp - Khối lượng vỏ.

## GitHub Pages
Đưa các file `index.html`, `style.css`, `app.js`, `materials.js` lên thư mục gốc của repository rồi bật GitHub Pages.

## Lưu ý
Dữ liệu vẫn được lưu bằng localStorage trên từng thiết bị. Muốn nhân viên và sếp dùng nhiều máy đồng bộ thời gian thực cần thêm Firebase hoặc Supabase.

Commit changes
## Bản mobile mới
Phiếu nhân viên đã rút gọn còn:
Mã, Nhóm, Tên nguyên liệu, Đơn vị kho, Tồn đầu kho, Nhập kho, Xuất kho, Vỏ, Tồn lẻ cuối ngày, Ghi chú.

Trên điện thoại, mỗi nguyên liệu hiển thị thành một thẻ riêng để dễ nhập.
Cột Tồn lẻ cuối ngày nhập số cân cả hộp; báo cáo tự trừ khối lượng vỏ.
