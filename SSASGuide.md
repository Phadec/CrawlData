# HƯỚNG DẪN PHÂN TÍCH DỮ LIỆU TV BẰNG SQL SERVER ANALYSIS SERVICES (SSAS)

## I. Tổng quan về SSAS

SQL Server Analysis Services (SSAS) là công cụ OLAP (Online Analytical Processing) và Data Mining của Microsoft, cho phép phân tích dữ liệu đa chiều và xây dựng các báo cáo phức tạp. Với dữ liệu TV đã thu thập và lưu trữ trong Data Warehouse, SSAS giúp:

- Phân tích xu hướng giá TV theo thời gian
- So sánh giá TV giữa các nhà cung cấp (CellPhoneS và DienMayXanh)
- Phân tích TV theo nhà sản xuất, tính năng và thông số kỹ thuật
- Khám phá mối tương quan giữa giá và các tính năng kỹ thuật

## II. Cài đặt và chuẩn bị môi trường

### 1. Yêu cầu phần mềm
- SQL Server với tính năng Analysis Services
- Visual Studio với SQL Server Data Tools (SSDT)
- SQL Server Management Studio (SSMS)
- Database TiviDataWarehouse đã tạo và có dữ liệu

### 2. Kiểm tra cài đặt SSAS
1. Mở SQL Server Configuration Manager
2. Kiểm tra xem dịch vụ "SQL Server Analysis Services" đã chạy chưa
3. Nếu chưa cài đặt, chạy SQL Server Setup và thêm tính năng Analysis Services

## III. Tạo dự án SSAS

### 1. Tạo dự án mới

1. Mở Visual Studio
2. Chọn File > New > Project
3. Chọn "Analysis Services Multidimensional and Data Mining Project"
4. Đặt tên dự án là "TiviDataAnalysis"
5. Chọn vị trí lưu và nhấn "Create"

### 2. Tạo Data Source

1. Trong Solution Explorer, nhấp chuột phải vào "Data Sources" > "New Data Source"
2. Chọn "Create a data source based on an existing or new connection"
3. Nhấn "New" để tạo kết nối mới:
   - Provider: SQL Server Native Client 11.0
   - Server name: (tên server của bạn)
   - Authentication: Windows Authentication hoặc SQL Server Authentication
   - Database: TiviDataWarehouse
4. Nhấn "Test Connection" để kiểm tra kết nối
5. Đặt tên data source là "TiviDW" và nhấn "Finish"

### 3. Tạo Data Source View (DSV)

1. Trong Solution Explorer, nhấp chuột phải vào "Data Source Views" > "New Data Source View"
2. Chọn data source "TiviDW" và nhấn "Next"
3. Chọn các bảng cần thiết từ Data Warehouse:
   - DimTime
   - DimSource
   - DimManufacturer
   - DimProduct
   - FactTVSales
4. Nhấn "Next" và đặt tên DSV là "TiviDW_View"
5. Nhấn "Finish" để tạo DSV

### 4. Thiết lập mối quan hệ trong DSV

1. Mở DSV vừa tạo
2. SSAS sẽ tự động phát hiện các quan hệ dựa trên khóa ngoại
3. Kiểm tra mối quan hệ và thêm nếu cần:
   - FactTVSales.ProductID → DimProduct.ProductID
   - FactTVSales.ManufacturerID → DimManufacturer.ManufacturerID
   - FactTVSales.TimeID → DimTime.TimeID
   - FactTVSales.SourceID → DimSource.SourceID
4. Lưu DSV

## IV. Xây dựng OLAP Cube

### 1. Tạo Cube

1. Trong Solution Explorer, nhấp chuột phải vào "Cubes" > "New Cube"
2. Chọn "Use existing tables" và nhấn "Next"
3. Chọn bảng Fact: FactTVSales
4. Chọn các measure (số liệu) cần theo dõi:
   - Price
   - OldPrice
   - DiscountPercent
5. Nhấn "Next"
6. Chọn các dimension (chiều) để phân tích:
   - DimTime
   - DimSource
   - DimManufacturer
   - DimProduct
7. Nhấn "Next" và đặt tên cube là "TiviAnalysis"
8. Nhấn "Finish" để tạo cube

### 2. Cấu hình Dimensions

#### Dimension DimTime

1. Mở dimension DimTime trong Solution Explorer
2. Trong tab "Dimension Structure":
   - Thêm các thuộc tính: Year, Quarter, Month, Day
   - Sắp xếp thứ tự phân cấp: Year > Quarter > Month > Day
3. Tạo Hierarchy (phân cấp):
   - Nhấp chuột phải vào DimTime > New Hierarchy
   - Thêm các cấp theo thứ tự: Year, Quarter, Month, Day
4. Đổi tên các thuộc tính nếu cần
5. Lưu dimension

#### Dimension DimProduct

1. Mở dimension DimProduct trong Solution Explorer
2. Trong tab "Dimension Structure":
   - Thêm các thuộc tính quan trọng: ProductName, ScreenSize, Resolution, ScreenType, etc.
   - Sắp xếp theo thứ tự hợp lý
3. Tạo Hierarchy (phân cấp) cho các thông số kỹ thuật:
   - ScreenType > Resolution > ScreenSize
   - OperatingSystem > Processor
4. Đổi tên các thuộc tính nếu cần
5. Lưu dimension

#### Dimension DimManufacturer

1. Mở dimension DimManufacturer trong Solution Explorer
2. Trong tab "Dimension Structure":
   - Thêm các thuộc tính: ManufacturerName, ManufacturedIn, ReleaseYear
3. Đổi tên các thuộc tính nếu cần
4. Lưu dimension

#### Dimension DimSource

1. Mở dimension DimSource trong Solution Explorer
2. Trong tab "Dimension Structure":
   - Thêm các thuộc tính: SourceName, SourceURL
3. Đổi tên các thuộc tính nếu cần
4. Lưu dimension

### 3. Cấu hình Measures

Phần này sẽ hướng dẫn cách cấu hình các measures (số liệu) cho OLAP cube chi tiết từng bước.

#### 3.1. Cấu hình các measures có sẵn

1. Mở TiviAnalysis cube trong Solution Explorer (double-click vào cube)
2. Chuyển sang tab "Cube Structure"
3. Mở rộng mục "Measure Groups" > "FactTVSales"
4. Bạn sẽ thấy danh sách các measures mặc định như Price, OldPrice, DiscountPercent
5. Cấu hình từng measure theo các bước sau:
   
   **Cấu hình measure Price:**
   - Nhấp chuột phải vào measure Price > Properties
   - Trong cửa sổ Properties, tìm và thiết lập:
     - Name: Price (hoặc đổi thành "TV Price" nếu muốn)
     - FormatString: $#,##0.00;($#,##0.00) (định dạng tiền tệ)
     - AggregateFunction: Sum (hàm tổng hợp)
     - Visible: True
     - MeasureExpression: để trống (sử dụng giá trị mặc định)
   
   **Cấu hình measure OldPrice:**
   - Nhấp chuột phải vào measure OldPrice > Properties
   - Thiết lập tương tự như Price:
     - Name: Old Price
     - FormatString: $#,##0.00;($#,##0.00)
     - AggregateFunction: Sum
     - Visible: True
   
   **Cấu hình measure DiscountPercent:**
   - Nhấp chuột phải vào measure DiscountPercent > Properties
   - Thiết lập:
     - Name: Discount Percent
     - FormatString: #,##0.00\% (định dạng phần trăm)
     - AggregateFunction: Average (lấy giá trị trung bình)
     - Visible: True

#### 3.2. Tạo Calculated Members (Các phép tính nâng cao)

Để tạo các phép tính nâng cao như AvgPrice, PriceGap và DiscountValue, thực hiện theo các bước sau:

1. **Mở Cube Designer**: Double-click vào cube "TiviAnalysis" trong Solution Explorer
2. **Chuyển đến tab "Calculations"**: Click vào tab "Calculations" trong cửa sổ thiết kế cube
3. **Tạo calculated member "AvgPrice"**:
   - Nhấn nút "New Calculated Member" (biểu tượng dấu cộng)
   - Trong cửa sổ Form View, nhập các thông tin sau:
     - Name: AvgPrice
     - Parent hierarchy: Measures
     - Expression: `[Measures].[Price] / COUNT([DimProduct].[ProductID].[ProductID])`
     - Format string: $#,##0.00;($#,##0.00)
     - Non-empty behavior: Chọn [Measures].[Price]
   - Click OK để lưu

4. **Tạo calculated member "PriceGap"**:
   - Nhấn nút "New Calculated Member"
   - Nhập các thông tin:
     - Name: PriceGap
     - Parent hierarchy: Measures
     - Expression: `[Measures].[OldPrice] - [Measures].[Price]`
     - Format string: $#,##0.00;($#,##0.00)
     - Non-empty behavior: Chọn [Measures].[Price], [Measures].[OldPrice]
   - Click OK để lưu

5. **Tạo calculated member "DiscountValue"**:
   - Nhấn nút "New Calculated Member"
   - Nhập các thông tin:
     - Name: DiscountValue
     - Parent hierarchy: Measures
     - Expression: `[Measures].[Price] * [Measures].[DiscountPercent] / 100`
     - Format string: $#,##0.00;($#,##0.00)
     - Non-empty behavior: Chọn [Measures].[Price], [Measures].[DiscountPercent]
   - Click OK để lưu

6. **Tạo calculated member "PricePerInch"** (giá/inch màn hình):
   - Nhấn nút "New Calculated Member"
   - Nhập các thông tin:
     - Name: PricePerInch
     - Parent hierarchy: Measures
     - Expression: 
     ```
     [Measures].[Price] / 
     VAL(
       LEFT(
         [DimProduct].[ScreenSize].CurrentMember.Name, 
         INSTR([DimProduct].[ScreenSize].CurrentMember.Name, " inch") - 1
       )
     )
     ```
     - Format string: $#,##0.00;($#,##0.00)
     - Non-empty behavior: Chọn [Measures].[Price]
   - Click OK để lưu

#### 3.3. Kiểm tra lỗi cú pháp MDX

Nếu bạn gặp lỗi cú pháp MDX trong các biểu thức:

1. Nhấp vào tab "Calculations"
2. Nhấp vào biểu thức đang gặp lỗi
3. Kiểm tra lỗi cú pháp trong ô Expression
4. Điều chỉnh biểu thức theo các quy tắc MDX:
   - Đảm bảo tên của các measures và dimensions đúng chính tả
   - Đảm bảo cú pháp MDX đúng (dấu ngoặc, dấu chấm phẩy, etc.)
   - Sử dụng hàm MDX đúng syntax

#### 3.4. Giải quyết lỗi thường gặp khi cấu hình Measures

**Lỗi 1: Không thể tạo calculated member**
- Nguyên nhân: Tên của dimension hoặc measure không chính xác
- Giải pháp: 
  - Kiểm tra chính xác tên của các dimensions và measures trong biểu thức
  - Mở tab "Browser" và xem tên chính xác của các thành phần

**Lỗi 2: Lỗi chuyển đổi kiểu dữ liệu**
- Nguyên nhân: Kiểu dữ liệu không tương thích trong biểu thức
- Giải pháp:
  - Sử dụng hàm CONVERT() để chuyển đổi kiểu dữ liệu
  - Ví dụ: `CONVERT([Measures].[DiscountPercent], 'Numeric')`

**Lỗi 3: Biểu thức không trả về giá trị**
- Nguyên nhân: Biểu thức có thể chia cho 0 hoặc null
- Giải pháp:
  - Sử dụng IIF() để kiểm tra điều kiện trước khi tính toán
  - Ví dụ: `IIF(COUNT([DimProduct].[ProductID].[ProductID]) = 0, 0, [Measures].[Price] / COUNT([DimProduct].[ProductID].[ProductID]))`

#### 3.5. Kiểm tra và xác nhận Measures

Sau khi cấu hình các measures:

1. Lưu lại cube (Ctrl+S)
2. Nhấp chuột phải vào cube > Process
3. Chọn "Process Full" để xử lý toàn bộ dữ liệu
4. Sau khi xử lý xong, nhấp chuột phải vào cube > Browse
5. Kéo các measures vừa tạo vào vùng giá trị (Values) của bảng pivot
6. Kéo các dimensions (như DimManufacturer.ManufacturerName) vào vùng hàng để kiểm tra kết quả

#### 3.6. Ví dụ script MDX để kiểm tra Measures

Sau khi đã cấu hình xong các measures, bạn có thể sử dụng câu truy vấn MDX sau để kiểm tra:

```mdx
SELECT
  {
    [Measures].[Price],
    [Measures].[OldPrice],
    [Measures].[DiscountPercent],
    [Measures].[AvgPrice],
    [Measures].[PriceGap],
    [Measures].[DiscountValue],
    [Measures].[PricePerInch]
  } ON COLUMNS,
  [DimManufacturer].[ManufacturerName].MEMBERS ON ROWS
FROM [TiviAnalysis]
```

Lưu truy vấn này vào file MDX và sử dụng SQL Server Management Studio (SSMS) để thực thi sau khi đã triển khai cube.

### 4. Tạo KPIs (Key Performance Indicators)

1. Trong TiviAnalysis cube, nhấp chuột phải vào "KPIs" > "New KPI"
2. Tạo KPI "DiscountPerformance":
   - Value: [Measures].[DiscountPercent]
   - Goal: 15 (mục tiêu giảm giá trung bình 15%)
   - Status: Case When [Measures].[DiscountPercent] >= 15 Then 1
             When [Measures].[DiscountPercent] >= 10 Then 0
             Else -1 End
   - Trend: [Measures].[DiscountPercent] / ([Measures].[DiscountPercent], [DimTime].[Year].PrevMember)
3. Lưu cube

## V. Xây dựng và triển khai Cube

### 1. Xây dựng và xử lý dữ liệu

1. Trong Solution Explorer, nhấp chuột phải vào dự án > "Build"
2. Sau khi build thành công, nhấp chuột phải vào cube "TiviAnalysis" > "Process"
3. Chọn "Process Full" để xử lý tất cả dữ liệu
4. Nhấn "Run" và đợi quá trình xử lý hoàn tất

### 2. Duyệt Cube

1. Nhấp chuột phải vào cube "TiviAnalysis" > "Browse"
2. Kéo thả các dimension vào hàng và cột của bảng để phân tích
3. Kéo thả các measure vào vùng giá trị
4. Khám phá dữ liệu với các tổ hợp dimension khác nhau

### 3. Triển khai dự án

1. Nhấp chuột phải vào dự án > "Deploy"
2. Kiểm tra cấu hình triển khai và nhấn "OK"
3. Đợi quá trình triển khai hoàn tất

## VI. Truy vấn MDX cơ bản để phân tích dữ liệu

Dưới đây là một số ví dụ truy vấn MDX có thể sử dụng để phân tích dữ liệu TV:

### 1. Giá trung bình theo nhà sản xuất

```mdx
SELECT [Measures].[AvgPrice] ON COLUMNS,
       [DimManufacturer].[ManufacturerName].MEMBERS ON ROWS
FROM [TiviAnalysis]
```

### 2. So sánh giá giữa CellPhoneS và DienMayXanh

```mdx
SELECT {[DimSource].[SourceName].&[CellPhoneS], [DimSource].[SourceName].&[DienMayXanh]} ON COLUMNS,
       [DimProduct].[ProductName].MEMBERS ON ROWS
FROM [TiviAnalysis]
WHERE [Measures].[Price]
```

### 3. Phân tích giảm giá theo thời gian

```mdx
SELECT [DimTime].[Year].MEMBERS * [DimTime].[Month].MEMBERS ON COLUMNS,
       [Measures].[DiscountPercent] ON ROWS
FROM [TiviAnalysis]
```

### 4. Top 10 TV có giá cao nhất

```mdx
SELECT [Measures].[Price] ON COLUMNS,
       TOPCOUNT([DimProduct].[ProductName].MEMBERS, 10, [Measures].[Price]) ON ROWS
FROM [TiviAnalysis]
```

### 5. Phân tích giá theo kích thước màn hình

```mdx
SELECT [Measures].[AvgPrice] ON COLUMNS,
       [DimProduct].[ScreenSize].MEMBERS ON ROWS
FROM [TiviAnalysis]
```

## VII. Tích hợp với Power BI

### 1. Kết nối Power BI với SSAS

1. Mở Power BI Desktop
2. Chọn "Get Data" > "Database" > "SQL Server Analysis Services"
3. Nhập thông tin server và model/cube 
4. Chọn Live Connection hoặc Import

### 2. Tạo Dashboard và báo cáo

1. Sử dụng các trường từ model SSAS để tạo các biểu đồ và bảng
2. Tạo các báo cáo so sánh giá TV giữa các nhà cung cấp
3. Tạo các biểu đồ phân tích xu hướng giá theo thời gian
4. Tạo bảng so sánh tính năng và giá của các TV

### 3. Xuất bản và chia sẻ

1. Xuất bản báo cáo lên Power BI Service (nếu có)
2. Cài đặt lịch làm mới dữ liệu
3. Chia sẻ với người dùng khác