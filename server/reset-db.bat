@echo off
echo =============================================
echo   Plan-I Database Reset Script
echo =============================================
echo.

cd /d "%~dp0"

echo [1/5] Deleting ALL old .db files...
del /s /q *.db 2>nul
echo       Done.
echo.

echo [2/5] Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ERROR: prisma generate failed!
    pause
    exit /b 1
)
echo.

echo [3/5] Pushing schema to fresh database...
call npx prisma db push --force-reset
if %ERRORLEVEL% neq 0 (
    echo ERROR: prisma db push failed!
    pause
    exit /b 1
)
echo.

echo [4/5] Seeding database with demo data...
call npx ts-node src/prisma/seed.ts
if %ERRORLEVEL% neq 0 (
    echo ERROR: seed failed!
    pause
    exit /b 1
)
echo.

echo [5/5] Verifying database...
call npx prisma db pull --print >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo WARNING: Could not verify database
) else (
    echo       Database verified OK.
)
echo.

echo =============================================
echo   SUCCESS! Database has been fully reset.
echo   You can now run: npm run dev
echo =============================================
pause
