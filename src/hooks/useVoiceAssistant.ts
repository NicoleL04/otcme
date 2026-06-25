import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/tts.functions";
import { useLanguage } from "@/lib/i18n";

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
  const { language } = useLanguage();
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cancellation generation — bumped by stopSpeaking/stopListening/cancelAll
  // so any in-flight speak/listen resolves immediately.
  const genRef = useRef(0);
  const cancelledRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");

  const hardStopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try {
        a.onplay = null;
        a.onended = null;
        a.onerror = null;
        a.pause();
        a.removeAttribute("src");
        a.src = "";
        try {
          a.load();
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
      hardStopAudio();
    };
  }, [hardStopAudio]);

  const stopSpeaking = useCallback(() => {
    genRef.current += 1;
    cancelledRef.current = true;
    hardStopAudio();
    setSpeaking(false);
  }, [hardStopAudio]);

  const stopListening = useCallback(() => {
    genRef.current += 1;
    cancelledRef.current = true;
    try {
      recRef.current?.abort();
    } catch {
      // ignore
    }
    recRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const cancelAll = useCallback(() => {
    genRef.current += 1;
    cancelledRef.current = true;
    try {
      recRef.current?.abort();
    } catch {
      // ignore
    }
    recRef.current = null;
    hardStopAudio();
    setListening(false);
    setSpeaking(false);
    setInterim("");
  }, [hardStopAudio]);

  const resetCancel = useCallback(() => {
    cancelledRef.current = false;
  }, []);

  const isCancelled = useCallback(() => cancelledRef.current, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (typeof window === "undefined" || !text.trim()) return;
    if (cancelledRef.current) return;
    const gen = genRef.current;

    hardStopAudio();

    let audioBase64: string;
    try {
      const res = await synthesizeSpeech({ data: { text } });
      audioBase64 = res.audioBase64;
    } catch (err) {
      console.error("TTS request failed", err);
      setSpeaking(false);
      return;
    }

    if (gen !== genRef.current || cancelledRef.current) {
      setSpeaking(false);
      return;
    }

    return new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
      audioRef.current = audio;
      let done = false;
      let interval: number | null = null;

      const finish = () => {
        if (done) return;
        done = true;
        if (interval !== null) {
          window.clearInterval(interval);
          interval = null;
        }
        try {
          audio.onplay = null;
          audio.onended = null;
          audio.onerror = null;
        } catch {
          // ignore
        }
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
        setSpeaking(false);
        resolve();
      };

      audio.onplay = () => {
        if (gen !== genRef.current || cancelledRef.current) {
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

      interval = window.setInterval(() => {
        if (gen !== genRef.current || cancelledRef.current || audio.paused) {
          try {
            audio.pause();
          } catch {
            // ignore
          }
          finish();
        }
      }, 100);

      audio.play().catch(() => finish());
    });
  }, [hardStopAudio]);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (cancelledRef.current) {
        resolve("");
        return;
      }
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
      rec.lang = language === "zh" ? "zh-CN" : "en-US";
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
        if (gen !== genRef.current || cancelledRef.current) {
          resolve("");
          return;
        }
        reject(new Error(e.error || "Speech recognition error"));
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        if (gen !== genRef.current || cancelledRef.current) {
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
  }, [language]);

  return {
    speak,
    stopSpeaking,
    listen,
    stopListening,
    cancelAll,
    resetCancel,
    isCancelled,
    listening,
    speaking,
    interim,
  };
}
