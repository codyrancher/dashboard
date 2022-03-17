<script>
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import { exceptionToErrorsArray } from '@/utils/error';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  components: {
    Card,
    AsyncButton,
    LabeledSelect
  },
  data() {
    const clusters = [
      'New Cluster',
      'Complicated Cluster',
      'Simple Cluster'
    ];

    const services = [
      'New Service',
      'Best Service',
      'Worst Service'
    ];

    return {
      cluster:  clusters[0],
      clusters,
      service:  services[0],
      services,
      source:   null,
      template: null
    };
  },
  methods: {
    close() {
      this.$modal.hide('clone-service-dialog');
    },

    open(cluster, service, template) {
      this.$set(this, 'source', { cluster, service });
      this.$set(this, 'template', template);
      this.$modal.show('clone-service-dialog');
    },

    apply(buttonDone) {
      try {
        buttonDone(true);
        this.$emit('save', this.source, { cluster: this.cluster, service: this.service }, this.template);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  },

  computed: {
    title() {
      return this.template ? 'Create Network SLOs' : 'Clone Service SLOs';
    },

    mode() {
      return this.template ? 'create' : 'clone';
    }
  }
};
</script>

<template>
  <modal
    class="clone-service-dialog"
    name="clone-service-dialog"
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
    height="auto"
    :width="400"
    :scrollable="true"
    @closed="close()"
  >
    <Card class="prompt-restore" :show-highlight-border="false" title="Clone Service SLOs">
      <h4 slot="title" class="text-default-text">
        {{ title }}
      </h4>
      <div slot="body" class="pt-10">
        <div class="row mb-10">
          <div class="col span-12">
            <LabeledSelect v-model="cluster" :options="clusters" label="Cluster" />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <LabeledSelect v-model="service" :options="services" label="Service" />
          </div>
        </div>
      </div>

      <div slot="actions" class="buttons">
        <button class="btn role-secondary mr-10" @click="close">
          {{ t('generic.cancel') }}
        </button>

        <AsyncButton
          :mode="mode"
          @click="apply"
        />
      </div>
    </Card>
  </modal>
</template>
<style lang='scss' scoped>
  .prompt-restore {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }

  .clone-service-dialog {
    border-radius: var(--border-radius);
    overflow: scroll;
    max-height: 100vh;
    & ::-webkit-scrollbar-corner {
      background: rgba(0,0,0,0);
    }
  }
</style>
