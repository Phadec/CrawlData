-- Kiểm tra xem database đã tồn tại chưa và tạo nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TiviStagingDB')
BEGIN
    CREATE DATABASE TiviStagingDB;
END
GO
USE TiviStagingDB;
GO

-- Tạo bảng staging để lưu trữ dữ liệu tạm thời từ các file Excel
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'StagingTVData') AND type in (N'U'))
BEGIN
    CREATE TABLE StagingTVData (
        StagingID INT PRIMARY KEY IDENTITY(1,1),
        DataId NVARCHAR(255),
        Name NVARCHAR(500) NOT NULL,
        Price DECIMAL(18,2),
        OldPrice DECIMAL(18,2),
        DiscountPercent INT,
        ImageUrl NVARCHAR(1000),
        ScreenSize NVARCHAR(255),
        Resolution NVARCHAR(255),
        ScreenType NVARCHAR(255),
        OperatingSystem NVARCHAR(255),
        ImageTechnology NVARCHAR(255),
        Processor NVARCHAR(255),
        RefreshRate NVARCHAR(255),
        SpeakerPower NVARCHAR(255),
        InternetConnection NVARCHAR(255),
        WirelessConnectivity NVARCHAR(255),
        USBPorts NVARCHAR(255),
        VideoAudioInputPorts NVARCHAR(500),
        AudioOutputPorts NVARCHAR(255),
        StandMaterial NVARCHAR(255),
        BezelMaterial NVARCHAR(255),
        Manufacturer NVARCHAR(255),
        ManufacturedIn NVARCHAR(255),
        ReleaseYear INT,
        ProductLink NVARCHAR(1000),
        SourceName NVARCHAR(255),
        SourceURL NVARCHAR(255),
        ImportDate DATETIME DEFAULT GETDATE()
    );
END
GO