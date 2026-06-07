import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const VOICE_ID = "JAATlCsz6GCH2vUjFcLg";

export const synthesizeSpeech = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string().min(1).max(5000) }))
  .handler(async ({ data }): Promise<{ audioBase64: string }> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
          model_id: "eleven_turbo_v2_5",
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs TTS failed: ${res.status} ${err}`);
    }

    const buf = await res.arrayBuffer();
    const audioBase64 = Buffer.from(buf).toString("base64");
    return { audioBase64 };
  });
