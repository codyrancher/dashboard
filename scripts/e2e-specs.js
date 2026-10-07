/* eslint-disable no-console */
/**
 * Finds the e2e spec files with a test matching a @cypress/grep tag filter, using the same
 * static pre-filter that @cypress/grep applies at the start of a run.
 */

const fs = require('fs');
const path = require('path');
const globby = require('globby');
const { getTestNames, setEffectiveTags } = require('find-test-names');
const { plugin } = require('@cypress/grep/plugin');

const ROOT = path.resolve(__dirname, '..');

/**
 * @param {string} grepTags a @cypress/grep tag filter, for example `@adminUser+@charts --@jenkins`
 * @returns {string[]} absolute paths of the matching spec files, empty when nothing matches
 */
function matchingSpecs(grepTags) {
  const specPattern = ['cypress/e2e/tests/**/*.spec.ts'];
  const log = console.log;

  console.log = () => {};

  try {
    const config = plugin({
      specPattern,
      excludeSpecPattern: ['cypress/e2e/tests/setup/**'],
      expose:             {
        grepTags, grepFilterSpecs: true, grepIntegrationFolder: ROOT
      },
    });

    return config.specPattern === specPattern ? [] : config.specPattern;
  } finally {
    console.log = log;
  }
}

/**
 * Narrows a tag filter to the tests that also carry another tag
 *
 * @param {string} grepTags a @cypress/grep tag filter, for example `@adminUser+@charts --@jenkins`
 * @param {string} tag the tag every alternative must also carry
 * @returns {string} for example `@adminUser+@charts+@parallel --@jenkins`
 */
function withTag(grepTags, tag) {
  return grepTags.split(/\s+/).filter(Boolean).map((part) => (part.startsWith('-') ? part : `${ part }+${ tag }`)).join(' ');
}

/**
 * Finds the tests that carry every one of the given tags, counting the tags of the blocks
 * around them. Unlike matchingSpecs, which mirrors @cypress/grep's pre-filter and only looks
 * at the tags written on each block, this is what @cypress/grep would run in a loaded spec.
 *
 * @param {string[]} tags for example `['@standardUser', '@explorer']`
 * @returns {{ spec: string, tests: number }[]} spec files, relative to the repo, with their number of such tests
 */
function specsWithInheritedTags(tags) {
  const specs = globby.sync(['cypress/e2e/tests/**/*.spec.ts'], { cwd: ROOT, ignore: ['cypress/e2e/tests/setup/**'] });

  return specs.map((spec) => {
    const { structure } = getTestNames(fs.readFileSync(path.join(ROOT, spec), 'utf8'), true);
    let tests = 0;
    const count = (nodes) => nodes.forEach((node) => {
      if (node.type === 'test' && !node.pending && tags.every((tag) => (node.effectiveTags || []).includes(tag))) {
        tests++;
      }
      count([...(node.suites || []), ...(node.tests || [])]);
    });

    setEffectiveTags(structure);
    count(structure);

    return { spec, tests };
  }).filter(({ tests }) => tests > 0);
}

module.exports = {
  ROOT, matchingSpecs, withTag, specsWithInheritedTags
};
