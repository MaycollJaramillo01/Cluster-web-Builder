"use client";

import { useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock3,
  Code2,
  Globe2,
  ImageIcon,
  Loader2,
  MapPin,
  PackagePlus,
  Palette,
  Phone,
  Plus,
  Sparkles,
  Store,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  ONBOARDING_STORAGE_KEY,
  PromptComposer,
} from "@/components/builder/OnboardingWizard";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/client-image";

type CreationMode = "guided" | "advanced";
type FieldErrors = Record<string, string>;
type ServiceRow = { id: number; name: string; price: string; description: string };
type MediaMode = "ai" | "upload";

const BUSINESS_TYPES = [
  ["restaurant", "Restaurante o cafetería"],
  ["beauty", "Belleza o spa"],
  ["fitness", "Gimnasio o fitness"],
  ["medical", "Clínica o salud"],
  ["law_firm", "Servicios legales"],
  ["real_estate", "Bienes raíces"],
  ["cleaning", "Limpieza"],
  ["landscaping", "Jardinería"],
  ["painting", "Pintura"],
  ["roofing", "Techos"],
  ["other", "Otro tipo de negocio"],
] as const;

const COUNTRIES = [
  "Nicaragua",
  "México",
  "Estados Unidos",
  "Costa Rica",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "Panamá",
  "Colombia",
  "España",
] as const;

const PALETTES = [
  { id: "cluster", label: "Cluster", style: "modern_clean", colors: ["#8b5cf6", "#2c2141", "#f59e0b", "#0f0d15", "#f7f2fb"] },
  { id: "ocean", label: "Océano", style: "corporate", colors: ["#0284c7", "#0c4a6e", "#22d3ee", "#f0f9ff", "#0f172a"] },
  { id: "forest", label: "Bosque", style: "local_trustworthy", colors: ["#15803d", "#14532d", "#eab308", "#f7fee7", "#142616"] },
  { id: "terracotta", label: "Terracota", style: "premium_elegant", colors: ["#c2410c", "#7c2d12", "#f59e0b", "#fff7ed", "#2c1810"] },
  { id: "rose", label: "Rosa", style: "creative", colors: ["#db2777", "#831843", "#fb7185", "#fff1f2", "#3f0a25"] },
  { id: "mono", label: "Monocromo", style: "minimalist", colors: ["#18181b", "#3f3f46", "#a1a1aa", "#fafafa", "#18181b"] },
  { id: "sunset", label: "Atardecer", style: "bold", colors: ["#ea580c", "#9f1239", "#facc15", "#fff7ed", "#431407"] },
  { id: "lavender", label: "Lavanda", style: "creative", colors: ["#7c3aed", "#4c1d95", "#c084fc", "#faf5ff", "#2e1065"] },
  { id: "emerald", label: "Esmeralda", style: "local_trustworthy", colors: ["#059669", "#064e3b", "#2dd4bf", "#ecfdf5", "#022c22"] },
  { id: "coffee", label: "Café", style: "premium_elegant", colors: ["#78350f", "#451a03", "#d97706", "#fffbeb", "#292524"] },
  { id: "coral", label: "Coral", style: "creative", colors: ["#e11d48", "#9f1239", "#fb7185", "#fff1f2", "#4c0519"] },
  { id: "night", label: "Noche", style: "bold", colors: ["#38bdf8", "#0f172a", "#a3e635", "#020617", "#f8fafc"] },
] as const;

export function HomeCreationModes() {
  const [mode, setMode] = useState<CreationMode>("guided");

  return (
    <section className="mx-auto w-full max-w-5xl" aria-labelledby="creation-mode-title">
      <div className="mb-7 text-center">
        <h2 id="creation-mode-title" className="font-[var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-[#f7f2fb] sm:text-3xl">
          Elige cómo quieres empezar
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#cbc3d7]">
          Ambos modos crean un sitio de una sola página principal y puedes editar el resultado después.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Modo para crear el sitio"
        className="mx-auto mb-7 grid max-w-2xl gap-3 sm:grid-cols-2"
      >
        <ModeTab
          id="guided-mode-tab"
          alternateId="advanced-mode-tab"
          controls="guided-mode-panel"
          selected={mode === "guided"}
          onClick={() => setMode("guided")}
          onAlternate={() => setMode("advanced")}
          icon={<Sparkles />}
          title="Guiado"
          description="No necesitas experiencia"
        />
        <ModeTab
          id="advanced-mode-tab"
          alternateId="guided-mode-tab"
          controls="advanced-mode-panel"
          selected={mode === "advanced"}
          onClick={() => setMode("advanced")}
          onAlternate={() => setMode("guided")}
          icon={<Code2 />}
          title="Avanzado"
          description="Describe todo con libertad"
        />
      </div>

      {mode === "guided" ? (
        <div id="guided-mode-panel" role="tabpanel" aria-labelledby="guided-mode-tab" data-home-mode="guided">
          <GuidedHomeForm />
        </div>
      ) : (
        <div id="advanced-mode-panel" role="tabpanel" aria-labelledby="advanced-mode-tab" data-home-mode="advanced">
          <PromptComposer variant="hero" />
        </div>
      )}
    </section>
  );
}

function ModeTab({
  id,
  alternateId,
  controls,
  selected,
  onClick,
  onAlternate,
  icon,
  title,
  description,
}: {
  id: string;
  alternateId: string;
  controls: string;
  selected: boolean;
  onClick: () => void;
  onAlternate: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        onAlternate();
        requestAnimationFrame(() => document.getElementById(alternateId)?.focus());
      }}
      className={`group min-h-20 cursor-pointer rounded-lg border p-4 text-left transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a078ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0d15] ${
        selected
          ? "border-[#8b5cf6] bg-[#2c2141] text-[#f7f2fb] shadow-[0_0_0_1px_rgb(139_92_246/0.35),0_12px_30px_rgb(0_0_0/0.22)]"
          : "border-[#494454] bg-[#15121b] text-[#958ea0] hover:border-[#6f647d] hover:bg-[#1d1a23] hover:text-[#cbc3d7]"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md [&_svg]:h-5 [&_svg]:w-5 ${selected ? "bg-[#8b5cf6] text-white" : "bg-[#2c2832] text-[#a9a0b4]"}`} aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs font-normal opacity-80">{description}</span>
        </span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#a078ff] bg-[#8b5cf6] text-white" : "border-[#494454] text-transparent"}`} aria-hidden="true">
          <Check className="h-3.5 w-3.5" />
        </span>
      </span>
    </button>
  );
}

function GuidedHomeForm() {
  const router = useRouter();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const nextServiceId = useRef(2);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([
    { id: 1, name: "", price: "", description: "" },
  ]);
  const [paletteId, setPaletteId] = useState("cluster");
  const [logoMode, setLogoMode] = useState<MediaMode>("ai");
  const [coverMode, setCoverMode] = useState<MediaMode>("ai");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateBusinessName = (value: string) => {
    setBusinessName(value);
    clearError("businessName");
    if (!slugEdited) setSlug(toSlug(value));
  };

  const updateService = (id: number, field: keyof Omit<ServiceRow, "id">, value: string) => {
    setServices((current) => current.map((service) => (
      service.id === id ? { ...service, [field]: value } : service
    )));
    clearError(`service-${id}-${field}`);
  };

  const addService = () => {
    if (services.length >= 5) return;
    const id = nextServiceId.current++;
    setServices((current) => [...current, { id, name: "", price: "", description: "" }]);
  };

  const removeService = (id: number) => {
    setServices((current) => current.filter((service) => service.id !== id));
  };

  const clearError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrors((current) => ({ ...current, logo: "El archivo original no puede superar 8 MB." }));
      event.target.value = "";
      return;
    }
    clearError("logo");
    try {
      setLogoDataUrl(await compressImageFile(file, 512, 350_000));
    } catch (reason) {
      setErrors((current) => ({ ...current, logo: reason instanceof Error ? reason.message : "No se pudo procesar el logo." }));
      event.target.value = "";
    }
  };

  const handleCoverFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setErrors((current) => ({ ...current, cover: "El archivo original no puede superar 12 MB." }));
      event.target.value = "";
      return;
    }
    clearError("cover");
    try {
      setCoverDataUrl(await compressImageFile(file, 1600, 1_400_000));
    } catch (reason) {
      setErrors((current) => ({ ...current, cover: reason instanceof Error ? reason.message : "No se pudo procesar la portada." }));
      event.target.value = "";
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextErrors: FieldErrors = {};
    const country = read(form, "country");
    const city = read(form, "city");
    const description = read(form, "description");
    const phone = read(form, "phone");
    const email = read(form, "email");
    const customBusinessType = read(form, "customBusinessType");

    if (businessName.trim().length < 2) nextErrors.businessName = "Escribe el nombre de tu negocio.";
    if (!businessType) nextErrors.businessType = "Selecciona la categoría que mejor describe tu negocio.";
    if (businessType === "other" && customBusinessType.length < 2) nextErrors.customBusinessType = "Describe brevemente el tipo de negocio.";
    if (!country) nextErrors.country = "Selecciona el país.";
    if (city.length < 2) nextErrors.city = "Escribe la ciudad o zona donde atiendes.";
    if (description.length < 20) nextErrors.description = "Cuéntanos un poco más: usa al menos 20 caracteres.";
    if (!services[0]?.name.trim()) nextErrors[`service-${services[0]?.id}-name`] = "Agrega al menos un producto o servicio.";
    if (!services[0]?.price.trim()) nextErrors[`service-${services[0]?.id}-price`] = "Indica un precio o escribe “Cotización”.";
    if (!phone && !email) nextErrors.phone = "Agrega un teléfono o un correo de contacto.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Escribe un correo válido.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
        first?.focus();
      });
      return;
    }

    const palette = PALETTES.find((item) => item.id === paletteId) ?? PALETTES[0];
    const street = read(form, "street");
    const opensAt = read(form, "opensAt");
    const closesAt = read(form, "closesAt");
    const hours = opensAt && closesAt
      ? `${read(form, "hoursDays") || "Lun–Vie"} ${opensAt}–${closesAt}`
      : "";
    const instagram = read(form, "instagram");
    const facebook = read(form, "facebook");
    const targetCustomer = read(form, "targetCustomer") || `Clientes potenciales en ${city}`;
    const serviceFacts = services
      .filter((service) => service.name.trim())
      .map((service) => {
        const details = [service.description.trim(), service.price.trim() && `Precio: ${service.price.trim()}`].filter(Boolean).join(". ");
        return `${service.name.trim()}: ${details || "Consultar detalles"}`;
      })
      .join("\n")
      .slice(0, 1200);
    const proofPoints = [
      description,
      hours && `Horario: ${hours}`,
      street && `Dirección: ${street}`,
      instagram && `Instagram: ${instagram}`,
      facebook && `Facebook: ${facebook}`,
    ].filter(Boolean).join("\n").slice(0, 800);

    setSubmitting(true);
    if (logoMode === "upload" && logoDataUrl) {
      sessionStorage.setItem("cluster_logo", logoDataUrl);
    } else {
      sessionStorage.removeItem("cluster_logo");
    }
    if (coverMode === "upload" && coverDataUrl) {
      sessionStorage.setItem("cluster_cover", coverDataUrl);
    } else {
      sessionStorage.removeItem("cluster_cover");
    }
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
      businessName: businessName.trim(),
      businessType,
      customBusinessType: businessType === "other" ? customBusinessType : "",
      location: [city, country].filter(Boolean).join(", "),
      services: serviceFacts,
      targetCustomer,
      proofPoints,
      goal: phone ? "calls" : "professional_presence",
      phone,
      email,
      domain: slug,
      language: read(form, "language") || "es",
      visualStyle: palette.style,
      palette: {
        primary: palette.colors[0],
        secondary: palette.colors[1],
        accent: palette.colors[2],
        background: palette.colors[3],
        text: palette.colors[4],
      },
      socialLinks: { instagram, facebook },
    }));
    router.push("/builder/generating");
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="overflow-hidden rounded-xl border border-[#494454] bg-[#15121b] text-[#f7f2fb] shadow-[0_28px_90px_rgb(0_0_0/0.42)]"
      aria-label="Formulario guiado para crear un sitio"
    >
      <div className="border-b border-[#3d3549] bg-[#1d1a23] px-5 py-6 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Inicio guiado</p>
        <h3 className="mt-2 font-[var(--font-outfit)] text-2xl font-bold tracking-[-0.025em] sm:text-3xl">Crea tu sitio web paso a paso</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8afc2]">
          Completa lo que sepas. La IA organizará el contenido, diseñará la portada y dejará todo listo para editar.
        </p>
      </div>

      <div className="space-y-8 px-5 py-7 sm:px-8 sm:py-9">
        <fieldset className="space-y-5">
          <legend className="flex items-center gap-2 text-base font-bold"><Store className="h-5 w-5 text-[#a078ff]" /> Tu negocio</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre del negocio" required error={errors.businessName} className="sm:col-span-2">
              <input
                id={`${formId}-business-name`}
                name="businessName"
                value={businessName}
                maxLength={120}
                autoComplete="organization"
                onChange={(event) => updateBusinessName(event.target.value)}
                aria-invalid={Boolean(errors.businessName)}
                className={fieldClass(Boolean(errors.businessName))}
                placeholder="Ej. Café Luna"
              />
            </Field>
            <Field label="Categoría" required error={errors.businessType} className="sm:col-span-2">
              <select
                id={`${formId}-business-type`}
                name="businessType"
                value={businessType}
                onChange={(event) => { setBusinessType(event.target.value); clearError("businessType"); }}
                aria-invalid={Boolean(errors.businessType)}
                className={fieldClass(Boolean(errors.businessType))}
              >
                <option value="">Selecciona una categoría</option>
                {BUSINESS_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            {businessType === "other" && (
              <Field label="¿Qué tipo de negocio es?" required error={errors.customBusinessType} className="sm:col-span-2">
                <input
                  id={`${formId}-custom-type`}
                  name="customBusinessType"
                  maxLength={80}
                  onChange={() => clearError("customBusinessType")}
                  aria-invalid={Boolean(errors.customBusinessType)}
                  className={fieldClass(Boolean(errors.customBusinessType))}
                  placeholder="Ej. Estudio de arquitectura"
                />
              </Field>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-lg border border-[#3d3549] bg-[#1d1a23] p-5 sm:p-6">
          <legend className="flex items-center gap-2 px-2 text-base font-bold"><MapPin className="h-5 w-5 text-[#a078ff]" /> Ubicación y horarios</legend>
          <p className="mb-5 text-sm text-[#aaa1b5]">Estos datos ayudan a tus clientes a encontrarte y saber cuándo contactarte.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="País" required error={errors.country}>
              <select id={`${formId}-country`} name="country" onChange={() => clearError("country")} aria-invalid={Boolean(errors.country)} className={fieldClass(Boolean(errors.country))}>
                <option value="">Selecciona el país</option>
                {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </Field>
            <Field label="Ciudad o zona" required error={errors.city}>
              <input id={`${formId}-city`} name="city" maxLength={80} autoComplete="address-level2" onChange={() => clearError("city")} aria-invalid={Boolean(errors.city)} className={fieldClass(Boolean(errors.city))} placeholder="Ej. Managua" />
            </Field>
            <Field label="Calle y número" hint="Opcional" className="sm:col-span-2">
              <input id={`${formId}-street`} name="street" maxLength={160} autoComplete="street-address" className={fieldClass(false)} placeholder="Ej. Avenida Principal, edificio 12" />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="flex w-full items-center gap-2 text-sm font-semibold text-[#e7e0ed]">
                <Clock3 className="h-4 w-4 text-[#a078ff]" aria-hidden="true" />
                Horario de atención
                <span className="ml-auto text-xs font-normal text-[#958ea0]">Opcional</span>
              </legend>
              <div className="mt-2 grid gap-3 rounded-lg border border-[#3d3549] bg-[#15121b] p-4 sm:grid-cols-[1.35fr_1fr_1fr]">
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-[#aaa1b5]">Días</span>
                  <select id={`${formId}-hours-days`} name="hoursDays" defaultValue="Lun–Vie" className={fieldClass(false)}>
                    <option>Lun–Vie</option>
                    <option>Lun–Sáb</option>
                    <option>Todos los días</option>
                    <option>Fin de semana</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-[#aaa1b5]">Abre</span>
                  <input id={`${formId}-opens-at`} name="opensAt" type="time" className={fieldClass(false)} />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-xs font-medium text-[#aaa1b5]">Cierra</span>
                  <input id={`${formId}-closes-at`} name="closesAt" type="time" className={fieldClass(false)} />
                </label>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#958ea0]">Déjalo vacío si no quieres mostrar un horario.</p>
            </fieldset>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-base font-bold">Cuéntanos a qué se dedica tu negocio</legend>
          <Field label="Descripción" required error={errors.description} hint="Mínimo 20 caracteres">
            <textarea
              id={`${formId}-description`}
              name="description"
              rows={5}
              maxLength={800}
              onChange={() => clearError("description")}
              aria-invalid={Boolean(errors.description)}
              className={`${fieldClass(Boolean(errors.description))} min-h-32 resize-y py-3`}
              placeholder="Cuenta quién eres, qué haces y qué hace especial a tu negocio."
            />
          </Field>
          <Field label="¿A quién quieres atraer?" hint="Opcional">
            <input id={`${formId}-target-customer`} name="targetCustomer" maxLength={240} className={fieldClass(false)} placeholder="Ej. Familias, empresas locales o turistas" />
          </Field>
        </fieldset>

        <fieldset className="rounded-lg border border-[#3d3549] bg-[#1d1a23] p-5 sm:p-6">
          <legend className="flex items-center gap-2 px-2 text-base font-bold"><PackagePlus className="h-5 w-5 text-[#a078ff]" /> Productos o servicios</legend>
          <p className="mb-5 text-sm text-[#aaa1b5]">Agrega al menos uno. Puedes incluir hasta cinco.</p>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className="rounded-lg border border-[#3d3549] bg-[#15121b] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Producto o servicio {index + 1}</p>
                  {services.length > 1 && (
                    <button type="button" onClick={() => removeService(service.id)} aria-label={`Eliminar producto o servicio ${index + 1}`} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-[#958ea0] hover:bg-red-950/60 hover:text-[#ffb4ab]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_0.55fr]">
                  <Field label="Nombre" required error={errors[`service-${service.id}-name`]}>
                    <input name={`service-${service.id}-name`} value={service.name} maxLength={100} onChange={(event) => updateService(service.id, "name", event.target.value)} aria-invalid={Boolean(errors[`service-${service.id}-name`])} className={fieldClass(Boolean(errors[`service-${service.id}-name`]))} placeholder="Ej. Corte de cabello" />
                  </Field>
                  <Field label="Precio" required={index === 0} error={errors[`service-${service.id}-price`]}>
                    <input name={`service-${service.id}-price`} value={service.price} maxLength={80} onChange={(event) => updateService(service.id, "price", event.target.value)} aria-invalid={Boolean(errors[`service-${service.id}-price`])} className={fieldClass(Boolean(errors[`service-${service.id}-price`]))} placeholder="$25 o Cotización" />
                  </Field>
                  <Field label="Descripción breve" hint="Opcional" className="sm:col-span-2">
                    <input name={`service-${service.id}-description`} value={service.description} maxLength={220} onChange={(event) => updateService(service.id, "description", event.target.value)} className={fieldClass(false)} placeholder="Qué incluye o por qué deberían elegirlo" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addService} disabled={services.length >= 5} className="mt-4 w-full border-dashed border-[#5b5068] bg-[#15121b] text-[#cbc3d7] hover:border-[#8b5cf6] hover:bg-[#2c2141]">
            <Plus /> {services.length >= 5 ? "Máximo de cinco productos" : "Agregar otro producto o servicio"}
          </Button>
        </fieldset>

        <fieldset className="rounded-lg border border-[#3d3549] bg-[#1d1a23] p-5 sm:p-6">
          <legend className="flex items-center gap-2 px-2 text-base font-bold"><Phone className="h-5 w-5 text-[#a078ff]" /> Cómo te contactan</legend>
          <p className="mb-5 text-sm text-[#aaa1b5]">Agrega un teléfono o correo para que tus visitantes puedan comunicarse.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Teléfono o WhatsApp" error={errors.phone}>
              <input id={`${formId}-phone`} name="phone" type="tel" maxLength={40} autoComplete="tel" onChange={() => clearError("phone")} aria-invalid={Boolean(errors.phone)} className={fieldClass(Boolean(errors.phone))} placeholder="+505 8888 8888" />
            </Field>
            <Field label="Correo" error={errors.email}>
              <input id={`${formId}-email`} name="email" type="email" maxLength={160} autoComplete="email" onChange={() => { clearError("email"); clearError("phone"); }} aria-invalid={Boolean(errors.email)} className={fieldClass(Boolean(errors.email))} placeholder="hola@minegocio.com" />
            </Field>
            <Field label="Instagram" hint="Opcional">
              <input id={`${formId}-instagram`} name="instagram" maxLength={120} className={fieldClass(false)} placeholder="@minegocio" />
            </Field>
            <Field label="Facebook" hint="Opcional">
              <input id={`${formId}-facebook`} name="facebook" maxLength={160} className={fieldClass(false)} placeholder="facebook.com/mi-negocio" />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-2 text-base font-bold"><Palette className="h-5 w-5 text-[#a078ff]" /> Paleta de colores</legend>
          <p className="mt-1 text-sm text-[#aaa1b5]">Cada opción combina color primario, secundario, acento, fondo y texto.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PALETTES.map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => setPaletteId(palette.id)}
                aria-pressed={paletteId === palette.id}
                aria-label={`Paleta ${palette.label}`}
                className={`min-h-20 cursor-pointer rounded-lg border p-3 text-left transition-[background-color,border-color,box-shadow] ${paletteId === palette.id ? "border-[#8b5cf6] bg-[#2c2141] shadow-[0_0_0_2px_rgb(139_92_246/0.18)]" : "border-[#494454] bg-[#1d1a23] hover:border-[#6f647d] hover:bg-[#25212b]"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#e7e0ed]">{palette.label}</span>
                  {paletteId === palette.id && <Check className="h-4 w-4 text-[#c4b5fd]" aria-hidden="true" />}
                </span>
                <span className="mt-3 flex overflow-hidden rounded-md border border-white/10" aria-hidden="true">
                  {palette.colors.map((color, index) => (
                    <span key={`${palette.id}-${index}`} className={`h-7 flex-1 ${index === palette.colors.length - 1 ? "" : "border-r border-black/15"}`} style={{ backgroundColor: color }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="flex items-center gap-2 text-base font-bold"><ImageIcon className="h-5 w-5 text-[#a078ff]" /> Logo e imagen de portada</legend>
          <p className="text-sm text-[#aaa1b5]">Sube tus propias imágenes o deja que la IA las prepare por ti.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <MediaUploadCard
              label="Logo"
              aiHint="La IA usará el nombre de tu negocio"
              mode={logoMode}
              preview={logoDataUrl}
              error={errors.logo}
              onModeChange={(m) => { setLogoMode(m); clearError("logo"); }}
              onFileChange={handleLogoFile}
              onRemove={() => { setLogoDataUrl(null); clearError("logo"); if (logoInputRef.current) logoInputRef.current.value = ""; }}
              inputRef={logoInputRef}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              maxSize="8 MB"
            />
            <MediaUploadCard
              label="Imagen de portada"
              aiHint="La IA elegirá una imagen profesional"
              mode={coverMode}
              preview={coverDataUrl}
              error={errors.cover}
              onModeChange={(m) => { setCoverMode(m); clearError("cover"); }}
              onFileChange={handleCoverFile}
              onRemove={() => { setCoverDataUrl(null); clearError("cover"); if (coverInputRef.current) coverInputRef.current.value = ""; }}
              inputRef={coverInputRef}
              accept="image/png,image/jpeg,image/webp"
              maxSize="12 MB"
            />
          </div>
        </fieldset>

        <div className="grid gap-5 rounded-lg border border-[#4c3968] bg-[#241a35] p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[#e9ddff]"><Sparkles className="h-4 w-4" /> Imágenes incluidas</p>
            <p className="mt-1 text-sm leading-6 text-[#bcaed0]">
              {coverMode === "upload" && coverDataUrl ? "Usaremos tu imagen de portada en el diseño." : "La IA preparará una imagen de portada acorde a tu negocio."}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[#e9ddff]"><Globe2 className="h-4 w-4" /> Página principal</p>
            <p className="mt-1 text-sm leading-6 text-[#bcaed0]">El resultado será un sitio tipo home, fácil de recorrer y editar.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_0.45fr]">
          <Field label="Tu enlace" required>
            <div className="flex min-w-0 rounded-md border border-[#494454] bg-[#120c1d] focus-within:border-[#8b5cf6] focus-within:ring-2 focus-within:ring-[#8b5cf6]/25">
              <span className="hidden items-center border-r border-[#494454] px-3 text-sm text-[#958ea0] sm:flex">cluster.site/s/</span>
              <input
                id={`${formId}-slug`}
                name="slug"
                value={slug}
                maxLength={80}
                onChange={(event) => { setSlugEdited(true); setSlug(toSlug(event.target.value)); }}
                className="h-12 min-w-0 flex-1 rounded-md bg-transparent px-3 text-base outline-none sm:text-sm"
                placeholder="mi-negocio"
              />
            </div>
          </Field>
          <Field label="Idioma">
            <select id={`${formId}-language`} name="language" className={fieldClass(false)} defaultValue="es">
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="bilingual">Bilingüe</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="border-t border-[#3d3549] bg-[#1d1a23] px-5 py-5 sm:px-8">
        <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-md bg-violet-600 text-white hover:bg-violet-700">
          {submitting ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {submitting ? "Preparando tu sitio" : "Crear mi sitio web"}
          {!submitting && <ArrowRight />}
        </Button>
        <p className="mt-3 text-center text-xs text-[#958ea0]">Crearás una página home que podrás personalizar antes de publicarla.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#e7e0ed]">
        {label} {required && <span className="text-[#ffb4ab]" aria-hidden="true">*</span>}
        {hint && <span className="ml-auto text-xs font-normal text-[#958ea0]">{hint}</span>}
      </span>
      {children}
      {error && <span role="alert" className="mt-1.5 block text-sm font-medium text-[#ffb4ab]">{error}</span>}
    </label>
  );
}

function MediaUploadCard({
  label,
  aiHint,
  mode,
  preview,
  error,
  onModeChange,
  onFileChange,
  onRemove,
  inputRef,
  accept,
  maxSize,
}: {
  label: string;
  aiHint: string;
  mode: MediaMode;
  preview: string | null;
  error?: string;
  onModeChange: (mode: MediaMode) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  accept: string;
  maxSize: string;
}) {
  return (
    <div className="rounded-lg border border-[#3d3549] bg-[#1d1a23] p-4">
      <p className="mb-3 text-sm font-semibold text-[#e7e0ed]">{label}</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange("ai")}
          className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-[background-color,border-color] ${
            mode === "ai"
              ? "border-[#8b5cf6] bg-[#2c2141] text-[#c4b5fd]"
              : "border-[#494454] bg-[#15121b] text-[#958ea0] hover:border-[#6f647d] hover:text-[#cbc3d7]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          IA lo hace
        </button>
        <button
          type="button"
          onClick={() => onModeChange("upload")}
          className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-[background-color,border-color] ${
            mode === "upload"
              ? "border-[#8b5cf6] bg-[#2c2141] text-[#c4b5fd]"
              : "border-[#494454] bg-[#15121b] text-[#958ea0] hover:border-[#6f647d] hover:text-[#cbc3d7]"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Subir
        </button>
      </div>

      {mode === "ai" ? (
        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-[#3d3549] bg-[#15121b]">
          <div className="text-center">
            <Sparkles className="mx-auto h-6 w-6 text-[#a078ff] opacity-50" />
            <p className="mt-2 text-xs leading-5 text-[#70677a]">{aiHint}</p>
          </div>
        </div>
      ) : preview ? (
        <div className="relative h-28 overflow-hidden rounded-lg border border-[#3d3549]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="h-full w-full object-contain bg-[#0f0d15]" />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Eliminar ${label}`}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f0d15]/80 text-[#f7f2fb] hover:bg-red-950 hover:text-[#ffb4ab]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#5b5068] bg-[#15121b] text-[#958ea0] transition-[border-color,background-color] hover:border-[#8b5cf6] hover:bg-[#1e1a2b] hover:text-[#cbc3d7]"
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">Haz clic para subir</span>
          <span className="text-[10px] opacity-70">Máx. {maxSize}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        aria-label={`Subir ${label}`}
        accept={accept}
        className="sr-only"
        onChange={onFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
      {error && <span role="alert" className="mt-2 block text-xs font-medium text-[#ffb4ab]">{error}</span>}
    </div>
  );
}

function fieldClass(invalid: boolean) {
  return `h-12 w-full rounded-md border bg-[#120c1d] px-3 text-base text-[#f7f2fb] outline-none transition-[border-color,box-shadow] placeholder:text-[#70677a] focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/25 sm:text-sm ${invalid ? "border-[#ff8a80] ring-2 ring-red-950/70" : "border-[#494454]"}`;
}

function read(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
