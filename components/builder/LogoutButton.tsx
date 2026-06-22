"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      title="Cerrar sesión"
      className="flex min-h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-[#2d243d] hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Salir</span>
    </button>
  );
}
