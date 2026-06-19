import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="soft-grid flex min-h-screen flex-col items-center justify-center bg-[#f7f7fa] px-6 text-center text-slate-950">
      <p className="text-sm font-semibold text-violet-700">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">
        No encontramos lo que buscas
      </h1>
      <p className="mt-2 text-slate-500">
        El sitio o la página solicitada no existe.
      </p>
      <Button asChild className="mt-6 bg-violet-700 text-white hover:bg-violet-800">
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    </main>
  );
}
