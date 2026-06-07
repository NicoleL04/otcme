import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/tts.functions";

// Minimal types for Web Speech API (not in lib.dom for all TS targets)
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};
type SpeechRecognitionErrorEvent = { error: string };
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceSupported() {
  return typeof window !== "undefined" && !!getRecognitionCtor();
}

export function useVoiceAssistant() {
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cancellation generation — bumped by stopSpeaking/stopListening so that
  // any in-flight speak() (waiting on fetch) or listen() that started before
  // the stop will resolve immediately instead of playing/recording further.
  const genRef = useRef(0);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }
        audioRef.current = null;
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    genRef.current += 1;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (typeof window === "undefined" || !text.trim()) return;
    const gen = genRef.current;

    // Stop any currently playing audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // ignore
      }
      audioRef.current = null;
    }

    let audioBase64: string;
    try {
      const res = await synthesizeSpeech({ data: { text } });
      audioBase64 = res.audioBase64;
    } catch (err) {
      console.error("TTS request failed", err);
      setSpeaking(false);
      return;
    }

    // Bail out if a stop happened while we were waiting on the fetch
    if (gen !== genRef.current) {
      setSpeaking(false);
      return;
    }

    return new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      const finish = () => {
        setSpeaking(false);
        if (audioRef.current === audio) audioRef.current = null;
        resolve();
      };
      audio.onplay = () => {
        // If stop happened between fetch and play, halt immediately
        if (gen !== genRef.current) {
          try {
            audio.pause();
          } catch {
            // ignore
          }
          finish();
          return;
        }
        setSpeaking(true);
      };
      audio.onended = finish;
      audio.onerror = finish;
      // Poll for cancellation while playing so a mid-playback stop resolves
      // the awaited promise (pause() alone never fires onended).
      const interval = window.setInterval(() => {
        if (gen !== genRef.current || audio.paused) {
          window.clearInterval(interval);
          finish();
        }
      }, 150);
      const origFinish = finish;
      // Wrap finish to also clear the interval
      const cleanup = () => window.clearInterval(interval);
      audio.addEventListener("ended", cleanup, { once: true });
      audio.addEventListener("error", cleanup, { once: true });
      audio.play().catch(() => {
        cleanup();
        origFinish();
      });
    });
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        reject(new Error("Speech recognition not supported in this browser"));
        return;
      }
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
      const gen = genRef.current;
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = false;
      let finalText = "";

      rec.onresult = (e) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interimText += r[0].transcript;
        }
        setInterim(interimText);
      };
      rec.onerror = (e) => {
        setListening(false);
        setInterim("");
        reject(new Error(e.error || "Speech recognition error"));
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        if (gen !== genRef.current) {
          resolve("");
        } else {
          resolve(finalText.trim());
        }
      };

      recRef.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch (err) {
        setListening(false);
        reject(err as Error);
      }
    });
  }, []);

  const stopListening = useCallback(() => {
    genRef.current += 1;
    try {
      recRef.current?.abort();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  return { speak, stopSpeaking, listen, stopListening, listening, speaking, interim };
}
