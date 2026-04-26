@echo off
setlocal enabledelayedexpansion

echo Building YourPath AI Android APK (using direct Gradle)...
echo.

REM Check if ANDROID_HOME is set
if not defined ANDROID_HOME (
    echo ERROR: ANDROID_HOME environment variable is not set.
    echo Please set ANDROID_HOME to your Android SDK directory in Environment Variables.
    echo Example: C:\Users\YourName\AppData\Local\Android\Sdk
    pause
    exit /b 1
)

echo ANDROID_HOME: !ANDROID_HOME!
echo.

cd android-app

echo Cleaning previous builds...
if exist app\build rmdir /s /q app\build

REM Try to use gradlew if it exists, otherwise try system gradle
if exist gradlew.bat (
    echo Using local Gradle wrapper...
    call gradlew.bat assembleDebug
) else if exist ..\gradlew.bat (
    echo Using root Gradle wrapper...
    call ..\gradlew.bat assembleDebug
) else (
    echo Gradle wrapper not found. Attempting to use system Gradle...
    gradle assembleDebug
)

if errorlevel 1 (
    echo.
    echo Build failed.
    echo Solution: Open the android-app folder in Android Studio to initialize Gradle wrapper:
    echo 1. File ^> Open ^> select 'android-app' folder
    echo 2. Wait for Gradle sync to complete
    echo 3. Build ^> Build APK(s)
    echo 4. Copy app\build\outputs\apk\debug\app-debug.apk to dist\ folder
    pause
    exit /b 1
)

echo.
echo Build successful! Creating dist folder...
if not exist ..\dist mkdir ..\dist

echo Copying APK to dist folder...
copy app\build\outputs\apk\debug\app-debug.apk ..\dist\yourpath-ai.apk

if errorlevel 1 (
    echo Warning: Could not auto-copy APK.
    echo Please manually copy: app\build\outputs\apk\debug\app-debug.apk to dist\yourpath-ai.apk
    pause
    exit /b 0
)

echo.
echo Success! APK created at: ..\dist\yourpath-ai.apk
echo You can now install it on any Android device.
pause
