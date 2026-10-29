"use client";

import { useRef, useState } from "react";
import type { MicVAD } from "@ricky0123/vad-web";

const CDN = "https://cdn.jsdelivr.net/npm/";

export function useLive(onSpeechStart: () => void, onSpeechEnd: (wav: Blob) => void) {
    const [live, setLive] = useState(false);
    const vadRef = useRef<MicVAD | null>(null);
    const handlersRef = useRef({ onSpeechStart, onSpeechEnd });
    handlersRef.current = { onSpeechStart, onSpeechEnd };


    async function start() {
        const { MicVAD, utils } = await import("@ricky0123/vad-web");

        vadRef.current = await MicVAD.new({
            baseAssetPath: `${CDN}@ricky0123/vad-web@0.0.31/dist/`,
            onnxWASMBasePath: `${CDN}onnxruntime-web@1.31.1/dist/`,
            onSpeechRealStart: () => handlersRef.current.onSpeechStart(),
            onSpeechEnd: (audio) =>
                handlersRef.current.onSpeechEnd(new Blob([utils.encodeWAV(audio)], { type: "audio/wav" })),

        });
        setLive(true);
    }

    async function stop() {
        await vadRef.current?.destroy();
        vadRef.current = null;
        setLive(false);
    }

    return { live, start, stop };
}
