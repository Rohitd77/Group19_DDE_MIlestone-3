@echo off
echo ========================================
echo  API Integration Check
echo ========================================
echo.

echo 1. Checking environment variable...
if "%ANTHROPIC_API_KEY%"=="" (
    echo    [X] ANTHROPIC_API_KEY is NOT set
) else (
    echo    [OK] ANTHROPIC_API_KEY is set ^(length: %ANTHROPIC_API_KEY:~0,10%...^)
)
echo.

echo 2. Checking server status endpoint...
curl -s http://localhost:5000/status
echo.
echo.

echo 3. Look for "ai_enabled": true in the output above
echo.
echo ========================================
echo  Integration Status Summary:
echo ========================================
echo.
echo If you see:
echo   - "ai_enabled": true  = API key is working
echo   - "ai_enabled": false = API key NOT configured
echo.
pause
