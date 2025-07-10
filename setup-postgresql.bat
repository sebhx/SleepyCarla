@echo off
echo Setting up PostgreSQL for SleepyCarla...
echo.
echo Step 1: Testing PostgreSQL connection...
echo.

rem Try common passwords
echo Trying with empty password...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT version();" -w
if %errorlevel% equ 0 goto success

echo.
echo Trying with password 'postgres'...
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT version();"
if %errorlevel% equ 0 goto success

echo.
echo Trying with password 'root'...
set PGPASSWORD=root
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT version();"
if %errorlevel% equ 0 goto success

echo.
echo Please enter the postgres user password manually:
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT version();"
if %errorlevel% equ 0 goto success

echo.
echo ❌ Could not connect to PostgreSQL
echo Please check the installation or try resetting the password
goto end

:success
echo.
echo ✅ PostgreSQL connection successful!
echo.
echo Step 2: Creating sleepycarla database...
"C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres sleepycarla
if %errorlevel% equ 0 (
    echo ✅ Database 'sleepycarla' created successfully!
) else (
    echo ⚠️  Database may already exist or there was an error
)

echo.
echo Step 3: Your DATABASE_URL should be:
echo postgresql://postgres:%PGPASSWORD%@localhost:5432/sleepycarla

:end
pause
