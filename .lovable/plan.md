## Why the audio is broken

Server logs show every TTS call returns:

```
ElevenLabs TTS failed: 401 {"status":"invalid_api_key","message":"Invalid API key"}
```

`ELEVENLABS_API_KEY` is present (synced from the ElevenLabs connector) but ElevenLabs is rejecting it. That's why nothing ever plays — the `speak()` promise resolves with no audio after the fetch throws.

The client side (`useVoiceAssistant`) is fine; the request itself never returns valid MP3 bytes.

## Can it speak Chinese?

Yes. The current model `eleven_turbo_v2_5` is multilingual and handles Mandarin. The fixed voice `JAATlCsz6GCH2vUjFcLg` will pronounce Chinese text once the key works. We can optionally pass the active UI language to the server fn so the model has an explicit language hint (slightly better pronunciation on short strings).

## Plan

1. **Fix the credential** — the connector-synced key is invalid. Two options:
   - Reconnect the ElevenLabs connector with a working API key (recommended, keeps it managed).
   - Or replace it with a manual `ELEVENLABS_API_KEY` secret.
   I'll trigger the reconnect flow once you confirm.

2. **Verify** by hitting `/api/public/tts-test` again — expect HTTP 200 with `audio/mpeg` instead of 500.

3. **Improve Chinese support** in `src/lib/tts.functions.ts`:
   - Accept an optional `language: 'en' | 'zh'` input.
   - Keep `eleven_turbo_v2_5` (multilingual) and pass `language_code: 'zh'` when Chinese.
   - In `useVoiceAssistant.speak`, forward the current `language` from `useLanguage()`.

4. No UI/layout changes; assistant button behavior stays the same.

## Question for you

Do you want me to (a) reconnect the ElevenLabs connector, or (b) set a manual `ELEVENLABS_API_KEY` you'll paste?