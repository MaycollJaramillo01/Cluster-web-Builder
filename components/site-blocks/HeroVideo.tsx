"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";

type HeroVideoProps = {
  src: string;
  poster: string;
  className?: string;
  style?: CSSProperties;
};

export function HeroVideo({ src, poster, className = "", style }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
    } else {
      void video.play().then(() => setPlaying(true)).catch(() => setFailed(true));
    }
  }, [reduceMotion]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setPlaying(true));
    else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={`overflow-hidden ${className}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {!reduceMotion && !failed && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={poster}
          aria-hidden="true"
          onError={() => { setFailed(true); setPlaying(false); }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!reduceMotion && !failed && (
        <button type="button" onClick={togglePlayback} aria-label={playing ? "Pausar video de portada" : "Reproducir video de portada"} className="absolute bottom-4 right-4 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {playing ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
