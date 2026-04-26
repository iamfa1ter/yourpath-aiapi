import OpenAI from "openai";

const graduateAnalysisPrompt = `You are YourPath AI, an expert graduate admissions counselor specializing in Master's and PhD programs. Analyze the graduate profile and provide structured guidance.

Return a JSON object with this exact structure:
{
  "profileSummary": "2-3 sentence summary of the graduate's overall profile and program prospects",
  "researchFitSummary": "Assessment of research fit and alignment with target programs",
  "evaluationScore": 78,
  "admissionChancePercentage": 65,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendedNextSteps": ["step 1", "step 2", "step 3"],
  "programRecommendations": [
    {"university": "Stanford University", "programName": "PhD Computer Science", "country": "United States", "degreeLevel": "PhD", "category": "Dream", "admissionChancePercentage": 28, "researchFit": "Your interest in machine learning aligns with Stanford's AI lab", "scholarshipNotes": "Full funding typically available"},
    {"university": "MIT", "programName": "PhD AI/ML", "country": "United States", "degreeLevel": "PhD", "category": "Dream", "admissionChancePercentage": 22, "researchFit": "...", "scholarshipNotes": "..."}
  ],
  "programCategories": {
    "dream": [{"university": "Stanford", "programName": "PhD Computer Science", "country": "United States", "degreeLevel": "PhD", "category": "Dream", "admissionChancePercentage": 28, "researchFit": "...", "scholarshipNotes": "..."}],
    "match": [{"university": "UC Berkeley", "programName": "Master's AI", "country": "United States", "degreeLevel": "Master", "category": "Match", "admissionChancePercentage": 55, "researchFit": "...", "scholarshipNotes": "..."}],
    "safe": [{"university": "University of Toronto", "programName": "Master's Computer Science", "country": "Canada", "degreeLevel": "Master", "category": "Safe", "admissionChancePercentage": 82, "researchFit": "...", "scholarshipNotes": "Scholarships available"}]
  },
  "scholarshipRecommendations": [
    {"name": "Fulbright PhD Program", "type": "Government fellowship", "fitPercentage": 72, "rationale": "Strong research background and international experience"},
    {"name": "NSF Graduate Fellowship", "type": "US Government", "fitPercentage": 68, "rationale": "Your research interests align with NSF priorities"}
  ],
  "supervisorLabSearchStrategy": ["Search for labs focusing on your research interests", "Review recent publications from potential advisors", "Contact 3-5 faculty members with specific research questions", "Prepare a concise research proposal aligned with their work"],
  "gapAnalysis": [
    {"gap": "Limited publications", "impact": "High", "action": "Aim to publish current research or submit to conferences"},
    {"gap": "GRE score could be stronger", "impact": "Medium", "action": "Consider retaking if timeline permits"}
  ],
  "roadmap": [
    {"phase": "Months 1-2", "title": "Research and Outreach", "tasks": ["Identify target professors and labs", "Review their recent papers", "Draft initial contact emails"]},
    {"phase": "Months 3-4", "title": "Application Preparation", "tasks": ["Write statement of purpose", "Request recommendation letters", "Prepare research proposal"]},
    {"phase": "Months 5-6", "title": "Submit Applications", "tasks": ["Submit all applications", "Prepare for interviews", "Monitor decisions"]}
  ],
  "statementOfPurposeDraft": "A compelling statement of purpose draft (500+ words)...",
  "researchStatementDraft": "A research direction and methodology statement..."
}`;

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY is missing. Configure it in Netlify environment variables."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const profileData = JSON.stringify(body, null, 2);

    const openai = new OpenAI({
      apiKey: openAIKey,
      baseURL: "https://openrouter.ai/api/v1"
    });

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: graduateAnalysisPrompt },
        { role: "user", content: `Analyze this graduate profile and provide detailed guidance:\n\n${profileData}` }
      ],
      max_tokens: 3000,
      temperature: 0.7
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    let result;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (parseErr) {
      result = {
        profileSummary: content,
        researchFitSummary: "Research fit analysis pending",
        evaluationScore: 70,
        admissionChancePercentage: 60,
        strengths: [],
        weaknesses: [],
        recommendedNextSteps: []
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Graduate analysis error:", error);
    return new Response(
      JSON.stringify({
        error: "AI analysis could not complete. Check your OPENAI_API_KEY and try again."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
