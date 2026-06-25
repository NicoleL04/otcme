# Add Chinese language support

Add a language switcher (English / 简体中文) so users can use the app in natural Chinese, including medical terms.

## 1. Language infrastructure

- Add a lightweight i18n layer (no extra deps needed — small custom context is enough):
  - `src/lib/i18n.tsx`: `LanguageProvider`, `useT()` hook, `useLanguage()` hook.
  - Language persisted in `localStorage` under `otcandme_lang` (`"en"` | `"zh"`).
  - Default: detect from `navigator.language` (zh* → `zh`, else `en`).
- Wrap the app in `<LanguageProvider>` inside `src/routes/__root.tsx`.
- Update `<html lang>` dynamically based on selected language.

## 2. Language switcher UI

- Add a compact EN / 中 toggle in `src/components/TopNav.tsx` (right side, next to existing controls).
- Also expose it on `src/routes/onboarding.tsx` (top-right) so first-time users can switch before there's a TopNav.

## 3. Translations

Create `src/lib/translations.ts` with `en` and `zh` dictionaries covering all user-visible strings on:

- `index.tsx` (dashboard / landing)
- `onboarding.tsx` (profile form: name, age, conditions list, allergies, prescriptions, "other")
- `symptom.tsx` (input, voice prompts, clarification, loading states)
- `recommendations.tsx` (category cards, status labels Safe/Caution/Not Recommended → 安全 / 注意 / 不推荐, reasons heading, actions)
- `safety.tsx` (drug-interaction check page)
- `summary.tsx` (pharmacist summary card, all section headings, footer disclaimer, print button, the pharmacist question template)
- `settings.tsx`, `wishlist.tsx`, `history.$id.tsx`
- `TopNav`, `NearbyPharmaciesDialog`
- Common: buttons, error messages, status badges, voice assistant button labels

Medical/condition lists (diabetes, hypertension, asthma, pregnancy, kidney disease, liver disease, heart disease, etc.) get natural Chinese terms (糖尿病, 高血压, 哮喘, 怀孕, 肾病, 肝病, 心脏病 …), not literal/machine translation.

## 4. AI-generated content (recommendations, clarifications, safety analysis)

The AI responses themselves must also come back in Chinese when `zh` is selected.

- Extend `src/lib/ai.functions.ts` server functions (`recommendCategories`, `clarifySymptom`, `checkSafety`, any others) to accept a `language: "en" | "zh"` input field.
- Inject a language instruction into the system prompt: e.g. "Respond entirely in Simplified Chinese using natural, patient-friendly medical terms. Category names and reasons must be in Chinese."
- Callers in `symptom.tsx` / `safety.tsx` pass the current language from `useLanguage()`.
- Recommendation category `status` stays as the enum (`green`/`yellow`/`red`); UI maps it to localized labels.

## 5. Voice assistant (TTS)

- `useVoiceAssistant.speak()` already takes plain text; pass already-translated strings from each page (the auto-spoken line in `recommendations.tsx` uses category names from the AI response, which will now be Chinese when `zh` is selected).
- `src/lib/tts.functions.ts`: ElevenLabs `eleven_turbo_v2_5` already supports Chinese with the current voice — no model change needed. If Chinese pronunciation is poor at QA time, switch to `eleven_multilingual_v2` (single-line change in `tts.functions.ts`).
- Speech recognition (`useVoiceAssistant.listen()`): set `rec.lang` from the current language (`"zh-CN"` for `zh`, `"en-US"` for `en`) so voice input is transcribed correctly.

## 6. SEO / meta

- Per-route `head()` titles and descriptions are currently English-only. Keep English defaults (better for indexing) but update `<html lang>` at runtime for accessibility. No separate `/zh` route tree — language is a client preference.

## Out of scope

- No separate URL prefix (`/zh/...`) or server-side locale routing.
- No translation of the legal disclaimer's legal meaning — Chinese version will be a faithful translation reviewed for clarity.
- No third-party i18n library (i18next, react-intl) — custom context keeps bundle small; can migrate later if more languages are added.
