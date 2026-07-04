export type DnsRecord = {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
  reason?: string;
};

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export function dnsRecordsForDomain(domain: string, verification: unknown): DnsRecord[] {
  const records = (Array.isArray(verification) ? verification : []).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const type = text(record.type).toUpperCase();
    const value = text(record.value);
    if ((type !== "A" && type !== "CNAME" && type !== "TXT") || !value) return [];
    return [{
      type,
      name: text(record.domain) || text(record.name) || (type === "TXT" ? "_vercel" : "@"),
      value,
      ...(text(record.reason) ? { reason: text(record.reason) } : {}),
    } as DnsRecord];
  });
  const routing: DnsRecord = domain.startsWith("www.")
    ? { type: "CNAME", name: "www", value: "cname.vercel-dns-0.com" }
    : { type: "A", name: "@", value: "76.76.21.21" };
  return records.some((record) => record.type === routing.type && record.value === routing.value) ? records : [...records, routing];
}
