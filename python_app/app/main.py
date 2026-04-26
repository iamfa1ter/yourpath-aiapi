from pathlib import Path
import sys
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

if __package__:
    from .ai import friendly_ai_error, get_active_model, get_ai_provider, run_structured_analysis
    from .prompts import (
        ADMISSION_ADVISOR_SYSTEM_PROMPT,
        ADMISSION_CHAT_SYSTEM_PROMPT,
        GRADUATE_SYSTEM_PROMPT,
        STUDENT_SYSTEM_PROMPT,
    )
    from .schemas import AdmissionAdvisorAnalysis, ChatAdvisorReply, GraduateAnalysis, StudentAnalysis
else:
    sys.path.append(str(Path(__file__).resolve().parent))
    from ai import friendly_ai_error, get_active_model, get_ai_provider, run_structured_analysis
    from prompts import ADMISSION_ADVISOR_SYSTEM_PROMPT, ADMISSION_CHAT_SYSTEM_PROMPT, GRADUATE_SYSTEM_PROMPT, STUDENT_SYSTEM_PROMPT
    from schemas import AdmissionAdvisorAnalysis, ChatAdvisorReply, GraduateAnalysis, StudentAnalysis

app = FastAPI(title="YourPath AI Python API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
    ROOT_DIR = Path(sys._MEIPASS)
else:
    ROOT_DIR = Path(__file__).resolve().parents[2]
DIST_DIR = ROOT_DIR / "dist"


def is_blank(value: Any) -> bool:
    return value is None or str(value).strip() == ""


def is_number(value: Any) -> bool:
    if is_blank(value):
        return False
    try:
        float(value)
        return True
    except (TypeError, ValueError):
        return False


def selected_or_custom(selected: Any, custom: Any) -> str:
    return str(custom or "").strip() if selected == "Other" else str(selected or "").strip()


def array_has_content(items: Any, other_text: Any) -> bool:
    return (isinstance(items, list) and len(items) > 0) or not is_blank(other_text)


def has_errors(errors: dict[str, str]) -> bool:
    return len(errors) > 0


def validate_student_payload(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    desired_country = selected_or_custom(data.get("desiredCountry"), data.get("desiredCountryOther"))
    desired_major = selected_or_custom(data.get("desiredMajor"), data.get("desiredMajorOther"))

    if not is_number(data.get("gpa")):
        errors["gpa"] = "GPA must be numeric."
    if not is_number(data.get("entScore")):
        errors["entScore"] = "ENT score must be numeric."
    if not desired_country:
        errors["desiredCountry"] = "Desired country is required."
    if not desired_major:
        errors["desiredMajor"] = "Desired major is required."
    if not array_has_content(data.get("hobbies"), data.get("hobbiesOther")):
        errors["hobbies"] = "Add at least one hobby or interest."
    if not array_has_content(data.get("olympiads"), data.get("olympiadsOther")):
        errors["olympiads"] = "Add olympiads, achievements, or write none yet."
    if is_blank(data.get("projects")):
        errors["projects"] = "Projects are required."
    if is_blank(data.get("portfolioText")):
        errors["portfolioText"] = "Portfolio text is required."

    if data.get("satTaken"):
        sat = float(data.get("satScore") or 0)
        if not is_number(data.get("satScore")) or sat < 400 or sat > 1600:
            errors["satScore"] = "SAT score must be between 400 and 1600."

    if data.get("ieltsTaken"):
        if not is_number(data.get("ieltsScore")):
            errors["ieltsScore"] = "IELTS / TOEFL score must be numeric."

    return errors


def validate_graduate_payload(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    target_country = selected_or_custom(data.get("targetCountry"), data.get("targetCountryOther"))
    preferred_field = selected_or_custom(data.get("preferredField"), data.get("preferredFieldOther"))

    if is_blank(data.get("currentUniversity")):
        errors["currentUniversity"] = "Current university is required."
    if is_blank(data.get("currentDegree")):
        errors["currentDegree"] = "Current degree is required."
    if not is_number(data.get("gpa")):
        errors["gpa"] = "GPA must be numeric."
    if is_blank(data.get("thesisTopic")):
        errors["thesisTopic"] = "Thesis topic is required."
    if is_blank(data.get("researchInterests")):
        errors["researchInterests"] = "Research interests are required."
    if is_blank(data.get("publications")):
        errors["publications"] = "Publications field is required. Write none yet if needed."
    if is_blank(data.get("academicAchievements")):
        errors["academicAchievements"] = "Academic achievements are required."
    if is_blank(data.get("ieltsToefl")):
        errors["ieltsToefl"] = "IELTS / TOEFL is required."
    if is_blank(data.get("greGmat")):
        errors["greGmat"] = "GRE / GMAT is required. Write not taken if needed."
    if not target_country:
        errors["targetCountry"] = "Target country is required."
    if data.get("targetProgram") not in {"Master", "PhD"}:
        errors["targetProgram"] = "Target program is required."
    if not preferred_field:
        errors["preferredField"] = "Preferred field is required."
    if is_blank(data.get("recommendationLetters")):
        errors["recommendationLetters"] = "Recommendation letters are required."
    if is_blank(data.get("researchExperience")):
        errors["researchExperience"] = "Research experience is required."

    return errors


def normalize_student_profile(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "applicantType": "School student applying to Bachelor's programs",
        "gpa": data.get("gpa"),
        "sat": data.get("satScore") if data.get("satTaken") else "Not taken",
        "ieltsOrToefl": data.get("ieltsScore") if data.get("ieltsTaken") else "Not taken",
        "entScore": data.get("entScore"),
        "desiredCountry": selected_or_custom(data.get("desiredCountry"), data.get("desiredCountryOther")),
        "desiredMajor": selected_or_custom(data.get("desiredMajor"), data.get("desiredMajorOther")),
        "hobbies": [item for item in [*(data.get("hobbies") or []), data.get("hobbiesOther")] if item],
        "olympiadsAndAchievements": [item for item in [*(data.get("olympiads") or []), data.get("olympiadsOther")] if item],
        "projects": data.get("projects"),
        "portfolioText": data.get("portfolioText"),
        "uploadedFilePlaceholder": data.get("fileName") or "No file attached",
    }


def normalize_graduate_profile(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "applicantType": "Graduate applicant for Master or PhD programs",
        "currentUniversity": data.get("currentUniversity"),
        "currentDegree": data.get("currentDegree"),
        "gpa": data.get("gpa"),
        "thesisTopic": data.get("thesisTopic"),
        "researchInterests": data.get("researchInterests"),
        "publications": data.get("publications"),
        "academicAchievements": data.get("academicAchievements"),
        "ieltsOrToefl": data.get("ieltsToefl"),
        "greOrGmat": data.get("greGmat"),
        "targetCountry": selected_or_custom(data.get("targetCountry"), data.get("targetCountryOther")),
        "targetProgram": data.get("targetProgram"),
        "preferredField": selected_or_custom(data.get("preferredField"), data.get("preferredFieldOther")),
        "recommendationLetters": data.get("recommendationLetters"),
        "researchExperience": data.get("researchExperience"),
    }


async def json_body(request: Request) -> dict[str, Any]:
    try:
        body = await request.json()
        return body if isinstance(body, dict) else {}
    except Exception:
        return {}


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "service": "YourPath AI Python API", "provider": get_ai_provider()}


@app.post("/api/analyze-student")
async def analyze_student(request: Request) -> dict[str, Any]:
    data = await json_body(request)
    errors = validate_student_payload(data)
    if has_errors(errors):
        raise HTTPException(status_code=400, detail={"error": "Please fix the highlighted fields.", "details": errors})

    try:
        analysis = await run_structured_analysis(
            schema_model=StudentAnalysis,
            schema_name="student_analysis",
            system_prompt=STUDENT_SYSTEM_PROMPT,
            profile=normalize_student_profile(data),
        )
        return {"analysis": analysis.model_dump(mode="json"), "provider": get_ai_provider(), "model": get_active_model()}
    except Exception as error:
        status = getattr(error, "status_code", 500)
        raise HTTPException(
            status_code=status,
            detail={"error": friendly_ai_error(error, "AI analysis could not be completed. Check the AI provider key/model in .env and try again.")},
        )


@app.post("/api/analyze-graduate")
async def analyze_graduate(request: Request) -> dict[str, Any]:
    data = await json_body(request)
    errors = validate_graduate_payload(data)
    if has_errors(errors):
        raise HTTPException(status_code=400, detail={"error": "Please fix the highlighted fields.", "details": errors})

    try:
        analysis = await run_structured_analysis(
            schema_model=GraduateAnalysis,
            schema_name="graduate_analysis",
            system_prompt=GRADUATE_SYSTEM_PROMPT,
            profile=normalize_graduate_profile(data),
        )
        return {"analysis": analysis.model_dump(mode="json"), "provider": get_ai_provider(), "model": get_active_model()}
    except Exception as error:
        status = getattr(error, "status_code", 500)
        raise HTTPException(
            status_code=status,
            detail={"error": friendly_ai_error(error, "AI graduate admission analysis could not be completed. Check the AI provider key/model in .env and try again.")},
        )


@app.post("/api/admission-advisor")
async def admission_advisor(request: Request) -> dict[str, Any]:
    data = await json_body(request)
    profile_text = str(data.get("profileText") or "").strip()
    if not profile_text:
        raise HTTPException(status_code=400, detail={"error": "Describe your academic profile or paste your admission form first.", "details": {"profileText": "Academic profile is required."}})

    try:
        analysis = await run_structured_analysis(
            schema_model=AdmissionAdvisorAnalysis,
            schema_name="admission_advisor_analysis",
            system_prompt=ADMISSION_ADVISOR_SYSTEM_PROMPT,
            profile={"userProvidedProfile": profile_text},
        )
        return {"analysis": analysis.model_dump(mode="json"), "provider": get_ai_provider(), "model": get_active_model()}
    except Exception as error:
        status = getattr(error, "status_code", 500)
        raise HTTPException(
            status_code=status,
            detail={"error": friendly_ai_error(error, "AI admission advisor could not complete the analysis. Check the AI provider key/model in .env and try again.")},
        )


@app.post("/api/admission-chat")
async def admission_chat(request: Request) -> dict[str, Any]:
    data = await json_body(request)
    message = str(data.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail={"error": "Write a message first.", "details": {"message": "Message is required."}})

    try:
        reply = await run_structured_analysis(
            schema_model=ChatAdvisorReply,
            schema_name="admission_chat_reply",
            system_prompt=ADMISSION_CHAT_SYSTEM_PROMPT,
            profile={"userMessage": message},
        )
        return {"reply": reply.model_dump(mode="json"), "provider": get_ai_provider(), "model": get_active_model()}
    except Exception as error:
        status = getattr(error, "status_code", 500)
        raise HTTPException(
            status_code=status,
            detail={"error": friendly_ai_error(error, "AI chat could not complete the answer. Check the AI provider key/model in .env and try again.")},
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    from fastapi.responses import JSONResponse

    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


if DIST_DIR.exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_frontend(full_path: str):
    index_file = DIST_DIR / "index.html"
    requested = DIST_DIR / full_path
    if full_path and requested.exists() and requested.is_file():
        return FileResponse(requested)
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse(
        """
        <main style="font-family: system-ui; padding: 32px">
          <h1>YourPath AI Python API is running</h1>
          <p>Build the frontend first with <code>npm run build</code>, then reload this page.</p>
          <p>Health check: <a href="/api/health">/api/health</a></p>
        </main>
        """
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
