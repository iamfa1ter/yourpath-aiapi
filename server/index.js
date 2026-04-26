import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const app = express();
const port = Number(process.env.PORT || 5000);
const openAIModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const openRouterModel = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

let openai;
let gemini;
let openrouter;

function readSecret(name, placeholderMarker) {
  const value = process.env[name]?.trim();
  if (!value || value.includes(placeholderMarker)) {
    const err = new Error(`${name} is missing. Add a real key to your .env file and restart the server.`);
    err.status = 500;
    throw err;
  }
  return value;
}

function getAIProvider() {
  return (
    process.env.AI_PROVIDER ||
    (process.env.OPENROUTER_API_KEY ? "openrouter" : process.env.GEMINI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();
}

function getActiveModel() {
  const provider = getAIProvider();
  if (provider === "openrouter") return openRouterModel;
  if (provider === "gemini") return geminiModel;
  return openAIModel;
}

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({ apiKey: readSecret("OPENAI_API_KEY", "sk-your") });
  }
  return openai;
}

function getGeminiClient() {
  if (!gemini) {
    gemini = new GoogleGenAI({ apiKey: readSecret("GEMINI_API_KEY", "replace-with") });
  }
  return gemini;
}

function getOpenRouterClient() {
  if (!openrouter) {
    openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: readSecret("OPENROUTER_API_KEY", "replace-with"),
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
        "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME || "YourPath AI"
      }
    });
  }
  return openrouter;
}

const Impact = z.enum(["High", "Medium", "Low"]);
const ProgramCategory = z.enum(["Dream", "Match", "Safe"]);

const RoadmapStep = z.object({
  phase: z.string(),
  title: z.string(),
  tasks: z.array(z.string())
});

const GapItem = z.object({
  gap: z.string(),
  impact: Impact,
  action: z.string()
});

const Scholarship = z.object({
  name: z.string(),
  type: z.string(),
  fitPercentage: z.number(),
  rationale: z.string()
});

const UndergraduateUniversity = z.object({
  name: z.string(),
  country: z.string(),
  category: ProgramCategory,
  admissionChancePercentage: z.number(),
  rationale: z.string(),
  scholarshipNotes: z.string()
});

const GraduateProgram = z.object({
  university: z.string(),
  country: z.string(),
  programName: z.string(),
  degreeLevel: z.enum(["Master", "PhD"]),
  category: ProgramCategory,
  admissionChancePercentage: z.number(),
  researchFit: z.string(),
  scholarshipNotes: z.string()
});

const StudentAnalysisSchema = z.object({
  profileSummary: z.string(),
  evaluationScore: z.number(),
  admissionChancePercentage: z.number(),
  recommendedMajors: z.array(
    z.object({
      name: z.string(),
      fitScore: z.number(),
      rationale: z.string()
    })
  ),
  recommendedUniversities: z.array(UndergraduateUniversity),
  universityCategories: z.object({
    dream: z.array(UndergraduateUniversity),
    match: z.array(UndergraduateUniversity),
    safe: z.array(UndergraduateUniversity)
  }),
  scholarshipRecommendations: z.array(Scholarship),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  gapAnalysis: z.array(GapItem),
  roadmap: z.array(RoadmapStep),
  personalStatementDraft: z.string(),
  recommendedNextSteps: z.array(z.string())
});

const GraduateAnalysisSchema = z.object({
  profileSummary: z.string(),
  evaluationScore: z.number(),
  admissionChancePercentage: z.number(),
  programRecommendations: z.array(GraduateProgram),
  programCategories: z.object({
    dream: z.array(GraduateProgram),
    match: z.array(GraduateProgram),
    safe: z.array(GraduateProgram)
  }),
  scholarshipRecommendations: z.array(Scholarship),
  researchFitSummary: z.string(),
  supervisorLabSearchStrategy: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  gapAnalysis: z.array(GapItem),
  roadmap: z.array(RoadmapStep),
  statementOfPurposeDraft: z.string(),
  researchStatementDraft: z.string(),
  recommendedNextSteps: z.array(z.string())
});

const AdmissionAdvisorSchema = z.object({
  admissionStrength: z.string(),
  suitableProgramDirections: z.array(z.string()),
  recommendedTargetFields: z.array(z.string()),
  targetCountriesAndUniversityTiers: z.array(z.string()),
  masterVsPhdRecommendation: z.string(),
  weaknesses: z.array(z.string()),
  improvementPlan: z.array(RoadmapStep),
  thesisPositioning: z.string(),
  recommendationLetterStrategy: z.array(z.string()),
  missingInformationImpact: z.array(z.string()),
  nextSteps: z.array(z.string())
});

const ChatAdvisorSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  items: z.array(z.string())
});

const ChatAdvisorSchema = z.object({
  mode: z.enum(["casual", "definition", "strategy", "redirect"]),
  content: z.string(),
  sections: z.array(ChatAdvisorSectionSchema),
  followUpQuestions: z.array(z.string())
});

function isBlank(value) {
  return value == null || String(value).trim() === "";
}

function isNumber(value) {
  return !isBlank(value) && Number.isFinite(Number(value));
}

function selectedOrCustom(selected, custom) {
  return selected === "Other" ? String(custom || "").trim() : String(selected || "").trim();
}

function arrayHasContent(items, otherText) {
  return (Array.isArray(items) && items.length > 0) || !isBlank(otherText);
}

function validateStudentPayload(data) {
  const errors = {};
  const desiredCountry = selectedOrCustom(data.desiredCountry, data.desiredCountryOther);
  const desiredMajor = selectedOrCustom(data.desiredMajor, data.desiredMajorOther);

  if (!isNumber(data.gpa)) errors.gpa = "GPA must be numeric.";
  if (!isNumber(data.entScore)) errors.entScore = "ENT score must be numeric.";
  if (!desiredCountry) errors.desiredCountry = "Desired country is required.";
  if (!desiredMajor) errors.desiredMajor = "Desired major is required.";
  if (!arrayHasContent(data.hobbies, data.hobbiesOther)) errors.hobbies = "Add at least one hobby or interest.";
  if (!arrayHasContent(data.olympiads, data.olympiadsOther)) errors.olympiads = "Add olympiads, achievements, or write none yet.";
  if (isBlank(data.projects)) errors.projects = "Projects are required.";
  if (isBlank(data.portfolioText)) errors.portfolioText = "Portfolio text is required.";

  if (data.satTaken) {
    const sat = Number(data.satScore);
    if (!isNumber(data.satScore) || sat < 400 || sat > 1600) {
      errors.satScore = "SAT score must be between 400 and 1600.";
    }
  }

  if (data.ieltsTaken) {
    const ielts = Number(data.ieltsScore);
    if (!isNumber(data.ieltsScore) || ielts < 0 || ielts > 120) {
      errors.ieltsScore = "IELTS / TOEFL score must be numeric.";
    }
  }

  return errors;
}

function validateGraduatePayload(data) {
  const errors = {};
  const targetCountry = selectedOrCustom(data.targetCountry, data.targetCountryOther);
  const preferredField = selectedOrCustom(data.preferredField, data.preferredFieldOther);

  if (isBlank(data.currentUniversity)) errors.currentUniversity = "Current university is required.";
  if (isBlank(data.currentDegree)) errors.currentDegree = "Current degree is required.";
  if (!isNumber(data.gpa)) errors.gpa = "GPA must be numeric.";
  if (isBlank(data.thesisTopic)) errors.thesisTopic = "Thesis topic is required.";
  if (isBlank(data.researchInterests)) errors.researchInterests = "Research interests are required.";
  if (isBlank(data.publications)) errors.publications = "Publications field is required. Write none yet if needed.";
  if (isBlank(data.academicAchievements)) errors.academicAchievements = "Academic achievements are required.";
  if (isBlank(data.ieltsToefl)) errors.ieltsToefl = "IELTS / TOEFL is required.";
  if (isBlank(data.greGmat)) errors.greGmat = "GRE / GMAT is required. Write not taken if needed.";
  if (!targetCountry) errors.targetCountry = "Target country is required.";
  if (!["Master", "PhD"].includes(data.targetProgram)) errors.targetProgram = "Target program is required.";
  if (!preferredField) errors.preferredField = "Preferred field is required.";
  if (isBlank(data.recommendationLetters)) errors.recommendationLetters = "Recommendation letters are required.";
  if (isBlank(data.researchExperience)) errors.researchExperience = "Research experience is required.";

  return errors;
}

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function normalizeStudentProfile(data) {
  return {
    applicantType: "School student applying to Bachelor's programs",
    gpa: data.gpa,
    sat: data.satTaken ? data.satScore : "Not taken",
    ieltsOrToefl: data.ieltsTaken ? data.ieltsScore : "Not taken",
    entScore: data.entScore,
    desiredCountry: selectedOrCustom(data.desiredCountry, data.desiredCountryOther),
    desiredMajor: selectedOrCustom(data.desiredMajor, data.desiredMajorOther),
    hobbies: [...(data.hobbies || []), data.hobbiesOther].filter(Boolean),
    olympiadsAndAchievements: [...(data.olympiads || []), data.olympiadsOther].filter(Boolean),
    projects: data.projects,
    portfolioText: data.portfolioText,
    uploadedFilePlaceholder: data.fileName || "No file attached"
  };
}

function normalizeGraduateProfile(data) {
  return {
    applicantType: "Graduate applicant for Master or PhD programs",
    currentUniversity: data.currentUniversity,
    currentDegree: data.currentDegree,
    gpa: data.gpa,
    thesisTopic: data.thesisTopic,
    researchInterests: data.researchInterests,
    publications: data.publications,
    academicAchievements: data.academicAchievements,
    ieltsOrToefl: data.ieltsToefl,
    greOrGmat: data.greGmat,
    targetCountry: selectedOrCustom(data.targetCountry, data.targetCountryOther),
    targetProgram: data.targetProgram,
    preferredField: selectedOrCustom(data.preferredField, data.preferredFieldOther),
    recommendationLetters: data.recommendationLetters,
    researchExperience: data.researchExperience
  };
}

function sanitizeGeminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map((item) => sanitizeGeminiSchema(item));
  if (!schema || typeof schema !== "object") return schema;
  const clean = {};
  for (const [key, value] of Object.entries(schema)) {
    if (["$schema", "$id", "$ref", "$defs", "definitions", "additionalProperties"].includes(key)) continue;
    clean[key] = sanitizeGeminiSchema(value);
  }
  return clean;
}

function sanitizeSchemaForResponseFormat(schema) {
  if (Array.isArray(schema)) return schema.map((item) => sanitizeSchemaForResponseFormat(item));
  if (!schema || typeof schema !== "object") return schema;
  const clean = {};
  for (const [key, value] of Object.entries(schema)) {
    if (["$schema", "$id", "$ref", "$defs", "definitions"].includes(key)) continue;
    clean[key] = sanitizeSchemaForResponseFormat(value);
  }
  return clean;
}

async function runOpenAIStructuredAnalysis({ schema, schemaName, systemPrompt, profile }) {
  const client = getOpenAIClient();
  const response = await client.responses.parse({
    model: openAIModel,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Return only structured JSON for this profile:\n${JSON.stringify(profile, null, 2)}` }
    ],
    text: { format: zodTextFormat(schema, schemaName) },
    max_output_tokens: 6000
  });

  if (!response.output_parsed) throw new Error("OpenAI returned an empty structured response.");
  return response.output_parsed;
}

async function runGeminiStructuredAnalysis({ schema, systemPrompt, profile }) {
  const client = getGeminiClient();
  const jsonSchema = sanitizeGeminiSchema(z.toJSONSchema(schema));
  const response = await client.models.generateContent({
    model: geminiModel,
    contents: `${systemPrompt}\n\nReturn only JSON for this profile:\n${JSON.stringify(profile, null, 2)}`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema
    }
  });

  return schema.parse(JSON.parse(response.text || "{}"));
}

async function runOpenRouterStructuredAnalysis({ schema, schemaName, systemPrompt, profile }) {
  const client = getOpenRouterClient();
  const jsonSchema = sanitizeSchemaForResponseFormat(z.toJSONSchema(schema));
  const completion = await client.chat.completions.create({
    model: openRouterModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Return only JSON for this profile:\n${JSON.stringify(profile, null, 2)}` }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: schemaName,
        strict: true,
        schema: jsonSchema
      }
    },
    provider: { require_parameters: true }
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty response.");
  return schema.parse(JSON.parse(content));
}

async function runStructuredAnalysis(options) {
  const provider = getAIProvider();
  if (provider === "openrouter") return runOpenRouterStructuredAnalysis(options);
  if (provider === "gemini") return runGeminiStructuredAnalysis(options);
  if (provider === "openai") return runOpenAIStructuredAnalysis(options);

  const err = new Error("AI_PROVIDER must be openai, gemini, or openrouter.");
  err.status = 500;
  throw err;
}

function friendlyAIError(error, fallback) {
  const message = error?.message || "";
  if (
    message.includes("OPENROUTER_API_KEY is missing") ||
    message.includes("GEMINI_API_KEY is missing") ||
    message.includes("OPENAI_API_KEY is missing")
  ) {
    return message;
  }
  if (error?.status === 401 || message.toLowerCase().includes("authentication")) {
    return "AI provider authentication failed. Check that the API key in .env is real, active, and the server was restarted.";
  }
  if (error?.status === 404 || message.toLowerCase().includes("model")) {
    return "AI provider model failed. Check OPENROUTER_MODEL in .env or choose a model available in your account.";
  }
  return fallback;
}

const studentSystemPrompt = `
You are YourPath AI, an admissions advisor for school students applying to Bachelor's programs.
Analyze the applicant profile and produce personalized university admission guidance.
Return JSON that matches the schema exactly.
Requirements:
- Recommend 3 to 5 majors.
- Recommend at least 6 universities across Dream, Match, and Safe categories.
- Include admission chances, scholarships, strengths, weaknesses, gap analysis, a 3-6 month roadmap, a personal statement draft, and next steps.
- Keep advice specific to GPA, SAT, IELTS/TOEFL, ENT, olympiads, projects, hobbies, desired country, desired major, and portfolio.
`;

const graduateSystemPrompt = `
You are YourPath AI, an admissions advisor for Master and PhD applicants.
Analyze the applicant profile and produce personalized graduate admission guidance.
Return JSON that matches the schema exactly.
Requirements:
- Recommend at least 6 university programs across Dream, Match, and Safe categories.
- Include admission chances, scholarship recommendations, research fit, supervisor/lab search strategy, strengths, weaknesses, gap analysis, an application roadmap, statement of purpose draft, research statement draft, and next steps.
- Keep advice specific to current university, degree, GPA, thesis topic, research interests, publications, academic achievements, IELTS/TOEFL, GRE/GMAT, target country, target program, preferred field, recommendation letters, and research experience.
`;

const admissionAdvisorSystemPrompt = `
You are an expert graduate admissions advisor.

You analyze student profiles and provide structured, realistic admission strategies.

Focus on:
- practical steps
- realistic chances
- research alignment
- clear structured output

Avoid generic advice.

You work inside YourPath AI, a Bachelor, Master, and PhD admission planning platform.
Analyze the student profile below and produce a practical admission strategy.

Default Graduate Admission Profile to use when the user gives incomplete information:
- University: KBTU
- Degree: Bachelor of Science in Biology
- GPA: 3.7
- Thesis topic: Transformer models for medical imaging
- IELTS/TOEFL: 7
- GRE/GMAT: Not taken
- Research interests: Not specified
- Research experience: Not specified
- Publications: None specified
- Academic achievements: Not specified
- Recommendation letters: Not specified
- Target country: Not selected
- Target program: Not selected
- Preferred field: Not selected

Tasks:
1. Assess the student's current admission strength.
2. Identify suitable program directions.
3. Recommend target fields based on the background.
4. Suggest realistic target countries and university tiers.
5. Explain whether Master's or PhD is more realistic.
6. Identify weaknesses in the profile.
7. Give a 6-12 month improvement plan.
8. Recommend how to position the thesis topic in applications.
9. Suggest what kind of recommendation letters are needed.
10. Include scholarships when relevant.
11. Output the answer in a clear structured format.

Important:
- Be realistic, not overly optimistic.
- Focus on Biology + AI + medical imaging intersection when relevant.
- If information is missing, state what is missing and how it affects admission chances.
- Return JSON that matches the schema exactly.
`;

const admissionChatSystemPrompt = `
You are YourPath AI, a specialized university admission advisor.

Your role is to help students plan Bachelor, Master, and PhD admissions.

Core rules:
- Do not invent academic details.
- Do not assume GPA, university, country, test scores, research experience, publications, budget, or target program unless the user explicitly provides them.
- If important information is missing, ask concise follow-up questions first.
- Do not use fake demo profiles.
- Do not mention KBTU, GPA 3.7, Biology, IELTS 7, or transformer models unless the user provided those details in the current chat.
- Be realistic, practical, and direct.
- Avoid overpromising admission chances.
- Do not write in a rigid repeated template unless the user asks for a formal report.

Response style:
- Write naturally, like a human admission consultant.
- Use short paragraphs.
- Use bullets only when useful.
- Avoid empty sections.
- Avoid generic headings like "Admission Strength", "Recommended Path", "Target Countries", "University Tier Strategy", "Weaknesses", "6-12 Month Plan" unless the user specifically asks for a structured report.

Behavior:
1. If the user asks a broad question without profile details, ask for the minimum required information:
   - current education level
   - GPA or grades
   - target degree: Bachelor, Master, or PhD
   - field of interest
   - target country or region
   - budget or scholarship need
   - English test score if available

2. If the user provides enough profile details, give a useful answer:
   - explain realistic options
   - identify missing pieces
   - suggest next steps
   - recommend what to improve
   - keep the answer practical

3. If the user clicks a quick action but profile data is missing, do not generate a fake plan. Instead ask for the minimum details needed.

Tone:
- professional
- clear
- supportive
- not too verbose
- not robotic

Schema guidance:
- mode: Use "casual" for greetings, "definition" for explaining terms, "strategy" for admission advice, "redirect" if user asks something unrelated.
- content: Keep this short and natural. Do not force rigid sections.
- sections: Leave EMPTY ARRAY for natural conversations. Only include sections if user explicitly asks for a "full analysis" or "report".
- followUpQuestions: Optional, 0-3 useful follow-up questions.

Important: Return JSON matching the schema, but prioritize natural, human conversation over forcing structured sections.
`;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "YourPath AI API", provider: getAIProvider() });
});

app.get("/", (_req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>YourPath AI API</title>
        <style>
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07071a; color: #f0f0ff; font-family: Inter, system-ui, sans-serif; }
          main { width: min(620px, calc(100vw - 32px)); padding: 28px; border: 1px solid rgba(255,255,255,.12); border-radius: 18px; background: rgba(255,255,255,.05); }
          a { color: #93c5fd; }
          code { color: #c4b5fd; background: rgba(255,255,255,.08); padding: 3px 7px; border-radius: 7px; }
        </style>
      </head>
      <body>
        <main>
          <h1>YourPath AI API is running</h1>
          <p>Open the React app at <a href="http://localhost:5173">http://localhost:5173</a>.</p>
          <p>Backend health check: <a href="/api/health"><code>/api/health</code></a></p>
        </main>
      </body>
    </html>
  `);
});

app.post("/api/analyze-student", async (req, res) => {
  try {
    const errors = validateStudentPayload(req.body || {});
    if (hasErrors(errors)) return res.status(400).json({ error: "Please fix the highlighted fields.", details: errors });

    const analysis = await runStructuredAnalysis({
      schema: StudentAnalysisSchema,
      schemaName: "student_analysis",
      systemPrompt: studentSystemPrompt,
      profile: normalizeStudentProfile(req.body)
    });

    res.json({ analysis, provider: getAIProvider(), model: getActiveModel() });
  } catch (error) {
    const status = error.status || 500;
    console.error("Student analysis failed:", error);
    res.status(status).json({
      error: friendlyAIError(error, "AI analysis could not be completed. Check the AI provider key/model in .env and try again.")
    });
  }
});

app.post("/api/analyze-graduate", async (req, res) => {
  try {
    const errors = validateGraduatePayload(req.body || {});
    if (hasErrors(errors)) return res.status(400).json({ error: "Please fix the highlighted fields.", details: errors });

    const analysis = await runStructuredAnalysis({
      schema: GraduateAnalysisSchema,
      schemaName: "graduate_analysis",
      systemPrompt: graduateSystemPrompt,
      profile: normalizeGraduateProfile(req.body)
    });

    res.json({ analysis, provider: getAIProvider(), model: getActiveModel() });
  } catch (error) {
    const status = error.status || 500;
    console.error("Graduate analysis failed:", error);
    res.status(status).json({
      error: friendlyAIError(error, "AI graduate admission analysis could not be completed. Check the AI provider key/model in .env and try again.")
    });
  }
});

app.post("/api/admission-advisor", async (req, res) => {
  try {
    const profileText = String(req.body?.profileText || "").trim();
    if (!profileText) {
      return res.status(400).json({
        error: "Describe your academic profile or paste your admission form first.",
        details: { profileText: "Academic profile is required." }
      });
    }

    const analysis = await runStructuredAnalysis({
      schema: AdmissionAdvisorSchema,
      schemaName: "admission_advisor_analysis",
      systemPrompt: admissionAdvisorSystemPrompt,
      profile: { userProvidedProfile: profileText }
    });

    res.json({ analysis, provider: getAIProvider(), model: getActiveModel() });
  } catch (error) {
    const status = error.status || 500;
    console.error("Admission advisor analysis failed:", error);
    res.status(status).json({
      error: friendlyAIError(error, "AI admission advisor could not complete the analysis. Check the AI provider key/model in .env and try again.")
    });
  }
});

app.post("/api/admission-chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.status(400).json({
        error: "Write a message first.",
        details: { message: "Message is required." }
      });
    }

    const reply = await runStructuredAnalysis({
      schema: ChatAdvisorSchema,
      schemaName: "admission_chat_reply",
      systemPrompt: admissionChatSystemPrompt,
      profile: { userMessage: message }
    });

    res.json({ reply, provider: getAIProvider(), model: getActiveModel() });
  } catch (error) {
    const status = error.status || 500;
    console.error("Admission chat failed:", error);
    res.status(status).json({
      error: friendlyAIError(error, "AI chat could not complete the answer. Check the AI provider key/model in .env and try again.")
    });
  }
});

app.listen(port, () => {
  console.log(`YourPath AI backend running on http://localhost:${port}`);
});
