import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";

import { HomeHero } from "@/components/marketing/HomeHero";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { HomeSections } from "@/components/marketing/HomeSections";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Cluster | Crea el sitio web de tu negocio", description: "Crea un sitio profesional con IA, edítalo y publícalo con hosting incluido." };
export const revalidate = 300;

export default function HomePage() {
  return <MarketingChrome>
    <main>
      <HomeHero />
      <HomeSections />

      <section className="border-t border-border bg-[#15121b] px-5 py-20 text-center sm:px-8"><Globe2 className="mx-auto h-8 w-8 text-[#a078ff]" /><h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Empieza con una idea. Termina con un sitio publicado.</h2><Button asChild size="lg" className="mt-8"><Link href="/builder">Crear mi sitio <ArrowRight /></Link></Button></section>
    </main>
  </MarketingChrome>;
}
