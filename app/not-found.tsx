import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        No encontramos lo que buscas
      </h1>
      <p className="mt-2 text-slate-500">
        El sitio o la página solicitada no existe.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    </main>
  );
}
