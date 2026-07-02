/**
 * Sanitiza enlaces provistos por el usuario (ctaLink). Solo se permiten
 * destinos seguros: https, rutas internas, anclas, mailto: y tel:.
 * Cualquier otro esquema (javascript:, data:, http:, vbscript:...) se descarta.
 */
export function sanitizeLink(value: string | null | undefined): string {
  const link = (value ?? "").trim();
  if (!link) return "";
  if (link.startsWith("#")) return link;
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  if (/^mailto:[^\s]+$/i.test(link)) return link;
  if (/^tel:\+?[\d\s().-]{3,40}$/i.test(link)) return link;
  if (/^https:\/\//i.test(link)) {
    try {
      return new URL(link).toString();
    } catch {
      return "";
    }
  }
  return "";
}
