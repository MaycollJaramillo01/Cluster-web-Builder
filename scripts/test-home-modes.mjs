import { evaluate, launchChrome, waitFor } from "./cdp.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const browser = await launchChrome("cluster-home-modes");
const { client } = browser;

try {
  await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await client.send("Page.navigate", { url: `${baseUrl}/builder` });
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

  await evaluate(client, `document.getElementById('advanced-mode-tab')?.click()`);
  await waitFor(() => evaluate(client, `document.querySelector('[data-home-mode]')?.dataset.homeMode === 'advanced'`));
  const advanced = await evaluate(client, `({
    mode: document.querySelector('[data-home-mode]')?.dataset.homeMode,
    prompt: Boolean(document.querySelector('#advanced-mode-panel textarea')),
  })`);
  assert(advanced.mode === "advanced" && advanced.prompt, "El modo avanzado no conserva el prompt actual.");

  await evaluate(client, `document.getElementById('guided-mode-tab')?.click()`);
  await waitFor(() => evaluate(client, `document.querySelector('[data-home-mode]')?.dataset.homeMode === 'guided'`));
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
    set('input[name="opensAt"]', '09:00');
    set('input[name="closesAt"]', '18:00');
    const description = document.querySelector('textarea[name="description"]');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(description, 'Cafetería local con granos propios y postres artesanales.');
    description.dispatchEvent(new Event('input', { bubbles: true }));
    set('input[name="service-1-name"]', 'Café latte');
    set('input[name="service-1-price"]', '$3.50');
    set('input[name="phone"]', '+505 8888 8888');
    document.querySelector('[aria-label="Paleta Noche"]')?.click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.fetch = () => new Promise(() => {});
    document.querySelector('#guided-mode-panel form button[type="submit"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 350));
    return JSON.parse(sessionStorage.getItem('ai-builder:onboarding') || '{}');
  })()`);
  assert(payload.businessName === "Café Luna", "El payload no conservó el nombre del negocio.");
  assert(payload.services?.includes("Café latte"), "El payload no incluyó el servicio capturado.");
  assert(payload.proofPoints?.includes("Horario: Lun–Vie 09:00–18:00"), "El payload no incluyó el horario estructurado.");
  assert(payload.palette?.primary === "#38bdf8", "El payload no conservó el color primario seleccionado.");
  assert(payload.palette?.secondary === "#0f172a", "El payload no conservó el color secundario seleccionado.");
  assert(payload.palette?.accent === "#a3e635", "El payload no conservó el color de acento seleccionado.");
  assert(payload.palette?.background === "#020617", "El payload no conservó el fondo seleccionado.");
  assert(payload.palette?.text === "#f8fafc", "El payload no conservó el texto seleccionado.");

  console.log("Builder modes: OK — guiado, avanzado, validación, móvil y payload one_page.");
} finally {
  browser.close();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
