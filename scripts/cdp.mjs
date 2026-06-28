import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function launchChrome(prefix) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const chromePath = process.env.CHROME_PATH || (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/usr/bin/google-chrome");
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${join(tmpdir(), `${prefix}-${Date.now()}`)}`,
    "about:blank",
  ], { stdio: "ignore" });

  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      if (targets.some((target) => target.type === "page")) break;
    } catch {}
    await sleep(250);
  }
  const page = targets?.find((target) => target.type === "page");
  if (!page) {
    chrome.kill();
    throw new Error("Chrome no inició una página para la prueba.");
  }
  const client = await createClient(page.webSocketDebuggerUrl);
  await Promise.all(["Page.enable", "Runtime.enable", "Network.enable"].map((method) => client.send(method)));
  return { client, close: () => { client.close(); chrome.kill(); } };
}

export async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "Falló una evaluación en navegador.");
  return result.result.value;
}

export async function waitFor(check, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (await check()) return;
    await sleep(150);
  }
  throw new Error("La página no quedó lista para la prueba.");
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
      listeners.set(method, [...group, listener]);
      return () => listeners.set(method, group.filter((item) => item !== listener));
    },
    close() { socket.close(); },
  };
}
