"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe, Zap } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Button } from "@/components/ui/button";

interface SiteMarker {
  id: string;
  label: string;
  location: string | null;
  lat: number;
  lon: number;
  createdAt: string;
}

const GEO_URL = "/world-110m.json";

// Fallback markers shown while real data loads
const FALLBACK_MARKERS: SiteMarker[] = [
  { id: "f1", label: "España", location: "Madrid, España", lat: 40.42, lon: -3.70, createdAt: "" },
  { id: "f2", label: "México", location: "Ciudad de México", lat: 19.43, lon: -99.13, createdAt: "" },
  { id: "f3", label: "Colombia", location: "Bogotá, Colombia", lat: 4.71, lon: -74.07, createdAt: "" },
  { id: "f4", label: "Nicaragua", location: "Managua, Nicaragua", lat: 12.13, lon: -86.29, createdAt: "" },
  { id: "f5", label: "Costa Rica", location: "San José, Costa Rica", lat: 9.93, lon: -84.08, createdAt: "" },
  { id: "f6", label: "Guatemala", location: "Guatemala", lat: 14.64, lon: -90.51, createdAt: "" },
  { id: "f7", label: "Honduras", location: "Tegucigalpa, Honduras", lat: 14.07, lon: -87.21, createdAt: "" },
  { id: "f8", label: "EE.UU.", location: "Miami, Estados Unidos", lat: 25.77, lon: -80.19, createdAt: "" },
];

export function HomeHero() {
  const [mounted, setMounted] = useState(false);
  const [markers, setMarkers] = useState<SiteMarker[]>(FALLBACK_MARKERS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pulseR, setPulseR] = useState(1);

  // Fetch real site locations
  useEffect(() => {
    fetch("/api/map-sites")
      .then((r) => r.json())
      .then((data: SiteMarker[]) => {
        if (Array.isArray(data) && data.length > 0) setMarkers(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));

    // Cycle through markers from most recent to oldest
    let i = 0;
    const cycle = setInterval(() => {
      i = (i + 1) % markers.length;
      setActiveIdx(i);
    }, 2200);

    // Pulse animation
    let frame: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const t = (ts - start) % 2200;
      setPulseR(1 + Math.sin((t / 2200) * Math.PI) * 18);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      clearInterval(cycle);
      cancelAnimationFrame(frame);
    };
  }, [markers.length]);

  const active = markers[activeIdx];

  return (
    <>
      {/* ── HERO: headline + world map background ── */}
      <section
        className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28"
        style={{ minHeight: "76vh" }}
      >
        {/* World map — fills the hero section only */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
        >
          {mounted && (
            <ComposableMap
              width={960}
              height={500}
              projection="geoNaturalEarth1"
              projectionConfig={{
                scale: 210,   // zoomed in — removes Antarctica and polar regions
                center: [0, 18], // shifted north to center on inhabited world
              }}
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="rgb(139 92 246 / 0.11)"
                      stroke="rgb(167 139 250 / 0.30)"
                      strokeWidth={0.4}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {markers.map((m, i) => {
                const isActive = i === activeIdx;
                // Recency fade: most recent = full opacity, older = dimmer
                const recencyOpacity = Math.max(0.25, 1 - (i / markers.length) * 0.65);

                // City only (before first comma) to avoid pill overflow
                const cityLabel = (m.location ?? m.label).split(",")[0].trim();
                const pillW = Math.max(56, cityLabel.length * 6.2 + 22);

                return (
                  <Marker key={m.id} coordinates={[m.lon, m.lat]}>
                    {isActive ? (
                      <>
                        {/* Outer pulse ring */}
                        <circle
                          r={pulseR}
                          fill="none"
                          stroke="rgb(167 139 250 / 0.28)"
                          strokeWidth={1}
                        />
                        {/* Glow halo */}
                        <circle r={8} fill="rgb(167 139 250 / 0.16)" />
                        {/* Core */}
                        <circle r={5} fill="#a78bfa" />
                        <circle r={2.2} fill="#ede9fe" />
                        {/* Label pill — dynamic width */}
                        <rect
                          x={-pillW / 2}
                          y={-42}
                          width={pillW}
                          height={20}
                          rx={10}
                          fill="#1d1a23"
                          stroke="#4c3f6b"
                          strokeWidth={0.8}
                        />
                        <text
                          textAnchor="middle"
                          y={-26}
                          fill="#c4b5fd"
                          fontSize={9}
                          fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
                          fontWeight={500}
                        >
                          {cityLabel}
                        </text>
                      </>
                    ) : (
                      <>
                        {/* Subtle glow for recent markers */}
                        {i < 5 && (
                          <circle r={4} fill={`rgb(167 139 250 / ${recencyOpacity * 0.12})`} />
                        )}
                        <circle
                          r={i < 3 ? 3 : 2}
                          fill={`rgb(167 139 250 / ${recencyOpacity * 0.7})`}
                        />
                      </>
                    )}
                  </Marker>
                );
              })}
            </ComposableMap>
          )}
        </div>

        {/* Decorative beams + vignette */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8b5cf6]/50 to-transparent" />
          <div className="absolute left-1/2 top-0 h-72 w-px -translate-x-1/2 bg-gradient-to-b from-[#8b5cf6]/60 to-transparent" />
          <div className="absolute left-1/2 top-0 h-60 w-[520px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/[0.09] blur-[90px]" />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 100% 75% at 50% 50%, transparent 30%, #0f0d15 95%)",
            }}
          />
        </div>

        {/* Headline content */}
        <div className="relative mx-auto max-w-5xl">
          <div
            className={`mx-auto max-w-3xl text-center transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#3d3549] bg-[#1d1a23]/90 px-3.5 py-1.5 text-xs font-medium text-[#cbc3d7] backdrop-blur-sm">
              <Zap className="h-3 w-3 fill-[#a78bfa] text-[#a78bfa]" />
              Generación con IA · Sin código · Listo para publicar
              <span className="h-3 w-px bg-[#4c3f6b]" />
              <Globe className="h-3 w-3 text-[#a78bfa]" />
              <span className="min-w-[72px] text-left text-[#a78bfa]">
                {active?.label ?? ""}
              </span>
            </div>

            <h1 className="[font-family:var(--font-outfit)] text-6xl font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-[5.5rem] lg:text-[6.5rem]">
              <span className="block text-[#f7f2fb]">Describe tu negocio.</span>
              <span className="block hero-gradient-text">La IA crea el sitio.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-[#9589a3]">
              Sin plantillas genéricas. Sin código. Describe tu negocio y en
              minutos tendrás un sitio profesional listo para editar y publicar.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/builder">Crear mi sitio <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
