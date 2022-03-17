<script>
import SortableTable from '@/components/SortableTable';
import Loading from '@/components/Loading';
import { getSLOs } from '@/product/opni/utils/requests/slo';
import SplitButton from '@/product/opni/components/SplitButton';
import CloneServiceDialog from './dialogs/CloneServiceDialog';
import { GlobalEventBus } from '~/product/opni/utils/globalEventBus';

export default {
  components: {
    SplitButton, CloneServiceDialog, Loading, SortableTable
  },
  async fetch() {
    await this.load();
  },

  data() {
    return {
      loading:       false,
      slos:          [],
      filter:        null,
      createOptions: [
        {
          label: 'Create SLO',
          value: 'slo'
        },
        {
          label: 'Create Network SLOs',
          value: 'network'
        },
        {
          label: 'Create Disk SLOs',
          value: 'disk'
        },
        {
          label: 'Create CPU SLOs',
          value: 'cpu'
        }
      ],
      headers:      [
        {
          name:      'name',
          labelKey:  'tableHeaders.name',
          sort:      ['name'],
          value:     'nameDisplay',
          width:     undefined
        },
        {
          name:          'time',
          labelKey:      'tableHeaders.time',
          sort:          ['time'],
          value:         'time',
        },
        {
          name:          'status',
          labelKey:      'tableHeaders.status',
          sort:          ['status'],
          value:         'status',
        },
        {
          name:          'budget',
          labelKey:      'tableHeaders.budget',
          sort:          ['budget'],
          value:         'budget',
        },
        {
          name:          'target',
          labelKey:      'tableHeaders.target',
          sort:          ['target'],
          value:         'target',
        },
      ]
    };
  },

  created() {
    this.$on('remove', this.onClusterDelete);
    GlobalEventBus.$on('update', this.onUpdate);
  },

  beforeDestroy() {
    this.$off('remove');
    GlobalEventBus.$off('update');
  },

  computed: {
    filteredSlos() {
      if (!this.filter) {
        return this.slos;
      }

      return this.slos.filter(slo => slo.base.cluster === this.filter);
    }
  },

  methods: {
    onClusterDelete() {
      this.load();
    },

    openCreateDialog(ev) {
      ev.preventDefault();
      this.$refs.dialog.open();
    },

    onUpdate() {
      this.load();
    },

    async load() {
      const slos = await getSLOs();

      this.$set(this, 'slos', slos);
    },

    showServiceAction(event, base) {
      this.$store.commit(`action-menu/show`, {
        resources: [{
          availableActions: [
            {
              action:     'cloneService',
              altAction:  'clone',
              label:      'Clone',
              icon:       'icon icon-copy',
              bulkable:   false,
              enabled:    true,
              bulkAction: 'clone',
              weight:     -10, // Delete always goes last
            },
          ],
          cloneService: () => {
            this.$refs.dialog.open(base.cluster, base.service);
          }
        }],
        elem: event.target
      });
    },

    cloneService(slo, service, cluster) {
      this.$refs.dialog.open(slo.base.cluster, slo.base.service);
    },

    cloneFromTemplate(template) {
      this.$refs.dialog.open(null, null, template);
    },

    openDialog(value) {
      this.$refs.dialog.open(value.target);
    },

    createAction(value) {
      if (value === 'slo') {
        this.$router.replace({ name: 'slo' });
      } else {
        this.cloneFromTemplate('network');
      }
    },

    addFilter(filter) {
      this.$set(this, 'filter', filter);
    },

    clearFilter() {
      this.$set(this, 'filter', null);
    },

  }
};
</script>
<template>
  <Loading v-if="loading || $fetchState.pending" />
  <div v-else class="slos">
    <header>
      <div class="title">
        <h1>Service Level Objectives</h1>
      </div>
      <div class="actions-container">
        <SplitButton :options="createOptions" @click="createAction">
        </splitbutton>
      </div>
    </header>
    <SortableTable
      :rows="filteredSlos"
      :headers="headers"
      :search="true"
      group-by="serviceCluster"
      default-sort-by="expirationDate"
      key-field="nameDisplay"
    >
      <template #group-by="group">
        <div class="service-bar">
          <div v-trim-whitespace class="group-tab">
            <div class="service-name">
              <b>Cluster: <span class="filter" @click="addFilter(group.group.rows[0].base.cluster)">{{ group.group.rows[0].base.cluster }}<span></span></span></b> (Service: {{ group.group.rows[0].base.service }})
            </div>
          </div>
          <div class="right">
            <button type="button" class="service-action btn btn-sm role-multi-action actions mr-5" @click="showServiceAction($event, group.group.rows[0].base)">
              <i class="icon icon-actions" />
            </button>
          </div>
        </div>
      </template>
      <template #header-middle>
        <div class="filters">
          <span v-if="filter" class="bubble filter" @click="clearFilter">
            Cluster: {{ filter }}
          </span>
        </div>
      </template>
    </SortableTable>
    <CloneServiceDialog ref="dialog" @save="cloneService" />
  </div>
</template>

<style lang="scss" scoped>
.slos {
  & ::v-deep {
    .filters {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: middle;
    }

    .filter {
      cursor: pointer;
    }

    .service-name {
      line-height: 30px;
    }

    .service-bar {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      &.has-description {
        .right {
          margin-top: 5px;
        }
        .group-tab {
          &, &::after {
              height: 50px;
          }

          &::after {
              right: -20px;
          }

          .description {
              margin-top: -20px;
          }
        }
      }
    }
  }
}
</style>
