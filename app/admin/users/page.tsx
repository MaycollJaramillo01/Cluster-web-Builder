import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminUserForm } from "@/components/builder/AdminUserForm";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios | Cluster Web Builder" };

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?from=/admin/users");
  if (currentUser.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, name: true, email: true, role: true, createdAt: true, _count: { select: { sites: true } } },
  });

  return (
    <main className="min-h-dvh bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Administración</p><h1 className="mt-2 text-3xl font-semibold">Usuarios</h1></div>
          <Button asChild variant="outline"><Link href="/dashboard">Volver</Link></Button>
        </div>
        <AdminUserForm />
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground"><tr><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Proyectos</th><th className="p-3">Creado</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id} className="border-t border-border"><td className="p-3"><div className="font-medium">{user.name || user.username}</div><div className="text-xs text-muted-foreground">{user.email || `@${user.username}`}</div></td><td className="p-3">{user.role}</td><td className="p-3">{user._count.sites}</td><td className="p-3">{user.createdAt.toLocaleDateString("es")}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
