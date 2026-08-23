@echo off
setlocal

if "%~1"=="" goto usage
if "%~2"=="" goto usage

set "SERVICE_NAME=%~1"
set "COMMAND=%~2"
set "SERVICE_DIR=%~dp0services\%SERVICE_NAME%"
set "PYTHON=%SERVICE_DIR%\.venv\Scripts\python.exe"

if not exist "%SERVICE_DIR%\manage.py" (
  echo Django service not found: services\%SERVICE_NAME%
  exit /b 1
)

if not exist "%PYTHON%" (
  echo Python virtualenv not found: %SERVICE_DIR%\.venv
  echo Create it with:
  echo   cd services\%SERVICE_NAME%
  echo   python -m venv .venv
  echo   .\.venv\Scripts\python -m pip install -r requirements.txt
  exit /b 1
)

shift
shift

set "ARGS="
:collect_args
if "%~1"=="" goto args_done
set ARGS=%ARGS% "%~1"
shift
goto collect_args
:args_done

if /I "%COMMAND%"=="server" goto server
if /I "%COMMAND%"=="runserver" goto server
if /I "%COMMAND%"=="migrate" goto migrate
if /I "%COMMAND%"=="makemigrations" goto makemigrations
if /I "%COMMAND%"=="test" goto test
if /I "%COMMAND%"=="check" goto check
if /I "%COMMAND%"=="shell" goto shell

echo Unknown command: %COMMAND%
echo.
goto usage

:server
pushd "%SERVICE_DIR%"
if defined ARGS (
  "%PYTHON%" manage.py runserver %ARGS%
) else (
  "%PYTHON%" manage.py runserver 8001
)
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%

:migrate
pushd "%SERVICE_DIR%"
"%PYTHON%" manage.py migrate %ARGS%
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%

:makemigrations
pushd "%SERVICE_DIR%"
"%PYTHON%" manage.py makemigrations %ARGS%
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%

:test
pushd "%SERVICE_DIR%"
"%PYTHON%" manage.py test %ARGS%
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%

:check
pushd "%SERVICE_DIR%"
"%PYTHON%" manage.py check %ARGS%
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%

:shell
pushd "%SERVICE_DIR%"
"%PYTHON%" manage.py shell %ARGS%
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%

:usage
echo Usage:
echo   service.bat ^<django-service^> ^<command^> [args...]
echo.
echo Examples:
echo   service.bat vivaah4u-api server
echo   service.bat vivaah4u-api runserver 8002
echo   service.bat vivaah4u-api migrate
echo   service.bat vivaah4u-api makemigrations
echo   service.bat vivaah4u-api test
echo   service.bat vivaah4u-api check
echo   service.bat vivaah4u-api shell
echo.
echo Commands:
echo   server, runserver, migrate, makemigrations, test, check, shell
exit /b 1
