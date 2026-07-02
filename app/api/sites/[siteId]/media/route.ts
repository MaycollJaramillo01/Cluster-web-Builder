import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getSiteMedia,
  IMAGE_MAX_BYTES,
  IMAGE_MEDIA_TYPES,
  isSiteMediaUrl,
  siteMediaPrefix,
  VIDEO_MAX_BYTES,
  VIDEO_MEDIA_TYPES,
} from "@/lib/site/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MB = 1024 * 1024;
const FREE_QUOTA = 100 * MB;
const PRO_QUOTA = 2 * 1024 * MB;

async function access(request: NextRequest, siteId: string) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(request.cookies.get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) return null;
  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      ...(user?.role === "ADMIN" ? {} : { OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ] }),
    },
    select: { id: true },
  });
  if (!site) return null;
  const quota = user && (user.role === "ADMIN" || user.planStatus === "ACTIVE") ? PRO_QUOTA : FREE_QUOTA;
  return { quota };
}

async function usage(siteId: string) {
  const blobs = await getSiteMedia(siteId);
  return { blobs, bytes: blobs.reduce((total, blob) => total + blob.size, 0) };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const allowed = await access(request, siteId);
  if (!allowed) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  const current = await usage(siteId);
  return NextResponse.json({ usedBytes: current.bytes, quotaBytes: allowed.quota, files: current.blobs.length });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  try {
    const body = (await request.json()) as HandleUploadBody;
    const allowed = body.type === "blob.generate-client-token" ? await access(request, siteId) : null;
    if (body.type === "blob.generate-client-token" && !allowed) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!allowed) throw new Error("Proyecto no encontrado.");
        if (!pathname.startsWith(siteMediaPrefix(siteId)) || !/^sites\/[\w-]+\/[\w-]+\.(?:jpe?g|png|webp|mp4|webm)$/i.test(pathname)) {
          throw new Error("Ruta de archivo inválida.");
        }
        const metadata = JSON.parse(clientPayload || "{}") as { size?: number; type?: string };
        const image = IMAGE_MEDIA_TYPES.includes(metadata.type as (typeof IMAGE_MEDIA_TYPES)[number]);
        const video = VIDEO_MEDIA_TYPES.includes(metadata.type as (typeof VIDEO_MEDIA_TYPES)[number]);
        if (!image && !video) throw new Error("Tipo de archivo no permitido.");
        const maximumSizeInBytes = image ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
        if (!Number.isFinite(metadata.size) || metadata.size! <= 0 || metadata.size! > maximumSizeInBytes) {
          throw new Error(image ? "La imagen no puede superar 8 MB." : "El video no puede superar 60 MB.");
        }
        const current = await usage(siteId);
        if (current.bytes + metadata.size! > allowed.quota) throw new Error("El sitio alcanzó su cuota de almacenamiento.");
        return {
          allowedContentTypes: image ? [...IMAGE_MEDIA_TYPES] : [...VIDEO_MEDIA_TYPES],
          maximumSizeInBytes,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ siteId, quota: allowed.quota }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const token = JSON.parse(tokenPayload || "{}") as { siteId?: string; quota?: number };
        if (token.siteId !== siteId || !isSiteMediaUrl(siteId, blob.url)) {
          await del(blob.url);
          return;
        }
        // ponytail: listing is sufficient for MVP; persist counters if concurrent uploads become common.
        const current = await usage(siteId);
        if (current.bytes > (token.quota ?? FREE_QUOTA)) await del(blob.url);
      },
    });
    return NextResponse.json(response);
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo subir el archivo." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  if (!(await access(request, siteId))) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  const { url } = await request.json().catch(() => ({ url: "" })) as { url?: string };
  if (!isSiteMediaUrl(siteId, url)) return NextResponse.json({ error: "Archivo inválido." }, { status: 400 });
  await del(url);
  return NextResponse.json({ ok: true });
}
