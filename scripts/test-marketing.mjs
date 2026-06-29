const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const publicRoutes = ["/", "/templates", "/domains", "/pricing", "/examples", "/help", "/terms", "/privacy", "/cookies", "/refund-policy", "/acceptable-use"];

const pages = await Promise.all(publicRoutes.map(async (route) => {
  const response = await fetch(`${baseUrl}${route}`);
  return { route, status: response.status, html: await response.text() };
}));

for (const page of pages) {
  assert(page.status === 200, `${page.route} respondió ${page.status}`);
  assert((page.html.match(/<h1/g) || []).length === 1, `${page.route} no tiene un H1 único`);
  assert(page.html.includes('href="/builder"'), `${page.route} no ofrece acceso al constructor`);
}

const home = pages[0].html;
assert(!home.includes("data-home-mode") && !home.includes("ai-builder:onboarding"), "el constructor todavía se carga en el home");
for (const route of ["/templates", "/domains", "/pricing", "/examples", "/help"]) assert(home.includes(`href="${route}"`), `falta ${route} en el header`);

const builder = await fetch(`${baseUrl}/builder`).then((response) => response.text());
assert(builder.includes("data-home-mode") && builder.includes("advanced-mode-tab"), "los modos guiado y avanzado no están en /builder");

const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then((response) => response.text());
assert(publicRoutes.slice(1).every((route) => sitemap.includes(route)), "el sitemap no incluye todas las páginas públicas");

console.log("Marketing: OK — home liviano, builder separado, navegación y 10 páginas públicas verificadas.");

function assert(condition, message) { if (!condition) throw new Error(message); }
