@echo off
rem Arranca AlbaViajera en local: compila, prepara la base de pruebas y abre el navegador.
cd /d "%~dp0"
call npm run build || (pause & exit /b 1)
call npm run db:migrar:local
start "AlbaViajera - servidor" cmd /k "npm run dev:api"
timeout /t 8 /nobreak >nul
start http://127.0.0.1:8791
