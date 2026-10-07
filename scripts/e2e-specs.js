/* eslint-disable no-console */
/**
 * Finds the e2e spec files with a test matching a @cypress/grep tag filter, using the same
 * static pre-filter that @cypress/grep applies at the start of a run.
 */

const path = require('path');
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

module.exports = {
  ROOT, matchingSpecs, withTag
};
