import { BaseResource, ProxiedResource, ProxyResourceInstance } from '~/plugins/steve/resource.types';

export default {
  data:       {},
  binaryData: {},

  keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  }
};

export interface ConfigMapModel extends ProxyResourceInstance {
  keysDisplay: string[];
  binaryData: {};
  data: {};
}

export type ConfigMapType = ProxiedResource<ConfigMapModel, BaseResource>
