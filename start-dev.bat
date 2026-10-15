@echo off
rem Starts API (4000), admin (5174) and shop (5173) in three windows. Uses cmd, so no PowerShell script policy problem.
start "API 4000" cmd /k "cd /d %~dp0server && npm install && npm start"
timeout /t 15 /nobreak >nul
start "ADMIN 5174" cmd /k "cd /d %~dp0admin && npm install && npm run dev"
start "SHOP 5173" cmd /k "cd /d %~dp0 && npm install && npm run dev"
