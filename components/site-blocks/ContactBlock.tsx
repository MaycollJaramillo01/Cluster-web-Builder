"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send } from "lucide-react";

import type { ContactStyle } from "@/lib/site/design";
import { getContrastText, getThemeSurface } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import type { BlockProps, BlockSiteInfo } from "./types";

type Status = "idle" | "sending" | "sent" | "error";
type InputMode = "boxed" | "line" | "soft" | "brutal";

type ContactLayout = {
  section: string;
  shell: string;
  info: string;
  form: string;
  fields: string;
  phone: string;
  message: string;
  details: string;
  button: string;
  inputMode: InputMode;
  formFirst?: boolean;
  dark?: boolean;
  eyebrow?: string;
};

export const CONTACT_LAYOUTS: Record<ContactStyle, ContactLayout> = {
  split: { section: "px-6 py-20 sm:py-24", shell: "mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-start", info: "md:sticky md:top-28", form: "p-7 sm:p-8", fields: "grid gap-5 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-8 space-y-4", button: "w-full", inputMode: "boxed", eyebrow: "Conversemos" },
  editorial: { section: "px-6 py-24 sm:py-32", shell: "mx-auto grid max-w-6xl gap-12 border-y py-12 md:grid-cols-[0.72fr_1.28fr] md:gap-20", info: "max-w-sm", form: "", fields: "grid gap-7", phone: "", message: "", details: "mt-10 grid gap-5 border-t pt-6", button: "w-auto min-w-48", inputMode: "line", eyebrow: "Correspondencia" },
  spotlight: { section: "px-6 py-24 sm:py-32", shell: "mx-auto max-w-4xl text-center", info: "mx-auto max-w-2xl", form: "mx-auto mt-12 p-7 text-left sm:p-10", fields: "grid gap-5 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3", button: "w-full sm:w-auto sm:min-w-56", inputMode: "soft", dark: true, eyebrow: "Tu próximo paso" },
  glass: { section: "px-6 py-20 sm:py-28", shell: "mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center", info: "p-4 md:p-8", form: "backdrop-blur-xl p-7 sm:p-9", fields: "grid gap-4 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-1", button: "w-full", inputMode: "soft", eyebrow: "Estamos cerca" },
  floating: { section: "px-6 pb-24 pt-28 sm:pb-32", shell: "relative mx-auto max-w-5xl pt-28 md:pt-20", info: "absolute inset-x-5 top-0 z-10 p-7 md:left-10 md:right-auto md:w-[42%] md:p-9", form: "ml-auto p-7 pt-36 sm:p-10 sm:pt-36 md:w-[68%] md:pl-[30%] md:pt-10", fields: "grid gap-5", phone: "", message: "", details: "mt-6 space-y-3", button: "w-full", inputMode: "soft", eyebrow: "Contacto directo" },
  minimalLine: { section: "px-6 py-24 sm:py-36", shell: "mx-auto max-w-4xl", info: "max-w-2xl", form: "mt-14", fields: "grid gap-x-10 gap-y-8 sm:grid-cols-2", phone: "", message: "sm:col-span-2", details: "mt-8 flex flex-wrap gap-x-8 gap-y-3", button: "w-auto border-b pb-2", inputMode: "line", eyebrow: "Escríbenos" },
  reverse: { section: "px-6 py-20 sm:py-24", shell: "mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center", info: "p-4 md:order-2 md:p-8", form: "p-7 sm:p-9", fields: "grid gap-5 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-8 space-y-4", button: "w-full", inputMode: "boxed", formFirst: true, eyebrow: "Cuéntanos tu idea" },
  brutal: { section: "px-5 py-20 sm:px-8 sm:py-28", shell: "mx-auto grid max-w-6xl gap-0 md:grid-cols-2", info: "border-[3px] p-7 sm:p-10", form: "border-[3px] p-7 sm:p-10 md:border-l-0", fields: "grid gap-4", phone: "", message: "", details: "mt-8 grid gap-3", button: "w-full uppercase tracking-widest", inputMode: "brutal", eyebrow: "Hablemos claro" },
  centered: { section: "px-6 py-24 sm:py-32", shell: "mx-auto max-w-3xl text-center", info: "mx-auto max-w-xl", form: "mt-12 p-7 text-left sm:p-10", fields: "grid gap-5", phone: "", message: "", details: "mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3", button: "w-full", inputMode: "boxed", eyebrow: "Contacto" },
  bordered: { section: "px-6 py-20 sm:py-28", shell: "mx-auto max-w-6xl border p-6 sm:p-10 md:p-14", info: "grid gap-5 border-b pb-9 md:grid-cols-[1fr_auto] md:items-end", form: "pt-10", fields: "grid gap-5 md:grid-cols-3", phone: "", message: "md:col-span-3", details: "flex flex-wrap gap-x-6 gap-y-3 md:justify-end", button: "w-full md:w-auto md:min-w-52", inputMode: "boxed", eyebrow: "Canal abierto" },
  offset: { section: "overflow-hidden px-6 py-24 sm:py-32", shell: "mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center", info: "relative z-10 md:pr-10", form: "relative p-7 before:absolute before:-inset-3 before:-z-10 before:border sm:p-9 md:translate-x-4", fields: "grid gap-5", phone: "", message: "", details: "mt-9 grid gap-4", button: "w-full", inputMode: "soft", eyebrow: "Empecemos" },
  dark: { section: "px-6 py-24 sm:py-32", shell: "mx-auto grid max-w-6xl gap-14 md:grid-cols-[0.8fr_1.2fr]", info: "", form: "border p-7 sm:p-9", fields: "grid gap-5 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-10 space-y-4", button: "w-full sm:w-auto sm:min-w-52", inputMode: "line", dark: true, eyebrow: "Disponible ahora" },
  asymmetric: { section: "px-6 py-20 sm:py-28", shell: "mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:gap-20", info: "lg:pt-16", form: "p-7 sm:p-10", fields: "grid gap-5 sm:grid-cols-2", phone: "", message: "sm:col-span-2", details: "mt-10 grid gap-4", button: "w-full sm:w-auto sm:min-w-48", inputMode: "soft", eyebrow: "Una buena conversación" },
  quote: { section: "px-6 py-24 sm:py-32", shell: "mx-auto max-w-5xl", info: "grid gap-8 border-b pb-12 md:grid-cols-[1.4fr_0.6fr] md:items-end", form: "mx-auto mt-12 max-w-3xl", fields: "grid gap-x-8 gap-y-6 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "grid gap-3 md:text-right", button: "w-auto min-w-52", inputMode: "line", eyebrow: "Queremos escucharte" },
  sidebar: { section: "px-6 py-20 sm:py-28", shell: "mx-auto grid max-w-6xl overflow-hidden md:grid-cols-[0.68fr_1.32fr]", info: "p-7 sm:p-10", form: "p-7 sm:p-10", fields: "grid gap-5 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-10 space-y-5", button: "w-full", inputMode: "boxed", eyebrow: "Información" },
  banner: { section: "px-6 py-20 sm:py-28", shell: "mx-auto max-w-6xl", info: "grid gap-8 border-b pb-10 md:grid-cols-[1fr_auto] md:items-end", form: "mt-10", fields: "grid gap-5 md:grid-cols-3", phone: "", message: "md:col-span-3", details: "flex flex-wrap gap-x-6 gap-y-3 md:justify-end", button: "w-full md:w-auto md:min-w-56", inputMode: "boxed", eyebrow: "Agenda abierta" },
  framed: { section: "px-6 py-20 sm:py-28", shell: "mx-auto max-w-5xl border p-3 sm:p-5", info: "border p-7 text-center sm:p-10", form: "border border-t-0 p-7 sm:p-10", fields: "grid gap-5 sm:grid-cols-2", phone: "sm:col-span-2", message: "sm:col-span-2", details: "mt-7 flex flex-wrap justify-center gap-x-7 gap-y-3", button: "w-full", inputMode: "soft", eyebrow: "Visítanos o escribe" },
  steps: { section: "px-6 py-20 sm:py-28", shell: "mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr]", info: "before:mb-6 before:block before:text-5xl before:font-black before:content-['01']", form: "p-7 before:mb-6 before:block before:text-xs before:font-bold before:tracking-[.25em] before:content-['02_·_ENVÍA_TU_CONSULTA'] sm:p-9", fields: "grid gap-5", phone: "", message: "", details: "mt-9 grid gap-4", button: "w-full", inputMode: "boxed", eyebrow: "Dos pasos" },
  stacked: { section: "px-6 py-24 sm:py-32", shell: "mx-auto max-w-2xl", info: "", form: "mt-10", fields: "grid gap-6", phone: "", message: "", details: "mt-8 grid gap-3 border-y py-6 sm:grid-cols-2", button: "w-full", inputMode: "line", eyebrow: "Déjanos un mensaje" },
  compact: { section: "px-6 py-16 sm:py-20", shell: "mx-auto max-w-6xl", info: "grid gap-5 md:grid-cols-[1fr_auto] md:items-end", form: "mt-8 p-6 sm:p-7", fields: "grid gap-4 md:grid-cols-3", phone: "", message: "md:col-span-3", details: "flex flex-wrap gap-x-6 gap-y-2 md:justify-end", button: "w-full md:w-auto md:min-w-44", inputMode: "soft", eyebrow: "Respuesta rápida" },
};

export function ContactBlock({ section, theme, preset, site }: BlockProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const surface = getThemeSurface(theme);
  const layout = CONTACT_LAYOUTS[preset.contactStyle];
  const fieldPrefix = `contact-${section.id}`;
  const darkBackground = preset.contactStyle === "spotlight" ? theme.text : theme.secondary;
  const sectionBackground = layout.dark ? darkBackground : surface.section;
  const sectionText = layout.dark ? getContrastText(sectionBackground) : theme.text;
  const mutedText = layout.dark ? `${sectionText}b8` : surface.muted;
  const infoBackground = preset.contactStyle === "floating" ? theme.primary : preset.contactStyle === "sidebar" ? theme.secondary : undefined;
  const infoText = infoBackground ? getContrastText(infoBackground) : sectionText;
  const infoMuted = infoBackground ? `${infoText}b8` : mutedText;
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const bodyStyle = resolveElementStyle("body", getStyleOverride(section.settings, "body"));
  const ctaTextStyle = resolveElementStyle("ctaText", getStyleOverride(section.settings, "ctaText"));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!site.publicSlug) {
      setStatus("error");
      setFeedback("El formulario quedará activo cuando publiques el sitio.");
      return;
    }
    setStatus("sending");
    const form = event.currentTarget;
    try {
      const response = await fetch(`/api/public/sites/${site.publicSlug}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo enviar el mensaje.");
      form.reset();
      setStatus("sent");
      setFeedback("Mensaje enviado correctamente.");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "No se pudo enviar. Intenta de nuevo.");
    }
  }

  const info = (
    <ContactInfo
      section={section}
      site={site}
      layout={layout}
      textColor={infoText}
      mutedColor={infoMuted}
      accentColor={infoBackground ? infoText : theme.primary}
      backgroundColor={infoBackground}
      preset={preset}
      titleStyle={titleStyle}
      bodyStyle={bodyStyle}
    />
  );
  const form = (
    <ContactForm
      section={section}
      layout={layout}
      fieldPrefix={fieldPrefix}
      status={status}
      feedback={feedback}
      onSubmit={submit}
      theme={theme}
      surface={surface}
      textColor={sectionText}
      mutedColor={mutedText}
      radius={preset.radius}
      buttonRadius={preset.buttonRadius}
      cardShadow={preset.cardShadow}
      contactStyle={preset.contactStyle}
      ctaTextStyle={ctaTextStyle}
    />
  );

  return (
    <section id="contact" data-contact-style={preset.contactStyle} className={layout.section} style={{ backgroundColor: sectionBackground, color: sectionText }}>
      <div className={layout.shell}>
        {layout.formFirst ? form : info}
        {layout.formFirst ? info : form}
      </div>
    </section>
  );
}

function ContactInfo({ section, site, layout, textColor, mutedColor, accentColor, backgroundColor, preset, titleStyle, bodyStyle }: {
  section: BlockProps["section"];
  site: BlockSiteInfo;
  layout: ContactLayout;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  backgroundColor?: string;
  preset: BlockProps["preset"];
  titleStyle: CSSProperties;
  bodyStyle: CSSProperties;
}) {
  return (
    <div className={layout.info} style={{ backgroundColor }}>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>{layout.eyebrow}</p>
      {section.title && (
        <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl" style={{ color: textColor, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight, textTransform: preset.uppercaseHeadings ? "uppercase" : "none", ...titleStyle }}>
          {section.title}
        </h2>
      )}
      {section.body && <p className="mt-5 max-w-2xl leading-relaxed" style={{ color: mutedColor, ...bodyStyle }}>{section.body}</p>}
      <ContactDetails site={site} className={layout.details} textColor={textColor} mutedColor={mutedColor} accentColor={accentColor} />
    </div>
  );
}

function ContactDetails({ site, className, textColor, mutedColor, accentColor }: { site: BlockSiteInfo; className: string; textColor: string; mutedColor: string; accentColor: string }) {
  const details = [
    site.phone ? { label: "Teléfono", value: site.phone, href: `tel:${site.phone}`, icon: <Phone aria-hidden="true" className="h-4 w-4" /> } : null,
    site.email ? { label: "Email", value: site.email, href: `mailto:${site.email}`, icon: <Mail aria-hidden="true" className="h-4 w-4" /> } : null,
    site.location ? { label: "Ubicación", value: site.location, icon: <MapPin aria-hidden="true" className="h-4 w-4" /> } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href?: string; icon: ReactNode }>;

  if (!details.length) return null;
  return (
    <ul className={className}>
      {details.map((detail) => (
        <li key={detail.label} className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center" style={{ color: accentColor, border: `1px solid ${accentColor}55`, borderRadius: "var(--site-btn-radius)" }}>{detail.icon}</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>{detail.label}</p>
            {detail.href ? <a href={detail.href} className="block break-words text-sm font-medium underline-offset-4 hover:underline" style={{ color: textColor }}>{detail.value}</a> : <p className="break-words text-sm font-medium" style={{ color: textColor }}>{detail.value}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ContactForm({ section, layout, fieldPrefix, status, feedback, onSubmit, theme, surface, textColor, mutedColor, radius, buttonRadius, cardShadow, contactStyle, ctaTextStyle }: {
  section: BlockProps["section"];
  layout: ContactLayout;
  fieldPrefix: string;
  status: Status;
  feedback: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  theme: BlockProps["theme"];
  surface: ReturnType<typeof getThemeSurface>;
  textColor: string;
  mutedColor: string;
  radius: string;
  buttonRadius: string;
  cardShadow: string;
  contactStyle: ContactStyle;
  ctaTextStyle: CSSProperties;
}) {
  const transparent = layout.inputMode === "line";
  const brutal = layout.inputMode === "brutal";
  const formBackground = transparent ? "transparent" : layout.dark ? `${theme.background}f2` : surface.panel;
  const formText = layout.dark && !transparent ? theme.text : textColor;
  const formMuted = layout.dark && !transparent ? surface.muted : mutedColor;
  const formBorder = brutal ? theme.text : `${formText}20`;
  const inputStyle: CSSProperties = {
    borderRadius: layout.inputMode === "line" || brutal ? "0" : buttonRadius === "9999px" ? "0.75rem" : buttonRadius,
    border: layout.inputMode === "line" ? "0" : `${brutal ? 2 : 1}px solid ${brutal ? formText : `${formText}32`}`,
    borderBottom: layout.inputMode === "line" ? `1px solid ${formText}66` : undefined,
    backgroundColor: layout.inputMode === "soft" ? `${theme.primary}0d` : "transparent",
    color: formText,
    outline: "none",
  };
  const shellStyle: CSSProperties = {
    borderRadius: ["editorial", "minimalLine", "brutal", "banner", "stacked", "compact"].includes(contactStyle) ? "0" : radius,
    backgroundColor: formBackground,
    borderColor: formBorder,
    boxShadow: brutal ? `10px 10px 0 ${theme.primary}` : undefined,
  };
  const feedbackId = `${fieldPrefix}-feedback`;

  return (
    <form onSubmit={onSubmit} className={`${layout.form} ${transparent ? "" : cardShadow}`} style={shellStyle} aria-describedby={feedbackId}>
      <div className={layout.fields}>
        <Field id={`${fieldPrefix}-name`} label="Nombre" className="" labelColor={formMuted}>
          <input id={`${fieldPrefix}-name`} name="name" required maxLength={120} autoComplete="name" placeholder="Tu nombre" className="min-h-12 w-full px-3.5 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2" style={inputStyle} />
        </Field>
        <Field id={`${fieldPrefix}-email`} label="Email" className="" labelColor={formMuted}>
          <input id={`${fieldPrefix}-email`} name="email" type="email" required maxLength={160} autoComplete="email" placeholder="tu@email.com" className="min-h-12 w-full px-3.5 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2" style={inputStyle} />
        </Field>
        <Field id={`${fieldPrefix}-phone`} label="Teléfono" optional className={layout.phone} labelColor={formMuted}>
          <input id={`${fieldPrefix}-phone`} name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="Tu teléfono" className="min-h-12 w-full px-3.5 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2" style={inputStyle} />
        </Field>
        <Field id={`${fieldPrefix}-message`} label="Mensaje" className={layout.message} labelColor={formMuted}>
          <textarea id={`${fieldPrefix}-message`} name="message" required maxLength={2000} rows={contactStyle === "compact" ? 3 : 5} placeholder="¿En qué podemos ayudarte?" className="w-full resize-y px-3.5 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2" style={inputStyle} />
        </Field>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className={`inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-[filter,opacity,transform] duration-200 hover:brightness-95 active:scale-[.99] disabled:cursor-wait disabled:opacity-60 ${layout.button}`} style={{ backgroundColor: theme.primary, color: getContrastText(theme.primary), borderRadius: contactStyle === "minimalLine" || contactStyle === "editorial" ? "0" : buttonRadius, ...ctaTextStyle }}>
          {status === "sent" ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <Send aria-hidden="true" className="h-4 w-4" />}
          {status === "sending" ? "Enviando..." : status === "sent" ? "Mensaje enviado" : section.ctaText || "Enviar mensaje"}
        </button>
        <p id={feedbackId} aria-live="polite" role={status === "error" ? "alert" : "status"} className="min-h-5 flex-1 text-xs" style={{ color: status === "error" ? "#dc2626" : formMuted }}>
          {feedback || "Responderemos a la brevedad posible."}
        </p>
      </div>
    </form>
  );
}

function Field({ id, label, optional, className, labelColor, children }: { id: string; label: string; optional?: boolean; className: string; labelColor: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: labelColor }}>
        {label}{optional && <span className="ml-1 normal-case font-normal tracking-normal opacity-70">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}
