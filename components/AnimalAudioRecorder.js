import { useCallback, useEffect, useRef, useState } from "react";
import { generateSpectrogram, requestMicrophonePermission } from "@/lib/animalAudio";

const MAX_SECONDS = 15;

export default function AnimalAudioRecorder({ t, onSubmit, onBack }) {
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopStream();
  }, [stopStream]);

  const startRecording = useCallback(async () => {
    setError("");
    const perm = await requestMicrophonePermission();
    if (!perm.ok) {
      setError(t("themes.juniors.sound_mic_error"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          setStatus("idle");
          setError(t("themes.juniors.sound_too_short"));
          return;
        }
        setStatus("processing");
        try {
          const { dataUrl, base64, durationSec } = await generateSpectrogram(blob);
          onSubmit?.({ spectrogram: dataUrl, base64, durationSec, audioBlob: blob });
        } catch (e) {
          console.error("[Wilder] spectrogram:", e);
          setStatus("idle");
          setError(t("themes.juniors.sound_process_error"));
        }
      };

      recorder.start(200);
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            recorder.stop();
            clearInterval(timerRef.current);
            timerRef.current = null;
            setStatus("stopping");
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.error("[Wilder] record:", e);
      setError(t("themes.juniors.sound_mic_error"));
      setStatus("idle");
    }
  }, [onSubmit, stopStream, t]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      setStatus("stopping");
      mediaRecorderRef.current.stop();
    }
  }, []);

  const isRecording = status === "recording";
  const isProcessing = status === "processing" || status === "stopping";

  return (
    <div className="animaux-audio-screen screen-enter">
      <button
        type="button"
        className="animaux-audio-back"
        onClick={onBack}
        aria-label={t("themes.juniors.back_to_animaux")}
      >
        ← {t("themes.juniors.back_to_animaux")}
      </button>

      <div className="animaux-audio-hero">
        <span className="animaux-audio-emoji" aria-hidden="true">
          🎵
        </span>
        <h1 className="animaux-audio-title">{t("themes.juniors.sound_title")}</h1>
        <p className="animaux-audio-sub">{t("themes.juniors.sound_sub")}</p>
      </div>

      <div className="animaux-audio-visual" aria-hidden="true">
        {isRecording && (
          <div className="animaux-audio-waves">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
        {!isRecording && !isProcessing && (
          <div className="animaux-audio-idle-icon">🎙️</div>
        )}
        {isProcessing && <div className="animaux-audio-processing">✨</div>}
      </div>

      {isRecording && (
        <p className="animaux-audio-timer" aria-live="polite">
          {t("themes.juniors.sound_recording", { sec: seconds, max: MAX_SECONDS })}
        </p>
      )}

      {error && (
        <p className="animaux-audio-error" role="alert">
          {error}
        </p>
      )}

      <div className="animaux-audio-actions">
        {!isRecording && !isProcessing && (
          <button type="button" className="animaux-audio-record-btn" onClick={startRecording}>
            <span aria-hidden="true">🔴</span>
            {t("themes.juniors.sound_record")}
          </button>
        )}
        {isRecording && (
          <button type="button" className="animaux-audio-stop-btn" onClick={stopRecording}>
            {t("themes.juniors.sound_stop")}
          </button>
        )}
        {isProcessing && (
          <p className="animaux-audio-status">{t("themes.juniors.sound_analyzing")}</p>
        )}
      </div>

      <p className="animaux-audio-hint">{t("themes.juniors.sound_hint")}</p>
    </div>
  );
}
