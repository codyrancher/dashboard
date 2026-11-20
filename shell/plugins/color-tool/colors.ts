import { COLOR_TOKENS } from '@components/design-system/colors';

export const PRIMITIVES: { name: string, value: string }[] = Object.entries(COLOR_TOKENS).map(([name, value]) => ({ name, value }));

let probe: HTMLElement | null = null;
const rendered = new Map<string, string | null>();

/** The color a CSS color value computes to, as `rgb(...)` or `rgba(...)`, or null when it is not a color. */
export function render(value: string): string | null {
  if (rendered.has(value)) {
    return rendered.get(value) as string | null;
  }
  if (!probe) {
    probe = document.createElement('span');
    probe.style.display = 'none';
    document.documentElement.appendChild(probe);
  }
  probe.style.color = '';
  probe.style.color = value;
  const color = probe.style.color ? getComputedStyle(probe).color : null;

  rendered.set(value, color);

  return color;
}

export const STATES = ['hover', 'active', 'focus', 'focus-visible', 'focus-within'];
const forcedStates = new Set<string>();
const forcedIn = new WeakMap<CSSStyleSheet, Set<string>>();

function addForcedRules(sheet: CSSStyleSheet, state: string) {
  const done = forcedIn.get(sheet) || new Set();

  if (done.has(state)) {
    return;
  }
  done.add(state);
  forcedIn.set(sheet, done);
  const attribute = `[data-color-tool-${ state }]`;
  const test = new RegExp(`:${ state }(?![\\w-])`);
  const replace = new RegExp(`:${ state }(?![\\w-])`, 'g');
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules) as any[]) {
      if (rule instanceof CSSStyleRule && test.test(rule.selectorText) && !rule.selectorText.includes(attribute)) {
        rule.selectorText = rule.selectorText.replace(replace, `:is(:${ state }, ${ attribute })`);
      } else if (rule.cssRules && !(rule instanceof CSSStyleRule)) {
        visit(rule.cssRules);
      }
    }
  };

  try {
    visit(sheet.cssRules);
  } catch (e) {}
}

function addAllForcedRules() {
  for (const sheet of [...Array.from(document.styleSheets), ...(document.adoptedStyleSheets || [])]) {
    forcedStates.forEach((state) => addForcedRules(sheet, state));
  }
}

let watching = false;

/**
 * Lets `:hover`, `:active`, `:focus`, `:focus-visible` or `:focus-within` be forced on an element with a
 * `data-color-tool-<state>` attribute, the way DevTools forces a state, in stylesheets that arrive later too. `:not(:hover)`
 * and the like stop matching a forced element, as they would for a real one.
 */
export function enableForcedState(state: string) {
  if (!STATES.includes(state)) {
    throw new Error(`cannot force :${ state }, only ${ STATES.map((s) => `:${ s }`).join(', ') }`);
  }
  forcedStates.add(state);
  addAllForcedRules();
  if (!watching) {
    watching = true;
    new MutationObserver(() => setTimeout(addAllForcedRules)).observe(document.head, {
      childList: true, subtree: true, characterData: true
    });
  }
}

const layers: Record<'stored' | 'external', Record<string, string>> = { stored: {}, external: {} };
const STORAGE_KEY = 'color-tool-overrides';
let suspended = false;
const listeners = new Set<() => void>();

function writeOverrides() {
  let style = document.getElementById('color-tool-overrides');

  if (!style) {
    style = document.createElement('style');
    style.id = 'color-tool-overrides';
    document.head.appendChild(style);
  }
  const all = suspended ? {} : { ...layers.stored, ...layers.external };

  style.textContent = `:root { ${ Object.entries(all).map(([name, value]) => `${ name }: ${ value } !important;`).join(' ') } }`;
  listeners.forEach((listener) => listener());
}

export function onOverridesChange(listener: () => void) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function overrides(): Record<string, string> {
  return { ...layers.stored, ...layers.external };
}

function save(persist: boolean) {
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layers.stored));
    } catch (e) {}
  }
}

/**
 * Overrides a primitive on the root, or drops the override when `value` is null or the primitive's own value, and
 * saves the panel's overrides in this browser when `persist` is set. Every color in Rancher's own styles follows it
 * (the build references primitives through postcss-relink.js); colors JavaScript reads from COLOR_TOKENS, `r, g, b`
 * triplet variables and inline styles do not.
 */
export function setOverride(name: string, value: string | null, { persist = true } = {}) {
  delete layers.external[name];
  if (value === null || value === COLOR_TOKENS[name as keyof typeof COLOR_TOKENS]) {
    delete layers.stored[name];
  } else {
    layers.stored[name] = value;
  }
  save(persist);
  writeOverrides();
}

export function clearOverrides({ persist = true } = {}) {
  layers.stored = {};
  layers.external = {};
  save(persist);
  writeOverrides();
}

/** Overrides that win over the panel's and are never saved: the `colors` query parameter and the frame's parent. */
export function setExternalOverrides(colors: Record<string, string>) {
  layers.external = Object.fromEntries(Object.entries(colors || {}).filter(([name, value]) => name.startsWith('--color-') && typeof value === 'string'));
  writeOverrides();
}

export function loadStoredOverrides() {
  try {
    layers.stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    layers.stored = {};
  }
  writeOverrides();
}

/**
 * Runs `fn` with the original primitives showing, for finding an element by the color it is painted. Transitions and
 * the editor cursor's blink are off meanwhile: a running transition reports its start value, and one in an off-screen
 * frame never advances.
 */
export async function withOriginalColors<T>(fn: () => T | Promise<T>): Promise<T> {
  const still = document.createElement('style');

  still.textContent = '*, *::before, *::after { transition: none !important; } .cm-cursorLayer { animation: none !important; }';
  document.head.appendChild(still);
  suspended = true;
  writeOverrides();
  try {
    return await fn();
  } finally {
    suspended = false;
    writeOverrides();
    document.documentElement.getBoundingClientRect();
    still.remove();
  }
}
