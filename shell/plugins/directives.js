import Vue from 'vue';
import focusDirective from '@shell/plugins/directives.js';

export default focusDirective;
/* eslint-disable-next-line no-console */
console.warn(`Importing focusDirective from plugins has been deprecated, use shell/directives/focus.js instead.
Make sure to invoke it using vueApp.directive('focus', focusDirective ) to maintain compatibility.`);
vueApp.directive('focus', focusDirective);
