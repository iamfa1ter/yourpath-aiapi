import json
import os
import sys
from pathlib import Path
from typing import Any, Type

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

if getattr(sys, "frozen", False):
    load_dotenv(Path(sys.executable).resolve().parent / ".env")
else:
    load_dotenv(Path(__file__).resolve().parents[2] / ".env")

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")


class AIProviderError(Exception):
    def __init__(self, message: str, status_code: int = 500):
      super().__init__(message)
      self.status_code = status_code


def read_secret(name: str, placeholder_marker: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value or placeholder_marker in value:
        raise AIProviderError(f"{name} is missing. Add a real key to your .env file and restart the server.")
    return value


def get_ai_provider() -> str:
    configured = os.getenv("AI_PROVIDER")
    if configured:
        return configured.lower()
    if os.getenv("OPENROUTER_API_KEY"):
        return "openrouter"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    return "openrouter"


def get_active_model() -> str:
    provider = get_ai_provider()
    if provider == "openrouter":
        return OPENROUTER_MODEL
    return OPENAI_MODEL


def get_client() -> OpenAI:
    provider = get_ai_provider()
    if provider == "openrouter":
        return OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=read_secret("OPENROUTER_API_KEY", "replace-with"),
            default_headers={
                "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost:5173"),
                "X-OpenRouter-Title": os.getenv("OPENROUTER_APP_NAME", "YourPath AI"),
            },
        )

    if provider == "openai":
        return OpenAI(api_key=read_secret("OPENAI_API_KEY", "sk-your"))

    raise AIProviderError("Python app currently supports AI_PROVIDER=openrouter or AI_PROVIDER=openai.")


def strict_json_schema(model: Type[BaseModel]) -> dict[str, Any]:
    schema = model.model_json_schema()
    return _sanitize_schema(schema)


def _sanitize_schema(value: Any) -> Any:
    if isinstance(value, list):
        return [_sanitize_schema(item) for item in value]
    if not isinstance(value, dict):
        return value

    clean: dict[str, Any] = {}
    for key, item in value.items():
        if key in {"$schema", "$id"}:
            continue
        clean[key] = _sanitize_schema(item)

    if clean.get("type") == "object":
        props = clean.get("properties", {})
        clean["additionalProperties"] = False
        if props:
            clean["required"] = list(props.keys())

    return clean


async def run_structured_analysis(
    *,
    schema_model: Type[BaseModel],
    schema_name: str,
    system_prompt: str,
    profile: dict[str, Any],
) -> BaseModel:
    provider = get_ai_provider()
    if provider not in {"openrouter", "openai"}:
        raise AIProviderError("AI_PROVIDER must be openrouter or openai for the Python app.")

    client = get_client()
    completion = client.chat.completions.create(
        model=get_active_model(),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Return only JSON for this profile:\n{json.dumps(profile, indent=2)}"},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": schema_name,
                "strict": True,
                "schema": strict_json_schema(schema_model),
            },
        },
    )

    content = completion.choices[0].message.content
    if not content:
        raise AIProviderError("AI provider returned an empty response.")
    return schema_model.model_validate_json(content)


def friendly_ai_error(error: Exception, fallback: str) -> str:
    message = str(error)
    lowered = message.lower()
    if "api_key is missing" in lowered or "key" in lowered and "missing" in lowered:
        return message
    if "authentication" in lowered or "401" in lowered:
        return "AI provider authentication failed. Check that the API key in .env is real, active, and the server was restarted."
    if "model" in lowered or "404" in lowered:
        return "AI provider model failed. Check OPENROUTER_MODEL in .env or choose a model available in your account."
    return fallback
