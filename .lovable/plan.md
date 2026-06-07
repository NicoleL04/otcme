## Plan

Contain the symptom-page conversation (voice + text) in a fixed-height, internally scrollable chat window so the page itself doesn't scroll.

### Changes to `src/routes/symptom.tsx`

1. **Wrap the chat transcript + composer in a single bounded container**
   - Replace the current `mt-6 space-y-3` block (which renders the chat messages, the textarea answer card, and the loader cards) with a column layout that has a fixed height, e.g. `h-[70vh]` on desktop and `h-[calc(100vh-220px)]` on mobile, plus a card border so it reads as a panel.

2. **Make the messages area the only scroll surface**
   - Inner structure:
     - `<div class="flex flex-col ...">` (outer, fixed height)
       - `<div class="flex-1 overflow-y-auto p-4 space-y-3">` → all chat bubbles + inline loader cards live here
       - `<div class="border-t p-3">` → the answer textarea + Send button (sticks to the bottom of the panel, not the page)

3. **Auto-scroll to the newest message inside the panel**
   - Add a `messagesEndRef` (`useRef<HTMLDivElement>`) at the bottom of the scroll area and, in a `useEffect` keyed on `chat.length`, `stage`, and `voice.interim`, call `scrollIntoView({ behavior: "smooth", block: "end" })` so new assistant/user messages and the live transcription stay visible without moving the page.

4. **Keep the voice status bar and Stop button inside the panel header**
   - Move the `voiceActive` status strip (with `VoiceStatus` + Stop button) to be the panel's sticky header so the Stop control is always visible while the user scrolls past messages.

5. **Leave the input/landing card unchanged**
   - The bounded chat panel only appears once `stage !== "input"` or `voiceActive` is true. The initial symptom textarea + "Start voice" CTA stays as-is.

6. **Verify in preview**
   - Run a text symptom flow with several Q&A turns → confirm the page header stays fixed and only the inner panel scrolls.
   - Run a voice flow → confirm chat messages and the Stop button are always reachable without scrolling the page.
   - Check mobile viewport (≤480px) → panel still fits without clipping the composer.