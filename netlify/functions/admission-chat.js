import OpenAI from "openai";
import { z } from "zod";

const ChatAdvisorSectionSchema = z.object({
  title: z.string(),
  content: z.string().optional(),
  items: z.array(z.string())
});

const ChatAdvisorSchema = z.object({
  mode: z.enum(["casual", "definition", "strategy", "redirect"]),
  content: z.string(),
  sections: z.array(ChatAdvisorSectionSchema),
  followUpQuestions: z.array(z.string())
});

const admissionChatSystemPrompt = `You are YourPath AI Advisor. Help with Bachelor, Master, and PhD admission strategy, research fit, scholarships, SOP positioning, and application roadmaps.
- Ask clarifying questions before giving advice
- Offer natural conversational responses
- Use structured sections only when explicitly requested
- Be realistic and encouraging
- Focus on what you learn about their profile`;

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const message = String(body?.message || "").trim();

    if (!message) {
      return new Response(
        JSON.stringify({
          error: "Write a message first.",
          details: { message: "Message is required." }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY is missing. Configure it in Netlify environment variables."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey: openAIKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: admissionChatSystemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1500
    });

    const reply = {
      content: response.choices?.[0]?.message?.content || "I couldn't process that. Try again.",
      sections: [],
      followUpQuestions: []
    };

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: "AI chat could not complete. Check your OPENAI_API_KEY and try again."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
