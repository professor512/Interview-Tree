const GEMINI_API_KEY = Deno.env.get(
  "GEMINI_API_KEY"
);

const GEMINI_MODEL =
  Deno.env.get("GEMINI_MODEL") ||
  "gemini-3.1-flash-lite";

const FALLBACK_MODEL =
  "gemini-3.7-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not configured"
      );
    }

    const body = await req.json();

    const {
      question,
      hook,
      category,
      difficulty,
      idealAnswerOutline,
      userAnswer,
      role,
      level,
      interviewType,
      resumeProfile,
    } = body;

    // ============================================
    // VALIDATION
    // ============================================

    if (
      !question ||
      typeof question !== "string"
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "question is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    if (
      !userAnswer ||
      typeof userAnswer !== "string"
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "userAnswer is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // ============================================
    // PROMPT
    // ============================================

    const prompt = `
You are an expert technical interviewer.

You are evaluating a candidate's answer to an
interview question and deciding how the interview
should branch next.

Candidate context:

Target Role:
${role || "Not specified"}

Experience Level:
${level || "Not specified"}

Interview Type:
${interviewType || "Mixed"}

Resume Profile:
${JSON.stringify(
      resumeProfile || {},
      null,
      2
    )}

Current Interview Question:
${question}

Why this question was asked:
${hook || "Not specified"}

Category:
${category || "Not specified"}

Difficulty:
${difficulty || "Not specified"}

Ideal Answer Outline:
${JSON.stringify(
      idealAnswerOutline || [],
      null,
      2
    )}

Candidate's Answer:
${userAnswer}

Analyze the candidate's answer carefully.

Return ONLY valid JSON.

Use exactly this structure:

{
  "evaluation": {
    "score": 0,
    "rating": "",
    "summary": "",
    "strengths": [],
    "weaknesses": [],
    "missingPoints": [],
    "feedback": ""
  },
  "followUps": [
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

1. "score" must be an integer from 0 to 100.

2. "rating" must be one of:
   - Poor
   - Needs Improvement
   - Good
   - Very Good
   - Excellent

3. Evaluate the answer based on:
   - correctness
   - relevance
   - technical depth
   - clarity
   - completeness

4. Do not give credit for information that
   the candidate did not actually provide.

5. "strengths" should contain specific things
   the candidate did well.

6. "weaknesses" should contain specific areas
   that could be improved.

7. "missingPoints" should identify important
   points from the ideal answer that were missing.

8. "feedback" should give concise and useful
   interview coaching.

9. Generate 3 to 4 follow-up questions.

10. Follow-up questions must be based on:
    - the candidate's answer
    - the original question
    - the resume
    - the target role

11. Do not generate random unrelated questions.

12. Follow-ups should progressively test the
    candidate's understanding.

13. Mix follow-up types where appropriate:
    - Technical
    - Project
    - Fundamentals
    - Behavioral
    - Experience

14. Difficulty must be one of:
    - Easy
    - Medium
    - Hard

15. Each follow-up must contain:
    - question
    - hook
    - category
    - branchType
    - difficulty
    - idealAnswerOutline

16. Do not invent resume facts.

17. Return JSON only.

18. Do not include markdown.

19. Do not include explanations outside JSON.
`;

    // ============================================
    // GEMINI REQUEST
    // ============================================

    async function callGemini(
      model: string
    ) {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
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
              responseMimeType:
                "application/json",
            },
          }),
        }
      );
    }

    let geminiResponse =
      await callGemini(GEMINI_MODEL);

    if (geminiResponse.status === 503) {
      console.warn(
        `${GEMINI_MODEL} unavailable. Trying ${FALLBACK_MODEL}.`
      );

      geminiResponse =
        await callGemini(
          FALLBACK_MODEL
        );
    }

    // ============================================
    // GEMINI ERROR
    // ============================================

    if (!geminiResponse.ok) {
      const errorText =
        await geminiResponse.text();

      console.error(
        "Gemini API error:",
        errorText
      );

      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Gemini API request failed",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // ============================================
    // PARSE RESPONSE
    // ============================================

    const geminiData =
      await geminiResponse.json();

    const generatedText =
      geminiData?.candidates?.[0]
        ?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error(
        "Empty Gemini response:",
        JSON.stringify(geminiData)
      );

      throw new Error(
        "Gemini returned an empty response"
      );
    }

    let result;

    try {
      result =
        JSON.parse(generatedText);
    } catch (error) {
      console.error(
        "Invalid JSON from Gemini:",
        generatedText
      );

      throw new Error(
        "Gemini returned invalid JSON"
      );
    }

    // ============================================
    // BASIC RESPONSE VALIDATION
    // ============================================

    if (
      !result.evaluation ||
      !Array.isArray(
        result.followUps
      )
    ) {
      throw new Error(
        "Gemini returned an invalid evaluation structure"
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "evaluate-and-expand error:",
      error
    );

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
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});