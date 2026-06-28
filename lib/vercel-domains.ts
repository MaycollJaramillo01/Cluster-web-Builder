const base = "https://api.vercel.com";

function config() {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  const team = process.env.VERCEL_TEAM_ID;
  return token && project ? { token, project, query: team ? `?teamId=${encodeURIComponent(team)}` : "" } : null;
}

async function call(path: string, init?: RequestInit) {
  const settings = config();
  if (!settings) return null;
  const response = await fetch(`${base}${path}${settings.query}`, { ...init, headers: { Authorization: `Bearer ${settings.token}`, "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 409) throw new Error((data as { error?: { message?: string } }).error?.message || "Vercel rechazó el dominio.");
  return data as { verified?: boolean; verification?: unknown[]; name?: string };
}

export function addProjectDomain(domain: string) {
  const settings = config();
  return settings ? call(`/v10/projects/${encodeURIComponent(settings.project)}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) }) : null;
}

export function verifyProjectDomain(domain: string) {
  const settings = config();
  return settings ? call(`/v9/projects/${encodeURIComponent(settings.project)}/domains/${encodeURIComponent(domain)}/verify`, { method: "POST" }) : null;
}

export function removeProjectDomain(domain: string) {
  const settings = config();
  return settings ? call(`/v9/projects/${encodeURIComponent(settings.project)}/domains/${encodeURIComponent(domain)}`, { method: "DELETE" }) : null;
}
