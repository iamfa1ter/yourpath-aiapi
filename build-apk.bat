@echo off
echo Building YourPath AI Android APK...

cd android-app

echo Cleaning previous builds...
if exist app\build rmdir /s /q app\build

echo Building APK with Gradle...
call gradlew.bat assembleDebug

if errorlevel 1 (
    echo Build failed. Make sure Android SDK is installed and ANDROID_HOME is set.
    pause
    exit /b 1
)

echo Creating dist folder...
if not exist ..\dist mkdir ..\dist

echo Copying APK to dist folder...
copy app\build\outputs\apk\debug\app-debug.apk ..\dist\yourpath-ai.apk

echo.
echo Success! APK created at: dist\yourpath-ai.apk
echo You can now install it on any Android device.
pause
