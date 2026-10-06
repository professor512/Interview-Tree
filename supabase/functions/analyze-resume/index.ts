const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const GEMINI_MODEL =
  Deno.env.get("GEMINI_MODEL") || "gemini-3.1-flash-lite";

const FALLBACK_MODEL = "gemini-3.7-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle browser CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check Gemini API key
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Read request body
    const body = await req.json();

    const {
      resumeText,
      role,
      level,
      interviewType,
      company,
      jobDescription,
    } = body;

    // Validate resume
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(
        JSON.stringify({
          error: "resumeText is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate role
    if (!role || typeof role !== "string") {
      return new Response(
        JSON.stringify({
          error: "role is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Build Gemini prompt
    const prompt = `
You are an expert technical interviewer and resume analyst.

Analyze the candidate's resume and create the foundation for an adaptive interview tree.

Candidate interview context:

Target Role: ${role}
Experience Level: ${level || "Not specified"}
Interview Type: ${interviewType || "Mixed"}
Company: ${company || "Not specified"}

Job Description:
${jobDescription || "Not provided"}

Resume:
${resumeText}

Return ONLY valid JSON.

Use exactly this structure:

{
  "resumeProfile": {
    "summary": "",
    "skills": [],
    "experience": [],
    "projects": [],
    "education": [],
    "strengths": [],
    "potentialGaps": []
  },
  "questions": [
    {
      "question": "",
      "hook": "",
      "category": "",
      "branchType": "",
      "difficulty": "",
      "idealAnswerOutline": []
    }
  ]
}

Requirements:

1. Analyze the resume carefully.
2. Do not invent experience, projects, skills, companies, or education.
3. Generate 5 to 8 strong Layer 1 interview questions.
4. Questions should be highly relevant to the candidate's resume and target role.
5. Mix technical, project, experience, and role-specific questions.
6. Each question should contain a clear "hook" explaining what part of the resume triggered the question.
7. "branchType" should describe the type of follow-up path, such as:
   - Technical
   - Project
   - Behavioral
   - Experience
   - Fundamentals
8. "difficulty" should be one of:
   - Easy
   - Medium
   - Hard
9. "idealAnswerOutline" should contain concise points an excellent candidate should cover.
10. Return JSON only.
11. Do not include markdown.
12. Do not include explanations outside the JSON.
`;

    // Call Gemini
    async function callGemini(model: string) {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );
    }

    // Try primary model first
    let geminiResponse = await callGemini(GEMINI_MODEL);

    // If primary model is temporarily unavailable,
    // try fallback model.
    if (geminiResponse.status === 503) {
      console.warn(
        `${GEMINI_MODEL} is unavailable. Trying fallback model ${FALLBACK_MODEL}.`
      );

      geminiResponse = await callGemini(FALLBACK_MODEL);
    }

    // Handle Gemini API errors
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();

      console.error("Gemini API error:", errorText);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Gemini API request failed",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse Gemini response
    const geminiData = await geminiResponse.json();

    const generatedText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error(
        "Gemini response did not contain generated text:",
        JSON.stringify(geminiData)
      );

      throw new Error("Gemini returned an empty response");
    }

    // Parse generated JSON
    let result;

    try {
      result = JSON.parse(generatedText);
    } catch (error) {
      console.error(
        "Invalid JSON returned by Gemini:",
        generatedText
      );

      throw new Error("Gemini returned invalid JSON");
    }

    // Return successful result
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("analyze-resume error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});