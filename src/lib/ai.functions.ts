import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const languageSchema = z.enum(["en", "zh"]).optional();

function langInstruction(language?: "en" | "zh"): string {
  if (language === "zh") {
    return "\n\nIMPORTANT: Respond entirely in Simplified Chinese (简体中文). Use natural, patient-friendly Chinese medical terms (e.g. 布洛芬, 对乙酰氨基酚, 高血压, 糖尿病). All field values in JSON output — including category_name, reason, dosage_guidance, examples, explanation, and any text — must be in Chinese. Do not include English translations.";
  }
  return "";
}

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
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits required. Please add credits in your workspace.");
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
      language: languageSchema,
    }),
  )
  .handler(async ({ data }) => {
    const content = await callGateway([
      {
        role: "system",
        content: `You are an expert clinical pharmacist assistant. The user has described a symptom. Ask 1 to 2 short, focused clarifying questions that will help recommend the safest OTC medication. Keep each question to a single sentence and easy to answer.

At least ONE of the questions MUST be a temporal/recency probe that the static profile would not capture — pick whichever is most relevant to the symptom (e.g. any medicine already taken today/in the last 24-72h, recent procedure or vaccination, recent alcohol use, new supplement, recent antibiotics, pregnancy/breastfeeding).

Respond with ONLY the questions, plainly written, no preamble. Patient profile:
${data.profile}${langInstruction(data.language)}`,
      },
      { role: "user", content: data.symptom },
    ]);
    return { questions: content as string };
  });

const probesSchema = z.object({
  probes: z
    .array(
      z.object({
        key: z.string().min(1),
        q: z.string().min(1),
      }),
    )
    .min(1)
    .max(5),
});

/** Generate short, profile-aware probe questions for the symptom flow. */
export const getSymptomProbes = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      profile: z.string(),
      symptom: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const content = await callGateway(
      [
        {
          role: "system",
          content: `You are a clinical pharmacist assistant gathering quick context before recommending an OTC medication.

Generate 3 to 5 SHORT follow-up questions about the symptom. Rules:
- Each question is ONE sentence, ideally 6-12 words, plain conversational English.
- DO NOT ask about anything already documented in the patient profile below (allergies, chronic conditions, prescription meds, smoking, alcohol, drug use, age, gender, weight). If a field shows a value other than "None", "Not reported", or empty, treat it as known.
- ALWAYS include at least one time-sensitive question that the static profile cannot capture (e.g. duration, severity right now, anything already taken in the last 24 hours, recent fever, pregnancy/breastfeeding if relevant).
- Tailor remaining questions to the specific symptom — do not use a fixed template.
- Vary phrasing across calls; do not always start the same way.
- Use snake_case keys that describe the question (e.g. "duration", "severity_now", "taken_last_24h").

Output ONLY valid JSON:
{ "probes": [ { "key": "snake_case_key", "q": "Short question?" } ] }

Patient profile:
${data.profile}`,
        },
        { role: "user", content: `Symptom: ${data.symptom}` },
      ],
      true,
    );
    return probesSchema.parse(parseJson(content));
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
          content: `You are an expert clinical pharmacist assistant. Based on the patient's profile, recommend OTC medication categories for the symptom.

CRITICAL — GROUP BY ACTIVE PHARMACEUTICAL INGREDIENT:
- Each "category" must represent ONE active ingredient (or a fixed-dose combination), NOT a therapeutic class and NOT a brand.
- "category_name" must be the active ingredient(s), e.g. "Ibuprofen", "Acetaminophen (Paracetamol)", "Loratadine", "Pseudoephedrine + Acetaminophen".
- "examples" must list both common brand names AND generics that contain THAT SAME active ingredient (e.g. Ibuprofen → "Advil, Motrin, generic ibuprofen"). Never mix different active ingredients in one category.
- The safety "status" applies to the active ingredient as a whole — brand vs generic does not change it.

Output ONLY valid JSON in this exact structure:
{
  "categories": [
    {
      "category_name": "Active ingredient name",
      "status": "green" | "yellow" | "grey",
      "reason": "string — explain why this status applies to this specific patient, referencing their conditions/meds/allergies",
      "dosage_guidance": "string",
      "examples": ["Brand name", "Other brand", "generic <ingredient>"]
    }
  ]
}
Rules:
- green = generally safe for this patient
- yellow = use with caution, patient should consult pharmacist
- grey = not advised due to a specific contraindication in this patient's profile
- Only include actual OTC drugs. No supplements, vitamins, or homeopathy.
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

const productListSchema = z.object({
  active_ingredient: z.string(),
  products: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["brand", "generic", "store-brand"]),
      form: z.string(),
      strength: z.string(),
      typical_pack: z.string(),
      reference_price_usd: z.string(),
    }),
  ),
  price_note: z.string(),
});
export type ProductList = z.infer<typeof productListSchema>;

/** Learn more — list products (brand + generic) for an active ingredient with reference prices */
export const getProductDetails = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      active_ingredient: z.string().min(1),
      examples: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }): Promise<ProductList> => {
    const content = await callGateway(
      [
        {
          role: "system",
          content: `You are a pharmacy product database assistant. Given an OTC active pharmaceutical ingredient, list the common products available in the United States that contain THAT SAME active ingredient.

Include both BRAND-name and GENERIC / store-brand options when they exist. Each product must contain the same active ingredient (do NOT include products with different active ingredients, even if they treat the same symptom).

For each product provide an APPROXIMATE reference retail price in USD for a typical retail pack size (e.g. "$8-$12 for 100 tablets"). Prices are rough public-retail estimates, NOT promises — explicitly note this in "price_note".

Output ONLY valid JSON:
{
  "active_ingredient": "string",
  "products": [
    {
      "name": "string — exact product name as sold (e.g. 'Advil Liqui-Gels')",
      "type": "brand" | "generic" | "store-brand",
      "form": "string — tablet / liquid / gel / cream / etc.",
      "strength": "string — e.g. '200 mg'",
      "typical_pack": "string — e.g. '100 ct'",
      "reference_price_usd": "string — e.g. '$8-$12'"
    }
  ],
  "price_note": "string — short disclaimer that prices are estimates and vary by retailer/region"
}

Aim for 4-8 products covering the major brand(s) and 1-3 generic / store-brand options.`,
        },
        {
          role: "user",
          content: `Active ingredient: ${data.active_ingredient}${
            data.examples?.length ? `\nKnown examples: ${data.examples.join(", ")}` : ""
          }`,
        },
      ],
      true,
    );
    return productListSchema.parse(parseJson(content));
  });
