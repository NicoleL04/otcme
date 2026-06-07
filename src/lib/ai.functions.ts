import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Google's OpenAI-compatible endpoint — accepts the same messages shape (incl. image_url parts)
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-2.5-pro";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

async function callGateway(messages: ChatMessage[], jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429)
      throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 401 || res.status === 403)
      throw new Error("Gemini API key invalid or lacks access. Check GEMINI_API_KEY.");
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T {
  // Strip code fences if present
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
  // Extract first {...} block as a fallback
  const match = cleaned.match(/\{[\s\S]*\}$/) || cleaned.match(/\{[\s\S]*\}/);
  const text = match ? match[0] : cleaned;
  return JSON.parse(text) as T;
}

/** Workflow 1, Step 2 — Clarifying questions */
export const getClarifyingQuestions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profile: z.string(),
      symptom: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const content = await callGateway([
      {
        role: "system",
        content: `You are an expert clinical pharmacist assistant. The user has described a symptom. Ask 1 to 2 short, focused clarifying questions (duration, severity, location, accompanying symptoms, etc.) that will help recommend the safest OTC medication. Respond with ONLY the questions, plainly written, no preamble. Patient profile:\n${data.profile}`,
      },
      { role: "user", content: data.symptom },
    ]);
    return { questions: content as string };
  });

const recommendationSchema = z.object({
  categories: z.array(
    z.object({
      category_name: z.string(),
      status: z.enum(["green", "yellow", "grey"]),
      reason: z.string(),
      dosage_guidance: z.string(),
      examples: z.array(z.string()),
    }),
  ),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

/** Workflow 1, Step 3 — Recommendation */
export const getRecommendation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profile: z.string(),
      symptom: z.string(),
      clarification: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<Recommendation> => {
    const content = await callGateway(
      [
        {
          role: "system",
          content: `You are an expert clinical pharmacist assistant. Based on the patient's profile, recommend OTC medication categories for the symptom. Output ONLY valid JSON in this exact structure:
{
  "categories": [
    {
      "category_name": "string",
      "status": "green" | "yellow" | "grey",
      "reason": "string — explain why this status applies to this specific patient",
      "dosage_guidance": "string",
      "examples": ["brand or generic name 1", "brand or generic name 2"]
    }
  ]
}
Rules:
- green = generally safe for this patient
- yellow = use with caution, patient should consult pharmacist
- grey = not advised due to a specific contraindication in this patient's profile
- Only include actual OTC medical drugs. No supplements, vitamins, or homeopathy.
- Base all reasoning on established pharmacological knowledge.

Patient profile:
${data.profile}`,
        },
        {
          role: "user",
          content: `Symptom: ${data.symptom}\nClarification: ${data.clarification}`,
        },
      ],
      true,
    );
    return recommendationSchema.parse(parseJson(content));
  });

const safetySchema = z.object({
  safety_status: z.enum(["Yes", "Caution", "No"]),
  explanation: z.string(),
});
export type SafetyResult = z.infer<typeof safetySchema>;

/** Workflow 2 — Safety check */
export const checkMedicationSafety = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profile: z.string(),
      medication_name: z.string().min(1),
    }),
  )
  .handler(async ({ data }): Promise<SafetyResult> => {
    const content = await callGateway(
      [
        {
          role: "system",
          content: `You are an expert clinical pharmacist assistant. Evaluate whether the medication is safe for the patient based on their profile.

Output ONLY valid JSON in this exact structure:
{
  "safety_status": "Yes" | "Caution" | "No",
  "explanation": "string — detailed explanation referencing the patient's specific conditions and the medication's properties."
}

Base all reasoning on established pharmacological knowledge. Only assess medications that are available over-the-counter (OTC).

Patient profile:
${data.profile}`,
        },
        { role: "user", content: `Medication: ${data.medication_name}` },
      ],
      true,
    );
    return safetySchema.parse(parseJson(content));
  });

/** Extract medication name from an image (data URL) */
export const extractMedicationFromImage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ image_data_url: z.string().min(20) }))
  .handler(async ({ data }) => {
    const content = await callGateway([
      {
        role: "system",
        content:
          "You read OTC medication labels/boxes. Return ONLY the medication's primary brand or generic name as plain text — no extra words. If unreadable, return 'UNKNOWN'.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "What is the name of this medication?" },
          { type: "image_url", image_url: { url: data.image_data_url } },
        ],
      },
    ]);
    return { medication_name: (content as string).trim() };
  });
