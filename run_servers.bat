@echo off
echo Starting Gutmann Backend and Frontend servers...

REM Start backend in a new command window
start "Gutmann Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Start frontend in a new command window  
start "Gutmann Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo Servers are starting in separate windows.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000