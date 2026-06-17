"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

const BUSINESS_OPTIONS = [
  { value: "roofing", label: "Roofing / Techos", emoji: "🏠" },
  { value: "painting", label: "Painting / Pintura", emoji: "🎨" },
  { value: "landscaping", label: "Landscaping / Jardinería", emoji: "🌿" },
  { value: "cleaning", label: "Cleaning / Limpieza", emoji: "🧽" },
  { value: "restaurant", label: "Restaurant / Restaurante", emoji: "🍽️" },
  { value: "law_firm", label: "Law Firm / Abogados", emoji: "⚖️" },
  { value: "real_estate", label: "Real Estate / Bienes raíces", emoji: "🏢" },
  { value: "medical", label: "Medical / Clínica", emoji: "🏥" },
  { value: "beauty", label: "Beauty / Belleza", emoji: "💅" },
  { value: "fitness", label: "Fitness / Gimnasio", emoji: "💪" },
  { value: "other", label: "Otro", emoji: "✨" },
] as const;

const GOAL_OPTIONS = [
  { value: "calls", label: "Conseguir llamadas" },
  { value: "quote_forms", label: "Conseguir formularios de cotización" },
  { value: "show_services", label: "Mostrar servicios" },
  { value: "sell_products", label: "Vender productos" },
  { value: "book_appointments", label: "Agendar citas" },
  { value: "professional_presence", label: "Mejorar presencia profesional" },
] as const;

const STYLE_OPTIONS = [
  { value: "modern_clean", label: "Moderno y limpio" },
  { value: "premium_elegant", label: "Premium / elegante" },
  { value: "local_trustworthy", label: "Local y confiable" },
  { value: "corporate", label: "Corporativo" },
  { value: "creative", label: "Creativo" },
  { value: "minimalist", label: "Minimalista" },
  { value: "bold", label: "Fuerte y llamativo" },
] as const;

const STRUCTURE_OPTIONS = [
  { value: "one_page", label: "Una sola página (todo en Inicio)" },
  { value: "pages_3", label: "3 páginas · Inicio, Servicios, Contacto" },
  { value: "pages_4", label: "4 páginas · Inicio, Servicios, Nosotros, Contacto" },
  { value: "pages_full", label: "Sitio completo · + Proyectos" },
  { value: "ai_decide", label: "No sé, que la IA decida" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "bilingual", label: "Bilingüe" },
] as const;

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
    sessionStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify(parsed.data)
    );
    router.push("/builder/generating");
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
          <span>
            Paso {step} de {TOTAL_STEPS}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <Step title="¿Cuál es el tipo de negocio?">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del negocio</Label>
              <Input
                id="businessName"
                placeholder="Ej: Techos Pro Monterrey"
                value={form.businessName ?? ""}
                onChange={(e) => update({ businessName: e.target.value })}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BUSINESS_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  active={form.businessType === opt.value}
                  onClick={() => update({ businessType: opt.value })}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </OptionCard>
              ))}
            </div>
            {form.businessType === "other" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="customBusinessType">
                  Describe tu tipo de negocio
                </Label>
                <Input
                  id="customBusinessType"
                  placeholder="Ej: Taller de motocicletas"
                  value={form.customBusinessType ?? ""}
                  onChange={(e) =>
                    update({ customBusinessType: e.target.value })
                  }
                />
              </div>
            )}
          </Step>
        )}

        {step === 2 && (
          <Step title="¿Cuál es el objetivo principal del sitio?">
            <div className="grid gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt.value}
                  active={form.goal === opt.value}
                  onClick={() => update({ goal: opt.value })}
                  label={opt.label}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="¿Qué estilo visual quiere?">
            <div className="grid gap-3 sm:grid-cols-2">
              {STYLE_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt.value}
                  active={form.visualStyle === opt.value}
                  onClick={() => update({ visualStyle: opt.value })}
                  label={opt.label}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step title="¿Cuántas páginas necesita tu sitio?">
            <div className="grid gap-3">
              {STRUCTURE_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt.value}
                  active={form.structureType === opt.value}
                  onClick={() => update({ structureType: opt.value })}
                  label={opt.label}
                />
              ))}
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step title="Datos básicos para publicar">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ubicación / zona">
                <Input
                  placeholder="Ej: Monterrey, NL"
                  value={form.location ?? ""}
                  onChange={(e) => update({ location: e.target.value })}
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  placeholder="Ej: +52 81 1234 5678"
                  value={form.phone ?? ""}
                  onChange={(e) => update({ phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  placeholder="contacto@negocio.com"
                  value={form.email ?? ""}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </Field>
              <Field label="Dominio (opcional)">
                <Input
                  placeholder="negocio.com"
                  value={form.domain ?? ""}
                  onChange={(e) => update({ domain: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-6">
              <Label className="mb-2 block">Idioma del sitio</Label>
              <div className="flex flex-wrap gap-3">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ language: opt.value })}
                    className={cn(
                      "rounded-full border px-5 py-2 text-sm font-medium transition-colors",
                      form.language === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-slate-200 bg-white text-slate-700 hover:border-primary/50"
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
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1}
            className={cn(step === 1 && "invisible")}
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={next}>
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={generate}>
              <Sparkles className="h-4 w-4" /> Generar mi sitio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
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

function OptionCard({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-slate-200 bg-white hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}

function OptionRow({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-slate-200 bg-white hover:border-primary/40"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          active ? "border-primary bg-primary text-white" : "border-slate-300"
        )}
      >
        {active ? "✓" : ""}
      </span>
    </button>
  );
}
