## Goal

Swap the browser's built-in `speechSynthesis` for ElevenLabs TTS using voice ID `JAATlCsz6GCH2vUjFcLg`, so the symptom voice assistant speaks with the chosen ElevenLabs voice. Keep speech recognition (mic input) on the existing Web Speech API.

## Steps

1. **Link ElevenLabs connector** ("Nicole's ElevenLabs") to the project so `ELEVENLABS_API_KEY` is available in server runtime.

2. **Create server function** `src/lib/tts.functions.ts`:
   - `synthesizeSpeech({ text })` using `createServerFn`.
   - Calls `https://api.elevenlabs.io/v1/text-to-speech/JAATlCsz6GCH2vUjFcLg?output_format=mp3_44100_128` with `xi-api-key` header and `model_id: "eleven_turbo_v2_5"` for low latency.
   - Returns `{ audioBase64: string }` (base64 MP3).

3. **Update `src/hooks/useVoiceAssistant.ts`**:
   - Replace `speak()` implementation: call the server fn, then play the audio via a data URI (`data:audio/mpeg;base64,...`) using an `HTMLAudioElement`.
   - Track the current `Audio` instance in a ref so `stopSpeaking()` can pause and reset it.
   - Keep `setSpeaking(true/false)` around playback (`onplay` / `onended` / `onerror`).
   - Remove `window.speechSynthesis` usage; keep `SpeechRecognition` (listen) untouched.
   - Keep the same public API (`speak`, `stopSpeaking`, `listen`, `stopListening`, `speaking`, `listening`, `interim`) so `src/routes/symptom.tsx` needs no changes.
   - Update `isVoiceSupported()` to only require `SpeechRecognition` (mic) since TTS now runs server-side and is always available.

4. **Verify** dev server compiles and the voice flow on `/symptom` plays ElevenLabs audio.

## Technical notes

- Voice ID is hardcoded server-side, per request.
- Base64 + data URI avoids binary streaming complexity over the serverFn RPC boundary (server fns return plain DTOs).
- Server uses `Buffer.from(arrayBuffer).toString("base64")` — no `btoa()` spread.
- If `ELEVENLABS_API_KEY` is missing, server fn throws a clear error; the UI surfaces it via the existing `toast.error` in `runVoiceFlow`'s catch.
