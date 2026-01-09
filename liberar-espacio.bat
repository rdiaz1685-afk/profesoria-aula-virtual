@echo off
echo ====================================
echo LIMPIEZA DE DISCO - PROFESOR IA
echo ====================================
echo.

echo 1. Limpiando archivos temporales...
del /q /s /f %TEMP%\*.*
for /d %%i in (%TEMP%\*) do rd /s /q "%%i"

echo.
echo 2. Limpiando Prefetch...
del /q /s /f C:\Windows\Prefetch\*.*

echo.
echo 3. Limpiando cache de navegadores...
rd /s /q "C:\Users\%USERNAME%\AppData\Local\Google\Chrome\User Data\Default\Cache" 2>nul
rd /s /q "C:\Users\%USERNAME%\AppData\Local\Microsoft\Edge\User Data\Default\Cache" 2>nul

echo.
echo 4. Limpiando archivos de actualizacion de Windows...
rd /s /q C:\Windows\SoftwareDistribution\Download 2>nul

echo.
echo 5. Iniciando limpieza de disco...
cleanmgr /sagerun:1

echo.
echo ====================================
echo LIMPIEZA COMPLETADA
echo ====================================
echo.
echo Espacio liberado. Presiona cualquier tecla para continuar...
pause >nul
