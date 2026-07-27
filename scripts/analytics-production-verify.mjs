import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9321;
const baseUrl = process.argv[2] || 'https://bloxtier.com/?ga4verify=cdp';
const userDataDir = mkdtempSync(join(tmpdir(), 'bloxtier-ga4-'));
const analyticsPattern = /googletagmanager|google-analytics|\/g\/collect|\/collect/;

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe'] });

chrome.unref();

function cleanup() {
  chrome.kill('SIGTERM');
  rmSync(userDataDir, { recursive: true, force: true });
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

async function waitForJson(path) {
  const url = `http://127.0.0.1:${port}${path}`;
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Chrome debugging endpoint did not become ready: ${url}`);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const callbacks = listeners.get(message.method) || [];
    callbacks.forEach((callback) => callback(message.params));
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      resolve({
        on(method, callback) {
          listeners.set(method, [...(listeners.get(method) || []), callback]);
        },
        send(method, params = {}) {
          const messageId = ++id;
          ws.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((commandResolve, commandReject) => {
            pending.set(messageId, { resolve: commandResolve, reject: commandReject });
          });
        },
        close() {
          ws.close();
        }
      });
    });
    ws.addEventListener('error', reject);
  });
}

async function evalValue(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    const details = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed';
    throw new Error(details);
  }
  return result.result.value;
}

async function verifyCase(label, actionExpression, url = baseUrl) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' }).then((response) => response.json());
  const client = await connect(target.webSocketDebuggerUrl);
  const requests = [];
  const pageErrors = [];

  client.on('Network.requestWillBeSent', (params) => {
    if (analyticsPattern.test(params.request.url)) {
      requests.push({
        method: params.request.method,
        url: params.request.url,
        postData: params.request.postData || ''
      });
    }
  });
  client.on('Runtime.exceptionThrown', (params) => {
    pageErrors.push(params.exceptionDetails?.text || 'exception');
  });

  await client.send('Network.enable');
  await client.send('Runtime.enable');
  await client.send('Page.enable');
  await new Promise((resolve) => setTimeout(resolve, 2500));
  await evalValue(client, `(async () => { ${actionExpression} })()`);
  await new Promise((resolve) => setTimeout(resolve, 6000));

  const state = await evalValue(client, `({
    href: location.href,
    consent: localStorage.getItem('bloxtier_analytics_consent'),
    gtagScripts: [...document.scripts].map((script) => script.src).filter((src) => src.includes('googletagmanager.com')),
    cookies: document.cookie,
    dataLayer: (window.dataLayer || []).map((entry) => Array.from(entry).slice(0, 4)),
    pendingSelect: sessionStorage.getItem('bloxtier_pending_select_content'),
    hasChoices: Boolean(document.querySelector('[data-privacy-choices]')),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
  })`);

  await client.close();
  return { label, requests, pageErrors, state };
}

let exitCode = 0;

try {
  await waitForJson('/json/version');
  const reject = await verifyCase('reject', `document.querySelector('[data-consent-reject]')?.click()`);
  const accept = await verifyCase('accept_page_view_select_content', `
    document.querySelector('[data-consent-accept]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const contentLink = document.querySelector('[data-select-content]');
    if (contentLink) {
      contentLink.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
      contentLink.click();
    }
  `);
  const filter = await verifyCase('accept_filter_use', `
    document.querySelector('[data-consent-accept]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const select = document.querySelector('[data-select-a]');
    if (select && select.options.length > 1) {
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `, new URL('/compare/rivals/?ga4verify=cdp', baseUrl).toString());

  console.log(JSON.stringify({ baseUrl, results: [reject, accept, filter] }, null, 2));
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  cleanup();
  setTimeout(() => process.exit(exitCode), 100);
}
