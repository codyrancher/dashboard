import { CUSTOM_PAGE_NAME, SETTING_PAGE_NAME, PRODUCT_SETTING_NAME } from '../config/constants';
import { PluginRouteRecordRaw } from '@shell/core/types';

import Registration from '../pages/Registration.vue';

const routes: PluginRouteRecordRaw[] = [
  {
    parent: 'default',
    route:  {
      name:      SETTING_PAGE_NAME,
      path:      `/c/:cluster/settings/${ CUSTOM_PAGE_NAME }`,
      component: Registration,
      meta:      { product: PRODUCT_SETTING_NAME },
    },
  },
];

export default routes;
