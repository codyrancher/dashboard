import { createApp } from 'vue';
const vueApp = createApp({});
import cleanTooltipDirective from '@shell/directives/clean-tooltip';

export default cleanTooltipDirective;
/* eslint-disable-next-line no-console */
console.warn(`Importing cleanTooltipDirective from plugins has been deprecated, use shell/directives/clean-tooltip.js instead.
Make sure to invoke it using vueApp.directive('clean-tooltip', cleanTooltipDirective ) to maintain compatibility.`);
vueApp.directive('clean-tooltip', cleanTooltipDirective);
