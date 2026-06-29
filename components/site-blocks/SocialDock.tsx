import { Facebook, Instagram, Linkedin, MessageCircle, Music2, Youtube } from "lucide-react";

import type { SocialLinks } from "@/lib/site/social-links";

const SOCIALS = [
  ["instagram", "Instagram", Instagram],
  ["facebook", "Facebook", Facebook],
  ["tiktok", "TikTok", Music2],
  ["linkedin", "LinkedIn", Linkedin],
  ["youtube", "YouTube", Youtube],
] as const;

export function SocialDock({ businessName, phone, links = {} }: { businessName: string; phone?: string | null; links?: SocialLinks }) {
  const whatsapp = phone?.replace(/\D/g, "");
  const items: Array<{ key: string; label: string; Icon: typeof Instagram; href: string }> = SOCIALS.flatMap(([key, label, Icon]) => links[key] ? [{ key, label, Icon, href: links[key]! }] : []);
  if (whatsapp && whatsapp.length >= 8) {
    items.unshift({ key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, href: `https://wa.me/${whatsapp}` });
  }
  if (items.length === 0) return null;

  return (
    <nav aria-label={`Redes y contacto de ${businessName}`} className="site-social-dock fixed bottom-5 right-4 z-40 flex flex-col gap-2 sm:right-5">
      {items.map(({ key, label, Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${label} de ${businessName}`}
          className="group relative flex min-h-12 min-w-12 items-center justify-center rounded-full border border-white/20 bg-[#111018]/95 text-white shadow-[0_12px_32px_rgb(0_0_0/0.28)] backdrop-blur-md transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#211c2c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-[#111018] px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {label}
          </span>
        </a>
      ))}
    </nav>
  );
}
