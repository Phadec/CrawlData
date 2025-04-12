@echo off
echo Running TV Data ETL Process

REM Set environment variables
set SCRIPT_DIR=d:\CrawlData\scripts
set DATA_DIR=d:\CrawlData\scripts\data

echo Starting data crawling and cleaning process...
cd %SCRIPT_DIR%
node RunCrawlAndClean.js

echo Crawling and cleaning process completed.

echo Verify the Excel files are generated successfully:
dir %DATA_DIR%\cleaned_*.xlsx

echo.
echo To import data into SQL Server, please follow the steps in SSISPackageGuide.md:
echo 1. Make sure SQL Server is running
echo 2. Use the SSIS package to import the cleaned data files
echo 3. If you encounter OLE DB errors about data type conversions:
echo    a. Add a Data Conversion transformation in your Data Flow
echo    b. Convert text columns to DT_WSTR with appropriate length
echo    c. Use the converted columns for mapping to the destination

echo.
echo Important: For fields with formatting or long text, make sure to:
echo - Set all Excel sources to use DT_WSTR instead of DT_NTEXT
echo - Apply Data Conversion transformation for all text fields
echo - Map the converted columns to your SQL destination

echo.
pause