import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="soft-grid flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="text-sm font-semibold text-[#a078ff]">404</p>
      <h1 className="mt-2 text-2xl font-bold">
        No encontramos lo que buscas
      </h1>
      <p className="mt-2 text-muted-foreground">
        El sitio o la página solicitada no existe.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    </main>
  );
}
