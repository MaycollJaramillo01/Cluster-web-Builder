/* eslint-disable @next/next/no-img-element */
import { sectionImageUrl } from "@/lib/site/images";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { getItems } from "@/lib/site/section";
import { ABOUT_US_STYLES, type AboutUsStyle } from "@/lib/site/design";
import type { BlockProps } from "./types";

/**
 * "About Us" section with 26 design variants.
 *
 * The variant is chosen by the AI: each design style maps to a preset with an
 * `aboutUsStyle`. The model can also force any layout via `settings.variant`.
 * Variants tagged (img) use a real image; most include entrance/idle motion.
 */
export function AboutBlock(props: BlockProps) {
  const forced = props.section.settings?.variant;
  const variant: AboutUsStyle =
    typeof forced === "string" && ABOUT_US_STYLES.includes(forced as AboutUsStyle)
      ? (forced as AboutUsStyle)
      : props.preset.aboutUsStyle;

  const Cmp = VARIANTS[variant] ?? SplitAbout;
  return <Cmp {...props} />;
}

/* ------------------------------- helpers ------------------------------- */

function hStyle(p: BlockProps, color?: string) {
  const { theme, preset } = p;
  return {
    color: color ?? theme.text,
    fontFamily: "var(--site-heading)",
    fontWeight: preset.headingWeight,
    letterSpacing: "var(--site-tracking)",
    textTransform: preset.uppercaseHeadings ? ("uppercase" as const) : ("none" as const),
  };
}

function imgRadius(p: BlockProps) {
  return p.preset.imageStyle === "arch" ? "999px 999px 0 0" : p.preset.imageStyle === "square" ? "0" : "var(--site-radius)";
}

function imgUrl(p: BlockProps, seed: string, w: number, h: number) {
  return sectionImageUrl({ prompt: p.section.imagePrompt, businessType: p.site.businessType, seed, width: w, height: h });
}

/** Image that gracefully degrades to a tinted block when images are off. */
function Img({
  p, seed, w, h, className, style, anim,
}: { p: BlockProps; seed: string; w: number; h: number; className?: string; style?: React.CSSProperties; anim?: string }) {
  const { preset, theme } = p;
  if (!preset.useImages) {
    return (
      <div className={className} style={{ ...style, background: `linear-gradient(135deg, ${theme.primary}22, ${theme.accent}22)`, borderRadius: style?.borderRadius ?? imgRadius(p) }} />
    );
  }
  return (
    <img
      src={imgUrl(p, seed, w, h)}
      alt={p.site.businessName}
      loading="lazy"
      className={`${className ?? ""} ${anim ?? ""}`}
      style={{ borderRadius: imgRadius(p), filter: preset.imageStyle === "monochrome" ? "grayscale(1) contrast(1.08)" : undefined, ...style }}
    />
  );
}

function Kicker({ p, children }: { p: BlockProps; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: p.theme.primary }}>
      {children}
    </p>
  );
}

type Highlight = { title: string; description?: string; value?: string };
function readHighlights(p: BlockProps): Highlight[] {
  const s = p.section.settings ?? {};
  const raw = (Array.isArray(s.highlights) && s.highlights) || (Array.isArray(s.stats) && s.stats) || getItems(p.section);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it): Highlight | null => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const title = str(o.title ?? o.label ?? o.name);
      const value = str(o.value);
      if (!title && !value) return null;
      return { title: title || value, description: str(o.description), value: value || undefined };
    })
    .filter((h): h is Highlight => h !== null)
    .slice(0, 4);
}
function str(v: unknown) { return typeof v === "string" ? v : ""; }
function sectionBg(p: BlockProps) {
  const surface = getThemeSurface(p.theme);
  return p.preset.surfaceStyle === "plain" ? p.theme.background : surface.section;
}

/* ------------------------------- variants ------------------------------ */

function SplitAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const first = p.preset.sectionStyle === "asymmetric" || p.preset.imageStyle === "offset";
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className={first ? "md:order-2" : ""}>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
        <div className={`group overflow-hidden ${first ? "md:order-1" : ""}`} style={{ borderRadius: imgRadius(p) }}>
          <Img p={p} seed="about" w={800} h={640} className="about-img-hover h-72 w-full object-cover shadow-lg md:h-80" anim="about-clip" />
        </div>
      </div>
    </section>
  );
}

function EditorialAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-24 sm:py-28" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-4 max-w-3xl text-4xl sm:text-6xl" style={hStyle(p)}>{section.title}</h2>}
        <div className="mt-12 grid gap-10 md:grid-cols-12">
          <div className="group overflow-hidden md:col-span-7" style={{ borderRadius: imgRadius(p) }}>
            <Img p={p} seed="about" w={900} h={760} className="about-img-hover h-80 w-full object-cover sm:h-[28rem]" anim="about-clip" />
          </div>
          {section.body && (
            <div className="md:col-span-5">
              <p className="text-lg leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold first-letter:leading-none" style={{ color: surface.muted }}>
                {section.body}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ManifestoAbout(p: BlockProps) {
  const { section, theme } = p;
  return (
    <section className="px-6 py-24 sm:py-32" style={{ backgroundColor: theme.secondary, color: "#fff" }}>
      <div className="mx-auto max-w-5xl about-stagger">
        <div className="mb-8 h-1.5 w-20" style={{ backgroundColor: theme.accent }} />
        {section.subtitle && <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{section.subtitle}</p>}
        {section.title && <h2 className="text-4xl leading-[1.05] sm:text-6xl" style={hStyle(p, "#fff")}>{section.title}</h2>}
        {section.body && <p className="mt-8 max-w-3xl text-xl leading-relaxed text-white/80 sm:text-2xl">{section.body}</p>}
      </div>
    </section>
  );
}

function StatementAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-28 sm:py-36" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-3xl text-center about-rise">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-5 text-3xl leading-snug sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        <div className="mx-auto mt-10 h-px w-16" style={{ backgroundColor: theme.accent }} />
      </div>
    </section>
  );
}

function GridAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2">
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-3 text-3xl font-bold sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
        {hl.length > 0 ? (
          <div className="grid gap-4 about-stagger sm:grid-cols-2">
            {hl.map((h, i) => (
              <div key={i} className={`p-5 ${p.preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderRadius: "var(--site-radius)", border: `1px solid ${theme.text}14` }}>
                {h.value && <p className="text-3xl font-bold" style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}>{h.value}</p>}
                <p className="font-semibold" style={{ color: theme.text }}>{h.title}</p>
                {h.description && <p className="mt-1 text-sm" style={{ color: surface.muted }}>{h.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="group overflow-hidden" style={{ borderRadius: imgRadius(p) }}>
            <Img p={p} seed="about" w={800} h={620} className="about-img-hover h-full min-h-72 w-full object-cover shadow-lg" anim="about-clip" />
          </div>
        )}
      </div>
    </section>
  );
}

function ImmersiveAbout(p: BlockProps) {
  const { section, theme } = p;
  return (
    <section className="relative overflow-hidden px-6 py-28 sm:py-36">
      <Img p={p} seed="about" w={1600} h={900} className="absolute inset-0 h-full w-full object-cover" style={{ borderRadius: 0 }} anim="about-kenburns" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${theme.secondary}F2, ${theme.secondary}99)` }} />
      <div className="relative mx-auto max-w-3xl about-pop">
        <div className="p-8 sm:p-12" style={{ backgroundColor: `${theme.background}f2`, borderRadius: "var(--site-radius)", border: `1px solid ${theme.text}14` }}>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-3 text-3xl font-bold sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: theme.text, opacity: 0.8 }}>{section.body}</p>}
        </div>
      </div>
    </section>
  );
}

function OverlapAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-0 md:grid-cols-12">
        <div className="group relative z-0 overflow-hidden md:col-span-7" style={{ borderRadius: imgRadius(p) }}>
          <Img p={p} seed="about" w={900} h={680} className="about-img-hover h-80 w-full object-cover sm:h-[30rem]" anim="about-clip" />
        </div>
        <div className="relative z-10 -mt-10 md:col-span-6 md:col-start-7 md:-ml-16 md:mt-0 about-rise">
          <div className="p-8 sm:p-10" style={{ backgroundColor: surface.panel, borderRadius: "var(--site-radius)", boxShadow: "0 24px 60px -24px rgba(15,23,42,.4)" }}>
            <Kicker p={p}>{section.subtitle}</Kicker>
            {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
            {section.body && <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function PolaroidAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        <div className="flex justify-center">
          <div className="about-tilt group bg-white p-3 pb-12 shadow-2xl" style={{ borderRadius: "2px" }}>
            <Img p={p} seed="about" w={520} h={520} className="about-img-hover h-72 w-72 object-cover sm:h-80 sm:w-80" style={{ borderRadius: "0" }} />
          </div>
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </div>
    </section>
  );
}

function BannerAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="py-0" style={{ backgroundColor: theme.background }}>
      <div className="group relative h-64 overflow-hidden sm:h-80">
        <Img p={p} seed="about" w={1600} h={700} className="about-img-hover h-full w-full object-cover" style={{ borderRadius: 0 }} anim="about-kenburns" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, ${theme.secondary}55)` }} />
      </div>
      <div className="mx-auto max-w-3xl px-6 py-14 text-center about-rise">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mx-auto mt-5 max-w-2xl leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
      </div>
    </section>
  );
}

function CollageAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3 about-stagger">
          <Img p={p} seed="about" w={500} h={620} className="col-span-1 row-span-2 h-full w-full object-cover shadow-lg" anim="about-clip" />
          <Img p={p} seed="about-2" w={500} h={300} className="h-full w-full object-cover shadow-lg" anim="about-clip" />
          <Img p={p} seed="about-3" w={500} h={300} className="h-full w-full object-cover shadow-lg" anim="about-clip" />
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </div>
    </section>
  );
}

function PortraitAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-5xl items-center gap-14 md:grid-cols-[0.8fr_1.2fr]">
        <div className="group overflow-hidden" style={{ borderRadius: "999px 999px 0 0" }}>
          <Img p={p} seed="about" w={520} h={680} className="about-img-hover h-96 w-full object-cover" style={{ borderRadius: "999px 999px 0 0" }} anim="about-clip" />
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
          {hl.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-8 about-stagger">
              {hl.slice(0, 3).map((h, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold" style={{ color: theme.primary }}>{h.value || h.title}</p>
                  {h.value && <p className="text-sm" style={{ color: surface.muted }}>{h.title}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ReverseAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="group overflow-hidden" style={{ borderRadius: imgRadius(p) }}>
          <Img p={p} seed="about" w={800} h={640} className="about-img-hover about-float h-72 w-full object-cover shadow-xl md:h-96" />
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </div>
    </section>
  );
}

function MastheadAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-5xl">
        <div className="group overflow-hidden" style={{ borderRadius: imgRadius(p) }}>
          <Img p={p} seed="about" w={1400} h={620} className="about-img-hover h-64 w-full object-cover sm:h-96" anim="about-kenburns" />
        </div>
        <div className="relative mx-auto -mt-16 max-w-3xl px-6 about-rise sm:-mt-20">
          <div className="p-8 sm:p-10" style={{ backgroundColor: surface.panel, borderRadius: "var(--site-radius)", boxShadow: "0 24px 60px -24px rgba(15,23,42,.4)" }}>
            <Kicker p={p}>{section.subtitle}</Kicker>
            {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
            {section.body && <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function FramedAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        <div className="relative mx-auto w-fit">
          <div className="absolute -inset-4 about-float" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, borderRadius: "calc(var(--site-radius) + 8px)" }} />
          <div className="group relative overflow-hidden" style={{ borderRadius: imgRadius(p) }}>
            <Img p={p} seed="about" w={640} h={620} className="about-img-hover h-80 w-full object-cover sm:h-96" anim="about-clip" />
          </div>
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </div>
    </section>
  );
}

function StatsAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="group overflow-hidden" style={{ borderRadius: imgRadius(p) }}>
          <Img p={p} seed="about" w={800} h={680} className="about-img-hover h-80 w-full object-cover shadow-lg md:h-96" anim="about-clip" />
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
          {hl.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-6 about-stagger">
              {hl.map((h, i) => (
                <div key={i} className="border-l-2 pl-4" style={{ borderColor: theme.accent }}>
                  <p className="text-3xl font-bold" style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}>{h.value || h.title}</p>
                  {h.value && <p className="text-sm" style={{ color: surface.muted }}>{h.title}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChecklistAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
          {hl.length > 0 && (
            <ul className="mt-7 space-y-3 about-stagger">
              {hl.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white" style={{ backgroundColor: theme.primary }}>✓</span>
                  <span><span className="font-semibold" style={{ color: theme.text }}>{h.title}</span>{h.description && <span style={{ color: surface.muted }}> — {h.description}</span>}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="group overflow-hidden md:order-first" style={{ borderRadius: imgRadius(p) }}>
          <Img p={p} seed="about" w={800} h={680} className="about-img-hover h-80 w-full object-cover shadow-lg md:h-96" anim="about-clip" />
        </div>
      </div>
    </section>
  );
}

function MosaicAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid grid-cols-6 grid-rows-6 gap-3 about-stagger h-[26rem]">
          <Img p={p} seed="about" w={700} h={700} className="col-span-4 row-span-6 h-full w-full object-cover" anim="about-clip" />
          <Img p={p} seed="about-2" w={400} h={300} className="col-span-2 row-span-3 h-full w-full object-cover" anim="about-clip" />
          <Img p={p} seed="about-3" w={400} h={300} className="col-span-2 row-span-3 h-full w-full object-cover" anim="about-clip" />
        </div>
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </div>
    </section>
  );
}

/* ---- Text-focused variants ---- */

function QuoteAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-24 sm:py-32" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-4xl text-center about-rise">
        <div className="text-7xl leading-none" style={{ color: theme.accent, fontFamily: "Georgia, serif" }}>“</div>
        {section.title && <h2 className="mx-auto -mt-6 max-w-3xl text-2xl leading-snug sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mx-auto mt-6 max-w-2xl leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        {section.subtitle && <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primary }}>{section.subtitle}</p>}
      </div>
    </section>
  );
}

function TimelineAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-3xl">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        {hl.length > 0 && (
          <ol className="mt-10 space-y-8 border-l-2 pl-8 about-stagger" style={{ borderColor: `${theme.primary}33` }}>
            {hl.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[2.6rem] flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>{i + 1}</span>
                <p className="font-semibold" style={{ color: theme.text }}>{h.value ? `${h.value} · ${h.title}` : h.title}</p>
                {h.description && <p className="mt-1 text-sm" style={{ color: surface.muted }}>{h.description}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function ColumnsAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const [lead, ...rest] = (section.body || "").split(/(?<=\.)\s+/);
  return (
    <section className="px-6 py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-5xl">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && (
          <div className="mt-8 gap-10 sm:columns-2">
            <p className="mb-4 text-lg font-medium leading-relaxed" style={{ color: theme.text }}>{lead}</p>
            <p className="leading-relaxed" style={{ color: surface.muted }}>{rest.join(" ")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AccentAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-4xl border-l-4 pl-8 about-rise" style={{ borderColor: theme.accent }}>
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-5xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mt-5 max-w-2xl text-lg leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
      </div>
    </section>
  );
}

function NumberedAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-5xl">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        {hl.length > 0 && (
          <div className="mt-12 grid gap-10 about-stagger sm:grid-cols-2 lg:grid-cols-4">
            {hl.map((h, i) => (
              <div key={i}>
                <p className="text-5xl font-bold" style={{ color: `${theme.primary}30`, fontFamily: "var(--site-heading)" }}>0{i + 1}</p>
                <p className="mt-2 font-semibold" style={{ color: theme.text }}>{h.title}</p>
                {h.description && <p className="mt-1 text-sm" style={{ color: surface.muted }}>{h.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BigtypeAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-24 sm:py-32" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-6xl about-rise">
        {section.subtitle && <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: theme.primary }}>{section.subtitle}</p>}
        {section.title && <h2 className="mt-4 text-5xl leading-[0.95] sm:text-8xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mt-8 max-w-2xl text-lg leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
      </div>
    </section>
  );
}

function SplitStatsAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <Kicker p={p}>{section.subtitle}</Kicker>
          {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
          {section.body && <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
        {hl.length > 0 && (
          <div className="grid grid-cols-2 gap-px overflow-hidden about-stagger" style={{ backgroundColor: `${theme.text}14`, borderRadius: "var(--site-radius)" }}>
            {hl.map((h, i) => (
              <div key={i} className="p-7 text-center" style={{ backgroundColor: surface.panel }}>
                <p className="text-4xl font-bold" style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}>{h.value || h.title}</p>
                {h.value && <p className="mt-1 text-sm" style={{ color: surface.muted }}>{h.title}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MinimalLineAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-24 sm:py-32" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-4xl about-rise">
        {section.title && <h2 className="text-2xl leading-snug sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
        <div className="my-8 h-px w-full" style={{ backgroundColor: `${theme.text}1f` }} />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          {section.body && <p className="max-w-xl leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
          {section.subtitle && <p className="shrink-0 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primary }}>{section.subtitle}</p>}
        </div>
      </div>
    </section>
  );
}

function BadgesAbout(p: BlockProps) {
  const { section, theme } = p;
  const surface = getThemeSurface(theme);
  const hl = readHighlights(p);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: sectionBg(p) }}>
      <div className="mx-auto max-w-3xl text-center about-rise">
        <Kicker p={p}>{section.subtitle}</Kicker>
        {section.title && <h2 className="mt-2 text-3xl font-bold sm:text-4xl" style={hStyle(p)}>{section.title}</h2>}
        {section.body && <p className="mx-auto mt-5 max-w-2xl leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
        {hl.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {hl.map((h, i) => (
              <span key={i} className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: `${theme.primary}55`, color: theme.primary, backgroundColor: `${theme.primary}0d` }}>
                {h.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const VARIANTS: Record<AboutUsStyle, (p: BlockProps) => React.ReactNode> = {
  split: SplitAbout,
  editorial: EditorialAbout,
  manifesto: ManifestoAbout,
  statement: StatementAbout,
  grid: GridAbout,
  immersive: ImmersiveAbout,
  overlap: OverlapAbout,
  polaroid: PolaroidAbout,
  banner: BannerAbout,
  collage: CollageAbout,
  portrait: PortraitAbout,
  reverse: ReverseAbout,
  masthead: MastheadAbout,
  framed: FramedAbout,
  stats: StatsAbout,
  checklist: ChecklistAbout,
  quote: QuoteAbout,
  timeline: TimelineAbout,
  columns: ColumnsAbout,
  accent: AccentAbout,
  numbered: NumberedAbout,
  bigtype: BigtypeAbout,
  splitstats: SplitStatsAbout,
  minimalline: MinimalLineAbout,
  badges: BadgesAbout,
  mosaic: MosaicAbout,
};
