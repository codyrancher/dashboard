// Taken from @nuxt/vue-app/template/index.js
// This file was generated during Nuxt migration

import Vue from 'vue';
import { createRouter } from '@shell/config/router';
import NuxtChild from '@shell/components/nuxt/nuxt-child';
import App from '@shell/initialize/App.js';
import { setContext, getLocation, normalizeError } from '@shell/utils/nuxt';
import { createStore } from '@shell/config/store';
import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';
import { loadDirectives } from '@shell/directives/index';
import { installPlugins } from '@shell/initialize/plugins';

// Prevent extensions from overriding existing directives
// Hook into Vue.directive and keep track of the directive names that have been added
// and prevent an existing directive from being overwritten
const directiveNames = {};
const vueDirective = Vue.directive;

Vue.directive = function(name) {
  if (directiveNames[name]) {
    console.log(`Can not override directive: ${ name }`); // eslint-disable-line no-console

    return;
  }

  directiveNames[name] = true;

  vueDirective.apply(Vue, arguments);
};

// Load the directives from the plugins - we do this with a function so we know
// these are initialized here, after the code above which keeps track of them and
// prevents over-writes
loadDirectives(Vue);

// Component: <NuxtChild>
Vue.component(NuxtChild.name, NuxtChild);
Vue.component('NChild', NuxtChild);

async function createApp() {
  // eslint-disable-next-line no-undef
  const config = nuxt.publicRuntimeConfig;
  const router = await createRouter(config);

  const store = createStore();

  // Add this.$router into store actions/mutations
  store.$router = router;

  // Create Root instance

  // here we inject the router and store to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = {
    store,
    router,
    nuxt: {
      err:     null,
      dateErr: null,
      error(err) {
        err = err || null;
        app.context._errored = Boolean(err);
        err = err ? normalizeError(err) : null;
        let nuxt = app.nuxt; // to work with @vue/composition-api, see https://github.com/nuxt/nuxt.js/issues/6517#issuecomment-573280207

        if (this) {
          nuxt = this.nuxt || this.$options.nuxt;
        }
        nuxt.dateErr = Date.now();
        nuxt.err = err;

        return err;
      }
    },
    ...App
  };

  // Make app available into store via this.app
  store.app = app;

  const next = (location) => app.router.push(location);
  // Resolve route

  const path = getLocation(router.options.base, router.options.mode);
  const route = router.resolve(path).route;

  // Set context to app.context
  await setContext(app, {
    store,
    route,
    next,
    error:   app.nuxt.error.bind(app),
    payload: undefined,
    req:     undefined,
    res:     undefined
  });

  await installPlugins(app, Vue);

  // Wait for async component to be resolved first
  await new Promise((resolve) => {
    // Ignore 404s rather than blindly replacing URL in browser
    const { route } = router.resolve(app.context.route.fullPath);

    if (!route.matched.length) {
      return resolve();
    }

    router.afterEach((to) => {
      const upgraded = to.query[UPGRADED] === _FLAGGED;

      if ( upgraded ) {
        router.applyQuery({ [UPGRADED]: _UNFLAG });

        store.dispatch('growl/success', {
          title:   store.getters['i18n/t']('serverUpgrade.title'),
          message: store.getters['i18n/t']('serverUpgrade.message'),
          timeout: 0,
        });
      }
    });
  });

  return {
    store,
    app,
    router
  };
}

export { createApp };
