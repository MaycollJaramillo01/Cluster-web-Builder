import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  ["Plantillas", "/templates"],
  ["Dominios", "/domains"],
  ["Precios", "/pricing"],
  ["Ejemplos", "/examples"],
  ["Ayuda", "/help"],
] as const;

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  return <div className="marketing-shell min-h-dvh overflow-x-hidden text-foreground">
    <a href="#main-content" className="sr-only z-50 rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido</a>
    <header className="sticky top-0 z-40 border-b border-border bg-[#0f0d15]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
          {links.map(([label, href]) => <Link key={href} href={href} className="flex min-h-11 items-center rounded px-3 text-sm text-[#cbc3d7] transition-colors hover:bg-muted hover:text-foreground">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Iniciar sesión</Link></Button>
          <Button asChild size="sm"><Link href="/builder">Crear sitio gratis</Link></Button>
        </div>
        <details className="relative sm:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded border border-border" aria-label="Abrir menú"><Menu className="h-5 w-5" /></summary>
          <nav className="absolute right-0 top-12 w-64 rounded-lg border border-border bg-[#15121b] p-2 shadow-[var(--shadow-md)]" aria-label="Navegación móvil">
            {links.map(([label, href]) => <Link key={href} href={href} className="flex min-h-11 items-center rounded px-3 text-sm hover:bg-muted">{label}</Link>)}
            <Link href="/login" className="flex min-h-11 items-center rounded px-3 text-sm hover:bg-muted">Iniciar sesión</Link>
            <Button asChild className="mt-2 w-full"><Link href="/builder">Crear sitio gratis</Link></Button>
          </nav>
        </details>
      </div>
    </header>
    <div id="main-content">{children}</div>
    <footer className="border-t border-border bg-[#0f0d15]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-[1fr_auto] sm:px-8">
        <div><Brand /><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Crea, publica y administra el sitio de tu negocio desde un solo lugar.</p></div>
        <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-muted-foreground sm:grid-cols-3" aria-label="Enlaces del pie">
          {[...links, ["Privacidad", "/privacy"], ["Términos", "/terms"], ["Uso aceptable", "/acceptable-use"]].map(([label, href]) => <Link key={href} href={href} className="hover:text-foreground">{label}</Link>)}
        </nav>
      </div>
      <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Cluster Web Builder</div>
    </footer>
  </div>;
}

export function Brand() {
  return <Link href="/" className="flex shrink-0 items-center gap-3 font-semibold tracking-tight text-[#f7f2fb]">
    <Image
      src="/cluster-logo.webp"
      alt="Cluster logo"
      width={52}
      height={52}
      className="object-contain"
      style={{ filter: "invert(1)", mixBlendMode: "screen" }}
    />
    <span>Cluster</span>
  </Link>;
}
