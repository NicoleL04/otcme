# Sync voice with recommendations screen

Right now the voice assistant says "Your top option is …" while the user is still on `/symptom`, then navigates. The user wants the assistant to stay silent until `/recommendations` is fully rendered, and then speak only the **names** of the recommended categories (no descriptions/reasons).

## Changes

### 1. `src/routes/symptom.tsx` — stop speaking on this page
In `runVoiceFlow`, after the recommendation is fetched and stored in `sessionStorage`:
- Remove the current `await say("Your top option is …")` block.
- Still store a flag in `sessionStorage` (e.g. `otcandme_voice_active = "1"`) so the next page knows to continue the voice conversation.
- Call `navigate({ to: "/recommendations" })` immediately.
- Do NOT call `voice.cancelAll()` (so TTS can resume on the next page); just let `setVoiceActive(false)` run in `finally`.

### 2. `src/routes/recommendations.tsx` — speak after render
- Read `otcandme_voice_active` from `sessionStorage` on mount. If present, clear it and trigger a one-shot TTS announcement.
- Use a `useEffect` that runs **after** the recommendation data has been loaded into state AND the category cards have mounted (depend on `recommendation` state being set; React guarantees DOM is committed before effect runs, which satisfies "fully loaded on screen").
- Build the spoken line from category names only:
  - 1 category: `"Here are your recommendations. The top option is {name}."`
  - 2+ categories: `"Here are your recommendations. The top option is {name1}, followed by {name2}{, and {name3}}."`
- Use the existing `useVoiceAssistant` hook's `speak(text)` method (same one used in `symptom.tsx`) so behavior is consistent. Guard with a `useRef` so it only fires once per page visit.
- Add a cleanup that calls `voice.cancelAll()` on unmount so navigating away stops speech mid-sentence.

## Technical details
- No changes to `useVoiceAssistant`, server functions, or recommendation data shape.
- `sessionStorage` key `otcandme_voice_active` is the handoff signal — set in `symptom.tsx`, consumed and deleted in `recommendations.tsx`.
- Effect dependency: `[recommendation]` (the state that holds the loaded `Recommendation` object). Because effects run after commit, the cards are on screen before `speak()` is called.
- Only category **names** are spoken; `reason`, status labels, and product details are intentionally omitted.

## Out of scope
- No visual/UI changes to either page.
- No changes to the text-chat (non-voice) flow — it already just navigates silently.
