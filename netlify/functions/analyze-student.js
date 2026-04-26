import OpenAI from "openai";

const studentAnalysisPrompt = `You are YourPath AI, an expert admission counselor. Analyze the student profile and provide structured guidance.

Return a JSON object with this exact structure:
{
  "profileSummary": "2-3 sentence summary of the student's overall profile and admission prospects",
  "evaluationScore": 75,
  "admissionChancePercentage": 68,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendedNextSteps": ["step 1", "step 2", "step 3"],
  "recommendedMajors": [
    {"name": "Computer Science", "fitScore": 92, "rationale": "Your strong math skills..."},
    {"name": "Data Science", "fitScore": 88, "rationale": "..."}
  ],
  "recommendedUniversities": [
    {"name": "MIT", "country": "United States", "category": "Dream", "admissionChancePercentage": 12, "rationale": "...", "scholarshipNotes": "Limited scholarships"},
    {"name": "UC Berkeley", "country": "United States", "category": "Dream", "admissionChancePercentage": 28, "rationale": "...", "scholarshipNotes": "..."}
  ],
  "universityCategories": {
    "dream": [{"name": "MIT", "country": "United States", "category": "Dream", "admissionChancePercentage": 12, "rationale": "...", "scholarshipNotes": "..."}],
    "match": [{"name": "Stanford", "country": "United States", "category": "Match", "admissionChancePercentage": 45, "rationale": "...", "scholarshipNotes": "..."}],
    "safe": [{"name": "Univ of Toronto", "country": "Canada", "category": "Safe", "admissionChancePercentage": 78, "rationale": "...", "scholarshipNotes": "..."}]
  },
  "scholarshipRecommendations": [
    {"name": "Fulbright", "type": "Government scholarship", "fitPercentage": 65, "rationale": "You meet the criteria..."},
    {"name": "Carnegie Mellon Scholarship", "type": "University-specific", "fitPercentage": 72, "rationale": "..."}
  ],
  "gapAnalysis": [
    {"gap": "Limited research experience", "impact": "High", "action": "Pursue summer research internships or independent projects"},
    {"gap": "SAT score could be stronger", "impact": "Medium", "action": "Consider retaking if timeline permits"}
  ],
  "roadmap": [
    {"phase": "Q1-Q2", "title": "Strengthen Applications", "tasks": ["Join coding competition", "Improve SAT score to 1500+", "Start research project"]},
    {"phase": "Q3", "title": "Application Prep", "tasks": ["Write personal statements", "Request recommendation letters"]},
    {"phase": "Q4", "title": "Submit Applications", "tasks": ["Apply to all universities", "Monitor application status"]}
  ],
  "personalStatementDraft": "A compelling 500-word draft for a personal statement..."
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
        { role: "system", content: studentAnalysisPrompt },
        { role: "user", content: `Analyze this student profile and provide detailed guidance:\n\n${profileData}` }
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
        evaluationScore: 65,
        admissionChancePercentage: 60,
        strengths: [],
        weaknesses: [],
        recommendedNextSteps: []
      };
    }

    return new Response(JSON.stringify({ analysis: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Student analysis error:", error);
    return new Response(
      JSON.stringify({
        error: "AI analysis could not complete. Check your OPENAI_API_KEY and try again."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
