import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editor | Cluster Web Builder", robots: { index: false, follow: false } };

export default async function TemplatesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  redirect(`/builder/${siteId}`);
}
