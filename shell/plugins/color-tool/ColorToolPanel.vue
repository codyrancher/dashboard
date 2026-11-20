<script setup lang="ts">
/* eslint-disable local-rules/no-color-literal */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
  PRIMITIVES, clearOverrides, onOverridesChange, overrides, render, setOverride, withOriginalColors
} from './colors';
import {
  THEMES, centerInView, clearRings, lockTheme, painted, ring
} from './page';

const props = defineProps<{ persist: boolean }>();

const read = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {}
};

const open = ref(read('color-tool-open') === 'true');
const filter = ref('');
const changedOnly = ref(false);
const theme = ref(read('color-tool-theme') || new URLSearchParams(window.location.search).get('theme') || '');
const current = ref(overrides());
const finding = ref<string | null>(null);
const found = ref('');
const copied = ref('');

const stop = onOverridesChange(() => {
  current.value = overrides();
});

onBeforeUnmount(() => stop());

watch(open, (value) => write('color-tool-open', String(value)));
watch(theme, (value) => {
  write('color-tool-theme', value);
  lockTheme(value || null);
});
if (theme.value) {
  lockTheme(theme.value);
}

const rows = computed(() => {
  const words = filter.value.toLowerCase().split(/\s+/).filter(Boolean);

  return PRIMITIVES
    .filter((p) => !changedOnly.value || current.value[p.name])
    .filter((p) => words.every((w) => p.name.includes(w) || p.value.toLowerCase().includes(w) || (current.value[p.name] || '').toLowerCase().includes(w)));
});

const changedCount = computed(() => Object.keys(current.value).length);

const toHex = (value: string) => {
  const [r, g, b] = (render(value) || 'rgb(0, 0, 0)').match(/[\d.]+/g)?.map(Number) || [0, 0, 0];

  return `#${ [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('') }`;
};

function edit(name: string, value: string) {
  const trimmed = value.trim();

  if (trimmed && !render(trimmed) && !/^var\(--color-[\w-]+\)$/.test(trimmed)) {
    return;
  }
  setOverride(name, trimmed || null, { persist: props.persist });
}

function pick(primitive: { name: string, value: string }, hex: string) {
  const alpha = (render(primitive.value) || '').match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1];
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  setOverride(primitive.name, alpha ? `rgba(${ r }, ${ g }, ${ b }, ${ alpha })` : hex, { persist: props.persist });
}

async function find(name: string) {
  if (finding.value === name) {
    finding.value = null;
    found.value = '';
    clearRings();

    return;
  }
  const hits = await withOriginalColors(() => painted(name));

  finding.value = name;
  found.value = hits.length ? `${ hits.length } ${ hits.length === 1 ? 'element paints' : 'elements paint' } ${ name } here` : `Nothing on this page paints ${ name }`;
  if (hits.length) {
    centerInView(hits[0].el);
    ring(hits.slice(0, 40).map((h) => h.el));
  } else {
    clearRings();
  }
}

async function copy(what: 'json' | 'link') {
  const text = what === 'json' ? JSON.stringify(current.value, null, 2) : (() => {
    const url = new URL(window.location.href);

    url.searchParams.set('colors', JSON.stringify(current.value));

    return url.toString();
  })();

  try {
    await navigator.clipboard.writeText(text);
    copied.value = what;
  } catch (e) {
    window.prompt('Copy this', text);
  }
  setTimeout(() => {
    copied.value = '';
  }, 1500);
}
</script>

<template>
  <div class="color-tool">
    <button
      v-if="!open"
      type="button"
      class="color-tool-toggle"
      aria-label="Open the color primitive editor"
      @click="open = true"
    >
      {{ changedCount ? `Colors (${ changedCount })` : 'Colors' }}
    </button>
    <aside
      v-else
      class="color-tool-panel"
      aria-label="Color primitive editor"
    >
      <header>
        <div class="color-tool-title">
          <strong>Color primitives</strong>
          <button
            type="button"
            aria-label="Close the color primitive editor"
            @click="open = false"
          >
            Close
          </button>
        </div>
        <input
          v-model="filter"
          type="search"
          placeholder="Filter: gray 96, #dcdfe7, blue"
          aria-label="Filter primitives"
        >
        <div class="color-tool-row">
          <label><input
            v-model="changedOnly"
            type="checkbox"
          > Changed only ({{ changedCount }})</label>
          <select
            v-model="theme"
            aria-label="Theme for this tab"
          >
            <option value="">
              Theme: as set
            </option>
            <option
              v-for="name in Object.keys(THEMES)"
              :key="name"
              :value="name"
            >
              {{ name }}
            </option>
          </select>
        </div>
        <div class="color-tool-row">
          <button
            type="button"
            :disabled="!changedCount"
            @click="copy('json')"
          >
            {{ copied === 'json' ? 'Copied' : 'Copy JSON' }}
          </button>
          <button
            type="button"
            :disabled="!changedCount"
            @click="copy('link')"
          >
            {{ copied === 'link' ? 'Copied' : 'Copy link' }}
          </button>
          <button
            type="button"
            :disabled="!changedCount"
            @click="clearOverrides({ persist })"
          >
            Reset all
          </button>
        </div>
        <p
          v-if="found"
          class="color-tool-found"
          role="status"
        >
          {{ found }}
        </p>
      </header>
      <ul>
        <li
          v-for="p in rows"
          :key="p.name"
          :class="{ changed: !!current[p.name], finding: finding === p.name }"
        >
          <label
            class="color-tool-swatch"
            :title="`Pick a color for ${ p.name }`"
          >
            <span :style="{ background: `var(${ p.name })` }" />
            <input
              type="color"
              :value="toHex(current[p.name] || p.value)"
              :aria-label="`Pick a color for ${ p.name }`"
              @input="pick(p, ($event.target as HTMLInputElement).value)"
            >
          </label>
          <button
            type="button"
            class="color-tool-name"
            :title="`Ring where this page paints ${ p.name }`"
            @click="find(p.name)"
          >
            {{ p.name.replace('--color-', '') }}
          </button>
          <input
            class="color-tool-value"
            :value="current[p.name] || p.value"
            spellcheck="false"
            :aria-label="`Value of ${ p.name }`"
            @change="edit(p.name, ($event.target as HTMLInputElement).value)"
          >
          <button
            v-if="current[p.name]"
            type="button"
            class="color-tool-reset"
            :aria-label="`Reset ${ p.name } to ${ p.value }`"
            :title="`Reset to ${ p.value }`"
            @click="setOverride(p.name, null, { persist })"
          >
            ↺
          </button>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
/* stylelint-disable local-rules/no-color-literal */
.color-tool-toggle, .color-tool-panel {
  position: fixed;
  z-index: 2147483647;
  font: 12px/1.4 system-ui, sans-serif;
  color: #ececf1;
}

.color-tool-toggle {
  right: 12px;
  bottom: 12px;
  padding: 6px 12px;
  border: 1px solid #5b5e6b;
  border-radius: 16px;
  background: #24262d;
  opacity: 0.8;
  cursor: pointer;

  &:hover, &:focus-visible {
    opacity: 1;
  }
}

.color-tool-panel {
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 380px;
  border-left: 1px solid #3a3d48;
  background: #1b1c21;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.35);

  header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #3a3d48;
  }

  ul {
    flex: 1;
    margin: 0;
    padding: 4px 0;
    overflow-y: auto;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 12px;

    &.changed {
      background: #2b2540;
    }

    &.finding {
      box-shadow: inset 3px 0 0 #ff00d4;
    }
  }

  button, input, select {
    height: 24px;
    padding: 0 8px;
    border: 1px solid #4a4d5a;
    border-radius: 4px;
    background: #24262d;
    color: inherit;
    font: inherit;
  }

  button {
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }

  :focus-visible {
    outline: 2px solid #7fb2ff;
    outline-offset: 1px;
  }

  input[type='search'] {
    width: 100%;
  }
}

.color-tool-title, .color-tool-row {
  display: flex;
  align-items: center;
  gap: 8px;

  strong {
    flex: 1;
    font-size: 13px;
  }

  label {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
  }

  input[type='checkbox'] {
    height: auto;
  }
}

.color-tool-found {
  margin: 0;
  color: #ff8be9;
}

.color-tool-swatch {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  border: 1px solid #5b5e6b;
  border-radius: 4px;
  background: repeating-conic-gradient(#d0d0d0 0% 25%, #ffffff 0% 50%) 50% / 8px 8px;
  overflow: hidden;
  cursor: pointer;

  span {
    position: absolute;
    inset: 0;
  }

  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
}

.color-tool-panel .color-tool-name {
  flex: 1;
  min-width: 0;
  height: auto;
  padding: 0;
  border: 0;
  background: none;
  font-family: ui-monospace, monospace;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}

.color-tool-panel .color-tool-value {
  width: 150px;
  padding: 0 4px;
  font-family: ui-monospace, monospace;
}

.color-tool-panel .color-tool-reset {
  width: 24px;
  padding: 0;
}
</style>
