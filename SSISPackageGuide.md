# HƯỚNG DẪN CHI TIẾT: XÂY DỰNG HỆ THỐNG ETL CHO DỮ LIỆU TIVI

## MỤC LỤC
1. [Tổng quan kiến trúc hệ thống](#i-tổng-quan-kiến-trúc-hệ-thống)
2. [Cài đặt môi trường phát triển](#ii-cài-đặt-môi-trường-phát-triển)
3. [Tạo cơ sở dữ liệu](#iii-tạo-cơ-sở-dữ-liệu)
4. [Phát triển SSIS Package](#iv-phát-triển-ssis-package)
5. [Triển khai và lập lịch](#v-triển-khai-và-lập-lịch-chạy-tự-động)
6. [Xử lý sự cố và tối ưu hóa](#vi-xử-lý-sự-cố-và-tối-ưu-hóa)
7. [Kiểm tra kết quả](#vii-kiểm-tra-và-phân-tích-dữ-liệu)
8. [Phụ lục & tài liệu tham khảo](#viii-phụ-lục--tài-liệu-tham-khảo)

## I. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1. Kiến trúc tổng thể
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Nguồn dữ liệu  │     │  Staging Area   │     │  Data Warehouse │     │  Visualization  │
│  (Excel Files)  │ ─── │  (TiviStagingDB)│ ─── │  (TiviDataWare- │ ─── │  (Power BI,     │
│                 │     │                 │     │  house)         │     │   SSAS)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1.2. Mô tả luồng dữ liệu

1. **Thu thập dữ liệu** - Dữ liệu được crawl từ 2 nguồn:
   - CellPhoneS: https://cellphones.com.vn/tivi.html
   - DienMayXanh: https://www.dienmayxanh.com/tivi

2. **Làm sạch dữ liệu** - Dữ liệu thô được làm sạch và chuẩn hóa:
   - Chuẩn hóa giá, phần trăm giảm giá
   - Xử lý giá trị NULL và đảm bảo tương thích SSIS
   - Chuẩn hóa các thuộc tính kỹ thuật

3. **Tải vào Staging** - Dữ liệu được tải vào cơ sở dữ liệu staging `TiviStagingDB`:
   - Lưu toàn bộ dữ liệu đã làm sạch 
   - Tạo bảng staging riêng biệt với đầy đủ thông tin

4. **Chuyển đổi vào Data Warehouse** - Dữ liệu từ staging được chuyển đổi vào mô hình Data Warehouse:
   - Tách thành các bảng Dimension (DimTime, DimScreenSize, DimResolution, DimManufacturer, v.v.)
   - Tạo bảng Fact (FactTVSales) kết nối các Dimension
   - Áp dụng các quy tắc business logic

5. **Phân tích** - Dữ liệu trong Data Warehouse sẵn sàng cho phân tích:
   - Truy vấn SQL phân tích
   - Power BI Dashboard
   - SSAS Cube

### 1.3. Mô hình dữ liệu

**Staging Database (`TiviStagingDB`)**
- `StagingTVData`: Bảng staging chứa toàn bộ dữ liệu TV từ nguồn

**Data Warehouse (`TiviDataWarehouse`)**
- Dimension tables:
  - `DimTime`: Lưu trữ thông tin thời gian (năm, quý, tháng, ngày)
  - `DimSource`: Lưu trữ thông tin nguồn dữ liệu (CellPhoneS, DienMayXanh)
  - `DimManufacturer`: Lưu trữ thông tin nhà sản xuất
  - `DimScreenSize`: Lưu trữ thông tin kích thước màn hình
  - `DimResolution`: Lưu trữ thông tin độ phân giải
  - `DimScreenType`: Lưu trữ thông tin loại màn hình
  - `DimOperatingSystem`: Lưu trữ thông tin hệ điều hành
  - `DimRefreshRate`: Lưu trữ thông tin tần số quét
  - `DimConnectivity`: Lưu trữ thông tin khả năng kết nối
  - `DimPrice`: Lưu trữ thông tin phân khúc giá
  - `DimProduct`: Lưu trữ thông tin sản phẩm (liên kết đến các dim khác)
- Fact table:
  - `FactTVSales`: Bảng fact chứa các phép đo và liên kết đến các Dimension

## II. CÀI ĐẶT MÔI TRƯỜNG PHÁT TRIỂN

### 2.1. Yêu cầu phần mềm

1. **SQL Server**:
   - SQL Server 2019 hoặc mới hơn (Standard/Enterprise)
   - SQL Server Management Studio (SSMS)

2. **Visual Studio**:
   - Visual Studio 2019 hoặc mới hơn
   - SQL Server Data Tools (SSDT)
   - Integration Services Project Extension

3. **Các driver và connector**:
   - Microsoft Access Database Engine để kết nối với Excel
   - OLEDB provider cho SQL Server
   - SQL_AS_OLEDB.msi (trong thư mục extensions)
   
### 2.2. Cài đặt SQL Server Data Tools

1. Mở Visual Studio Installer
2. Chọn "Modify" trên Visual Studio đã cài đặt
3. Trong tab "Workloads", chọn "Data storage and processing"
4. Đánh dấu "SQL Server Data Tools" và "SQL Server Integration Services"
5. Nhấn "Modify" để cài đặt

### 2.3. Cài đặt Microsoft Access Database Engine

1. Chạy file `InstallAccessEngine.bat` trong thư mục root:
   ```
   @echo off
   echo Installing Microsoft Access Database Engine...
   extension\msoledbsql.msi /quiet /norestart
   echo Done.
   ```

2. Đảm bảo cài đặt phiên bản phù hợp (32-bit hoặc 64-bit) tương thích với Visual Studio.

3. Cài đặt các driver cần thiết:
   - MSOLEDBSQL driver
   - SQLNCLI
   - SQL_AS_OLEDB

## III. TẠO CƠ SỞ DỮ LIỆU

### 3.1. Tạo Staging Database

1. **Mở SSMS và kết nối đến SQL Server instance**

2. **Chạy script để tạo TiviStagingDB**:
   ```sql
   -- Tạo Staging Database
   USE [master]
   GO
   
   IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TiviStagingDB')
   BEGIN
       CREATE DATABASE TiviStagingDB;
   END
   GO
   ```

3. **Chạy file `CreateStagingDatabase.sql` để tạo bảng staging**:
   ```
   SQLCMD -S DESKTOP-LM393J1 -E -i "d:\CrawlData\CreateStagingDatabase.sql"
   ```
   Hoặc mở file trong SSMS và thực thi trực tiếp.

### 3.2. Tạo Data Warehouse

1. **Chạy script để tạo TiviDataWarehouse**:
   ```sql
   -- Tạo Data Warehouse
   USE [master]
   GO
   
   IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TiviDataWarehouse')
   BEGIN
       CREATE DATABASE TiviDataWarehouse;
   END
   GO
   ```

2. **Chạy file `CreateDataWarehouse.sql` để tạo các bảng Dimension và Fact**:
   ```
   SQLCMD -S DESKTOP-LM393J1 -E -i "d:\CrawlData\CreateDataWarehouse.sql"
   ```
   Hoặc mở file trong SSMS và thực thi.

### 3.3. Kiểm tra cấu trúc database

Sau khi tạo xong, kiểm tra cấu trúc database để đảm bảo các bảng đã được tạo đúng:

```sql
-- Kiểm tra TiviStagingDB
USE TiviStagingDB;
GO
SELECT * FROM INFORMATION_SCHEMA.TABLES;
GO

-- Kiểm tra TiviDataWarehouse
USE TiviDataWarehouse;
GO
SELECT * FROM INFORMATION_SCHEMA.TABLES;
GO
```

## IV. PHÁT TRIỂN SSIS PACKAGE

### 4.1. Tạo Integration Services Project mới

1. **Mở Visual Studio với quyền Administrator**

2. **Tạo Project mới**:
   - File > New > Project
   - Tìm kiếm "Integration Services"
   - Chọn "Integration Services Project"
   - Đặt tên: "TiviDataWarehouseETL"
   - Chọn vị trí lưu và nhấn "Create"

3. **Tạo hai package chính**:
   - Nhấp chuột phải vào SSIS Packages > Add New Package
   - Đặt tên: "LoadToStaging.dtsx"
   - Thêm package thứ hai: "StageToWarehouse.dtsx"

### 4.2. Tạo Connection Managers

Trong mỗi package, tạo các Connection Manager cần thiết:

1. **Kết nối Excel CellPhoneS**:
   - Nhấp chuột phải vào Connection Managers > New Connection > Excel
   - Browse tới file `d:\CrawlData\scripts\data\cleaned_tivi_data_cellphones.xlsx`
   - Excel version: Microsoft Excel 2016
   - FirstRowHasColumnName: True
   - Đặt tên: "Excel_CellPhoneS"

2. **Kết nối Excel DienMayXanh**:
   - Thực hiện tương tự với file `cleaned_tivi_data_dienmayxanh.xlsx`
   - Đặt tên: "Excel_DienMayXanh"

3. **Kết nối TiviStagingDB**:
   - Nhấp chuột phải > New Connection > OLEDB
   - Chọn "Microsoft OLE DB Provider for SQL Server" hoặc "Microsoft OLE DB Driver for SQL Server"
   - Server name: DESKTOP-LM393J1 (hoặc tên SQL Server instance của bạn)
   - Authentication: Windows Authentication (hoặc SQL Server Authentication nếu cần)
   - Database: TiviStagingDB
   - Test Connection để kiểm tra
   - Đặt tên: "OLEDB_TiviStagingDB"

4. **Kết nối TiviDataWarehouse**:
   - Tương tự như trên nhưng chọn database TiviDataWarehouse
   - Đặt tên: "OLEDB_TiviDW"

### 4.3. Phát triển Package "LoadToStaging.dtsx"

#### 4.3.1. Tạo Control Flow

1. **Thêm Execute SQL Task để xóa dữ liệu cũ**:
   - Kéo "Execute SQL Task" vào Control Flow và đặt tên là "Truncate Staging Table"
   - Double-click để cấu hình:
     - Connection: OLEDB_TiviStagingDB
     - SQLStatement: `TRUNCATE TABLE StagingTVData;`
     - ResultSet: None
     - Nhấn OK

2. **Thêm Data Flow Task để load dữ liệu CellPhoneS**:
   - Kéo "Data Flow Task" vào Control Flow và đặt tên là "Load CellPhoneS Data"
   - Kéo đường từ "Truncate Staging Table" đến "Load CellPhoneS Data" để tạo precedence constraint

3. **Thêm Data Flow Task để load dữ liệu DienMayXanh**:
   - Kéo "Data Flow Task" vào Control Flow và đặt tên là "Load DienMayXanh Data"
   - Kéo đường từ "Load CellPhoneS Data" đến "Load DienMayXanh Data"

#### 4.3.2. Cấu hình Data Flow cho CellPhoneS

1. **Double-click vào "Load CellPhoneS Data" để cấu hình**:

2. **Thêm Excel Source**:
   - Kéo "Excel Source" vào Data Flow
   - Cấu hình:
     - Excel Connection Manager: Excel_CellPhoneS
     - Data access mode: Table or view
     - Chọn sheet: [Cleaned Data$]
     - Preview để kiểm tra dữ liệu
     - Nhấn OK

3. **Thêm Data Conversion Transformation**:
   - Kéo "Data Conversion" component vào Data Flow và kết nối với Excel Source
   - Cấu hình:
     - Chọn tất cả cột kiểu text/string
     - Đối với mỗi cột, đặt tên output là [conversion]ColumnName và chọn kiểu DT_WSTR với độ dài 255
     - Đặc biệt chú ý các cột sau cần đảm bảo độ dài phù hợp:
       - ImageTechnology → [conversion]ImageTechnology với kiểu DT_WSTR(255)
       - VideoAudioInputPorts → [conversion]VideoAudioInputPorts với kiểu DT_WSTR(500)
     - Nhấn OK

4. **Thêm Derived Column để thêm thông tin nguồn**:
   - Kéo "Derived Column" component vào Data Flow và kết nối với Data Conversion
   - Cấu hình:
     - Thêm cột mới:
       - SourceName: `"CellPhoneS"` (bao gồm dấu ngoặc kép)
       - SourceURL: `"https://cellphones.com.vn/tivi.html"`
     - Nhấn OK

5. **Thêm OLE DB Destination**:
   - Kéo "OLE DB Destination" component vào Data Flow và kết nối với Derived Column
   - Cấu hình:
     - OLE DB Connection Manager: OLEDB_TiviStagingDB
     - Chế độ: Table or view - fast load
     - Table: [dbo].[StagingTVData]
     - Chuyển qua tab "Mappings" để ánh xạ cột:
       - dataId -> DataId
       - [conversion]name -> Name
       - price -> Price
       - oldPrice -> OldPrice
       - discountPercent -> DiscountPercent
       - [conversion]imageUrl -> ImageUrl
       - [conversion]screenSize -> ScreenSize
       - ... (map tất cả các cột đã được convert)
     - Nhấn OK

#### 4.3.3. Cấu hình Data Flow cho DienMayXanh

Lặp lại các bước tương tự như CellPhoneS nhưng:
- Sử dụng Excel_DienMayXanh connection
- Đặt giá trị Derived Column:
  - SourceName: `"DienMayXanh"`
  - SourceURL: `"https://www.dienmayxanh.com/tivi"`

### 4.4. Phát triển Package "StageToWarehouse.dtsx"

#### 4.4.1. Tạo Control Flow

1. **Thêm Execute SQL Task để chạy LoadDimTime**:
   - Kéo "Execute SQL Task" vào Control Flow và đặt tên là "Load DimTime"
   - Cấu hình:
     - Connection: OLEDB_TiviDW
     - SQLStatement: `EXEC dbo.usp_LoadDimTime;`

2. **Thêm Execute SQL Task để chạy LoadDimPrice**:
   - Kéo "Execute SQL Task" vào Control Flow và đặt tên là "Load DimPrice"
   - Kéo đường từ "Load DimTime" đến "Load DimPrice"
   - Cấu hình:
     - Connection: OLEDB_TiviDW
     - SQLStatement: `EXEC dbo.usp_LoadDimPrice;`

3. **Thêm các Execute SQL Task để load các dimension mới**:
   - Kéo nhiều "Execute SQL Task" và đặt tên lần lượt:
     - "Load DimScreenSize"
     - "Load DimResolution"
     - "Load DimScreenType"
     - "Load DimOperatingSystem"
     - "Load DimRefreshRate"
     - "Load DimConnectivity"
   - Kéo đường từ "Load DimPrice" đến "Load DimScreenSize", sau đó nối tiếp các task
   - Cấu hình mỗi task với các lệnh SQL tương ứng:
     ```sql
     EXEC dbo.usp_LoadDimScreenSize;
     EXEC dbo.usp_LoadDimResolution;
     EXEC dbo.usp_LoadDimScreenType;
     EXEC dbo.usp_LoadDimOperatingSystem;
     EXEC dbo.usp_LoadDimRefreshRate;
     EXEC dbo.usp_LoadDimConnectivity;
     ```

4. **Thêm Execute SQL Task để chạy LoadDimManufacturer**:
   - Kéo "Execute SQL Task" và đặt tên là "Load DimManufacturer"
   - Kéo đường từ "Load DimConnectivity" (task trước đó) đến "Load DimManufacturer"
   - Cấu hình:
     - Connection: OLEDB_TiviDW
     - SQLStatement: `EXEC dbo.usp_LoadDimManufacturer;`

5. **Thêm Execute SQL Task để chạy LoadDimProduct**:
   - Kéo "Execute SQL Task" và đặt tên là "Load DimProduct"
   - Kéo đường từ "Load DimManufacturer" đến "Load DimProduct"
   - Cấu hình:
     - Connection: OLEDB_TiviDW
     - SQLStatement: `EXEC dbo.usp_LoadDimProduct;`

6. **Thêm Execute SQL Task để chạy LoadFactTVSales**:
   - Kéo "Execute SQL Task" và đặt tên là "Load FactTVSales"
   - Kéo đường từ "Load DimProduct" đến "Load FactTVSales"
   - Cấu hình:
     - Connection: OLEDB_TiviDW
     - SQLStatement: `EXEC dbo.usp_LoadFactTVSales;`

**Lưu ý**: Việc thực thi theo thứ tự các task này rất quan trọng vì có sự phụ thuộc dữ liệu giữa các Dimension và Fact table.

### 4.5. Tạo Main Package "Master_ETL.dtsx"

1. **Tạo package mới**:
   - Nhấp chuột phải vào SSIS Packages > Add New Package
   - Đặt tên: "Master_ETL.dtsx"

2. **Thêm Execute Package Task để chạy LoadToStaging**:
   - Kéo "Execute Package Task" vào Control Flow và đặt tên là "Execute LoadToStaging"
   - Cấu hình:
     - Location: Project
     - PackageNameFromProjectReference: LoadToStaging.dtsx

3. **Thêm Execute Package Task để chạy StageToWarehouse**:
   - Kéo "Execute Package Task" vào Control Flow và đặt tên là "Execute StageToWarehouse"
   - Kéo đường từ "Execute LoadToStaging" đến "Execute StageToWarehouse"
   - Cấu hình:
     - Location: Project
     - PackageNameFromProjectReference: StageToWarehouse.dtsx

### 4.6. Cấu hình Error Handling và Logging

1. **Thiết lập Error Output cho các Data Transformation**:
   - Đối với mỗi Data Conversion và transformation, nhấp chuột phải > Show Advanced Editor
   - Chuyển đến tab "Error Output"
   - Đối với mỗi cột, đặt Error và Truncation thành "Redirect row"

2. **Cấu hình Logging**:
   - Nhấp chuột phải vào vùng trống trong Control Flow > Logging
   - Chọn "SSIS log provider for SQL Server" hoặc "SSIS log provider for Text files"
   - Cấu hình để lưu log vào bảng trong SQL Server hoặc file text
   - Chọn các events:
     - OnError
     - OnTaskFailed
     - OnWarning
     - OnPreExecute, OnPostExecute (tùy chọn)

3. **Cấu hình Failure Paths**:
   - Nhấp chuột phải vào đường kết nối giữa các tasks > Edit
   - Cấu hình failure path để xử lý lỗi khi task không hoàn thành

## V. TRIỂN KHAI VÀ LẬP LỊCH CHẠY TỰ ĐỘNG

### 5.1. Triển khai SSIS Project lên SQL Server

1. **Chuẩn bị SSIS Catalog**:
   - Mở SSMS và kết nối đến instance
   - Nếu SSIS Catalog chưa được tạo:
     - Mở SQL Server Agent để đảm bảo dịch vụ đang chạy
     - Expand Integration Services Catalogs
     - Nhấp chuột phải > Create Catalog
     - Đánh dấu "Enable CLR Integration"
     - Đặt mật khẩu và nhấn OK

2. **Triển khai Project**:
   - Trong Visual Studio, nhấp chuột phải vào project > Deploy
   - Chọn Server name: [your_server_name]
   - Chọn Path: /SSISDB/[folder_name]
   - Nhấn Deploy

### 5.2. Lập lịch chạy tự động với SQL Server Agent

1. **Tạo Job mới**:
   - Mở SSMS > Expand SQL Server Agent > Nhấp chuột phải Jobs > New Job
   - General tab:
     - Name: TiviETL_Daily
     - Owner: [your_username]
     - Category: [select_appropriate_category]
     - Description: ETL process for TV data warehouse

2. **Thêm Step để chạy Crawl**:
   - Chuyển đến Steps tab > New
   - Step name: Run Data Crawling
   - Type: Operating system (CmdExec)
   - Command: `node "d:\CrawlData\scripts\RunCrawlAndClean.js"`
   - Nhấn OK

3. **Thêm Step để chạy SSIS Package**:
   - Nhấp New để thêm step mới
   - Step name: Run SSIS ETL
   - Type: SQL Server Integration Services Package
   - Package source: SSIS Catalog
   - Server: [your_server_name]
   - Path: /SSISDB/[folder_name]/TiviDataWarehouseETL/Master_ETL.dtsx
   - Execution options: 32-bit runtime (nếu cần)
   - Nhấn OK

4. **Cấu hình Schedule**:
   - Chuyển đến Schedules tab > New Schedule
   - Name: Daily_2AM
   - Schedule type: Recurring
   - Frequency: Daily
   - Daily frequency: Occurs once at: 2:00:00 AM
   - Nhấn OK

5. **Cấu hình Notification**:
   - Chuyển đến Notifications tab
   - Chọn các thông báo phù hợp:
     - Email
     - Windows event log
   - Đặt điều kiện thông báo:
     - When the job succeeds
     - When the job fails
   - Nhấn OK

### 5.3. Kiểm tra chạy thủ công

Trước khi lập lịch tự động, nên chạy thủ công để kiểm tra:

1. **Chạy Crawl và Clean**:
   ```
   node "d:\CrawlData\scripts\RunCrawlAndClean.js"
   ```

2. **Chạy SSIS Package**:
   - Mở SSMS > Connect to Integration Services
   - Expand SSISDB > [folder_name] > Projects > TiviDataWarehouseETL > Packages
   - Nhấp chuột phải vào Master_ETL.dtsx > Execute
   - Nhấn OK để thực thi

3. **Kiểm tra kết quả trong database**:
   ```sql
   USE TiviDataWarehouse;
   GO
   SELECT COUNT(*) FROM FactTVSales;
   GO
   ```

## VI. XỬ LÝ SỰ CỐ VÀ TỐI ƯU HÓA

### 6.1. Các lỗi thường gặp và cách khắc phục

#### 6.1.1. Lỗi kết nối Excel

**Triệu chứng**: "The requested OLE DB provider Microsoft.ACE.OLEDB.16.0 is not registered."

**Giải pháp**:
1. Cài đặt Microsoft Access Database Engine:
   ```
   d:\CrawlData\InstallAccessEngine.bat
   ```
2. Đảm bảo phiên bản 32-bit/64-bit phù hợp với Visual Studio
3. Đổi package execution từ 64-bit sang 32-bit:
   - Nhấp chuột phải vào Project > Properties
   - Debugging > Run64BitRuntime: False

#### 6.1.2. Lỗi Data Conversion

**Triệu chứng**: "Text was truncated or one or more characters had no match in the target code page."

**Giải pháp**:
1. Tăng kích thước cột trong Data Conversion:
   - Mở Data Conversion transformation
   - Tăng độ dài cột từ 255 lên 500 hoặc hơn
2. Xử lý chuỗi trong phase làm sạch dữ liệu:
   ```javascript
   // Trong CleanDataCellPhoneS.js và CleanDataDienMayXanh.js
   function cleanForSsis(value) {
     // ...existing code...
     // Truncate if too long to avoid "long data" errors
     if (cleaned.length > 250) {
       cleaned = cleaned.substring(0, 250);
     }
     return cleaned;
   }
   ```

#### 6.1.3. Lỗi Cross-Database Queries

**Triệu chứng**: "Could not access database TiviStagingDB from TiviDataWarehouse"

**Giải pháp**:
1. Kiểm tra quyền truy cập:
   ```sql
   USE [master]
   GO
   GRANT VIEW ANY DEFINITION TO [username];
   ```
2. Bật cờ Cross-database ownership chaining:
   ```sql
   sp_configure 'cross db ownership chaining', 1;
   RECONFIGURE;
   ```
3. Đảm bảo SQL Server Browser service đang chạy

### 6.2. Tối ưu hóa hiệu suất

#### 6.2.1. Tối ưu cho Data Flow Tasks

1. **Cấu hình DefaultBufferSize và DefaultBufferMaxRows**:
   - Nhấp chuột phải vào Data Flow area > Properties
   - Thiết lập DefaultBufferSize = 10485760 (10MB)
   - Thiết lập DefaultBufferMaxRows = 30000

2. **Fast Load cho OLE DB Destination**:
   - Mở OLE DB Destination > Show Advanced Editor
   - Component Properties > FastLoadOptions:
     ```
     TABLOCK,CHECK_CONSTRAINTS,ROWS_PER_BATCH=10000
     ```

#### 6.2.2. Tối ưu SQL Stored Procedures

1. **Thêm chỉ mục cho bảng Staging**:
   ```sql
   USE TiviStagingDB;
   GO
   CREATE NONCLUSTERED INDEX IX_StagingTVData_Name ON StagingTVData (Name);
   CREATE NONCLUSTERED INDEX IX_StagingTVData_Manufacturer ON StagingTVData (Manufacturer);
   GO
   ```

2. **Thêm chỉ mục cho Data Warehouse**:
   ```sql
   USE TiviDataWarehouse;
   GO
   CREATE NONCLUSTERED INDEX IX_DimProduct_ProductName ON DimProduct (ProductName);
   CREATE NONCLUSTERED INDEX IX_DimManufacturer_Name ON DimManufacturer (ManufacturerName);
   GO
   ```

## VII. KIỂM TRA VÀ PHÂN TÍCH DỮ LIỆU

### 7.1. Truy vấn kiểm tra dữ liệu đã nạp thành công

```sql
-- Kiểm tra số lượng bản ghi trong các bảng
USE TiviDataWarehouse;
GO

-- 1. Kiểm tra số lượng bản ghi theo bảng
SELECT 'DimTime' AS TableName, COUNT(*) AS RecordCount FROM DimTime
UNION ALL
SELECT 'DimSource', COUNT(*) FROM DimSource
UNION ALL  
SELECT 'DimManufacturer', COUNT(*) FROM DimManufacturer
UNION ALL
SELECT 'DimScreenSize', COUNT(*) FROM DimScreenSize
UNION ALL
SELECT 'DimResolution', COUNT(*) FROM DimResolution
UNION ALL
SELECT 'DimScreenType', COUNT(*) FROM DimScreenType
UNION ALL
SELECT 'DimOperatingSystem', COUNT(*) FROM DimOperatingSystem
UNION ALL
SELECT 'DimRefreshRate', COUNT(*) FROM DimRefreshRate
UNION ALL
SELECT 'DimConnectivity', COUNT(*) FROM DimConnectivity
UNION ALL
SELECT 'DimPrice', COUNT(*) FROM DimPrice
UNION ALL
SELECT 'DimProduct', COUNT(*) FROM DimProduct
UNION ALL
SELECT 'FactTVSales', COUNT(*) FROM FactTVSales;

-- 2. Kiểm tra dữ liệu theo nhà sản xuất và độ phân giải
SELECT m.ManufacturerName, 
       r.ResolutionCategory,
       COUNT(DISTINCT p.ProductID) AS ProductCount,
       AVG(f.Price) AS AvgPrice
FROM DimManufacturer m
JOIN DimProduct p ON m.ManufacturerID = p.ManufacturerID
JOIN DimResolution r ON p.ResolutionID = r.ResolutionID
JOIN FactTVSales f ON p.ProductID = f.ProductID
GROUP BY m.ManufacturerName, r.ResolutionCategory
ORDER BY m.ManufacturerName, r.ResolutionCategory;

-- 3. So sánh giá giữa các nguồn theo kích thước màn hình
SELECT s.ScreenSizeValue,
       s.ScreenSizeCategory,
       AVG(CASE WHEN src.SourceName = 'CellPhoneS' THEN f.Price END) AS CellPhoneS_Avg_Price,
       AVG(CASE WHEN src.SourceName = 'DienMayXanh' THEN f.Price END) AS DienMayXanh_Avg_Price,
       COUNT(DISTINCT p.ProductID) AS ProductCount
FROM FactTVSales f
JOIN DimProduct p ON f.ProductID = p.ProductID
JOIN DimScreenSize s ON p.ScreenSizeID = s.ScreenSizeID
JOIN DimSource src ON f.SourceID = src.SourceID
GROUP BY s.ScreenSizeValue, s.ScreenSizeCategory
ORDER BY s.ScreenSizeCategory, s.ScreenSizeValue;

-- 4. Phân tích xu hướng tivi theo hệ điều hành
SELECT os.OperatingSystemName,
       os.OSCategory,
       COUNT(DISTINCT p.ProductID) AS ProductCount,
       AVG(f.Price) AS AvgPrice,
       MIN(f.Price) AS MinPrice,
       MAX(f.Price) AS MaxPrice
FROM DimOperatingSystem os
JOIN DimProduct p ON os.OperatingSystemID = p.OperatingSystemID
JOIN FactTVSales f ON p.ProductID = f.ProductID
GROUP BY os.OperatingSystemName, os.OSCategory
ORDER BY ProductCount DESC;
```

### 7.2. Kiểm tra hiệu suất ETL

```sql
-- Kiểm tra thời gian thực thi gói SSIS
USE SSISDB;
GO

SELECT execution_id,
       folder_name,
       project_name,
       package_name,
       start_time,
       end_time,
       DATEDIFF(SECOND, start_time, end_time) AS duration_seconds,
       status
FROM catalog.executions
ORDER BY start_time DESC;

-- Kiểm tra chi tiết tình trạng thực thi
SELECT message_time,
       message_type,
       message_source_name,
       message
FROM catalog.event_messages
WHERE operation_id = @execution_id -- Thay execution_id từ truy vấn trên
ORDER BY message_time;
```

### 7.3. Truy vấn phân tích dữ liệu nâng cao

```sql
-- 1. Phân tích mối quan hệ giữa tần số quét và giá bán
SELECT rr.RefreshRateValue,
       rr.RefreshRateHz,
       pr.PriceSegment,
       COUNT(DISTINCT f.ProductID) AS ProductCount,
       AVG(f.Price) AS AvgPrice
FROM FactTVSales f
JOIN DimProduct p ON f.ProductID = p.ProductID
JOIN DimRefreshRate rr ON p.RefreshRateID = rr.RefreshRateID
JOIN DimPrice pr ON f.PriceID = pr.PriceID
WHERE rr.RefreshRateHz > 0
GROUP BY rr.RefreshRateValue, rr.RefreshRateHz, pr.PriceSegment
ORDER BY rr.RefreshRateHz, pr.PriceSegment;

-- 2. Phân tích khả năng kết nối của các mẫu tivi hiện đại
SELECT c.HasWifi,
       c.HasBluetooth,
       c.HasEthernet,
       COUNT(DISTINCT p.ProductID) AS ProductCount,
       AVG(f.Price) AS AvgPrice,
       STRING_AGG(DISTINCT os.OSCategory, ', ') AS OSCategories
FROM DimConnectivity c
JOIN DimProduct p ON c.ConnectivityID = p.ConnectivityID
JOIN FactTVSales f ON p.ProductID = f.ProductID
JOIN DimOperatingSystem os ON p.OperatingSystemID = os.OperatingSystemID
GROUP BY c.HasWifi, c.HasBluetooth, c.HasEthernet
ORDER BY ProductCount DESC;

-- 3. Phân tích xu hướng giảm giá theo nhà sản xuất và kích thước màn hình
SELECT m.ManufacturerName,
       s.ScreenSizeCategory,
       AVG(f.DiscountPercent) AS AvgDiscountPercent,
       AVG(f.DiscountAmount) AS AvgDiscountAmount,
       COUNT(DISTINCT f.ProductID) AS ProductCount
FROM FactTVSales f
JOIN DimManufacturer m ON f.ManufacturerID = m.ManufacturerID
JOIN DimScreenSize s ON f.ScreenSizeID = s.ScreenSizeID
WHERE f.DiscountPercent <> 0
GROUP BY m.ManufacturerName, s.ScreenSizeCategory
ORDER BY AvgDiscountAmount DESC;

-- 4. Phân tích phân khúc giá theo công nghệ màn hình và độ phân giải
SELECT st.ScreenTypeValue,
       r.ResolutionCategory,
       pr.PriceSegment,
       COUNT(DISTINCT f.ProductID) AS ProductCount,
       AVG(f.Price) AS AvgPrice
FROM FactTVSales f
JOIN DimProduct p ON f.ProductID = p.ProductID
JOIN DimScreenType st ON p.ScreenTypeID = st.ScreenTypeID
JOIN DimResolution r ON p.ResolutionID = r.ResolutionID
JOIN DimPrice pr ON f.PriceID = pr.PriceID
GROUP BY st.ScreenTypeValue, r.ResolutionCategory, pr.PriceSegment
ORDER BY st.ScreenTypeValue, r.ResolutionCategory, pr.PriceSegment;
```

## VIII. PHỤ LỤC & TÀI LIỆU THAM KHẢO

### 8.1. Cấu trúc thư mục dự án

```
D:\CrawlData\
│
├── AutoCrawl.bat                        # Batch file để chạy quá trình crawl tự động
├── CreateDataWarehouse.sql              # Script tạo Data Warehouse database
├── CreateStagingDatabase.sql            # Script tạo Staging database
├── InstallAccessEngine.bat              # Batch file cài đặt Microsoft Access Database Engine
├── SSISPackageGuide.md                  # Tài liệu hướng dẫn SSIS này
│
├── scripts/                             # Thư mục scripts crawl và xử lý dữ liệu
│   ├── RunCrawlAndClean.js              # Script chính để chạy toàn bộ quá trình crawl và làm sạch
│   ├── CrawlDataCellPhoneS.js           # Script crawl dữ liệu từ CellPhoneS
│   ├── CrawlDataDienMayXanh.js          # Script crawl dữ liệu từ DienMayXanh
│   ├── CleanDataCellPhoneS.js           # Script làm sạch dữ liệu CellPhoneS
│   ├── CleanDataDienMayXanh.js          # Script làm sạch dữ liệu DienMayXanh
│   │
│   └── data/                            # Thư mục chứa dữ liệu Excel
│       ├── tivi_data_cellphones.xlsx    # Dữ liệu thô từ CellPhoneS
│       ├── tivi_data_dienmayxanh.xlsx   # Dữ liệu thô từ DienMayXanh
│       ├── cleaned_tivi_data_cellphones.xlsx  # Dữ liệu đã làm sạch từ CellPhoneS
│       └── cleaned_tivi_data_dienmayxanh.xlsx # Dữ liệu đã làm sạch từ DienMayXanh
│
└── extension/                           # Thư mục chứa các file cài đặt
    ├── SQL_AS_OLEDB.msi                 # OLEDB provider cho SQL Server Analysis Services
    ├── sqlncli.msi                      # SQL Native Client
    └── msoledbsql.msi                   # Microsoft OLE DB Driver cho SQL Server
```

### 8.2. Mã nguồn mẫu cho các công cụ bổ sung

#### 8.2.1. Chạy crawler và ETL tự động

```javascript
// etl_process.js - Script để chạy toàn bộ quy trình ETL với DW mở rộng
const { exec } = require('child_process');
const path = require('path');

async function runProcess() {
  try {
    // 1. Chạy crawl và làm sạch dữ liệu
    console.log('Bắt đầu crawl và làm sạch dữ liệu...');
    await execPromise('node scripts/RunCrawlAndClean.js');
    
    // 2. Chạy SSIS Package qua DTExec
    console.log('Chạy SSIS Package để load dữ liệu vào Data Warehouse...');
    await execPromise(
      'DTExec /F "C:\\SSIS\\TiviDataWarehouseETL\\Master_ETL.dtsx" /CONFIGFILE "C:\\SSIS\\config.dtsConfig"'
    );
    
    // 3. Kiểm tra dữ liệu đã load
    console.log('Kiểm tra kết quả load dữ liệu...');
    await execPromise(
      'sqlcmd -S localhost -E -d TiviDataWarehouse -Q "SELECT COUNT(*) AS RecordCount FROM FactTVSales;"'
    );
    
    console.log('Quá trình ETL hoàn tất!');
  } catch (error) {
    console.error('Lỗi trong quá trình ETL:', error);
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.error(`Lỗi: ${error.message}`);
        return reject(error);
      }
      resolve();
    });
  });
}

runProcess();
```

#### 8.2.2. PowerShell script để kiểm tra tình trạng ETL và gửi thông báo

```powershell
# Monitor_ETL_Status.ps1 - Kiểm tra tình trạng ETL cùng với các dimension mới
param (
    [string]$SqlServer = "DESKTOP-LM393J1",
    [string]$Database = "TiviDataWarehouse",
    [int]$HoursBack = 24
)

# Import SQL Server module
Import-Module SqlServer

# Kiểm tra số lượng bản ghi trong các bảng dimension và fact
$query = @"
SELECT TableName, RecordCount FROM (
    SELECT 'DimTime' AS TableName, COUNT(*) AS RecordCount FROM DimTime
    UNION ALL
    SELECT 'DimSource', COUNT(*) FROM DimSource
    UNION ALL  
    SELECT 'DimManufacturer', COUNT(*) FROM DimManufacturer
    UNION ALL
    SELECT 'DimScreenSize', COUNT(*) FROM DimScreenSize
    UNION ALL
    SELECT 'DimResolution', COUNT(*) FROM DimResolution
    UNION ALL
    SELECT 'DimScreenType', COUNT(*) FROM DimScreenType
    UNION ALL
    SELECT 'DimOperatingSystem', COUNT(*) FROM DimOperatingSystem
    UNION ALL
    SELECT 'DimRefreshRate', COUNT(*) FROM DimRefreshRate
    UNION ALL
    SELECT 'DimConnectivity', COUNT(*) FROM DimConnectivity
    UNION ALL
    SELECT 'DimPrice', COUNT(*) FROM DimPrice
    UNION ALL
    SELECT 'DimProduct', COUNT(*) FROM DimProduct
    UNION ALL
    SELECT 'FactTVSales', COUNT(*) FROM FactTVSales
) t
ORDER BY TableName;
"@

# Thực thi truy vấn
$results = Invoke-Sqlcmd -ServerInstance $SqlServer -Database $Database -Query $query

# Kiểm tra xem có bảng nào không có dữ liệu không
$emptyTables = $results | Where-Object { $_.RecordCount -eq 0 }

if ($emptyTables.Count -gt 0) {
    # Chuẩn bị nội dung email
    $body = "Các bảng sau không có dữ liệu sau khi ETL hoàn thành:`n`n"
    foreach ($table in $emptyTables) {
        $body += "- $($table.TableName)`n"
    }
    
    # Gửi email
    Send-MailMessage -From "etl@yourdomain.com" -To "admin@yourdomain.com" -Subject "ETL Warning: Empty tables detected" -Body $body -SmtpServer "smtp.yourdomain.com"
    
    Write-Host "Phát hiện bảng rỗng, đã gửi email thông báo!"
}
else {
    # Kiểm tra số lượng bản ghi trong FactTVSales
    $factCount = ($results | Where-Object { $_.TableName -eq 'FactTVSales' }).RecordCount
    
    if ($factCount -lt 10) {  # Ngưỡng này có thể điều chỉnh
        Send-MailMessage -From "etl@yourdomain.com" -To "admin@yourdomain.com" -Subject "ETL Warning: Low record count in FactTVSales" -Body "Bảng FactTVSales chỉ có $factCount bản ghi. Vui lòng kiểm tra lại." -SmtpServer "smtp.yourdomain.com"
        Write-Host "Số lượng bản ghi trong FactTVSales thấp, đã gửi email thông báo!"
    }
    else {
        Write-Host "Tất cả các bảng đều có dữ liệu, ETL thành công!"
        Write-Host "Bảng FactTVSales có $factCount bản ghi."
    }
}
```

### 8.3. Tài liệu tham khảo

1. [Microsoft Docs - SSIS Tutorial](https://docs.microsoft.com/en-us/sql/integration-services/ssis-how-to-create-an-etl-package)
2. [Data Warehouse Snowflake Schema Design](https://www.vertabelo.com/blog/snowflake-schema/)
3. [SSIS Best Practices for Complex ETL Workflows](https://www.mssqltips.com/sqlservertip/5718/best-practices-for-ssis-package-development/)
4. [Handling Slowly Changing Dimensions in SSIS](https://docs.microsoft.com/en-us/sql/integration-services/slowly-changing-dimension-transformation)
5. [Optimizing SSIS Packages for Performance](https://www.sqlshack.com/ways-optimize-ssis-package-performance/)
6. [Microsoft Business Intelligence Stack Documentation](https://docs.microsoft.com/en-us/analysis-services/)
7. [SQL Server Data Warehouse Design Considerations](https://learn.microsoft.com/en-us/sql/relational-databases/data-warehouse-design-considerations)

### 8.4. Liên hệ hỗ trợ

Nếu bạn gặp khó khăn hoặc cần hỗ trợ thêm, vui lòng liên hệ:
- Email: support@yourdomain.com
- Điện thoại: +XX-XXX-XXX-XXXX