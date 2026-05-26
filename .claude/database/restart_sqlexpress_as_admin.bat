@echo off
REM EJECUTAR COMO ADMINISTRADOR - Habilita SQL Server Mixed Mode
echo Reiniciando SQL Server Express con Mixed Mode...
net stop "MSSQL$SQLEXPRESS"
timeout /t 3 /nobreak
net start "MSSQL$SQLEXPRESS"
echo.
echo Listo. Ahora sqlcmd y el MCP server pueden usar SQL Auth.
pause
