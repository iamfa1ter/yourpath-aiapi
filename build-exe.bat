@echo off
echo Building YourPath AI Desktop App (EXE)...

echo Installing Python dependencies...
pip install PyQt5 PyQtWebEngine pyinstaller

if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Building EXE with PyInstaller...
pyinstaller --onefile --windowed --name "YourPath AI" desktop-app.py

if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
)

echo Creating dist folder...
if not exist dist mkdir dist

echo Copying EXE to dist folder...
copy "dist\YourPath AI\YourPath AI.exe" dist\YourPathAI.exe 2>nul || copy "dist\YourPath AI.exe" dist\YourPathAI.exe

echo.
echo Success! EXE created at: dist\YourPathAI.exe
echo You can now run it on any Windows PC.
pause
