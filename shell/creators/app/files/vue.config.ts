import config from '@rancher/shell/vue.config';

// Excludes the following plugins if there's no .env file.
const defaultExcludes = 'epinio, rancher-components, harvester';
const excludes = process.env.EXCLUDES_PKG || defaultExcludes;

export default config(__dirname, {
  excludes: excludes.replace(/\s/g, '').split(','),
  // excludes: ['fleet', 'example']
  // autoLoad: ['fleet', 'example']
});
