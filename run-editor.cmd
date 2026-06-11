@echo off
setlocal
cd /d "%~dp0"

echo Starting CopiaSoft Site Editor...
echo.
echo Editor URL:
echo   http://localhost:5177
echo.
echo Keep this window open while editing.
echo Press Ctrl+C to stop the editor server.
echo.

where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:5177"
  node tools\editor-server.js
  if not %errorlevel%==0 pause
  exit /b %errorlevel%
)

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  start "" "http://localhost:5177"
  "%BUNDLED_NODE%" tools\editor-server.js
  if not %errorlevel%==0 pause
  exit /b %errorlevel%
)

echo Node.js was not found.
echo Install Node.js or run this inside Codex with the bundled runtime available.
pause
exit /b 1
