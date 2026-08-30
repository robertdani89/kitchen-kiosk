"use client";

import { useEffect, useRef, useState } from "react";

const radarUrl = "https://cdn.idokep.hu/radar/radar.mp4";
const refreshIntervalMs = 10 * 60 * 1000;

const buildVideoSrc = () => `${radarUrl}?t=${Date.now()}`;

export default function RadarVideo() {
    const [videoSrc, setVideoSrc] = useState(buildVideoSrc);
    const [hasError, setHasError] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const restartVideo = (video: HTMLVideoElement) => {
        video.currentTime = 0;
        void video.play().catch(() => {
            // Ignore replay failures caused by browser autoplay policies.
        });
    };

    useEffect(() => {
        const id = window.setInterval(() => {
            setHasError(false);
            setVideoSrc(buildVideoSrc());
        }, refreshIntervalMs);

        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.load();
        void video.play().catch(() => {
            // Muted autoplay is expected to work, but ignore failures quietly.
        });
    }, [videoSrc]);

    return (
        <section className="h-full w-full rounded bg-white p-1 shadow">
            <div className="flex h-full items-center justify-center overflow-hidden rounded bg-black">
                {hasError ? (
                    <div className="px-2 text-center text-xs text-white">Radar video is unavailable.</div>
                ) : (
                    <video
                        ref={videoRef}
                        key={videoSrc}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onEnded={(event) => restartVideo(event.currentTarget)}
                        onError={() => setHasError(true)}
                    >
                        <source src={videoSrc} type="video/mp4" />
                    </video>
                )}
            </div>
        </section>
    );
}