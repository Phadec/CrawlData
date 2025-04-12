@echo off
echo Installing Microsoft Access Database Engine 2016 Redistributable...
echo This is required for SSIS package to connect to Excel files

REM Check if running as administrator
NET SESSION >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Downloading Access Database Engine...
REM Download Access Database Engine 2016 Redistributable
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://download.microsoft.com/download/3/5/C/35C84C36-661A-44E6-9324-8786B8DBE231/AccessDatabaseEngine_X64.exe' -OutFile '%TEMP%\AccessDatabaseEngine_X64.exe'}"

if not exist "%TEMP%\AccessDatabaseEngine_X64.exe" (
    echo Failed to download Access Database Engine. Please check your internet connection.
    pause
    exit /b 1
)

echo Installing Access Database Engine...
REM Install with passive mode (minimal UI)
%TEMP%\AccessDatabaseEngine_X64.exe /passive /quiet

echo Cleaning up temporary files...
del "%TEMP%\AccessDatabaseEngine_X64.exe"

echo.
echo Installation completed.
echo You may need to restart your applications for the changes to take effect.
echo.
pause