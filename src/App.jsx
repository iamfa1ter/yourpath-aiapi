import { cloneElement, useEffect, useId, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  Layers,
  MapPin,
  Microscope,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Upload
} from "lucide-react";
import { analyzeAdmissionChat, analyzeGraduate, analyzeStudent } from "./api.js";
import { ChatLayout } from "./components/ui/ChatLayout";
import { generateResultsPdf } from "./pdf.js";
import { hasErrors, validateGraduate, validateStudent } from "./validation.js";

const countries = [
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "Netherlands",
  "Singapore",
  "UAE",
  "South Korea",
  "Japan",
  "Other"
];

const majors = [
  "Computer Science",
  "Data Science and AI",
  "Business Administration",
  "Medicine",
  "Engineering",
  "Law",
  "Architecture",
  "Psychology",
  "Design",
  "Economics",
  "Other"
];

const fields = [
  "Artificial Intelligence",
  "Computer Science",
  "Biomedical Sciences",
  "Engineering",
  "Economics",
  "Public Policy",
  "Education",
  "Psychology",
  "Architecture",
  "Business Analytics",
  "Other"
];

const hobbies = [
  "Coding",
  "Design",
  "Music",
  "Sports",
  "Writing",
  "Research",
  "Entrepreneurship",
  "Community Service",
  "Gaming",
  "Photography"
];

const olympiads = [
  "Math Olympiad",
  "Physics Olympiad",
  "Chemistry Olympiad",
  "Informatics",
  "Biology Olympiad",
  "National Science Fair"
];

const studentSteps = ["Academic Info", "Goals", "Activities", "Portfolio"];
const resultTabs = ["Summary", "Recommendations", "Gap Analysis", "Roadmap", "Generated Documents"];

const initialStudentData = {
  gpa: "",
  satTaken: false,
  satScore: "",
  ieltsTaken: false,
  ieltsScore: "",
  entScore: "",
  desiredCountry: "",
  desiredCountryOther: "",
  desiredMajor: "",
  desiredMajorOther: "",
  hobbies: [],
  hobbiesOther: "",
  olympiads: [],
  olympiadsOther: "",
  projects: "",
  portfolioText: "",
  fileName: ""
};

const initialGraduateData = {
  currentUniversity: "",
  currentDegree: "",
  gpa: "",
  thesisTopic: "",
  researchInterests: "",
  publications: "",
  academicAchievements: "",
  ieltsToefl: "",
  greGmat: "",
  targetCountry: "",
  targetCountryOther: "",
  targetProgram: "",
  preferredField: "",
  preferredFieldOther: "",
  recommendationLetters: "",
  researchExperience: ""
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("students");
  const [studentData, setStudentData] = useState(initialStudentData);
  const [graduateData, setGraduateData] = useState(initialGraduateData);
  const [studentErrors, setStudentErrors] = useState({});
  const [graduateErrors, setGraduateErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState(null);

  const navScreen = screen === "results" || screen === "loading" ? mode : screen;

  async function submitStudent() {
    const validationErrors = validateStudent(studentData);
    setStudentErrors(validationErrors);
    setApiError("");
    if (hasErrors(validationErrors)) return false;

    setMode("students");
    setScreen("loading");
    try {
      const response = await analyzeStudent(studentData);
      setResult(response.analysis);
      setScreen("results");
      return true;
    } catch (error) {
      setApiError(error.message || "AI analysis failed. Please try again.");
      if (error.details) setStudentErrors(error.details);
      setScreen("students");
      return false;
    }
  }

  async function submitGraduate() {
    const validationErrors = validateGraduate(graduateData);
    setGraduateErrors(validationErrors);
    setApiError("");
    if (hasErrors(validationErrors)) return false;

    setMode("graduates");
    setScreen("loading");
    try {
      const response = await analyzeGraduate(graduateData);
      setResult(response.analysis);
      setScreen("results");
      return true;
    } catch (error) {
      setApiError(error.message || "AI analysis failed. Please try again.");
      if (error.details) setGraduateErrors(error.details);
      setScreen("graduates");
      return false;
    }
  }

  function navigate(next) {
    setApiError("");
    setScreen(next);
    if (next === "students" || next === "graduates") setMode(next);
  }

  return (
    <div className="app-shell">
      <Nav screen={navScreen} onNavigate={navigate} />
      {screen === "home" && <HomeScreen onNavigate={navigate} />}
      {screen === "students" && (
        <StudentScreen
          data={studentData}
          setData={setStudentData}
          errors={studentErrors}
          setErrors={setStudentErrors}
          apiError={apiError}
          onAnalyze={submitStudent}
        />
      )}
      {screen === "graduates" && (
        <GraduateScreen
          data={graduateData}
          setData={setGraduateData}
          errors={graduateErrors}
          setErrors={setGraduateErrors}
          apiError={apiError}
          onAnalyze={submitGraduate}
        />
      )}
      {screen === "advisor" && <AdvisorScreen />}
      {screen === "loading" && <LoadingScreen mode={mode} />}
      {screen === "results" && result && <ResultsScreen mode={mode} result={result} onEdit={() => setScreen(mode)} />}
    </div>
  );
}

function Nav({ screen, onNavigate }) {
  return (
    <header className="nav">
      <button className="brand" type="button" onClick={() => onNavigate("home")} aria-label="Go home">
        <span className="brand-mark">Y</span>
        <span className="brand-name">
          YourPath <span className="grad">AI</span>
        </span>
      </button>
      <nav className="nav-links" aria-label="Main navigation">
        {[
          ["home", "Home"],
          ["students", "School Students"],
          ["graduates", "Graduates"],
          ["advisor", "YourPath AI"]
        ].map(([key, label]) => (
          <button key={key} className={`nav-link ${screen === key ? "active" : ""}`} type="button" onClick={() => onNavigate(key)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="nav-status">Secure AI analysis</div>
    </header>
  );
}

function HomeScreen({ onNavigate }) {
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeHomePrompt() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const response = await analyzeAdmissionChat({ message: trimmed });
      setPreview(response.reply);
    } catch (err) {
      setError(err.message || "AI preview could not be completed.");
      setPreview({
        content: "I could not reach the live advisor, but I can still show the kind of strategy YourPath AI builds.",
        sections: [
          { title: "Admission Strength", content: "Depends on GPA, test scores, research experience, documents, and target program level.", items: [] },
          { title: "Recommended Path (Master / PhD)", content: "Master first is usually safer if research output and supervisor fit are still weak.", items: [] },
          { title: "Target Countries", content: "", items: ["Canada", "Germany", "Netherlands"] },
          { title: "Next Steps", content: "", items: ["Clarify target field", "Shortlist programs", "Prepare SOP", "Build a 6-12 month roadmap"] }
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  const previewSections = Array.isArray(preview?.sections) ? preview.sections.slice(0, 4) : [];

  return (
    <main className="screen home">
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            AI-powered admission navigator
          </div>
          <h1 id="home-title">
            AI that builds your <br />
            <span className="grad">university admission strategy</span>
          </h1>
          <p>
            Describe your profile and get a clear admission roadmap in seconds
          </p>
        </div>

        <div className="home-ai-console">
          <div className="home-analyzer">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="GPA 3.7, Biology, want AI/medical field..."
            />
            <button className="btn btn-primary" type="button" onClick={analyzeHomePrompt} disabled={loading || !prompt.trim()}>
              <Sparkles size={16} />
              {loading ? "Analyzing..." : "Analyze my profile"}
            </button>
          </div>

          {error && <div className="home-error">{error}</div>}

          {loading && (
            <div className="home-preview-card typing-preview">
              <div className="chat-typing">
                <span />
                <span />
                <span />
                <p>Building your admission preview...</p>
              </div>
            </div>
          )}

          {preview && !loading && (
            <div className="home-preview-card">
              <div className="home-preview-top">
                <span className="chat-sidebar-mark">
                  <Sparkles size={16} />
                </span>
                <div>
                  <strong>YourPath AI preview</strong>
                  <p>{preview.content}</p>
                </div>
              </div>
              {!!previewSections.length && (
                <div className="home-preview-grid">
                  {previewSections.map((section, index) => (
                    <section className="home-preview-section" key={`${section.title}-${index}`}>
                      <h3>{section.title}</h3>
                      {section.content && <p>{section.content}</p>}
                      {!!section.items?.length && (
                        <ul>
                          {section.items.slice(0, 3).map((item, itemIndex) => (
                            <li key={`${section.title}-${itemIndex}`}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>
              )}
              <button className="btn btn-secondary home-open-chat" type="button" onClick={() => onNavigate("advisor")}>
                Continue in full chat <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="path-grid">
          <PathCard
            className="student"
            icon={<GraduationCap size={25} />}
            title="For School Students"
            text="Bachelor's program guidance with major fit, university categories, admission chances, and a personal statement draft."
            tags={["Bachelor Admissions", "Major Fit", "Scholarship Ideas"]}
            onClick={() => onNavigate("students")}
          />
          <PathCard
            className="graduate"
            icon={<Microscope size={25} />}
            title="For Graduates"
            text="Master / PhD path planning with research fit, program recommendations, supervisor search, and academic documents."
            tags={["Master / PhD", "Research Fit", "SOP Draft"]}
            onClick={() => onNavigate("graduates")}
          />
          <PathCard
            className="advisor"
            icon={<Sparkles size={25} />}
            title="YourPath AI"
            text="Admission-focused AI for program fit, country choice, scholarships, research fit, SOP help, and roadmaps."
            tags={["AI Advisor", "Program Fit", "SOP Help"]}
            onClick={() => onNavigate("advisor")}
          />
        </div>
      </section>
    </main>
  );
}

function PathCard({ className, icon, title, text, tags, onClick }) {
  return (
    <button className={`path-card ${className}`} type="button" onClick={onClick}>
      <span className="path-icon">{icon}</span>
      <span>
        <h2>{title}</h2>
        <p>{text}</p>
      </span>
      <span className="tag-row">
        {tags.map((tag) => (
          <span className="mini-tag" key={tag}>
            {tag}
          </span>
        ))}
      </span>
      <span className="pill">
        Get started <ArrowRight size={14} />
      </span>
    </button>
  );
}

function AdvisorScreen() {
  return (
    <main className="screen advisor-screen">
      <ChatLayout />
    </main>
  );
}

function StudentScreen({ data, setData, errors, setErrors, apiError, onAnalyze }) {
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState("");
  const progress = ((step + 1) / studentSteps.length) * 100;

  function setField(field, value) {
    setLocalError("");
    setData((current) => ({ ...current, [field]: value }));
    clearErrors(setErrors, field);
  }

  function toggleArray(field, value) {
    setLocalError("");
    setData((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]
    }));
    clearErrors(setErrors, field);
  }

  function handleAnalyzeClick() {
    const validationErrors = validateStudent(data);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      setLocalError("Please fix the highlighted fields before running the AI analysis.");
      setStep(getStudentErrorStep(validationErrors));
      return;
    }
    setLocalError("");
    onAnalyze();
  }

  return (
    <main className="screen flow">
      <FlowHeader title="School Student Profile" subtitle={`Step ${step + 1} of ${studentSteps.length}: ${studentSteps[step]}`} steps={studentSteps} step={step} progress={progress} />
      <div className="flow-body">
        {(apiError || localError) && <ErrorAlert message={apiError || localError} />}
        {step === 0 && <StudentAcademicStep data={data} setField={setField} errors={errors} />}
        {step === 1 && <StudentGoalsStep data={data} setField={setField} errors={errors} />}
        {step === 2 && <StudentActivitiesStep data={data} setField={setField} toggleArray={toggleArray} errors={errors} />}
        {step === 3 && <StudentPortfolioStep data={data} setField={setField} errors={errors} />}
      </div>
      <div className="flow-footer">
        <button className="btn btn-secondary" type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
          <ArrowLeft size={16} />
          Back
        </button>
        <span className="footer-note">Your API key stays on the backend.</span>
        {step < studentSteps.length - 1 ? (
          <button className="btn btn-primary" type="button" onClick={() => setStep((current) => current + 1)}>
            Continue
            <ArrowRight size={16} />
          </button>
        ) : (
          <button className="btn btn-primary" type="button" onClick={handleAnalyzeClick}>
            <Sparkles size={16} />
            Analyze with AI
          </button>
        )}
      </div>
    </main>
  );
}

function GraduateScreen({ data, setData, errors, setErrors, apiError, onAnalyze }) {
  function setField(field, value) {
    setData((current) => ({ ...current, [field]: value }));
    clearErrors(setErrors, field);
  }

  return (
    <main className="screen flow">
      <div className="flow-header">
        <h1>Graduate Admission Profile</h1>
        <div className="flow-subtitle">Master / PhD program planning based on academic background and research direction.</div>
      </div>
      <div className="flow-body">
        {apiError && <ErrorAlert message={apiError} />}
        <div className="form-grid wide">
          <SectionCard title="Academic Background" icon={<GraduationCap size={17} />} className="full">
            <div className="field-grid">
              <TextInput label="Current university" field="currentUniversity" data={data} setField={setField} errors={errors} placeholder="Nazarbayev University, KBTU, University of Toronto" />
              <TextInput label="Current degree" field="currentDegree" data={data} setField={setField} errors={errors} placeholder="Bachelor of Science in Biology" />
              <TextInput label="GPA" field="gpa" data={data} setField={setField} errors={errors} placeholder="3.7" hint="numeric" />
              <TextInput label="Thesis topic" field="thesisTopic" data={data} setField={setField} errors={errors} placeholder="Transformer models for medical imaging" />
            </div>
          </SectionCard>

          <SectionCard title="Research Profile" icon={<Microscope size={17} />} className="full">
            <div className="field-grid">
              <TextAreaInput label="Research interests" field="researchInterests" data={data} setField={setField} errors={errors} placeholder="Topics, methods, datasets, questions you want to study" />
              <TextAreaInput label="Research experience" field="researchExperience" data={data} setField={setField} errors={errors} placeholder="Labs, assistants, capstone research, independent studies" />
              <TextAreaInput label="Publications" field="publications" data={data} setField={setField} errors={errors} placeholder="Published papers, preprints, posters, or write none yet" />
              <TextAreaInput label="Academic achievements" field="academicAchievements" data={data} setField={setField} errors={errors} placeholder="Awards, honors, conferences, grants, strong coursework" />
            </div>
          </SectionCard>

          <SectionCard title="Tests and Letters" icon={<FileText size={17} />} className="full">
            <div className="field-grid">
              <TextInput label="IELTS / TOEFL" field="ieltsToefl" data={data} setField={setField} errors={errors} placeholder="IELTS 7.5 or TOEFL 102" />
              <TextInput label="GRE / GMAT" field="greGmat" data={data} setField={setField} errors={errors} placeholder="GRE 320, GMAT 690, or not taken" />
              <TextAreaInput label="Recommendation letters" field="recommendationLetters" data={data} setField={setField} errors={errors} placeholder="Who can write letters and what they can support" />
            </div>
          </SectionCard>

          <SectionCard title="Target Program" icon={<Target size={17} />} className="full">
            <div className="field-grid">
              <Field label="Target country" error={errors.targetCountry}>
                <select className="select" value={data.targetCountry} onChange={(event) => setField("targetCountry", event.target.value)}>
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option value={country} key={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target program" error={errors.targetProgram}>
                <select className="select" value={data.targetProgram} onChange={(event) => setField("targetProgram", event.target.value)}>
                  <option value="">Select program</option>
                  <option value="Master">Master</option>
                  <option value="PhD">PhD</option>
                </select>
              </Field>
              <Field label="Preferred field" error={errors.preferredField}>
                <select className="select" value={data.preferredField} onChange={(event) => setField("preferredField", event.target.value)}>
                  <option value="">Select field</option>
                  {fields.map((field) => (
                    <option value={field} key={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </Field>
              {data.targetCountry === "Other" && <TextInput label="Other country" field="targetCountryOther" data={data} setField={setField} errors={errors} placeholder="France, Italy, Kazakhstan" />}
              {data.preferredField === "Other" && <TextInput label="Other field" field="preferredFieldOther" data={data} setField={setField} errors={errors} placeholder="Computational social science" />}
            </div>
          </SectionCard>
        </div>
      </div>
      <div className="flow-footer">
        <span className="footer-note">The backend sends a schema-guided admission prompt to the AI provider.</span>
        <button className="btn btn-primary" type="button" onClick={onAnalyze}>
          <Sparkles size={16} />
          Analyze Graduate Path
        </button>
      </div>
    </main>
  );
}

function FlowHeader({ title, subtitle, steps, step, progress }) {
  return (
    <div className="flow-header">
      <div className="flow-title-row">
        <div>
          <h1>{title}</h1>
          <div className="flow-subtitle">{subtitle}</div>
        </div>
        <div className="stepper">
          {steps.map((label, index) => (
            <span className={`step-indicator ${index < step ? "done" : ""} ${index === step ? "active" : ""}`} title={label} key={label}>
              {index < step ? <Check size={14} /> : index + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function getStudentErrorStep(errors) {
  if (["gpa", "entScore", "satScore", "ieltsScore"].some((field) => errors[field])) return 0;
  if (["desiredCountry", "desiredMajor"].some((field) => errors[field])) return 1;
  if (["hobbies", "olympiads", "projects"].some((field) => errors[field])) return 2;
  return 3;
}

function StudentAcademicStep({ data, setField, errors }) {
  return (
    <div className="form-grid">
      <SectionCard title="Academic Scores" icon={<ClipboardList size={17} />} className="full">
        <div className="field-grid">
          <TextInput label="GPA" field="gpa" data={data} setField={setField} errors={errors} placeholder="3.8" hint="numeric" />
          <TextInput label="ENT score" field="entScore" data={data} setField={setField} errors={errors} placeholder="118" hint="numeric" />
        </div>
      </SectionCard>

      <SectionCard title="SAT" icon={<FileText size={17} />}>
        <div className="stack">
          <ToggleRow checked={data.satTaken} label="I have taken SAT" onChange={() => setField("satTaken", !data.satTaken)} />
          {data.satTaken && <TextInput label="SAT score" field="satScore" data={data} setField={setField} errors={errors} placeholder="1450" hint="400-1600" />}
        </div>
      </SectionCard>

      <SectionCard title="IELTS / TOEFL" icon={<FileText size={17} />}>
        <div className="stack">
          <ToggleRow checked={data.ieltsTaken} label="I have IELTS / TOEFL" onChange={() => setField("ieltsTaken", !data.ieltsTaken)} />
          {data.ieltsTaken && <TextInput label="IELTS / TOEFL score" field="ieltsScore" data={data} setField={setField} errors={errors} placeholder="IELTS 7.5 or TOEFL 102" />}
        </div>
      </SectionCard>
    </div>
  );
}

function StudentGoalsStep({ data, setField, errors }) {
  return (
    <div className="form-grid">
      <SectionCard title="Desired Country" icon={<MapPin size={17} />}>
        <Field label="Country" error={errors.desiredCountry}>
          <select className="select" value={data.desiredCountry} onChange={(event) => setField("desiredCountry", event.target.value)}>
            <option value="">Select country</option>
            {countries.map((country) => (
              <option value={country} key={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>
        {data.desiredCountry === "Other" && <div style={{ marginTop: 12 }}><TextInput label="Other country" field="desiredCountryOther" data={data} setField={setField} errors={errors} placeholder="France, Italy, Kazakhstan" /></div>}
      </SectionCard>

      <SectionCard title="Desired Major" icon={<Target size={17} />}>
        <Field label="Major" error={errors.desiredMajor}>
          <select className="select" value={data.desiredMajor} onChange={(event) => setField("desiredMajor", event.target.value)}>
            <option value="">Select major</option>
            {majors.map((major) => (
              <option value={major} key={major}>
                {major}
              </option>
            ))}
          </select>
        </Field>
        {data.desiredMajor === "Other" && <div style={{ marginTop: 12 }}><TextInput label="Describe major" field="desiredMajorOther" data={data} setField={setField} errors={errors} placeholder="Biomedical engineering, robotics" /></div>}
      </SectionCard>
    </div>
  );
}

function StudentActivitiesStep({ data, setField, toggleArray, errors }) {
  return (
    <div className="form-grid">
      <SectionCard title="Olympiads" icon={<Trophy size={17} />} className="full">
        <ChipGroup values={olympiads} selected={data.olympiads} onToggle={(value) => toggleArray("olympiads", value)} />
        <div style={{ marginTop: 12 }}>
          <TextInput label="Other achievements" field="olympiadsOther" data={data} setField={setField} errors={errors} placeholder="Regional finalist, school science fair, none yet" />
        </div>
      </SectionCard>

      <SectionCard title="Projects" icon={<Rocket size={17} />} className="full">
        <TextAreaInput label="Project details" field="projects" data={data} setField={setField} errors={errors} placeholder="Apps, research, school projects, portfolio links" />
      </SectionCard>

      <SectionCard title="Hobbies" icon={<Sparkles size={17} />} className="full">
        <ChipGroup values={hobbies} selected={data.hobbies} onToggle={(value) => toggleArray("hobbies", value)} />
        <div style={{ marginTop: 12 }}>
          <TextInput label="Other hobbies" field="hobbiesOther" data={data} setField={setField} errors={errors} placeholder="Debate, robotics, volunteering" />
        </div>
      </SectionCard>
    </div>
  );
}

function StudentPortfolioStep({ data, setField, errors }) {
  return (
    <div className="form-grid">
      <SectionCard title="Portfolio" icon={<FileText size={17} />} className="full">
        <TextAreaInput label="Portfolio / personal bio" field="portfolioText" data={data} setField={setField} errors={errors} placeholder="Tell us about your goals, story, strengths, and academic interests." />
      </SectionCard>

      <SectionCard title="File Upload Placeholder" icon={<Upload size={17} />} className="full" subtitle="Optional placeholder only. Files are not sent to the API in this version.">
        <label className="upload-zone">
          <Upload size={28} />
          <span>{data.fileName || "Select a transcript, certificate, or portfolio file"}</span>
          <small>PDF, DOC, JPG up to 10MB</small>
          <input type="file" onChange={(event) => setField("fileName", event.target.files?.[0]?.name || "")} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        </label>
      </SectionCard>
    </div>
  );
}

function LoadingScreen({ mode }) {
  const [progress, setProgress] = useState(8);
  const messages = useMemo(
    () =>
      mode === "students"
        ? ["Reading academic profile", "Estimating admission fit", "Building university categories", "Drafting roadmap and statement"]
        : ["Reading research profile", "Estimating program fit", "Building supervisor search strategy", "Drafting academic statements"],
    [mode]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setProgress((current) => Math.min(96, current + Math.random() * 9 + 4)), 520);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="screen loading-screen">
      <div className="loading-card">
        <div className="spinner" aria-hidden="true" />
        <div className="loading-title">Analyzing Your Profile</div>
        <p>{messages[Math.min(messages.length - 1, Math.floor(progress / 25))]}</p>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </main>
  );
}

function ResultsScreen({ mode, result, onEdit }) {
  const [tab, setTab] = useState(0);
  const isStudent = mode === "students";
  const score = clampScore(result.evaluationScore);
  const chance = clampScore(result.admissionChancePercentage);

  return (
    <main className="screen">
      <div className="results-header">
        <ScoreRing score={score} />
        <div>
          <div className="results-title">AI Analysis Complete</div>
          <div className="results-subtitle">{result.profileSummary}</div>
          <div className="button-row" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" type="button" onClick={() => generateResultsPdf(mode, result)}>
              <Download size={16} />
              Generate PDF
            </button>
            <button className="btn btn-secondary" type="button" onClick={onEdit}>
              <ArrowLeft size={16} />
              Edit Data
            </button>
          </div>
        </div>
        <div className="metric-grid">
          <Metric value={`${score}%`} label="Evaluation" />
          <Metric value={`${chance}%`} label="Admission chance" />
          <Metric value={isStudent ? result.recommendedUniversities?.length || 0 : result.programRecommendations?.length || 0} label={isStudent ? "Universities" : "Programs"} />
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {resultTabs.map((label, index) => (
          <button key={label} className={`tab-button ${index === tab ? "active" : ""}`} type="button" onClick={() => setTab(index)}>
            {label}
          </button>
        ))}
      </div>

      <div className="results-body">
        {tab === 0 && <SummaryTab mode={mode} result={result} />}
        {tab === 1 && <RecommendationsTab mode={mode} result={result} />}
        {tab === 2 && <GapTab result={result} />}
        {tab === 3 && <RoadmapTab roadmap={result.roadmap} />}
        {tab === 4 && <DocumentsTab mode={mode} result={result} />}
      </div>
    </main>
  );
}

function SummaryTab({ mode, result }) {
  const isStudent = mode === "students";
  return (
    <div className="section-grid">
      <SectionCard title="Summary" icon={<Sparkles size={17} />} className="full">
        <p className="document">{result.profileSummary}</p>
      </SectionCard>
      {!isStudent && (
        <SectionCard title="Research Fit" icon={<Microscope size={17} />} className="full">
          <p className="document">{result.researchFitSummary}</p>
        </SectionCard>
      )}
      <SectionCard title="Strengths" icon={<Check size={17} />}>
        <ul className="list">{(result.strengths || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </SectionCard>
      <SectionCard title="Weaknesses" icon={<AlertTriangle size={17} />}>
        <ul className="list">{(result.weaknesses || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </SectionCard>
      <SectionCard title="Recommended Next Steps" icon={<ArrowRight size={17} />} className="full">
        <ul className="list">{(result.recommendedNextSteps || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </SectionCard>
    </div>
  );
}

function RecommendationsTab({ mode, result }) {
  const isStudent = mode === "students";
  if (isStudent) {
    return (
      <div className="section-grid">
        <SectionCard title="Recommended Majors" icon={<Target size={17} />}>
          <div className="stack">{(result.recommendedMajors || []).map((major) => <MajorCard major={major} key={major.name} />)}</div>
        </SectionCard>
        <SectionCard title="Recommended Universities" icon={<Building2 size={17} />}>
          <div className="stack">{(result.recommendedUniversities || []).map((university) => <UniversityCard university={university} key={`${university.name}-${university.category}`} />)}</div>
        </SectionCard>
        <CategorySection title="Dream / Match / Safe Categories" groups={result.universityCategories} renderItem={(item) => <UniversityCard university={item} key={`${item.name}-${item.category}`} />} />
        <ScholarshipSection scholarships={result.scholarshipRecommendations} />
      </div>
    );
  }

  return (
    <div className="section-grid">
      <SectionCard title="Program Recommendations" icon={<BookOpen size={17} />} className="full">
        <div className="stack">{(result.programRecommendations || []).map((program) => <ProgramCard program={program} key={`${program.university}-${program.programName}`} />)}</div>
      </SectionCard>
      <CategorySection title="Dream / Match / Safe Categories" groups={result.programCategories} renderItem={(item) => <ProgramCard program={item} key={`${item.university}-${item.programName}-${item.category}`} />} />
      <ScholarshipSection scholarships={result.scholarshipRecommendations} />
      <SectionCard title="Supervisor / Lab Search Strategy" icon={<Microscope size={17} />} className="full">
        <ul className="list">{(result.supervisorLabSearchStrategy || []).map((item) => <li key={item}>{item}</li>)}</ul>
      </SectionCard>
    </div>
  );
}

function CategorySection({ title, groups, renderItem }) {
  return (
    <SectionCard title={title} icon={<Layers size={17} />} className="full">
      <div className="section-grid">
        {[
          ["Dream", groups?.dream || []],
          ["Match", groups?.match || []],
          ["Safe", groups?.safe || []]
        ].map(([label, items]) => (
          <div className="stack" key={label}>
            <span className="pill">{label}</span>
            {items.map(renderItem)}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ScholarshipSection({ scholarships }) {
  return (
    <SectionCard title="Scholarship Recommendations" icon={<Trophy size={17} />} className="full">
      <div className="stack">
        {(scholarships || []).map((item) => (
          <div className="item-card" key={item.name}>
            <div className="item-top">
              <h3>{item.name}</h3>
              <span className="pill">{clampScore(item.fitPercentage)}% fit</span>
            </div>
            <p>{item.type}</p>
            <p>{item.rationale}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function GapTab({ result }) {
  return (
    <div className="stack" style={{ width: "min(760px, 100%)" }}>
      {(result.gapAnalysis || []).map((gap) => (
        <div className="item-card" key={gap.gap}>
          <div className="item-top">
            <h3>{gap.gap}</h3>
            <span className={`pill impact-${gap.impact.toLowerCase()}`}>{gap.impact} impact</span>
          </div>
          <p>{gap.action}</p>
        </div>
      ))}
    </div>
  );
}

function RoadmapTab({ roadmap }) {
  return (
    <div className="roadmap">
      {(roadmap || []).map((step, index) => (
        <div className="roadmap-step" key={`${step.phase}-${step.title}`}>
          <div className="roadmap-node">
            <span className="roadmap-dot" />
            {index < roadmap.length - 1 && <span className="roadmap-line" />}
          </div>
          <div className="item-card" style={{ marginBottom: 16 }}>
            <div className="item-top">
              <h3>{step.title}</h3>
              <span className="pill">{step.phase}</span>
            </div>
            <ul className="list">{(step.tasks || []).map((task) => <li key={task}>{task}</li>)}</ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentsTab({ mode, result }) {
  const isStudent = mode === "students";
  return (
    <div className="section-grid">
      <SectionCard title={isStudent ? "Personal Statement Draft" : "Statement of Purpose Draft"} icon={<FileText size={17} />} className="full">
        <div className="document">{isStudent ? result.personalStatementDraft : result.statementOfPurposeDraft}</div>
      </SectionCard>
      {!isStudent && (
        <SectionCard title="Research Statement Draft" icon={<FileText size={17} />} className="full">
          <div className="document">{result.researchStatementDraft}</div>
        </SectionCard>
      )}
      <SectionCard title="Recommended Next Steps" icon={<ArrowRight size={17} />} className="full">
        <ul className="list">{(result.recommendedNextSteps || []).map((step) => <li key={step}>{step}</li>)}</ul>
      </SectionCard>
    </div>
  );
}

function MajorCard({ major }) {
  return (
    <div className="item-card">
      <div className="item-top">
        <h3>{major.name}</h3>
        <span className="pill">{clampScore(major.fitScore)}% fit</span>
      </div>
      <p>{major.rationale}</p>
    </div>
  );
}

function UniversityCard({ university }) {
  return (
    <div className="item-card">
      <div className="item-top">
        <h3>{university.name}</h3>
        <span className="pill">{university.category}</span>
      </div>
      <p>{university.country} - {clampScore(university.admissionChancePercentage)}% chance</p>
      <p>{university.rationale}</p>
      <p>{university.scholarshipNotes}</p>
    </div>
  );
}

function ProgramCard({ program }) {
  return (
    <div className="item-card">
      <div className="item-top">
        <h3>{program.programName}</h3>
        <span className="pill">{program.category}</span>
      </div>
      <p>{program.degreeLevel} at {program.university}, {program.country} - {clampScore(program.admissionChancePercentage)}% chance</p>
      <p>{program.researchFit}</p>
      <p>{program.scholarshipNotes}</p>
    </div>
  );
}

function TextInput({ label, field, data, setField, errors, placeholder, hint }) {
  return (
    <Field label={label} hint={hint} error={errors[field]}>
      <input className="input" value={data[field]} onChange={(event) => setField(field, event.target.value)} placeholder={placeholder} />
    </Field>
  );
}

function TextAreaInput({ label, field, data, setField, errors, placeholder }) {
  return (
    <Field label={label} error={errors[field]}>
      <textarea className="textarea" value={data[field]} onChange={(event) => setField(field, event.target.value)} placeholder={placeholder} />
    </Field>
  );
}

function SectionCard({ title, subtitle, icon, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <div className="card-title">
        {icon}
        {title}
      </div>
      {subtitle && <div className="card-subtitle">{subtitle}</div>}
      {children}
    </section>
  );
}

function Field({ label, hint, error, children }) {
  const reactId = useId();
  const id = `${label.replace(/\W+/g, "-").toLowerCase()}-${reactId}`;
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {hint && <small>{hint}</small>}
      </div>
      {cloneElement(children, { id, "aria-invalid": error ? "true" : "false" })}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function ToggleRow({ checked, label, onChange }) {
  return (
    <div className="toggle-row">
      <button className={`toggle ${checked ? "on" : ""}`} type="button" onClick={onChange} aria-pressed={checked}>
        <span />
      </button>
      <span>{label}</span>
    </div>
  );
}

function ChipGroup({ values, selected, onToggle }) {
  return (
    <div className="chip-grid">
      {values.map((value) => (
        <button key={value} className={`chip ${selected.includes(value) ? "active" : ""}`} type="button" onClick={() => onToggle(value)}>
          {value}
        </button>
      ))}
    </div>
  );
}

function ErrorAlert({ message }) {
  return (
    <div className="alert" role="alert">
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  );
}

function ScoreRing({ score }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * clampScore(score)) / 100;
  return (
    <div className="score-ring">
      <svg width="136" height="136" viewBox="0 0 136 136">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="68" cy="68" r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" />
        <circle cx="68" cy="68" r={radius} fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <div className="score-center">
        <div>
          <strong>{clampScore(score)}</strong>
          <span>Score</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function clearErrors(setErrors, field) {
  setErrors((current) => {
    const next = { ...current };
    delete next[field];
    if (field.endsWith("Other")) {
      delete next[field.replace("Other", "")];
    }
    return next;
  });
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}
