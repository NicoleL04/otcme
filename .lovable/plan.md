
## Goal

1. Use the **same ElevenLabs voice** for English and Chinese, and make it actually sound multilingual.
2. Stop the **Chinese mic** from cutting off mid-sentence.
3. Stop the **Chinese TTS audio** from being clipped / stopping early.

## Why it's happening

- `src/lib/tts.functions.ts` uses `model_id: "eleven_turbo_v2_5"`. Turbo handles Chinese, but quality/consistency on a single English-trained voice is shaky — switching to the multilingual model gives the same voice ID a consistent multilingual delivery and avoids the random truncations we're seeing on long ZH strings.
- `src/hooks/useVoiceAssistant.ts` `listen()` uses `continuous: false`. With `zh-CN`, Web Speech fires `onend` on the first natural pause, so a sentence with a comma-pause ends the turn. We never accumulate across that — whatever was captured so far is returned, often empty/partial.
- The same hook's `speak()` polls every 100 ms and calls `finish()` whenever `audio.paused` is true. During MP3 buffering on slower ZH responses the audio element briefly reports `paused`, which trips the watchdog and tears the audio down → "TTS cuts off". The paused-check is redundant with the cancel flag.

## Changes

### 1. `src/lib/tts.functions.ts` — same voice, multilingual model
- Keep `VOICE_ID` unchanged (single voice for both languages).
- Change `model_id` to `"eleven_multilingual_v2"` (best ZH+EN consistency on a single voice; `language_code` already forwarded).

### 2. `src/hooks/useVoiceAssistant.ts` — robust ZH listening
Rework `listen()` so a pause in Chinese speech doesn't end the turn:
- Set `continuous = true`.
- Keep an internal `finalText` buffer and a **silence timer** (~1500 ms after the last result event). Only when the silence timer fires do we `rec.stop()` and resolve with the accumulated final text.
- Reset the silence timer on every `onresult` (interim or final).
- Add a hard cap (~15 s) so a stuck mic still resolves.
- Keep the existing cancel/gen guards; `stopListening` clears the timer and aborts.

### 3. `src/hooks/useVoiceAssistant.ts` — don't clip TTS
In `speak()`:
- Remove the `audio.paused` branch from the 100 ms watchdog; the watchdog should only fire on `cancelledRef`/`gen` change.
- Keep `onended`/`onerror` as the natural completion paths.
- (No change to ordering of events, no API change.)

## Out of scope
- No UI changes, no new dependencies, no provider switch.
- Not touching the recommendation/clarify flows.

## Verification
- Run preview, switch to 中文, start voice flow, speak a longer sentence with a mid-sentence pause → mic should keep listening until ~1.5 s of silence; transcript captured in full.
- Long ZH assistant reply (e.g. recommendation summary) should play to completion without truncation.
- EN flow regression check: greeting + probes still work; voice sounds the same as before (same voice ID).
