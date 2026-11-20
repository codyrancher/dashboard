/* eslint-disable local-rules/no-color-literal */
import { EditorView } from '@codemirror/view';
import { PRIMITIVES, enableForcedState, render, withOriginalColors } from './colors';

/** The theme names the color screenshots use, and the body classes each one needs. */
export const THEMES: Record<string, string> = {
  light:        'theme-light',
  dark:         'theme-dark',
  'suse light': 'suse theme-light',
  'suse dark':  'suse theme-dark',
};
const THEME_CLASSES = ['theme-light', 'theme-dark', 'suse'];

let themeObserver: MutationObserver | null = null;

/**
 * Shows a theme in this tab only. The body's theme classes are held while the app rewrites them, and the user's
 * preference is never written.
 */
export function lockTheme(theme: string | null) {
  themeObserver?.disconnect();
  themeObserver = null;
  if (!theme) {
    return;
  }
  const classes = THEMES[theme.toLowerCase()];

  if (!classes) {
    throw new Error(`unknown theme "${ theme }", use one of ${ Object.keys(THEMES).join(', ') }`);
  }
  const wanted = classes.split(' ');
  const apply = () => {
    const current = THEME_CLASSES.filter((c) => document.body.classList.contains(c));

    if (current.sort().join(' ') !== [...wanted].sort().join(' ')) {
      document.body.classList.remove(...THEME_CLASSES);
      document.body.classList.add(...wanted);
    }
  };

  themeObserver = new MutationObserver(apply);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  apply();
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const onLoginPage = () => /\/(auth\/(login|verify)|fail-whale)/.test(window.location.pathname);

/** Waits for the route to finish loading: a `main`, and none of the app's spinners. */
export async function pageReady(timeout = 60000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const busy = [...document.querySelectorAll('.initial-load-spinner, .loading-indicator, .main-loading, i.icon-spinner')].some((el) => el.checkVisibility());

    if (onLoginPage() || (document.readyState === 'complete' && document.querySelector('main') && !busy)) {
      break;
    }
    await sleep(250);
  }
  await sleep(1000);
}

export const describe = (el: Element) => `${ el.tagName.toLowerCase() }${ [...el.classList].filter((c) => !c.startsWith('data-v-')).slice(0, 2).map((c) => `.${ c }`).join('') }`;

/** The first visible element matching `selector` whose text contains `text`, waiting up to `timeout` for one. */
export async function find(selector: string, { text, index = 0, timeout = 10000 }: { text?: string, index?: number, timeout?: number } = {}) {
  const start = Date.now();

  do {
    const matches = [...document.querySelectorAll(selector)].filter((el) => el.checkVisibility() && (!text || (el.textContent || '').trim().includes(text)));

    if (matches[index]) {
      return matches[index];
    }
    await sleep(250);
  } while (Date.now() - start < timeout);

  throw new Error(`nothing matches ${ selector }${ text ? ` with "${ text }"` : '' }`);
}

/** Scrolls each scrolling ancestor so the element is centered, without scrolling a page this one is framed in. */
export function centerInView(el: Element) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    const rect = el.getBoundingClientRect();
    const box = node.getBoundingClientRect();

    if (/auto|scroll|overlay/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      node.scrollBy({ top: rect.top + rect.height / 2 - (box.top + box.height / 2), behavior: 'instant' });
    }
    if (/auto|scroll|overlay/.test(style.overflowX) && node.scrollWidth > node.clientWidth) {
      node.scrollBy({ left: rect.left + rect.width / 2 - (box.left + box.width / 2), behavior: 'instant' });
    }
  }
  const rect = el.getBoundingClientRect();

  window.scrollBy({
    left: rect.left + rect.width / 2 - innerWidth / 2, top: rect.top + rect.height / 2 - innerHeight / 2, behavior: 'instant'
  });
}

function pointer(el: Element, types: string[]) {
  const rect = el.getBoundingClientRect();
  const init = {
    bubbles: true, cancelable: true, composed: true, view: window, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, button: 0
  };

  for (const type of types) {
    const event = type.startsWith('pointer') ? new PointerEvent(type, {
      ...init, pointerType: 'mouse', isPrimary: true
    }) : new MouseEvent(type, init);

    if (type === 'focus') {
      (el.closest('a, button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable=false])') as HTMLElement | null)?.focus({ preventScroll: true });
    } else {
      el.dispatchEvent(event);
    }
  }
}

const HOVER_EVENTS = ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove'];

/** Forces a pseudo-class on an element, like DevTools does. `withAncestors` also covers what a real pointer would. */
export function force(el: Element, state: string, withAncestors = false) {
  enableForcedState(state);
  for (let node: Element | null = el; node; node = withAncestors ? node.parentElement : null) {
    node.setAttribute(`data-color-tool-${ state }`, '');
  }
}

export function clearForced() {
  for (const el of document.querySelectorAll('[data-color-tool-hover], [data-color-tool-active], [data-color-tool-focus], [data-color-tool-focus-visible], [data-color-tool-focus-within]')) {
    for (const attr of [...el.attributes].map((a) => a.name).filter((name) => name.startsWith('data-color-tool-'))) {
      el.removeAttribute(attr);
    }
  }
}

/** The CodeMirror editor `el` is in, for eval steps as `colorTool.editorOf(el)`. */
export function editorOf(el: Element | null): EditorView | null {
  const dom = el?.closest('.cm-editor');

  return dom instanceof HTMLElement ? EditorView.findFromDOM(dom) : null;
}

const KEY_CODES: Record<string, number> = {
  Enter: 13, Escape: 27, Tab: 9, Backspace: 8, Delete: 46, Home: 36, End: 35, PageDown: 34, PageUp: 33, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, ' ': 32, Alt: 18, Control: 17, Shift: 16, Meta: 91
};

let clicked: { el: Element, focus: Element | null } | null = null;

function keyTarget(): Element {
  const active = document.activeElement;

  if (clicked?.el.isConnected && (!active || active === document.body || (active === clicked.focus && !clicked.el.contains(active)))) {
    return clicked.el;
  }

  return active || document.body;
}

function press(combo: string) {
  const parts = combo.split('+');
  const key = parts.pop() || '+';
  const target = keyTarget();
  const view = target.closest('.cm-content') ? editorOf(target) : null;

  if (parts.some((p) => p === 'Control' || p === 'Meta') && key.toLowerCase() === 'a') {
    if (view) {
      view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
    } else {
      document.execCommand('selectAll');
    }

    return;
  }
  const code = key.length === 1 ? (/[a-z]/i.test(key) ? `Key${ key.toUpperCase() }` : /\d/.test(key) ? `Digit${ key }` : '') : key;
  const init = {
    key,
    code,
    bubbles:    true,
    cancelable: true,
    composed:   true,
    ctrlKey:    parts.includes('Control'),
    metaKey:    parts.includes('Meta'),
    altKey:     parts.includes('Alt') || key === 'Alt',
    shiftKey:   parts.includes('Shift'),
    keyCode:    KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0),
    which:      KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0),
  };

  target.dispatchEvent(new KeyboardEvent('keydown', init));
  target.dispatchEvent(new KeyboardEvent('keyup', init));
}

function type(text: string) {
  const target = keyTarget();
  const view = target.closest('.cm-content') ? editorOf(target) : null;

  if (view) {
    view.dispatch(view.state.replaceSelection(text));

    return;
  }
  const field = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target : null;
  const editable = !field && (target as HTMLElement).isContentEditable ? target : null;
  const before = field ? field.value : editable?.textContent;

  document.execCommand('insertText', false, text);
  const keyup = () => target.dispatchEvent(new KeyboardEvent('keyup', { key: text.slice(-1), bubbles: true }));

  if (field && field.value === before) {
    const start = field.selectionStart ?? field.value.length;
    const end = field.selectionEnd ?? field.value.length;

    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value')?.set?.call(field, field.value.slice(0, start) + text + field.value.slice(end));
  } else if (editable && editable.textContent === before) {
    editable.textContent = `${ before }${ text }`;
    window.getSelection()?.selectAllChildren(editable);
    window.getSelection()?.collapseToEnd();
  } else {
    keyup();

    return;
  }
  (field || editable)?.dispatchEvent(new InputEvent('input', {
    bubbles: true, composed: true, inputType: 'insertText', data: text
  }));
  field?.dispatchEvent(new Event('change', { bubbles: true }));
  keyup();
}

/**
 * The component instance that rendered `el`, or null. Eval steps call it as `colorTool.componentOf(el)`, and it works in
 * a production build, where elements have no `__vueParentComponent`.
 */
export function componentOf(el: Element | null): any {
  const walk = (vnode: any, owner: any): any => {
    if (!vnode || typeof vnode !== 'object') {
      return null;
    }
    if (vnode.el === el && typeof vnode.type === 'string') {
      return owner;
    }
    if (vnode.component) {
      return walk(vnode.component.subTree, vnode.component);
    }
    if (vnode.suspense) {
      return walk(vnode.suspense.activeBranch, owner);
    }
    for (const child of Array.isArray(vnode.children) ? vnode.children : []) {
      const found = walk(child, owner);

      if (found) {
        return found;
      }
    }

    return null;
  };

  return el ? walk((document.querySelector('#app') as any)?._vnode, null) : null;
}

export type Step = {
  click?: string, hover?: string, text?: string, index?: number, type?: string, key?: string, force?: string, state?: string,
  all?: boolean, eval?: string, waitFor?: string, wait?: number, scroll?: string
};

/**
 * Runs the steps that make a color show: the format the color screenshots' scenarios use, played back in the page
 * instead of over the DevTools protocol. `eval` only runs for a trusted caller.
 */
export async function runSteps(steps: Step[], { trusted }: { trusted: boolean }) {
  for (const step of steps || []) {
    if (step.click || step.hover) {
      const el = await find((step.click || step.hover) as string, { text: step.text, index: step.index });

      centerInView(el);
      if (step.click) {
        pointer(el, [...HOVER_EVENTS, 'pointerdown', 'mousedown', 'focus', 'pointerup', 'mouseup', 'click']);
        clicked = { el, focus: document.activeElement };
      } else {
        pointer(el, HOVER_EVENTS);
        force(el, 'hover', true);
      }
      await sleep(step.wait ?? 1000);
    } else if (step.type) {
      type(step.type);
      await sleep(step.wait ?? 300);
    } else if (step.key) {
      press(step.key);
      await sleep(step.wait ?? 400);
    } else if (step.force) {
      const state = step.state || 'hover';
      const first = await find(step.force, { text: step.text, index: step.index });
      const els = step.all ? [...document.querySelectorAll(step.force)] : [first];

      els.forEach((el) => force(el, state));
      await sleep(step.wait ?? 300);
    } else if (step.scroll) {
      centerInView(await find(step.scroll, { text: step.text, index: step.index }));
      await sleep(step.wait ?? 300);
    } else if (step.eval) {
      if (!trusted) {
        throw new Error('eval steps only run when the page is framed by a trusted origin');
      }
      await (0, eval)(step.eval); // eslint-disable-line no-eval
      await sleep(step.wait ?? 500);
    } else if (step.waitFor) {
      await find(step.waitFor, { text: step.text, timeout: 15000 });
    } else if (step.wait) {
      await sleep(step.wait);
    }
  }
}

const WEIGHT: Record<string, number> = {
  'background-color': 5, 'background-image': 4, 'border-color': 3, fill: 3, stroke: 3, color: 2, 'outline-color': 2, 'box-shadow': 1, 'text-decoration-color': 1
};
const SHAPES = 'path, rect, circle, ellipse, line, polyline, polygon, text, tspan';

/** Where a primitive is painted: each visible element that paints it, the property, and how prominent it is. */
export function painted(name: string, scope: Element = document.body) {
  const value = PRIMITIVES.find((p) => p.name === name)?.value;
  const color = value && render(value);
  const found: { el: Element, property: string, score: number }[] = [];

  if (!color) {
    return found;
  }
  for (const el of [scope, ...scope.querySelectorAll('*')]) {
    if (el.closest('.color-tool') || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
      continue;
    }
    const rect = el.getBoundingClientRect();
    const area = rect.width * rect.height;

    if (rect.width < 2 || rect.height < 2 || rect.right + scrollX <= 0 || rect.bottom + scrollY <= 0) {
      continue;
    }
    const size = area < 150 ? 0.3 : area > 400000 ? 0.4 : 1;
    const text = [...el.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.textContent?.trim());

    for (const pseudo of [null, '::before', '::after', ...(el.matches(':placeholder-shown') ? ['::placeholder'] : [])]) {
      const s = getComputedStyle(el, pseudo);

      if (pseudo === '::placeholder') {
        if (s.color.includes(color)) {
          found.push({
            el, property: `color${ pseudo }`, score: WEIGHT.color * size
          });
          break;
        }
        continue;
      }
      if (pseudo && (s.content === 'none' || s.content === 'normal')) {
        continue;
      }
      const props: [string, string][] = [['background-color', s.backgroundColor], ['background-image', s.backgroundImage]];

      for (const side of ['top', 'right', 'bottom', 'left']) {
        if (parseFloat(s.getPropertyValue(`border-${ side }-width`)) > 0 && s.getPropertyValue(`border-${ side }-style`) !== 'none') {
          props.push(['border-color', s.getPropertyValue(`border-${ side }-color`)]);
        }
      }
      if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) {
        props.push(['outline-color', s.outlineColor]);
      }
      if (s.boxShadow !== 'none') {
        props.push(['box-shadow', s.boxShadow]);
      }
      if (el.matches(SHAPES)) {
        props.push(['fill', s.fill], ['stroke', s.stroke]);
      }
      if (text || (pseudo && s.content.replace(/["']/g, '').trim())) {
        props.push(['color', s.color]);
        if (s.textDecorationLine !== 'none') {
          props.push(['text-decoration-color', s.textDecorationColor]);
        }
      }
      const hit = props.find(([, value]) => (value || '').includes(color));

      if (hit) {
        found.push({
          el, property: `${ hit[0] }${ pseudo || '' }`, score: WEIGHT[hit[0]] * size
        });
        break;
      }
    }
  }

  return found.sort((a, b) => b.score - a.score);
}

export type Highlight = { selector?: string, text?: string, index?: number, color?: string };

/**
 * The element a highlight names: a selector (and text), the most prominent element painting a color, or both. With
 * both, the matches of the selector are searched for the color first, then the whole page, then the first match.
 */
export async function locate(highlight: Highlight) {
  const first = highlight.selector ? await find(highlight.selector, { text: highlight.text, index: highlight.index }) : document.body;
  const color = highlight.color;

  if (!color) {
    return { el: first, property: undefined };
  }
  const hits = await withOriginalColors(() => {
    const scopes = !highlight.selector ? [document.body] : highlight.index ? [first] : [...document.querySelectorAll(highlight.selector)].filter((el) => el.checkVisibility() && (!highlight.text || (el.textContent || '').includes(highlight.text)));

    for (const scope of scopes) {
      const inScope = painted(color, scope);

      if (inScope.length) {
        return inScope;
      }
    }

    return highlight.selector ? painted(color) : [];
  });

  if (!hits.length) {
    if (highlight.selector) {
      return { el: first, property: undefined };
    }
    throw new Error(`nothing on this page paints ${ color }`);
  }

  return { el: hits[0].el, property: hits[0].property };
}

const rings: { el: Element, ring: HTMLElement }[] = [];
let ringsShown = true;
let ringWidth = 3;
let frame = 0;
let moved: ((rect: DOMRect) => void) | null = null;
let last = '';

function placeRings() {
  for (const [i, { el, ring }] of rings.entries()) {
    const rect = el.getBoundingClientRect();
    const where = [rect.left, rect.top, rect.width, rect.height].map(Math.round).join();

    if (i === 0 && where !== last) {
      last = where;
      moved?.(rect);
    }
    const gap = ringWidth + 2;

    ring.style.display = ringsShown && el.isConnected && rect.width ? 'block' : 'none';
    ring.style.left = `${ rect.left - gap - ringWidth }px`;
    ring.style.top = `${ rect.top - gap - ringWidth }px`;
    ring.style.width = `${ rect.width + 2 * gap }px`;
    ring.style.height = `${ rect.height + 2 * gap }px`;
    ring.style.borderWidth = `${ ringWidth }px`;
    ring.style.boxShadow = `0 0 0 ${ Math.max(1, ringWidth / 2) }px rgba(255, 255, 255, 0.9), inset 0 0 0 ${ Math.max(1, ringWidth / 2) }px rgba(255, 255, 255, 0.9)`;
  }
  frame = rings.length ? requestAnimationFrame(placeRings) : 0;
}

/** Rings the elements, following them as the page scrolls. `width` is the ring's thickness in CSS pixels. */
export function ring(els: Element[], { width = 3 } = {}) {
  clearRings();
  ringWidth = width;
  for (const el of els) {
    const div = document.createElement('div');

    div.className = 'color-tool color-tool-ring';
    Object.assign(div.style, {
      position: 'fixed', zIndex: '2147483646', pointerEvents: 'none', boxSizing: 'content-box', border: '3px solid #ff00d4', borderRadius: '4px'
    });
    document.body.appendChild(div);
    rings.push({ el, ring: div });
  }
  if (!frame) {
    placeRings();
  }
}

export function clearRings() {
  rings.splice(0).forEach(({ ring: div }) => div.remove());
  cancelAnimationFrame(frame);
  frame = 0;
}

/** Shows or hides the rings, and sets their thickness in CSS pixels when `width` is given. */
export function showRings(shown: boolean, width?: number) {
  ringsShown = shown;
  if (width) {
    ringWidth = width;
  }
}

/** Calls `listener` with the first ringed element's viewport rectangle whenever it moves or resizes. */
export function onRingMove(listener: (rect: DOMRect) => void) {
  moved = listener;
}
