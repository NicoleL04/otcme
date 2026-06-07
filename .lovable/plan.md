## Plan

1. **Add a voice-flow cancellation flag in the symptom page**
   - Track whether the current voice conversation has been cancelled.
   - When the user clicks **Stop voice**, mark the conversation as cancelled before stopping listening/speaking.

2. **Guard every voice step against cancellation**
   - Update the voice flow helpers so after each `speak()` or `listen()` completes, they check whether the flow was stopped.
   - If stopped, they return immediately instead of continuing to the next question, starting another ElevenLabs request, or playing the next response.

3. **Make the hook’s stop behavior more forceful**
   - In `useVoiceAssistant`, clear audio event handlers, pause the current audio, remove its source, and call `load()` so browser playback is released immediately.
   - Ensure any pending `speak()` promise resolves when stopped, not only when the audio naturally ends.

4. **Keep the button as a true start/stop toggle**
   - **Start voice** begins one conversation.
   - **Stop voice** immediately stops ElevenLabs audio, stops speech recognition, hides the active voice state, and prevents any queued voice prompts from starting afterward.

5. **Verify the behavior**
   - Use the symptom page voice flow in preview.
   - Confirm clicking **Stop voice** during ElevenLabs speech stops audio immediately and does not restart with the next prompt.