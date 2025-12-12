@echo off
REM Setup script for Jewelry E-commerce Backend

echo ========================================
echo Jewelry E-commerce Backend Setup
echo ========================================
echo.

REM Check if XAMPP MySQL is running
echo [1/3] Checking MySQL connection...
echo.

REM Create database using mysql command
echo [2/3] Creating database and tables...
echo Please ensure XAMPP MySQL is running on port 3306
echo.

REM Try to find MySQL in common XAMPP locations
set MYSQL_PATH=
if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
if exist "C:\XAMPP\mysql\bin\mysql.exe" set MYSQL_PATH=C:\XAMPP\mysql\bin\mysql.exe

if "%MYSQL_PATH%"=="" (
    echo ERROR: MySQL not found in XAMPP directory
    echo Please run this command manually from XAMPP MySQL bin directory:
    echo mysql -u root ^< database_schema.sql
    echo.
    pause
    exit /b 1
)

echo Found MySQL at: %MYSQL_PATH%
echo Running database schema...
"%MYSQL_PATH%" -u root < database_schema.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create database
    echo Please check if XAMPP MySQL is running
    pause
    exit /b 1
)

echo Database created successfully!
echo.

echo [3/3] Seeding admin user...
call npm run seed-admin

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to seed admin user
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Admin credentials:
echo Email: admin@gmail.com
echo Password: admin
echo.
echo To start the server, run:
echo npm run dev
echo.
pause
