import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3010";
const prefix = process.env.QA_PREFIX || "local";
const port = 9333 + Math.floor(Math.random() * 300);
const chromePath = process.env.CHROME_PATH || (
  process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome"
);
const artifactDir = join(process.cwd(), "artifacts", "qa");
mkdirSync(artifactDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
  `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), `cluster-qa-${Date.now()}`)}`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let client;

try {
  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      if (targets.some((target) => target.type === "page")) break;
    } catch {}
    await sleep(250);
  }
  const page = targets?.find((target) => target.type === "page");
  if (!page) throw new Error("Chrome no expuso una página para QA.");
  client = await createClient(page.webSocketDebuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");

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
  client?.close();
  chrome.kill();
}

async function waitForReady(cdp) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const ready = await evaluate(cdp, "document.readyState === 'complete'");
    if (ready) break;
    await sleep(100);
  }
  await sleep(650);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return result.result.value;
}

async function createClient(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  const listeners = new Map();
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }
    for (const listener of listeners.get(message.method) || []) listener(message.params || {});
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const requestId = ++id;
        pending.set(requestId, { resolve, reject });
        socket.send(JSON.stringify({ id: requestId, method, params }));
      });
    },
    on(method, listener) {
      const group = listeners.get(method) || [];
      group.push(listener);
      listeners.set(method, group);
      return () => listeners.set(method, group.filter((item) => item !== listener));
    },
    close() { socket.close(); },
  };
}
