# YourPath AI — Multi-Platform Deployment

## Overview
Complete desktop and mobile applications for the YourPath AI admission advisor chatbot.

## Applications

### Windows Desktop App (build-exe.bat)
- **Technology**: PyQt5 + QWebEngine
- **Output**: `dist/YourPathAI.exe` (112 MB)
- **Build Time**: ~2 minutes
- **Usage**: Double-click to run on Windows 7+

### Android App (android-app/)
- **Technology**: Java, Retrofit2, OkHttp3, RecyclerView
- **Min SDK**: 24 (Android 7.0+)
- **Target SDK**: 34 (Android 14+)
- **Output**: `dist/yourpath-ai.apk` (after build)
- **Build**: Android Studio → Build > Build APK(s)

## Backend Integration
Both apps connect to: `https://yourpathai.netlify.app/.netlify/functions/admission-chat`

### API Endpoint
- **Base URL**: Netlify Functions
- **Framework**: OpenRouter API (gpt-4o-mini)
- **Auth**: API key from environment

## Build Instructions

### Desktop (EXE)
```bash
./build-exe.bat
```
Requires: Python 3.8+, pip (PyQt5, PyQtWebEngine, PyInstaller)

### Mobile (APK)
Option 1: GUI (Recommended)
```
Android Studio → File > Open > android-app
Build > Build APK(s)
```

Option 2: CLI with Gradle wrapper
```bash
cd android-app
./gradlew assembleDebug
```
Requires: Android SDK, JAVA_HOME set, Gradle 8.5+

## Design
- **Dark Theme**: Purple accent (#6366f1), navy backgrounds (#0f172a)
- **UI**: Native platform conventions (PyQt5 on Windows, Material Design on Android)
- **Responsive**: Adapts to window/screen size

## File Structure
```
.
├── desktop-app.py          # PyQt5 app code
├── build-exe.bat           # EXE build script
├── android-app/            # Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/yourpath/ai/
│   │   │   │   ├── MainActivity.java
│   │   │   │   ├── ChatAdapter.java
│   │   │   │   ├── ApiService.java
│   │   │   │   └── ...
│   │   │   └── res/
│   │   └── build.gradle
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradle/wrapper/
│   └── gradlew.bat
├── build-apk.bat           # APK build script
└── dist/                   # Output folder (gitignored)
    ├── YourPathAI.exe
    └── yourpath-ai.apk
```

## Troubleshooting

### EXE Build Fails
- Ensure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install PyQt5 PyQtWebEngine pyinstaller`

### APK Build Fails
- Set `ANDROID_HOME` environment variable to Android SDK path
- Ensure Android API 34 is installed
- Try: `cd android-app && ./gradlew assembleDebug --stacktrace`

### Network Issues
Both apps require internet connection to load the admission chat at yourpathai.netlify.app

## Release Notes
- Version: 1.0
- Release Date: 2026-04-26
- Status: Ready for distribution
