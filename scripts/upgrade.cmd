@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "UPGRADE_SCRIPT=%SCRIPT_DIR%upgrade_ai.py"

where py >nul 2>&1
if %errorlevel% equ 0 (
  set "UPGRADE_PYTHON_CMD=py -3"
  py -3 "%UPGRADE_SCRIPT%" %*
  exit /b %errorlevel%
)

where python >nul 2>&1
if %errorlevel% equ 0 (
  set "UPGRADE_PYTHON_CMD=python"
  python "%UPGRADE_SCRIPT%" %*
  exit /b %errorlevel%
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
  set "UPGRADE_PYTHON_CMD=python3"
  python3 "%UPGRADE_SCRIPT%" %*
  exit /b %errorlevel%
)

echo ERROR: Python runtime not found. Tried: py -3, python, python3 1>&2
exit /b 1
