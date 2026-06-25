import { createFileRoute } from "@tanstack/react-router";
import { synthesizeSpeech } from "@/lib/tts.functions";

export const Route = createFileRoute("/api/public/tts-test")({
  server: {
    handlers: {
      GET: async () => {
        const { audioBase64 } = await synthesizeSpeech({
          data: { text: "Hello, this is a quick test of the ElevenLabs connection." },
        });
        const bytes = Buffer.from(audioBase64, "base64");
        return new Response(bytes, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(bytes.length),
          },
        });
      },
    },
  },
});
