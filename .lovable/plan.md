## Plan

The current symptom flow always asks the same long list of questions (duration, severity, other symptoms, tried, alcohol-24h, smoking-24h, drugs-24h, plus several profile gap-fills). It ignores what's already on file and the wording is long.

### 1. Add an AI-generated probe step (`src/lib/ai.functions.ts`)
- New server function `getSymptomProbes({ profile, symptom })` that returns `{ probes: { key, q }[] }`.
- System prompt rules:
  - Read the patient profile and the symptom.
  - Generate **3-5** short questions, each **one short sentence, ≤12 words**.
  - Skip anything already known in the profile (allergies, conditions, prescriptions, smoking, alcohol). Do NOT ask the user to repeat those.
  - Always include at least one time-sensitive probe (e.g. "Taken anything for it in the last 24h?") since that's not in the profile.
  - Vary phrasing per call so repeated visits don't feel scripted.
  - Return strict JSON `{ "probes": [{ "key": "snake_case", "q": "..." }] }`.

### 2. Use the dynamic probes in both flows (`src/routes/symptom.tsx`)
- Replace `buildProbes(profile)` and the inline voice probe list with a single call to `getSymptomProbes`.
- Text flow: after the user submits the symptom, fetch probes, then run the existing one-at-a-time chat loop with those probes (no `handle` callbacks needed — just store the answer under the returned key).
- Voice flow: after the greeting captures the symptom, fetch probes, then ask each one via `askOneShown`.
- Loading state: show "Thinking of a few quick questions…" while probes are fetched.
- Fallback: if the call fails, fall back to a minimal hardcoded set of 2 questions (duration, anything tried in last 24h).

### 3. Keep profile gap-fills minimal and only when truly missing
- Drop the bulk of `_profile_*` probes from the static list. The AI prompt already knows the profile and will ask for missing critical info itself if relevant to the symptom.
- Continue saving any new info the model collects back to the profile via the existing `updateProfile` path (apply patches when answers map to a `_profile_*` key returned by the model).

### 4. Verify
- Trigger the symptom flow in preview with a profile that already lists allergies + a chronic condition → confirm those aren't re-asked, questions are short, and only 3-5 are asked.
- Run it a second time with the same symptom → confirm wording varies.