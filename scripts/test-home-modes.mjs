import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3010";
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9600 + Math.floor(Math.random() * 200);
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(tmpdir(), `cluster-home-modes-${Date.now()}`)}`,
  "about:blank",
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
  if (!page) throw new Error("Chrome no inició una página para la prueba.");
  client = await createClient(page.webSocketDebuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");

  if (process.env.QA_SESSION_SECRET) {
    await client.send("Network.setCookie", {
      name: "__cluster_session",
      value: process.env.QA_SESSION_SECRET,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    });
  }

  await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await client.send("Page.navigate", { url: baseUrl });
  await waitFor(() => evaluate(client, "document.readyState === 'complete' && Boolean(document.querySelector('[data-home-mode]'))"));

  const initial = await evaluate(client, `(() => ({
    mode: document.querySelector('[data-home-mode]')?.dataset.homeMode,
    overflow: document.documentElement.scrollWidth > window.innerWidth,
    tabs: document.querySelectorAll('[role="tab"]').length,
    invalidControls: [...document.querySelectorAll('input, select, textarea')].filter((control) => !control.labels?.length && !control.getAttribute('aria-label')).length,
    palettes: document.querySelectorAll('[aria-label^="Paleta "]').length,
    paletteColors: document.querySelector('[aria-label="Paleta Cluster"]')?.querySelectorAll('[style*="background-color"]').length,
    whiteSurfaces: [...document.querySelectorAll('#guided-mode-panel *')].filter((element) => getComputedStyle(element).backgroundColor === 'rgb(255, 255, 255)').length,
  }))()`);
  assert(initial.mode === "guided", "El modo guiado no es la opción inicial.");
  assert(initial.tabs === 2, "No se renderizaron las dos opciones de creación.");
  assert(!initial.overflow, "El home guiado tiene desbordamiento horizontal en móvil.");
  assert(initial.invalidControls === 0, "Hay controles sin etiqueta accesible en el modo guiado.");
  assert(initial.palettes >= 10, "El selector no ofrece suficientes paletas.");
  assert(initial.paletteColors === 5, "Las opciones no muestran una paleta completa de cinco colores.");
  assert(initial.whiteSurfaces === 0, "El formulario guiado todavía contiene superficies blancas.");

  const advanced = await evaluate(client, `(() => {
    document.getElementById('advanced-mode-tab')?.click();
    return new Promise((resolve) => requestAnimationFrame(() => resolve({
      mode: document.querySelector('[data-home-mode]')?.dataset.homeMode,
      prompt: Boolean(document.querySelector('#advanced-mode-panel textarea')),
    })));
  })()`);
  assert(advanced.mode === "advanced" && advanced.prompt, "El modo avanzado no conserva el prompt actual.");

  await evaluate(client, `(() => {
    document.getElementById('guided-mode-tab')?.click();
    return new Promise((resolve) => requestAnimationFrame(resolve));
  })()`);
  const validation = await evaluate(client, `(() => {
    document.querySelector('#guided-mode-panel form button[type="submit"]')?.click();
    return new Promise((resolve) => requestAnimationFrame(() => resolve({
      errors: document.querySelectorAll('[role="alert"]').length,
      focusedInvalid: document.activeElement?.getAttribute('aria-invalid'),
    })));
  })()`);
  assert(validation.errors >= 6, "El formulario guiado no mostró sus validaciones requeridas.");
  assert(validation.focusedInvalid === "true", "La validación no llevó el foco al primer campo inválido.");

  const payload = await evaluate(client, `(async () => {
    const set = (selector, value) => {
      const element = document.querySelector(selector);
      const setter = Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value')?.set;
      setter.call(element, value);
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('input[name="businessName"]', 'Café Luna');
    set('select[name="businessType"]', 'restaurant');
    set('select[name="country"]', 'Nicaragua');
    set('input[name="city"]', 'Managua');
    const description = document.querySelector('textarea[name="description"]');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(description, 'Cafetería local con granos propios y postres artesanales.');
    description.dispatchEvent(new Event('input', { bubbles: true }));
    set('input[name="service-1-name"]', 'Café latte');
    set('input[name="service-1-price"]', '$3.50');
    set('input[name="phone"]', '+505 8888 8888');
    window.fetch = () => new Promise(() => {});
    document.querySelector('#guided-mode-panel form button[type="submit"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 350));
    return JSON.parse(sessionStorage.getItem('ai-builder:onboarding') || '{}');
  })()`);
  assert(payload.businessName === "Café Luna", "El payload no conservó el nombre del negocio.");
  assert(payload.structureType === "one_page", "El modo guiado no genera una estructura home.");
  assert(payload.services?.includes("Café latte"), "El payload no incluyó el servicio capturado.");
  assert(payload.palette?.primary === "#8b5cf6", "El payload no incluyó la paleta seleccionada.");

  console.log("Home modes: OK — guiado, avanzado, validación, móvil y payload one_page.");
} finally {
  client?.close();
  chrome.kill();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitFor(check) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await check()) return;
    await sleep(150);
  }
  throw new Error("La página no quedó lista para la prueba.");
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "Falló una evaluación en navegador.");
  return result.result.value;
}

async function createClient(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
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
    close() { socket.close(); },
  };
}
