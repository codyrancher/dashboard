import { createApp } from 'vue';
import ColorToolPanel from './ColorToolPanel.vue';
import { loadStoredOverrides, setExternalOverrides } from './colors';
import {
  Highlight, Step, centerInView, clearForced, clearRings, describe, locate, lockTheme, onLoginPage, onRingMove, pageReady, ring, runSteps, showRings
} from './page';

const SOURCE = 'rancher-color-tool';
const framed = window.parent !== window;

function trusted(origin: string) {
  try {
    const { hostname, protocol } = new URL(origin);
    const parentDomain = (host: string) => host.split('.').slice(1).join('.');

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    return protocol === 'https:' && parentDomain(hostname).includes('.') && parentDomain(hostname) === parentDomain(window.location.hostname);
  } catch (e) {
    return false;
  }
}

function post(message: Record<string, unknown>) {
  if (framed) {
    window.parent.postMessage({ source: SOURCE, ...message }, '*');
  }
}

function parseColors(value: string | null): Record<string, string> {
  if (!value) {
    return {};
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return Object.fromEntries(value.split(/,(?=\s*--color-)/).map((pair) => {
      const at = pair.indexOf(':');

      return [pair.slice(0, at).trim(), pair.slice(at + 1).trim()];
    }).filter(([name, color]) => name && color));
  }
}

const primitiveName = (name: string | null) => (name ? `--${ name.replace(/^-*/, '').replace(/^(color-)?/, 'color-') }` : undefined);

let shown = '';

async function highlightFromQuery(query: URLSearchParams, path: string) {
  const highlight: Highlight = {
    selector: query.get('highlight') || undefined,
    text:     query.get('highlightText') || undefined,
    index:    Number(query.get('highlightIndex') || 0),
    color:    primitiveName(query.get('highlightColor')),
  };
  const key = `${ path }|${ JSON.stringify(highlight) }`;

  if (key === shown) {
    return;
  }
  if (!highlight.selector && !highlight.color) {
    if (shown && !framed) {
      shown = '';
      clearRings();
    }

    return;
  }
  shown = key;
  await pageReady();
  try {
    const { el } = await locate(highlight);

    centerInView(el);
    ring([el]);
  } catch (e) {
    console.warn(`color tool: ${ (e as Error).message }`); // eslint-disable-line no-console
  }
}

let showing: Promise<void> = Promise.resolve();

const box = (rect: DOMRect) => ({
  x: Math.round(rect.left), y: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height)
});

async function show(message: { theme?: string, steps?: Step[], highlight?: Highlight, ringWidth?: number, colors?: Record<string, string> }, isTrusted: boolean) {
  clearRings();
  clearForced();
  setExternalOverrides(message.colors || {});
  post({ type: 'status', state: 'loading' });
  try {
    lockTheme(message.theme || null);
    await pageReady();
    if (onLoginPage()) {
      post({ type: 'status', state: 'login' });

      return;
    }
    if (message.steps?.length) {
      if (!isTrusted) {
        throw new Error('steps only run for a parent on a sibling host or localhost');
      }
      post({ type: 'status', state: 'running' });
      await runSteps(message.steps, { trusted: isTrusted });
    }
    if (message.highlight) {
      const { el, property } = await locate(message.highlight);

      centerInView(el);
      ring([el], { width: message.ringWidth || 3 });
      post({
        type: 'status', state: 'done', element: describe(el), property, rect: box(el.getBoundingClientRect())
      });
    } else {
      post({ type: 'status', state: 'done' });
    }
  } catch (e) {
    post({
      type: 'status', state: 'error', message: (e as Error).message
    });
  }
}

function listen() {
  window.addEventListener('message', (event) => {
    const message = event.data;

    if (event.source !== window.parent || message?.source !== SOURCE) {
      return;
    }
    if (message.type === 'show') {
      showing = showing.then(() => show(message, trusted(event.origin)));
    } else if (message.type === 'colors') {
      setExternalOverrides(message.colors || {});
    } else if (message.type === 'rings') {
      showRings(message.shown !== false, message.width);
    } else if (message.type === 'ping') {
      post({ type: 'hello', path: window.location.pathname });
    }
  });
  onRingMove((rect) => post({ type: 'rect', rect: box(rect) }));
  post({ type: 'hello', path: window.location.pathname });
}

function mountPanel() {
  const host = document.createElement('div');

  document.body.appendChild(host);
  createApp(ColorToolPanel, { persist: true }).mount(host);
}

/**
 * The color primitive tool: an editor for every `--color-*` primitive while the app runs, and a page that a review tool
 * can frame and point at a color.
 *
 * Query parameters, for any visitor:
 * - `colors`: overrides, as JSON (`{"--color-gray-96":"#e0e0e0"}`) or `--color-gray-96:#e0e0e0,--color-blue-451:red`.
 * - `theme`: `light`, `dark`, `classic light`, `classic dark`, `suse light` or `suse dark`, in this tab only.
 * - `highlight` (a selector), `highlightText`, `highlightIndex` and `highlightColor` (a primitive): ring an element and
 *   scroll it into view. With `highlightColor` alone the ring goes on the element that paints that color most.
 *
 * Messages from a parent frame, `{ source: 'rancher-color-tool', type, ... }`:
 * - `show`: `{ theme, steps, highlight, ringWidth, colors }`. Steps only run for a parent on a sibling host (the other
 *   shares on this node) or localhost, because they click and type as the signed-in user.
 * - `colors`: `{ colors }` replaces the overrides. `rings`: `{ shown, width }` shows or hides the ring and sets its
 *   thickness. `ping` asks for `hello`.
 * The page answers `hello` when it starts and `status` (`loading`, `login`, `running`, `done` or `error`) as it works.
 * `done` and `rect` carry the ringed element's `rect` (`{ x, y, width, height }` in the page's viewport) when it moves.
 */
export default function colorTool(context: any) {
  const query = new URLSearchParams(window.location.search);

  if (!framed) {
    loadStoredOverrides();
  }
  setExternalOverrides(parseColors(query.get('colors')));
  try {
    lockTheme(query.get('theme'));
  } catch (e) {
    console.warn(`color tool: ${ (e as Error).message }`); // eslint-disable-line no-console
  }
  if (framed) {
    listen();
  } else {
    mountPanel();
  }
  highlightFromQuery(query, window.location.pathname);
  context.app?.router?.afterEach((to: any) => {
    highlightFromQuery(new URLSearchParams(Object.entries(to.query || {}).map(([k, v]) => [k, String(v)])), to.path);
  });
}
