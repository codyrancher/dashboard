/* eslint-disable local-rules/no-color-literal */
const fs = require('fs');
const path = require('path');
const colorName = require('color-name');

/**
 * PostCSS plugin for the color tool. Sass compiles most primitives into the themes as literal colors, so overriding
 * `--color-*` at runtime would not reach them. Every primitive has a value of its own, so each literal in Rancher's
 * own styles that equals one is put back as `var(--color-*)`. Styles from node_modules are left as they are.
 *
 * @param {string} root the dashboard checkout
 * @returns {(resourcePath: string) => object | null} the plugin for a stylesheet, or null when it is not Rancher's own
 */
module.exports = function colorToolRelink(root) {
  const NAMED = colorName.default || colorName;
  const tokenFile = path.join(root, 'pkg/rancher-components/src/components/design-system/colors.ts');

  if (!fs.existsSync(tokenFile)) {
    return () => null;
  }
  const tokens = fs.readFileSync(tokenFile, 'utf8');
  const own = [path.join(root, 'shell') + path.sep, path.join(root, 'pkg/rancher-components/src') + path.sep];
  const COLOR_TOKEN = /#[0-9a-f]{3,8}(?![\w-])|(?<![\w-])rgba?\([^()]*\)|(?<![\w-])[a-z]+(?![\w(-])/gi;
  const COLOR_PROPERTY = /^--|color|background|border|outline|fill|stroke|shadow|caret|column-rule|text-decoration/;

  const parse = (token) => {
    let rgba;

    if (token.startsWith('#')) {
      const hex = token.slice(1);
      const long = hex.length <= 4 ? hex.replace(/./g, '$&$&') : hex;

      rgba = [0, 2, 4, 6].map((i) => parseInt(long.slice(i, i + 2) || 'ff', 16));
      rgba[3] /= 255;
    } else if (/^rgba?\(/i.test(token)) {
      const parts = token.replace(/^rgba?\(|\)$/gi, '').split(/[\s,/]+/).filter(Boolean);

      rgba = parts.map((p, i) => (p.endsWith('%') ? parseFloat(p) * (i === 3 ? 0.01 : 2.55) : parseFloat(p)));
      rgba[3] = rgba[3] ?? 1;
    } else if (NAMED[token.toLowerCase()]) {
      rgba = [...NAMED[token.toLowerCase()], 1];
    }

    return rgba && rgba.length === 4 && rgba.every((n) => !isNaN(n)) ? rgba.map((n, i) => (i === 3 ? Math.round(n * 100) / 100 : Math.round(n))).join(',') : null;
  };

  const byColor = new Map();

  for (const [, name, value] of tokens.matchAll(/'(--color-[\w-]+)':\s*'([^']+)'/g)) {
    const key = parse(value);

    if (key && !key.endsWith(',0') && !byColor.has(key)) {
      byColor.set(key, name);
    }
  }

  const relink = (value) => value.replace(COLOR_TOKEN, (token) => {
    const name = byColor.get(parse(token));

    return name ? `var(${ name })` : token;
  });

  return (resourcePath) => {
    if (!resourcePath || resourcePath.includes(`${ path.sep }node_modules${ path.sep }`) || !own.some((dir) => resourcePath.startsWith(dir))) {
      return null;
    }

    return {
      postcssPlugin: 'color-tool-relink',
      Declaration(decl) {
        if (decl.prop.startsWith('--color-') || !COLOR_PROPERTY.test(decl.prop) || /["']|url\(/i.test(decl.value)) {
          return;
        }
        const value = relink(decl.value);

        if (value !== decl.value) {
          decl.value = value;
        }
      }
    };
  };
};
