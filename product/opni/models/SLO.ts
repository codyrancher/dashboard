import { Resource } from './Resource';
import { GlobalEventBus } from '~/product/opni/utils/globalEventBus';
import { cloneSLO } from '~/product/opni/utils/requests/slo';

export interface SLOResponse {
  name: string;
  service: string;
  cluster: string;
  time: number;
  status: number;
  budget: number;
  target: number
}

export interface SLOsResponse {
  items: SLOResponse[];
}

export class SLO extends Resource {
    private base: SLOResponse;
    private serviceCluster: string;

    constructor(base: SLOResponse, vue: any) {
      super(vue);
      this.base = base;
      this.serviceCluster = `${ base.cluster } ${ base.service }`;
    }

    get budget(): string {
      return `100% (1h 40m)`;
    }

    get nameDisplay(): string {
      return this.base.name;
    }

    get serviceDisplay(): string {
      return this.base.service;
    }

    get clusterDisplay(): string {
      return this.base.cluster;
    }

    get time() {
      return `7d`;
    }

    get status() {
      return `100% (1h 40m)`;
    }

    get target() {
      return `90%`;
    }

    get availableActions(): any[] {
      return [
        {
          action:     'clone',
          altAction:  'clone',
          label:      'Clone',
          icon:       'icon icon-copy',
          bulkable:   false,
          enabled:    true,
          bulkAction: 'clone',
          weight:     2, // Delete always goes last
        },
        {
          action:     'move',
          altAction:  'move',
          label:      'Move',
          icon:       'icon icon-fork',
          bulkable:   false,
          enabled:    true,
          bulkAction: 'move',
          weight:     1, // Delete always goes last
        },
        {
          action:     'edit',
          altAction:  'edit',
          label:      'Edit',
          icon:       'icon icon-edit',
          bulkable:   false,
          enabled:    true,
          bulkAction: 'edit',
          weight:     0,
        },
        {
          action:     'promptRemove',
          altAction:  'delete',
          label:      'Delete',
          icon:       'icon icon-trash',
          bulkable:   true,
          enabled:    true,
          bulkAction: 'promptRemove',
          weight:     -10, // Delete always goes last
        }
      ];
    }

    async clone() {
      const cloned = await cloneSLO(this);

      GlobalEventBus.$emit('update', {
        event: 'clone', type: 'slo', target: cloned
      });
    }
}

export function createResponse(name: string, service: string, cluster: string): SLOResponse {
  return {
    name,
    service,
    cluster,
    time:   0,
    status: 0,
    budget: 0,
    target: 0
  };
}

export function createSLO(name: string, service: string, cluster: string) {
  return new SLO(createResponse(name, service, cluster), null);
}
