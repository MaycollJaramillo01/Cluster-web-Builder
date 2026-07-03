"use client";

import { useRef, useState, type DragEvent } from "react";
import { upload } from "@vercel/blob/client";
import { ImageIcon, Loader2, Trash2, Video } from "lucide-react";

import { compressImageFile } from "@/lib/client-image";
import { cn } from "@/lib/utils";

type Props = {
  siteId: string;
  kind: "image" | "video";
  value: string;
  onChange: (url: string) => void;
  onUsageChange: () => void;
  /** "dark" para el editor V1 (por defecto), "light" para el editor V2. */
  tone?: "dark" | "light";
};

const types = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm"],
};

export function EditorMediaField({ siteId, kind, value, onChange, onUsageChange, tone = "dark" }: Props) {
  const light = tone === "light";
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const busy = progress > 0 && progress < 100;

  const process = async (original: File) => {
    const max = kind === "image" ? 8 * 1024 * 1024 : 60 * 1024 * 1024;
    if (!types[kind].includes(original.type)) return setError(kind === "image" ? "Usa JPG, PNG o WebP." : "Usa MP4 o WebM.");
    if (original.size > max) return setError(kind === "image" ? "La imagen no puede superar 8 MB." : "El video no puede superar 60 MB.");
    setError(null);
    setProgress(1);
    try {
      let file = original;
      if (kind === "image") {
        const dataUrl = await compressImageFile(original, 2000, 2_500_000);
        const blob = await (await fetch(dataUrl)).blob();
        file = new File([blob], `${original.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
      }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
      const pathname = `sites/${siteId}/${crypto.randomUUID()}.${extension}`;
      const result = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: `/api/sites/${siteId}/media`,
        clientPayload: JSON.stringify({ size: file.size, type: file.type }),
        contentType: file.type,
        multipart: kind === "video" && file.size > 10 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.max(1, Math.round(percentage))),
      });
      onChange(result.url);
      setProgress(100);
      onUsageChange();
    } catch (reason) {
      setProgress(0);
      setError(reason instanceof Error ? reason.message : "No se pudo subir el archivo.");
    }
  };

  const remove = () => {
    onChange("");
    onUsageChange();
  };

  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void process(file);
  };

  return <div className={cn("space-y-2", light && "mb-4")}>
    <p className={cn("text-xs font-medium", light ? "text-zinc-900" : "text-[#cbc3d7]")}>{kind === "image" ? "Imagen" : "Video"}</p>
    {value ? <div className={cn("relative overflow-hidden rounded-lg border", light ? "border-zinc-200 bg-zinc-50" : "border-[#494454] bg-[#0f0d15]")}>
      {kind === "image"
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={value} alt="Archivo del negocio" className="h-40 w-full object-cover" />
        : <video src={value} controls preload="metadata" className="aspect-video w-full bg-black object-contain" />}
      <button type="button" onClick={() => void remove()} aria-label="Eliminar archivo" className={cn("absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full", light ? "bg-white/95 text-zinc-600 shadow hover:bg-red-50 hover:text-red-600" : "bg-[#0f0d15]/90 text-white hover:bg-red-950")}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div> : <button
      type="button"
      disabled={busy}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
      className={cn(
        "flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center transition-colors",
        light
          ? dragging ? "border-violet-500 bg-violet-50" : "border-zinc-300 bg-zinc-50 hover:border-violet-400 hover:bg-violet-50/50"
          : dragging ? "border-[#8b5cf6] bg-[#2c2141]" : "border-[#5b5068] bg-[#15121b] hover:border-[#8b5cf6]",
      )}
    >
      {busy ? <Loader2 className={cn("h-6 w-6 animate-spin", light ? "text-violet-600" : "text-[#a078ff]")} /> : kind === "image" ? <ImageIcon className={cn("h-6 w-6", light ? "text-violet-600" : "text-[#a078ff]")} /> : <Video className={cn("h-6 w-6", light ? "text-violet-600" : "text-[#a078ff]")} />}
      <span className={cn("text-sm font-semibold", light ? "text-zinc-800" : "text-[#e9ddff]")}>{busy ? `Subiendo ${progress}%` : dragging ? "Suelta el archivo aquí" : `Subir ${kind === "image" ? "imagen" : "video"}`}</span>
      <span className={cn("text-xs", light ? "text-zinc-500" : "text-[#958ea0]")}>{kind === "image" ? "JPG, PNG o WebP, máximo 8 MB" : "MP4 o WebM, máximo 60 MB"}</span>
    </button>}
    <input ref={inputRef} type="file" className="sr-only" accept={types[kind].join(",")} onChange={(event) => { const file = event.target.files?.[0]; if (file) void process(file); event.target.value = ""; }} />
    {error && <p role="alert" className={cn("text-xs", light ? "text-red-600" : "text-[#ffb4ab]")}>{error}</p>}
  </div>;
}
