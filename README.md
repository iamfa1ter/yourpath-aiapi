# YourPath AI

AI-powered education and university admission navigator for school students and graduate applicants.

## Install

```bash
npm install
```

On Windows PowerShell, if `npm` is blocked by script policy, use `npm.cmd` for the same commands:

```bash
npm.cmd install
npm.cmd run dev:all
```

## Configure AI Provider

1. Copy `.env.example` to `.env`.
2. Choose OpenRouter, Gemini, or OpenAI and put the key in `.env`.

For OpenRouter:

```bash
PORT=5000
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-fresh-openrouter-key
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=YourPath AI
```

For Gemini:

```bash
PORT=5000
AI_PROVIDER=gemini
GEMINI_API_KEY=your-fresh-gemini-key
GEMINI_MODEL=gemini-2.5-flash
```

For OpenAI:

```bash
PORT=5000
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-real-key
OPENAI_MODEL=gpt-5.4-mini
```

Never put any AI API key in frontend files under `src/`.

## Run Backend

```bash
npm run server
```

Backend runs on `http://localhost:5000`.

## Run Frontend

In another terminal:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## Run Both Together

```bash
npm run dev:all
```

## Run Python App

The Python version uses the exact same React build and API routes, served by FastAPI.

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r python_app/requirements.txt
npm run build
npm run python:server
```

Open `http://localhost:8000`.

## Build

```bash
npm run build
```

## API Endpoints

- `POST /api/analyze-student`
- `POST /api/analyze-graduate`
- `POST /api/admission-advisor`
- `POST /api/admission-chat`

The backend validates each request, sends a structured admission prompt to the selected AI provider, and returns schema-shaped JSON for the React results screen and PDF export.
