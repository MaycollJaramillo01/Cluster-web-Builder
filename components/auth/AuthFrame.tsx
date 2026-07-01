import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/BrandMark";

export function AuthFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <main className="flex min-h-dvh items-center justify-center bg-[#0a0812] px-4 py-10 text-white">
    <div aria-hidden className="pointer-events-none fixed inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(rgba(139,92,246,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.05) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
    <div className="relative w-full max-w-md">
      <Link href="/" className="mb-7 flex items-center justify-center gap-3"><BrandMark /><span className="font-semibold">Cluster</span></Link>
      <div className="rounded-2xl border border-[#2d243d] bg-[#15121b] p-7 shadow-[0_24px_64px_rgba(0,0,0,.5)] sm:p-9">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#9d8fb5]">{description}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  </main>;
}

export const authInputClass = "min-h-12 w-full rounded-lg border border-[#3d3549] bg-[#1d1a23] px-4 text-base text-white outline-none placeholder:text-[#665a73] focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/25";
export const authButtonClass = "min-h-12 w-full rounded-lg bg-[#8b5cf6] px-5 font-semibold text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-wait disabled:opacity-60";
