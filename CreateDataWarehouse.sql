-- Kiểm tra xem database đã tồn tại chưa và tạo nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TiviDataWarehouse')
BEGIN
    CREATE DATABASE TiviDataWarehouse;
END
GO
USE TiviDataWarehouse;
GO

-- Tạo bảng DimTime (Dimension bảng thời gian)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimTime') AND type in (N'U'))
BEGIN
    CREATE TABLE DimTime (
        TimeID INT PRIMARY KEY IDENTITY(1,1),
        Year INT NOT NULL,
        Quarter INT NOT NULL,
        Month INT NOT NULL,
        Day INT NOT NULL,
        DateValue DATE NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimSource (Dimension bảng nguồn dữ liệu)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimSource') AND type in (N'U'))
BEGIN
    CREATE TABLE DimSource (
        SourceID INT PRIMARY KEY IDENTITY(1,1),
        SourceName NVARCHAR(255) NOT NULL,
        SourceURL NVARCHAR(255) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimManufacturer (Dimension bảng nhà sản xuất)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimManufacturer') AND type in (N'U'))
BEGIN
    CREATE TABLE DimManufacturer (
        ManufacturerID INT PRIMARY KEY IDENTITY(1,1),
        ManufacturerName NVARCHAR(100) NOT NULL,
        ManufacturerCountry NVARCHAR(100),
        CreatedDate DATETIME DEFAULT GETDATE(),
        ModifiedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimScreenSize (Dimension mới cho kích thước màn hình)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimScreenSize') AND type in (N'U'))
BEGIN
    CREATE TABLE DimScreenSize (
        ScreenSizeID INT PRIMARY KEY IDENTITY(1,1),
        ScreenSizeValue NVARCHAR(50) NOT NULL,
        ScreenSizeInch DECIMAL(5,1),
        ScreenSizeCategory NVARCHAR(50), -- Nhỏ, Trung bình, Lớn, Rất lớn
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimResolution (Dimension mới cho độ phân giải)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimResolution') AND type in (N'U'))
BEGIN
    CREATE TABLE DimResolution (
        ResolutionID INT PRIMARY KEY IDENTITY(1,1),
        ResolutionValue NVARCHAR(50) NOT NULL,
        ResolutionCategory NVARCHAR(50), -- HD, Full HD, 4K, 8K
        ResolutionWidth INT,
        ResolutionHeight INT,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimScreenType (Dimension mới cho loại màn hình)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimScreenType') AND type in (N'U'))
BEGIN
    CREATE TABLE DimScreenType (
        ScreenTypeID INT PRIMARY KEY IDENTITY(1,1),
        ScreenTypeValue NVARCHAR(100) NOT NULL,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimOperatingSystem (Dimension mới cho hệ điều hành)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimOperatingSystem') AND type in (N'U'))
BEGIN
    CREATE TABLE DimOperatingSystem (
        OperatingSystemID INT PRIMARY KEY IDENTITY(1,1),
        OperatingSystemName NVARCHAR(100) NOT NULL,
        OSCategory NVARCHAR(50), -- Smart TV, Android TV, WebOS, Tizen, etc.
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimRefreshRate (Dimension mới cho tần số quét)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimRefreshRate') AND type in (N'U'))
BEGIN
    CREATE TABLE DimRefreshRate (
        RefreshRateID INT PRIMARY KEY IDENTITY(1,1),
        RefreshRateValue NVARCHAR(50) NOT NULL,
        RefreshRateHz INT,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimConnectivity (Dimension mới cho khả năng kết nối)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimConnectivity') AND type in (N'U'))
BEGIN
    CREATE TABLE DimConnectivity (
        ConnectivityID INT PRIMARY KEY IDENTITY(1,1),
        InternetConnection NVARCHAR(255),
        WirelessConnectivity NVARCHAR(255),
        HasWifi BIT DEFAULT 0,
        HasBluetooth BIT DEFAULT 0,
        HasEthernet BIT DEFAULT 0,
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimPrice (Dimension mới cho phân khúc giá)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimPrice') AND type in (N'U'))
BEGIN
    CREATE TABLE DimPrice (
        PriceID INT PRIMARY KEY IDENTITY(1,1),
        PriceMin INT,
        PriceMax INT,
        PriceSegment NVARCHAR(50) NOT NULL,
        PriceDescription NVARCHAR(100),
        CreatedDate DATETIME DEFAULT GETDATE(),
        ModifiedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng DimProduct (Dimension bảng sản phẩm - đã điều chỉnh)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'DimProduct') AND type in (N'U'))
BEGIN
    CREATE TABLE DimProduct (
        ProductID INT PRIMARY KEY IDENTITY(1,1),
        ProductName NVARCHAR(500) NOT NULL,
        ImageTechnology NVARCHAR(255),
        Processor NVARCHAR(255),
        SpeakerPower NVARCHAR(255),
        USBPorts NVARCHAR(255),
        VideoAudioInputPorts NVARCHAR(500),
        AudioOutputPorts NVARCHAR(255),
        StandMaterial NVARCHAR(255),
        BezelMaterial NVARCHAR(255),
        ImageURL NVARCHAR(1000),
        CreatedDate DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tạo bảng FactTVSales (Fact bảng dữ liệu TV - đã điều chỉnh)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'FactTVSales') AND type in (N'U'))
BEGIN
    CREATE TABLE FactTVSales (
        TVSalesID INT PRIMARY KEY IDENTITY(1,1),
        ProductID INT,
        ManufacturerID INT,
        TimeID INT,
        SourceID INT,
        ScreenSizeID INT,
        ResolutionID INT,
        ScreenTypeID INT,
        OperatingSystemID INT,
        RefreshRateID INT,
        ConnectivityID INT,
        PriceID INT,
        Price DECIMAL(18,2),
        OldPrice DECIMAL(18,2),
        DiscountPercent INT,
        DiscountAmount DECIMAL(18,2),
        DataSourceID NVARCHAR(255),
        ProductLink NVARCHAR(1000),
        CreatedDate DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_FactTVSales_DimProduct FOREIGN KEY (ProductID) REFERENCES DimProduct(ProductID),
        CONSTRAINT FK_FactTVSales_DimManufacturer FOREIGN KEY (ManufacturerID) REFERENCES DimManufacturer(ManufacturerID),
        CONSTRAINT FK_FactTVSales_DimTime FOREIGN KEY (TimeID) REFERENCES DimTime(TimeID),
        CONSTRAINT FK_FactTVSales_DimSource FOREIGN KEY (SourceID) REFERENCES DimSource(SourceID),
        CONSTRAINT FK_FactTVSales_DimScreenSize FOREIGN KEY (ScreenSizeID) REFERENCES DimScreenSize(ScreenSizeID),
        CONSTRAINT FK_FactTVSales_DimResolution FOREIGN KEY (ResolutionID) REFERENCES DimResolution(ResolutionID),
        CONSTRAINT FK_FactTVSales_DimScreenType FOREIGN KEY (ScreenTypeID) REFERENCES DimScreenType(ScreenTypeID),
        CONSTRAINT FK_FactTVSales_DimOperatingSystem FOREIGN KEY (OperatingSystemID) REFERENCES DimOperatingSystem(OperatingSystemID),
        CONSTRAINT FK_FactTVSales_DimRefreshRate FOREIGN KEY (RefreshRateID) REFERENCES DimRefreshRate(RefreshRateID),
        CONSTRAINT FK_FactTVSales_DimConnectivity FOREIGN KEY (ConnectivityID) REFERENCES DimConnectivity(ConnectivityID),
        CONSTRAINT FK_FactTVSales_DimPrice FOREIGN KEY (PriceID) REFERENCES DimPrice(PriceID)
    );
END
GO

-- Khởi tạo dữ liệu cho bảng DimSource nếu bảng rỗng
IF NOT EXISTS (SELECT TOP 1 1 FROM DimSource)
BEGIN
    INSERT INTO DimSource (SourceName, SourceURL)
    VALUES 
    ('CellPhoneS', 'https://cellphones.com.vn/tivi.html'),
    ('DienMayXanh', 'https://www.dienmayxanh.com/tivi');
END
GO

-- Khởi tạo dữ liệu cho bảng DimPrice
IF NOT EXISTS (SELECT TOP 1 1 FROM DimPrice)
BEGIN
    INSERT INTO DimPrice (PriceRange, MinPrice, MaxPrice, PriceSegment)
    VALUES 
    ('Dưới 5 triệu', 0, 5000000, 'Phổ thông'),
    ('5 triệu - 10 triệu', 5000000, 10000000, 'Phổ thông'),
    ('10 triệu - 20 triệu', 10000000, 20000000, 'Trung cấp'),
    ('20 triệu - 50 triệu', 20000000, 50000000, 'Cao cấp'),
    ('Trên 50 triệu', 50000000, 999999999, 'Sang trọng');
END
GO

-- Các Stored Procedure để xử lý dữ liệu

-- SP 1: Thêm vào DimTime
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimTime') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimTime
GO

CREATE PROCEDURE dbo.usp_LoadDimTime
AS
BEGIN
    SET NOCOUNT ON;
    -- Lấy ngày hiện tại
    DECLARE @CurrentDate DATE = CAST(GETDATE() AS DATE);
    
    -- Kiểm tra xem ngày đã tồn tại trong DimTime chưa
    IF NOT EXISTS (SELECT 1 FROM DimTime WHERE DateValue = @CurrentDate)
    BEGIN
        INSERT INTO DimTime (Year, Quarter, Month, Day, DateValue)
        VALUES (
            YEAR(@CurrentDate),
            DATEPART(QUARTER, @CurrentDate),
            MONTH(@CurrentDate),
            DAY(@CurrentDate),
            @CurrentDate
        );
    END
END;
GO

-- SP mới: Thêm vào DimScreenSize
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimScreenSize') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimScreenSize
GO

CREATE PROCEDURE dbo.usp_LoadDimScreenSize
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các kích thước màn hình mới từ staging vào DimScreenSize
    INSERT INTO DimScreenSize (ScreenSizeValue, ScreenSizeInch, ScreenSizeCategory)
    SELECT DISTINCT 
        s.ScreenSize, 
        TRY_CAST(REPLACE(REPLACE(SUBSTRING(s.ScreenSize, 1, CHARINDEX('"', s.ScreenSize + '"') - 1), ',', '.'), ' ', '') AS DECIMAL(5,1)) AS ScreenSizeInch,
        CASE 
            WHEN TRY_CAST(REPLACE(REPLACE(SUBSTRING(s.ScreenSize, 1, CHARINDEX('"', s.ScreenSize + '"') - 1), ',', '.'), ' ', '') AS DECIMAL(5,1)) < 32 THEN N'Nhỏ'
            WHEN TRY_CAST(REPLACE(REPLACE(SUBSTRING(s.ScreenSize, 1, CHARINDEX('"', s.ScreenSize + '"') - 1), ',', '.'), ' ', '') AS DECIMAL(5,1)) < 50 THEN N'Trung bình'
            WHEN TRY_CAST(REPLACE(REPLACE(SUBSTRING(s.ScreenSize, 1, CHARINDEX('"', s.ScreenSize + '"') - 1), ',', '.'), ' ', '') AS DECIMAL(5,1)) < 65 THEN N'Lớn'
            ELSE N'Rất lớn'
        END AS ScreenSizeCategory
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimScreenSize d 
        WHERE d.ScreenSizeValue = s.ScreenSize
    )
    AND s.ScreenSize IS NOT NULL
    AND s.ScreenSize <> '';
END;
GO

-- SP mới: Thêm vào DimResolution
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimResolution') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimResolution
GO

CREATE PROCEDURE dbo.usp_LoadDimResolution
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các độ phân giải mới từ staging vào DimResolution
    INSERT INTO DimResolution (ResolutionValue, ResolutionCategory, ResolutionWidth, ResolutionHeight)
    SELECT DISTINCT 
        s.Resolution, 
        CASE 
            WHEN s.Resolution LIKE '%8K%' THEN '8K'
            WHEN s.Resolution LIKE '%4K%' OR s.Resolution LIKE '%UHD%' OR s.Resolution LIKE '%Ultra HD%' THEN '4K'
            WHEN s.Resolution LIKE '%Full HD%' OR s.Resolution LIKE '%1080%' THEN 'Full HD'
            WHEN s.Resolution LIKE '%HD%' OR s.Resolution LIKE '%720%' THEN 'HD'
            ELSE 'Khác'
        END AS ResolutionCategory,
        CASE 
            WHEN s.Resolution LIKE '%7680%' THEN 7680
            WHEN s.Resolution LIKE '%3840%' THEN 3840
            WHEN s.Resolution LIKE '%1920%' THEN 1920
            WHEN s.Resolution LIKE '%1366%' THEN 1366
            WHEN s.Resolution LIKE '%1280%' THEN 1280
            ELSE NULL
        END AS ResolutionWidth,
        CASE 
            WHEN s.Resolution LIKE '%4320%' THEN 4320
            WHEN s.Resolution LIKE '%2160%' THEN 2160
            WHEN s.Resolution LIKE '%1080%' THEN 1080
            WHEN s.Resolution LIKE '%768%' THEN 768
            WHEN s.Resolution LIKE '%720%' THEN 720
            ELSE NULL
        END AS ResolutionHeight
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimResolution d 
        WHERE d.ResolutionValue = s.Resolution
    )
    AND s.Resolution IS NOT NULL
    AND s.Resolution <> '';
END;
GO

-- SP mới: Thêm vào DimScreenType
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimScreenType') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimScreenType
GO

CREATE PROCEDURE dbo.usp_LoadDimScreenType
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các loại màn hình mới từ staging vào DimScreenType
    INSERT INTO DimScreenType (ScreenTypeValue)
    SELECT DISTINCT s.ScreenType
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimScreenType d 
        WHERE d.ScreenTypeValue = s.ScreenType
    )
    AND s.ScreenType IS NOT NULL
    AND s.ScreenType <> '';
END;
GO

-- SP mới: Thêm vào DimOperatingSystem
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimOperatingSystem') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimOperatingSystem
GO

CREATE PROCEDURE dbo.usp_LoadDimOperatingSystem
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các hệ điều hành mới từ staging vào DimOperatingSystem
    INSERT INTO DimOperatingSystem (OperatingSystemName, OSCategory)
    SELECT DISTINCT 
        s.OperatingSystem,
        CASE 
            WHEN s.OperatingSystem LIKE '%Android%' THEN 'Android TV'
            WHEN s.OperatingSystem LIKE '%WebOS%' THEN 'WebOS'
            WHEN s.OperatingSystem LIKE '%Google TV%' THEN 'Google TV'
            WHEN s.OperatingSystem LIKE '%Tizen%' THEN 'Tizen'
            WHEN s.OperatingSystem LIKE '%Smart TV%' THEN 'Smart TV'
            WHEN s.OperatingSystem LIKE '%Vidaa%' THEN 'Vidaa'
            ELSE 'Khác'
        END AS OSCategory
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimOperatingSystem d 
        WHERE d.OperatingSystemName = s.OperatingSystem
    )
    AND s.OperatingSystem IS NOT NULL
    AND s.OperatingSystem <> '';
END;
GO

-- SP mới: Thêm vào DimRefreshRate
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimRefreshRate') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimRefreshRate
GO

CREATE PROCEDURE dbo.usp_LoadDimRefreshRate
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các tần số quét mới từ staging vào DimRefreshRate
    INSERT INTO DimRefreshRate (RefreshRateValue, RefreshRateHz)
    SELECT DISTINCT 
        s.RefreshRate,
        CASE 
            WHEN s.RefreshRate LIKE '%200%' THEN 200
            WHEN s.RefreshRate LIKE '%144%' THEN 144
            WHEN s.RefreshRate LIKE '%120%' THEN 120
            WHEN s.RefreshRate LIKE '%100%' THEN 100
            WHEN s.RefreshRate LIKE '%60%' THEN 60
            WHEN s.RefreshRate LIKE '%50%' THEN 50
            ELSE NULL
        END AS RefreshRateHz
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimRefreshRate d 
        WHERE d.RefreshRateValue = s.RefreshRate
    )
    AND s.RefreshRate IS NOT NULL
    AND s.RefreshRate <> '';
END;
GO

-- SP mới: Thêm vào DimConnectivity
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimConnectivity') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimConnectivity
GO

CREATE PROCEDURE dbo.usp_LoadDimConnectivity
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các thông tin kết nối mới từ staging vào DimConnectivity
    INSERT INTO DimConnectivity (InternetConnection, WirelessConnectivity, HasWifi, HasBluetooth, HasEthernet)
    SELECT DISTINCT 
        s.InternetConnection, 
        s.WirelessConnectivity,
        CASE WHEN s.WirelessConnectivity LIKE '%Wi-Fi%' THEN 1 ELSE 0 END AS HasWifi,
        CASE WHEN s.WirelessConnectivity LIKE '%Bluetooth%' THEN 1 ELSE 0 END AS HasBluetooth,
        CASE WHEN s.InternetConnection LIKE '%LAN%' OR s.InternetConnection LIKE '%RJ-45%' THEN 1 ELSE 0 END AS HasEthernet
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimConnectivity d 
        WHERE d.InternetConnection = s.InternetConnection
        AND d.WirelessConnectivity = s.WirelessConnectivity
    )
    AND (s.InternetConnection IS NOT NULL OR s.WirelessConnectivity IS NOT NULL)
    AND (s.InternetConnection <> '' OR s.WirelessConnectivity <> '');
END;
GO

-- SP 2: Thêm vào DimManufacturer từ Staging database
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimManufacturer') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimManufacturer
GO

CREATE PROCEDURE dbo.usp_LoadDimManufacturer
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các nhà sản xuất mới từ staging vào DimManufacturer
    INSERT INTO DimManufacturer (ManufacturerName, ManufacturedIn, ReleaseYear)
    SELECT DISTINCT s.Manufacturer, s.ManufacturedIn, s.ReleaseYear
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimManufacturer m 
        WHERE m.ManufacturerName = s.Manufacturer
    )
    AND s.Manufacturer IS NOT NULL
    AND s.Manufacturer <> '';
END;
GO

-- SP 3: Thêm vào DimProduct từ Staging database (đã cập nhật để loại bỏ các khóa ngoại)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadDimProduct') AND type in (N'P'))
    DROP PROCEDURE usp_LoadDimProduct
GO

CREATE PROCEDURE dbo.usp_LoadDimProduct
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Thêm các sản phẩm mới từ staging vào DimProduct (không tham chiếu các bảng dim khác)
    INSERT INTO DimProduct (
        ProductName, ImageTechnology, Processor, SpeakerPower,
        USBPorts, VideoAudioInputPorts, AudioOutputPorts,
        StandMaterial, BezelMaterial, ImageURL
    )
    SELECT DISTINCT 
        s.Name, 
        s.ImageTechnology, 
        s.Processor, 
        s.SpeakerPower,
        s.USBPorts, 
        s.VideoAudioInputPorts, 
        s.AudioOutputPorts,
        s.StandMaterial, 
        s.BezelMaterial, 
        s.ImageUrl
    FROM TiviStagingDB.dbo.StagingTVData s
    WHERE NOT EXISTS (
        SELECT 1 
        FROM DimProduct p 
        WHERE p.ProductName = s.Name
    )
    AND s.Name IS NOT NULL
    AND s.Name <> '';
END;
GO

-- SP 4: Thêm vào FactTVSales từ Staging database (giữ nguyên, đã chuẩn hóa)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_LoadFactTVSales') AND type in (N'P'))
    DROP PROCEDURE usp_LoadFactTVSales
GO

CREATE PROCEDURE dbo.usp_LoadFactTVSales
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Lấy TimeID của ngày hiện tại
    DECLARE @CurrentTimeID INT;
    SELECT @CurrentTimeID = TimeID FROM DimTime WHERE DateValue = CAST(GETDATE() AS DATE);
    
    -- Thêm dữ liệu vào FactTVSales
    INSERT INTO FactTVSales (
        ProductID, ManufacturerID, TimeID, SourceID,
        ScreenSizeID, ResolutionID, ScreenTypeID, OperatingSystemID,
        RefreshRateID, ConnectivityID, PriceID,
        Price, OldPrice, DiscountPercent, DiscountAmount,
        DataSourceID, ProductLink
    )
    SELECT 
        p.ProductID, 
        m.ManufacturerID, 
        @CurrentTimeID, 
        src.SourceID,
        ss.ScreenSizeID,
        r.ResolutionID,
        st.ScreenTypeID,
        os.OperatingSystemID,
        rr.RefreshRateID,
        c.ConnectivityID,
        pr.PriceID,
        s.Price, 
        s.OldPrice, 
        s.DiscountPercent,
        CASE WHEN s.OldPrice > 0 AND s.Price > 0 THEN s.OldPrice - s.Price ELSE 0 END AS DiscountAmount,
        s.DataId, 
        s.ProductLink
    FROM TiviStagingDB.dbo.StagingTVData s
    JOIN DimProduct p ON s.Name = p.ProductName
    JOIN DimManufacturer m ON s.Manufacturer = m.ManufacturerName
    JOIN DimSource src ON s.SourceName = src.SourceName
    LEFT JOIN DimScreenSize ss ON s.ScreenSize = ss.ScreenSizeValue
    LEFT JOIN DimResolution r ON s.Resolution = r.ResolutionValue
    LEFT JOIN DimScreenType st ON s.ScreenType = st.ScreenTypeValue
    LEFT JOIN DimOperatingSystem os ON s.OperatingSystem = os.OperatingSystemName
    LEFT JOIN DimRefreshRate rr ON s.RefreshRate = rr.RefreshRateValue
    LEFT JOIN DimConnectivity c ON s.InternetConnection = c.InternetConnection AND s.WirelessConnectivity = c.WirelessConnectivity
    JOIN DimPrice pr ON s.Price BETWEEN pr.MinPrice AND pr.MaxPrice
    WHERE NOT EXISTS (
        SELECT 1 
        FROM FactTVSales f 
        WHERE f.ProductID = p.ProductID 
          AND f.SourceID = src.SourceID 
          AND f.DataSourceID = s.DataId
          AND CAST(f.CreatedDate AS DATE) = CAST(GETDATE() AS DATE)
    );
END;
GO

-- SP 5: Thủ tục chính để xử lý tất cả các bước (đã cập nhật để gọi tất cả SPs mới)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'usp_ProcessTVData') AND type in (N'P'))
    DROP PROCEDURE usp_ProcessTVData
GO

CREATE PROCEDURE dbo.usp_ProcessTVData
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1. Thêm dữ liệu vào DimTime
        EXEC dbo.usp_LoadDimTime;
        
        -- 2. Thêm dữ liệu vào các bảng dimension mới
        EXEC dbo.usp_LoadDimScreenSize;
        EXEC dbo.usp_LoadDimResolution;
        EXEC dbo.usp_LoadDimScreenType;
        EXEC dbo.usp_LoadDimOperatingSystem;
        EXEC dbo.usp_LoadDimRefreshRate;
        EXEC dbo.usp_LoadDimConnectivity;
        
        -- 3. Thêm dữ liệu vào DimManufacturer
        EXEC dbo.usp_LoadDimManufacturer;
        
        -- 4. Thêm dữ liệu vào DimProduct
        EXEC dbo.usp_LoadDimProduct;
        
        -- 5. Thêm dữ liệu vào FactTVSales
        EXEC dbo.usp_LoadFactTVSales;
        
        COMMIT TRANSACTION;
        
        PRINT 'Đã xử lý dữ liệu TV thành công.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        PRINT 'Lỗi: ' + @ErrorMessage;
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO