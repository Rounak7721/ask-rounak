"use client";

import { useRef, useState } from "react";

export function useRecorder(onAudio: (audio: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      onAudio(new Blob(chunks, { type: recorder.mimeType }));
    };

    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return { recording, start, stop };
}
