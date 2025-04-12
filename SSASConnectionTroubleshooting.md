# Hướng dẫn khắc phục sự cố kết nối SSAS

## Lỗi khi deploy: "A connection cannot be made. Ensure that the server is running."

Lỗi này thường xảy ra khi bạn cố gắng deploy một project SSAS từ Visual Studio đến SQL Server Analysis Services. Dưới đây là các bước kiểm tra và khắc phục sự cố:

### 1. Kiểm tra dịch vụ SSAS
- Mở **SQL Server Configuration Manager**
- Chọn **SQL Server Services**
- Kiểm tra **SQL Server Analysis Services (MSSQLSERVER)** có đang chạy không
- Nếu không chạy, nhấp chuột phải vào nó và chọn **Start**

### 2. Kiểm tra cấu hình Deployment trong Visual Studio
- Nhấp chuột phải vào project SSAS
- Chọn **Properties**
- Chọn tab **Deployment**
- Đảm bảo thông tin Server được thiết lập đúng
  - Thử sử dụng `localhost` hoặc tên máy chủ
  - Ví dụ: `localhost` hoặc `SERVERNAME\INSTANCE`

### 3. Kiểm tra kết nối bằng SQL Server Management Studio
- Mở SQL Server Management Studio (SSMS)
- Ở màn hình kết nối, chọn **Analysis Services** từ dropdown Server type
- Nhập `localhost` vào trường Server name
- Kiểm tra xem có kết nối được không

### 4. Kiểm tra tường lửa
- Đảm bảo cổng SSAS (2383 cho instance mặc định, 2382 cho SQL Browser) được mở
- Mở Windows Defender Firewall:
  ```
  Control Panel -> System and Security -> Windows Defender Firewall
  ```
- Chọn "Allow an app or feature through Windows Defender Firewall"
- Kiểm tra xem SQL Server và SQL Browser có được cho phép không

### 5. Kiểm tra Provider MSOLAP
- Đảm bảo MSOLAP provider được cài đặt đúng cách
- Chạy file cài đặt `SQL_AS_OLEDB.msi` trong thư mục extension

### 6. Kiểm tra quyền truy cập
- Đảm bảo người dùng có quyền truy cập vào SSAS
- Mở SSMS, kết nối đến SSAS
- Nhấp chuột phải vào server -> Properties -> Security
- Kiểm tra tài khoản người dùng của bạn có quyền không

### 7. Kiểm tra & sửa cấu hình SSAS
1. Tìm file cấu hình SSAS:
   - Thông thường ở `C:\Program Files\Microsoft SQL Server\MSAS15.MSSQLSERVER\OLAP\Config\msmdsrv.ini`
   
2. Kiểm tra các thiết lập trong file cấu hình:
   ```xml
   <Port>2383</Port>
   <AllowedBrowsingFolders>C:\</AllowedBrowsingFolders>
   ```

3. Nếu cần thiết, khởi động lại dịch vụ sau khi sửa cấu hình:
   ```
   net stop "SQL Server Analysis Services (MSSQLSERVER)"
   net start "SQL Server Analysis Services (MSSQLSERVER)"
   ```

### 8. Kiểm tra bằng Telnet
Kiểm tra kết nối đến cổng SSAS:
```
telnet localhost 2383
```
Nếu màn hình chuyển sang trắng, kết nối đang hoạt động.

### 9. Xem log lỗi SSAS
Kiểm tra log lỗi SSAS trong thư mục:
```
C:\Program Files\Microsoft SQL Server\MSAS15.MSSQLSERVER\OLAP\Log
```

### 10. Kiểm tra trạng thái dịch vụ bằng PowerShell
```powershell
$connStr = "Provider=MSOLAP;Data Source=localhost"
$conn = New-Object System.Data.OleDb.OleDbConnection($connStr)
$conn.Open()
```

### 11. Cài đặt lại SSAS
Nếu tất cả phương pháp trên không khắc phục được vấn đề:
- Cài đặt lại SQL Server Analysis Services
- Chọn "Repair" trong Control Panel -> Programs -> Programs and Features

### 12. Chạy script khắc phục tự động
Chạy file `SetupSSAS.bat` trong thư mục gốc của project để cài đặt và cấu hình lại SSAS tự động.

## Lỗi liên quan đến cài đặt

### Lỗi thiếu provider MSOLAP
Nếu gặp lỗi về MSOLAP provider:
- Cài đặt file `SQL_AS_OLEDB.msi` trong thư mục extension
- Hoặc tải về từ [Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=56722)

### Lỗi thiếu SQL Native Client
Nếu gặp lỗi về SQL Native Client:
- Cài đặt file `sqlncli.msi` trong thư mục extension
- Hoặc tải về từ [Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=50402)

## Khắc phục sự cố sau khi deploy thành công

### Lỗi kết nối đến cube
Nếu deploy thành công nhưng không thể kết nối đến cube:
1. Kiểm tra quyền truy cập vào database SSAS
2. Kiểm tra đường dẫn đến cube có chính xác không
3. Kiểm tra processing state của cube (có thể cube chưa được process)

### Khởi động lại Visual Studio
Đôi khi khởi động lại Visual Studio có thể khắc phục các vấn đề kết nối tạm thời.

### Chạy với quyền Admin
Chạy Visual Studio với quyền Administrator có thể giúp khắc phục một số vấn đề kết nối.

## Tài liệu tham khảo
- [SQL Server 2019 Analysis Services](https://docs.microsoft.com/en-us/analysis-services/analysis-services-overview)
- [Deploy và Process Analysis Services Objects](https://docs.microsoft.com/en-us/analysis-services/deployment/deployment-script-files-solution-deployment-properties)