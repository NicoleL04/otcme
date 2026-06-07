import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types for Web Speech API
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
  return (
    typeof window !== "undefined" &&
    !!getRecognitionCtor() &&
    "speechSynthesis" in window
  );
}

// Pick the most natural-sounding English voice available
function pickFriendlyVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Preferred natural/neural voices across major browsers/OS
  const preferred = [
    "Google US English",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Microsoft Ava Online (Natural) - English (United States)",
    "Samantha",
    "Ava (Premium)",
    "Ava (Enhanced)",
    "Allison",
    "Karen",
    "Moira",
    "Serena",
  ];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) return v;
  }
  // Fallback: any en-US voice marked as natural/premium/enhanced
  const natural = voices.find(
    (v) =>
      /en[-_]US/i.test(v.lang) &&
      /(natural|premium|enhanced|neural)/i.test(v.name),
  );
  if (natural) return natural;
  // Final fallback: first en-US voice
  return voices.find((v) => /en[-_]US/i.test(v.lang)) || voices[0] || null;
}

export function useVoiceAssistant() {
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0); // 0..1 mic volume

  // Warm up voices list
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", handler);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
    };
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    setLevel(0);
  }, []);

  const startMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 2.5));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // mic blocked; meter just stays at 0
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      stopMeter();
    };
  }, [stopMeter]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickFriendlyVoice();
      if (v) u.voice = v;
      u.rate = 1.02;
      u.pitch = 1.05;
      u.lang = "en-US";
      u.onstart = () => setSpeaking(true);
      u.onend = () => {
        setSpeaking(false);
        resolve();
      };
      u.onerror = () => {
        setSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(u);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
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
        stopMeter();
        reject(new Error(e.error || "Speech recognition error"));
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        stopMeter();
        resolve(finalText.trim());
      };

      recRef.current = rec;
      try {
        rec.start();
        setListening(true);
        void startMeter();
      } catch (err) {
        setListening(false);
        stopMeter();
        reject(err as Error);
      }
    });
  }, [startMeter, stopMeter]);

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  return {
    speak,
    stopSpeaking,
    listen,
    stopListening,
    listening,
    speaking,
    interim,
    level,
  };
}
