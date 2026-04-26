# YourPath AI Python App

This FastAPI app runs the same YourPath AI React interface and the same AI endpoints as the Node backend.

## Install

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r python_app/requirements.txt
```

## Build the frontend

```bash
npm install
npm run build
```

## Configure AI

Use the same root `.env` file:

```bash
PORT=5000
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=http://localhost:8000
OPENROUTER_APP_NAME=YourPath AI
```

## Run

```bash
uvicorn python_app.app.main:app --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000
```

## API Endpoints

- `GET /api/health`
- `POST /api/analyze-student`
- `POST /api/analyze-graduate`
- `POST /api/admission-advisor`
- `POST /api/admission-chat`

## Desktop EXE App

This creates a Windows desktop app with the same YourPath AI design inside a native window.

Install/build:

```powershell
.\python_app\build_exe.ps1
```

Open:

```text
dist\YourPathAI\YourPathAI.exe
```

Important: put a `.env` file next to the EXE:

```text
dist\YourPathAI\.env
```

The `.env` format is the same as the web version.
