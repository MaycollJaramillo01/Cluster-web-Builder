import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resultados de diseño — test-20-designs" };
export const dynamic = "force-dynamic";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Engine = "ai" | "fallback";
type Mode   = "guided" | "advanced";

type TestResult = {
  index: number;
  mode: Mode;
  style: string;
  mood: string;
  sections: number;
  valid: boolean;
  elapsed: number;
  engine: Engine;
  siteId?: string | null;
  previewUrl?: string | null;
};

type UntestedStyle = { style: string; mood: string };

type TestRun = {
  runAt: string;
  company: string;
  command: string;
  baseUrl: string;
  keepMode?: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
    uniqueStyles: number;
    validSites: number;
    aiGenerations: number;
    fallbackGenerations: number;
  };
  results: TestResult[];
  untestedStyles: UntestedStyle[];
};

// ── Datos ─────────────────────────────────────────────────────────────────────
function loadResults(): TestRun | null {
  const path = join(process.cwd(), "scripts", "last-test-results.json");
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf-8")) as TestRun; }
  catch { return null; }
}

// ── Utilidades visuales ───────────────────────────────────────────────────────
function fmtTime(ms: number) {
  return ms < 2000 ? `${(ms / 1000).toFixed(1)}s` : `${(ms / 1000).toFixed(0)}s`;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

// Color accent per style (subset, for visual variety in cards)
const STYLE_ACCENT: Record<string, string> = {
  "Neo-Geo": "#6366f1",
  "Editorial": "#ec4899",
  "Typography First": "#f59e0b",
  "Scandinavian": "#10b981",
  "Minimal": "#94a3b8",
  "Retro-futuristic": "#f97316",
  "Monochromatic": "#a1a1aa",
  "Dark Mode First": "#8b5cf6",
  "Luxury Minimal": "#d97706",
  "Corporate Professional": "#3b82f6",
  "Artisan": "#84cc16",
  "Modernist": "#06b6d4",
  "Neumorphic": "#e879f9",
  "Swiss/International": "#ef4444",
  "Japandi": "#78716c",
  "Flat": "#22c55e",
  "Bauhaus": "#eab308",
  "Material": "#0ea5e9",
  "Metropolitan": "#c084fc",
  "Glassmorphism": "#67e8f9",
};

function styleAccent(style: string) {
  return STYLE_ACCENT[style] ?? "#a78bfa";
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#2a2235] bg-[#13101c] px-5 py-4">
      <span className="font-mono text-3xl font-bold tracking-tight text-white">{value}</span>
      <span className="text-sm font-semibold text-[#c4b5fd]">{label}</span>
      {sub && <span className="text-xs text-[#6b6478]">{sub}</span>}
    </div>
  );
}

function ModeBadge({ mode }: { mode: Mode }) {
  return mode === "guided"
    ? <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">Guiado</span>
    : <span className="rounded-full bg-violet-900/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">Avanzado</span>;
}

function EngineBadge({ engine }: { engine: Engine }) {
  return engine === "ai"
    ? <span className="rounded-full bg-blue-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-400">IA</span>
    : <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">Fallback</span>;
}

function SectionsBar({ count, max = 10 }: { count: number; max?: number }) {
  const pct = Math.round((count / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#2a2235]">
        <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#8b7fa0]">{count} secc.</span>
    </div>
  );
}

function ResultCard({ r }: { r: TestResult }) {
  const accent = styleAccent(r.style);
  return (
    <article
      className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-[#2a2235] bg-[#13101c] p-4 transition-colors hover:border-[#4c3f6b]"
      style={{ borderTopColor: accent, borderTopWidth: "2px" }}
    >
      {/* index */}
      <span className="absolute right-3 top-3 font-mono text-[10px] text-[#4a4258]">
        #{String(r.index).padStart(2, "0")}
      </span>

      {/* style name */}
      <h3 className="pr-8 text-sm font-bold leading-tight text-white">{r.style}</h3>

      {/* mood */}
      <p className="text-[11px] italic leading-4 text-[#7b6e8a]">{r.mood}</p>

      {/* badges */}
      <div className="flex flex-wrap gap-1.5">
        <ModeBadge mode={r.mode} />
        <EngineBadge engine={r.engine} />
        {r.valid
          ? <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">✓ Válido</span>
          : <span className="rounded-full bg-red-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">✗ Inválido</span>
        }
      </div>

      {/* sections + time */}
      <div className="flex items-center justify-between border-t border-[#1e1a28] pt-2">
        <SectionsBar count={r.sections} />
        <span className="font-mono text-[11px] text-[#5c5268]">{fmtTime(r.elapsed)}</span>
      </div>

      {/* preview link */}
      {r.previewUrl && (
        <a
          href={r.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#2a2235] bg-[#0e0b18] py-2 text-[11px] font-bold uppercase tracking-widest text-[#a78bfa] transition-colors hover:border-[#6d35db] hover:bg-[#1a1030] hover:text-white"
        >
          Ver sitio →
        </a>
      )}
    </article>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TestResultsPage() {
  const data = loadResults();

  if (!data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0812] px-4 text-center">
        <p className="text-5xl">🌿</p>
        <h1 className="mt-6 text-2xl font-bold text-white">Sin resultados todavía</h1>
        <p className="mt-3 text-[#8b7fa0]">Ejecuta el test para generar los resultados.</p>
        <pre className="mt-6 rounded-lg border border-[#2a2235] bg-[#13101c] px-6 py-4 font-mono text-sm text-[#c4b5fd]">
          npm run test:20-designs
        </pre>
      </div>
    );
  }

  const { summary, results, untestedStyles } = data;
  const guidedResults   = results.filter((r) => r.mode === "guided");
  const advancedResults = results.filter((r) => r.mode === "advanced");
  const allPassed       = summary.failed === 0 && summary.uniqueStyles === summary.total && summary.validSites === summary.total;
  const avgElapsed      = Math.round(results.reduce((s, r) => s + r.elapsed, 0) / results.length);

  return (
    <div className="min-h-dvh bg-[#0a0812] px-4 py-12 text-[#e8e0f0] sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ── */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[.18em] text-[#6b6478]">
              test-20-designs · {fmtDate(data.runAt)}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pruebas de diseño
            </h1>
            <p className="mt-2 text-[#8b7fa0]">
              Empresa: <span className="text-[#c4b5fd]">{data.company}</span>
              {" · "}
              <code className="rounded bg-[#1a1525] px-1.5 py-0.5 font-mono text-xs text-[#a78bfa]">{data.command}</code>
            </p>
          </div>

          {/* Global badge */}
          <div className={`flex h-16 w-40 shrink-0 flex-col items-center justify-center rounded-xl border-2 font-bold ${
            allPassed
              ? "border-emerald-500 bg-emerald-950/40 text-emerald-400"
              : "border-red-500 bg-red-950/40 text-red-400"
          }`}>
            <span className="text-2xl">{allPassed ? "✓" : "✗"}</span>
            <span className="text-sm uppercase tracking-widest">{allPassed ? "PASÓ" : "FALLÓ"}</span>
          </div>
        </header>

        {/* ── Banner de preview ── */}
        {data.keepMode && results.some((r) => r.previewUrl) && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-violet-800/40 bg-violet-950/30 px-5 py-3.5">
            <span className="text-lg">👁</span>
            <div>
              <p className="text-sm font-semibold text-violet-300">
                Los 20 sitios están publicados y disponibles para inspección.
              </p>
              <p className="text-xs text-violet-500">
                Haz clic en <span className="font-bold">"Ver sitio →"</span> en cada tarjeta. Para limpiar:{" "}
                <code className="rounded bg-[#1a1525] px-1 py-0.5 font-mono text-violet-400">
                  npm run test:20-designs:cleanup
                </code>
              </p>
            </div>
          </div>
        )}

        {!data.keepMode && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-[#2a2235] bg-[#0e0b18] px-5 py-3.5">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-semibold text-[#8b7fa0]">
                Este run eliminó los sitios al terminar.
              </p>
              <p className="text-xs text-[#5c5268]">
                Para ver los sitios generados corre:{" "}
                <code className="rounded bg-[#1a1525] px-1 py-0.5 font-mono text-[#a78bfa]">
                  npm run test:20-designs:keep
                </code>
              </p>
            </div>
          </div>
        )}

        {/* ── Estadísticas ── */}
        <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={`${summary.passed}/${summary.total}`} label="Generaciones" sub="exitosas" />
          <StatCard value={`${summary.uniqueStyles}/${summary.total}`} label="Estilos únicos" sub="sin repeticiones" />
          <StatCard value={`${summary.validSites}/${summary.passed}`} label="Sitios válidos" sub="hero + cta + footer" />
          <StatCard value={fmtTime(avgElapsed)} label="Tiempo promedio" sub={`${summary.aiGenerations} IA · ${summary.fallbackGenerations} fallback`} />
        </section>

        {/* ── Modo Guiado ── */}
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Modo Guiado</h2>
            <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-bold text-emerald-400">
              {guidedResults.filter((r) => r.valid).length}/{guidedResults.length} válidos
            </span>
            <span className="ml-auto font-mono text-xs text-[#4a4258]">
              Pruebas #01 – #10
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {guidedResults.map((r) => <ResultCard key={r.index} r={r} />)}
          </div>
        </section>

        {/* ── Modo Avanzado ── */}
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Modo Avanzado</h2>
            <span className="rounded-full bg-violet-900/40 px-3 py-1 text-xs font-bold text-violet-400">
              {advancedResults.filter((r) => r.valid).length}/{advancedResults.length} válidos
            </span>
            <span className="ml-auto font-mono text-xs text-[#4a4258]">
              Pruebas #11 – #20
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {advancedResults.map((r) => <ResultCard key={r.index} r={r} />)}
          </div>
        </section>

        {/* ── Estilos no probados ── */}
        <section className="mb-12">
          <h2 className="mb-5 text-lg font-bold text-white">
            Estilos pendientes{" "}
            <span className="ml-2 rounded-full bg-[#2a2235] px-3 py-1 font-mono text-sm text-[#8b7fa0]">
              {untestedStyles.length} restantes
            </span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {untestedStyles.map(({ style, mood }) => (
              <div key={style} className="flex flex-col gap-1.5 rounded-xl border border-dashed border-[#2a2235] bg-[#0e0b18] p-4">
                <span className="text-sm font-bold text-[#6b6478]">{style}</span>
                <span className="text-[11px] italic text-[#4a4258]">{mood}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Nota de engine ── */}
        {summary.fallbackGenerations > 0 && (
          <div className="mb-10 rounded-xl border border-amber-900/40 bg-amber-950/20 px-5 py-4">
            <p className="text-sm text-amber-300">
              <span className="font-bold">Nota sobre el fallback:</span>{" "}
              {summary.fallbackGenerations} de {summary.total} generaciones usaron el motor local
              (NVIDIA NIM estaba saturado en ese momento).
              Los sitios generados por fallback siguen siendo válidos pero pueden tener menos secciones.
            </p>
          </div>
        )}

        {/* ── Notas sobre diversidad ── */}
        <section className="rounded-xl border border-[#2a2235] bg-[#13101c] p-6">
          <h2 className="mb-4 font-bold text-white">Análisis de diversidad</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex gap-3">
              <dt className="text-[#6b6478]">Estilos disponibles (total):</dt>
              <dd className="font-mono font-bold text-white">26</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-[#6b6478]">Estilos usados en prueba:</dt>
              <dd className="font-mono font-bold text-white">{summary.uniqueStyles}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-[#6b6478]">Cobertura de estilos:</dt>
              <dd className="font-mono font-bold text-emerald-400">
                {Math.round((summary.uniqueStyles / 26) * 100)}%
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-[#6b6478]">Duplicados detectados:</dt>
              <dd className={`font-mono font-bold ${summary.uniqueStyles === summary.total ? "text-emerald-400" : "text-red-400"}`}>
                {summary.total - summary.uniqueStyles}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-[#6b6478]">Secciones promedio:</dt>
              <dd className="font-mono font-bold text-white">
                {(results.reduce((s, r) => s + r.sections, 0) / results.length).toFixed(1)}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-[#6b6478]">Min / Max secciones:</dt>
              <dd className="font-mono font-bold text-white">
                {Math.min(...results.map((r) => r.sections))} / {Math.max(...results.map((r) => r.sections))}
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mt-10 text-center font-mono text-xs text-[#3a3248]">
          {data.baseUrl} · {fmtDate(data.runAt)}
        </footer>
      </div>
    </div>
  );
}
