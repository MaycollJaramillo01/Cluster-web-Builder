import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { evaluate, launchChrome, sleep, waitFor } from "./cdp.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const prefix = process.env.QA_PREFIX || "local";
const artifactDir = join(process.cwd(), "artifacts", "qa");
mkdirSync(artifactDir, { recursive: true });

const browser = await launchChrome("cluster-qa");
const { client } = browser;

try {
  const dashboardHtml = await fetch(`${baseUrl}/dashboard`).then((response) => response.text());
  const previewId = dashboardHtml.match(/\/preview\/([a-z0-9]+)/i)?.[1];
  const routes = ["/", "/builder", "/dashboard", ...(previewId ? [`/builder/${previewId}`, `/preview/${previewId}`] : [])];
  const viewports = [
    ["desktop", 1440, 900], ["laptop", 1280, 800], ["tablet", 768, 900], ["mobile", 390, 844],
  ];
  const failures = [];

  for (const [viewport, width, height] of viewports) {
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
    for (const route of routes) {
      const consoleErrors = [];
      const requestFailures = [];
      const offConsole = client.on("Runtime.consoleAPICalled", (event) => {
        if (event.type === "error") consoleErrors.push(event.args.map((arg) => arg.value || arg.description || "").join(" "));
      });
      const offRequest = client.on("Network.loadingFailed", (event) => {
        if (!event.canceled) requestFailures.push(event.errorText);
      });

      await client.send("Page.navigate", { url: `${baseUrl}${route}` });
      await waitForReady(client);
      const audit = await evaluate(client, `(() => {
        const controls = [...document.querySelectorAll('input:not([type="hidden"]), textarea, select')];
        const unlabeled = controls.filter((control) => !control.labels?.length && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby'));
        return {
          title: document.title,
          main: Boolean(document.querySelector('main')),
          h1: document.querySelectorAll('h1').length,
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          unlabeled: unlabeled.length,
          bodyText: document.body.innerText.slice(0, 120),
        };
      })()`);

      if (!audit.main || audit.h1 !== 1 || audit.overflow || audit.unlabeled || consoleErrors.length) {
        failures.push({ viewport, route, audit, consoleErrors });
      }
      if (requestFailures.length) console.warn(`WARN ${viewport} ${route}: ${requestFailures.length} requests fallidos`);

      if ((route === "/" && (viewport === "desktop" || viewport === "mobile")) ||
          (route === "/dashboard" && viewport === "desktop") ||
          (route.startsWith("/builder/") && viewport === "desktop") ||
          (route.startsWith("/preview/") && viewport === "mobile")) {
        const shot = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        const name = route === "/" ? "home" : route.startsWith("/preview/") ? "preview" : route.startsWith("/builder/") ? "editor" : "dashboard";
        writeFileSync(join(artifactDir, `${prefix}-${name}-${viewport}.png`), Buffer.from(shot.data, "base64"));
      }

      if (viewport === "mobile" && route.startsWith("/preview/")) {
        const menuOpened = await evaluate(client, `(() => { const details = document.querySelector('header details'); if (!details) return false; details.querySelector('summary')?.click(); return details.open; })()`);
        if (!menuOpened) failures.push({ viewport, route, issue: "El menú móvil no abrió." });
      }
      offConsole();
      offRequest();
      console.log(`OK ${viewport.padEnd(7)} ${route} overflow=${audit.overflow} labels=${audit.unlabeled}`);
    }
  }

  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`QA completado: ${routes.length} rutas × ${viewports.length} viewports.`);
  }
} finally {
  browser.close();
}

async function waitForReady(cdp) {
  await waitFor(() => evaluate(cdp, "document.readyState !== 'loading' && Boolean(document.body)"), 30);
  await sleep(650);
}
