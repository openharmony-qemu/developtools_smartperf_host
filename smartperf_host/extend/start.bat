@echo off
setlocal
set CURRENT_DIR=%~dp0
set NODE_EXECUTABLE=%CURRENT_DIR%bin\node.exe
set SERVICE_PATH=%CURRENT_DIR%windows-service.js
set DAEMON_PATH=%CURRENT_DIR%daemon

rd /s /q %DAEMON_PATH%
cmd /c  "%NODE_EXECUTABLE% %SERVICE_PATH%"
pause