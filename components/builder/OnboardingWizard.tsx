"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Home,
  Paintbrush,
  Trees,
  SprayCan,
  UtensilsCrossed,
  Scale,
  Building2,
  Stethoscope,
  Scissors,
  Dumbbell,
  MoreHorizontal,
  Phone,
  FileText,
  LayoutList,
  ShoppingBag,
  CalendarCheck,
  BadgeCheck,
  File,
  Files,
  LayoutGrid,
  Globe,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getPalette } from "@/lib/site/design";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

type BusinessType = OnboardingInput["businessType"];
type Goal = OnboardingInput["goal"];
type VisualStyle = OnboardingInput["visualStyle"];
type StructureType = OnboardingInput["structureType"];
type Language = OnboardingInput["language"];

const BUSINESS_OPTIONS: { value: BusinessType; label: string; icon: LucideIcon }[] = [
  { value: "roofing", label: "Techos", icon: Home },
  { value: "painting", label: "Pintura", icon: Paintbrush },
  { value: "landscaping", label: "Jardinería", icon: Trees },
  { value: "cleaning", label: "Limpieza", icon: SprayCan },
  { value: "restaurant", label: "Restaurante", icon: UtensilsCrossed },
  { value: "law_firm", label: "Abogados", icon: Scale },
  { value: "real_estate", label: "Bienes raíces", icon: Building2 },
  { value: "medical", label: "Clínica", icon: Stethoscope },
  { value: "beauty", label: "Belleza", icon: Scissors },
  { value: "fitness", label: "Gimnasio", icon: Dumbbell },
  { value: "other", label: "Otro", icon: MoreHorizontal },
];

const GOAL_OPTIONS: {
  value: Goal;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  { value: "calls", label: "Conseguir llamadas", desc: "Que los clientes te contacten por teléfono", icon: Phone },
  { value: "quote_forms", label: "Formularios de cotización", desc: "Recibe solicitudes de presupuesto", icon: FileText },
  { value: "show_services", label: "Mostrar servicios", desc: "Presenta lo que ofreces con claridad", icon: LayoutList },
  { value: "sell_products", label: "Vender productos", desc: "Impulsa ventas en línea", icon: ShoppingBag },
  { value: "book_appointments", label: "Agendar citas", desc: "Permite reservar de forma sencilla", icon: CalendarCheck },
  { value: "professional_presence", label: "Presencia profesional", desc: "Proyecta imagen y confianza", icon: BadgeCheck },
];

const STYLE_OPTIONS: { value: VisualStyle; label: string; desc: string }[] = [
  { value: "modern_clean", label: "Moderno y limpio", desc: "Diseño actual con espacios amplios" },
  { value: "premium_elegant", label: "Premium / elegante", desc: "Sofisticado, con tipografía serif" },
  { value: "local_trustworthy", label: "Local y confiable", desc: "Cercano, ideal para negocios de barrio" },
  { value: "corporate", label: "Corporativo", desc: "Serio y orientado a empresas" },
  { value: "creative", label: "Creativo", desc: "Audaz, colorido y con personalidad" },
  { value: "minimalist", label: "Minimalista", desc: "Esencial, sin distracciones" },
  { value: "bold", label: "Fuerte y llamativo", desc: "Alto contraste e impacto visual" },
];

const STRUCTURE_OPTIONS: {
  value: StructureType;
  label: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  { value: "one_page", label: "Una sola página", desc: "Todo en Inicio · ideal para conversión rápida", icon: File },
  { value: "pages_3", label: "3 páginas", desc: "Inicio · Servicios · Contacto", icon: Files },
  { value: "pages_4", label: "4 páginas", desc: "Inicio · Servicios · Nosotros · Contacto", icon: LayoutGrid },
  { value: "pages_full", label: "Sitio completo", desc: "Incluye página de Proyectos / portafolio", icon: Globe },
  { value: "ai_decide", label: "Que la IA decida", desc: "Elegimos la mejor estructura por ti", icon: Wand2 },
];

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "bilingual", label: "Bilingüe" },
] as const;

const STEP_LABELS = ["Negocio", "Objetivo", "Estilo", "Páginas", "Detalles"];
const TOTAL_STEPS = 5;
export const ONBOARDING_STORAGE_KEY = "ai-builder:onboarding";

type FormState = Partial<OnboardingInput>;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ language: "es" });
  const [error, setError] = useState<string | null>(null);

  const update = (patch: FormState) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const validateStep = (): boolean => {
    setError(null);
    switch (step) {
      case 1:
        if (!form.businessName || form.businessName.trim().length < 2) {
          setError("Escribe el nombre del negocio.");
          return false;
        }
        if (!form.businessType) {
          setError("Selecciona un tipo de negocio.");
          return false;
        }
        if (form.businessType === "other" && !form.customBusinessType?.trim()) {
          setError("Describe brevemente tu tipo de negocio.");
          return false;
        }
        return true;
      case 2:
        if (!form.goal) {
          setError("Selecciona el objetivo principal.");
          return false;
        }
        return true;
      case 3:
        if (!form.visualStyle) {
          setError("Selecciona un estilo visual.");
          return false;
        }
        return true;
      case 4:
        if (!form.structureType) {
          setError("Selecciona la estructura.");
          return false;
        }
        return true;
      case 5:
        if (!form.language) {
          setError("Selecciona el idioma.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const back = () => {
    setError(null);
    if (step > 1) setStep((s) => s - 1);
  };

  const generate = () => {
    if (!validateStep()) return;
    const parsed = onboardingSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Revisa los datos.");
      return;
    }
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(parsed.data));
    router.push("/builder/generating");
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Stepper step={step} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] sm:p-9">
        {step === 1 && (
          <Step
            title="¿Cuál es tu negocio?"
            subtitle="Esto nos ayuda a generar contenido específico para tu industria."
          >
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                placeholder="Ej: Techos Pro Monterrey"
                value={form.businessName ?? ""}
                onChange={(e) => update({ businessName: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="mt-6">
              <Label className="mb-3 block">Tipo de negocio</Label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {BUSINESS_OPTIONS.map((opt) => (
                  <IconTile
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    active={form.businessType === opt.value}
                    onClick={() => update({ businessType: opt.value })}
                  />
                ))}
              </div>
            </div>
            {form.businessType === "other" && (
              <div className="mt-5 space-y-2">
                <Label htmlFor="customBusinessType">Describe tu negocio</Label>
                <Input
                  id="customBusinessType"
                  placeholder="Ej: Taller de motocicletas"
                  value={form.customBusinessType ?? ""}
                  onChange={(e) => update({ customBusinessType: e.target.value })}
                  className="h-11"
                />
              </div>
            )}
          </Step>
        )}

        {step === 2 && (
          <Step
            title="¿Cuál es el objetivo del sitio?"
            subtitle="Optimizaremos el diseño y los textos para lograrlo."
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              {GOAL_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  desc={opt.desc}
                  active={form.goal === opt.value}
                  onClick={() => update({ goal: opt.value })}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step
            title="¿Qué estilo visual prefieres?"
            subtitle="Define la tipografía, los colores y la personalidad del sitio."
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              {STYLE_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  desc={opt.desc}
                  active={form.visualStyle === opt.value}
                  onClick={() => update({ visualStyle: opt.value })}
                  swatch={<Swatch style={opt.value} />}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="¿Cuántas páginas necesitas?"
            subtitle="Puedes ajustar las secciones más adelante en el editor."
          >
            <div className="grid gap-2.5">
              {STRUCTURE_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  icon={opt.icon}
                  label={opt.label}
                  desc={opt.desc}
                  active={form.structureType === opt.value}
                  onClick={() => update({ structureType: opt.value })}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            title="Datos de contacto"
            subtitle="Aparecerán en tu sitio. Puedes dejar campos vacíos si aún no los tienes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ubicación / zona">
                <Input
                  placeholder="Ej: Monterrey, NL"
                  value={form.location ?? ""}
                  onChange={(e) => update({ location: e.target.value })}
                  className="h-11"
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  placeholder="Ej: +52 81 1234 5678"
                  value={form.phone ?? ""}
                  onChange={(e) => update({ phone: e.target.value })}
                  className="h-11"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="contacto@negocio.com"
                  value={form.email ?? ""}
                  onChange={(e) => update({ email: e.target.value })}
                  className="h-11"
                />
              </Field>
              <Field label="Dominio (opcional)">
                <Input
                  placeholder="negocio.com"
                  value={form.domain ?? ""}
                  onChange={(e) => update({ domain: e.target.value })}
                  className="h-11"
                />
              </Field>
            </div>
            <div className="mt-6">
              <Label className="mb-2.5 block">Idioma del sitio</Label>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ language: opt.value })}
                    className={cn(
                      "rounded-md px-5 py-2 text-sm font-medium transition-all",
                      form.language === opt.value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Step>
        )}

        {error && (
          <p className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1}
            className={cn(step === 1 && "invisible")}
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={next} size="lg" className="px-6">
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={generate} size="lg" className="px-6">
              <Sparkles className="h-4 w-4" /> Generar mi sitio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <ol className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num < step;
          const current = num === step;
          return (
            <li
              key={label}
              className={cn("flex items-center", i < STEP_LABELS.length - 1 && "flex-1")}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    current && "border-primary bg-primary/10 text-primary",
                    !done && !current && "border-slate-200 bg-white text-slate-400"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : num}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block",
                    current ? "text-slate-900" : "text-slate-400"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <span
                  className={cn(
                    "mx-3 h-px flex-1 transition-colors",
                    done ? "bg-primary/40" : "bg-slate-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Compact icon tile (business types). */
function IconTile({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
        active
          ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          active ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className={cn("text-sm font-medium", active ? "text-slate-900" : "text-slate-700")}>
        {label}
      </span>
    </button>
  );
}

/** Rich option row with icon/swatch, label, description and a check. */
function OptionCard({
  icon: Icon,
  label,
  desc,
  active,
  onClick,
  swatch,
}: {
  icon?: LucideIcon;
  label: string;
  desc?: string;
  active: boolean;
  onClick: () => void;
  swatch?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3.5 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {Icon && (
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            active ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      {swatch}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-semibold", active ? "text-slate-900" : "text-slate-800")}>
          {label}
        </span>
        {desc && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{desc}</span>}
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          active ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
        )}
      >
        {active && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

/** Three color dots previewing a style's real palette. */
function Swatch({ style }: { style: string }) {
  const p = getPalette(style, "preview");
  return (
    <span className="flex shrink-0 items-center gap-1">
      {[p.primary, p.secondary, p.accent].map((c, i) => (
        <span
          key={i}
          className="h-6 w-6 rounded-md ring-1 ring-black/5"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}
