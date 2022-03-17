<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import AsyncButton from '@/components/AsyncButton';
import Loading from '@/components/Loading';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import Card from '@/components/Card';

export default {
  components: {
    AsyncButton,
    Card,
    LabeledInput,
    LabeledSelect,
    Loading,
    TextAreaAutoGrow
  },

  async fetch() {
  },

  data() {
    const metrics = [
      'system.disk.read_time',
      'system.cpu.usage',
      'system.memory.usage'
    ];

    const formulas = [
      'Identity',
      'Sum',
      'P99.9'
    ];

    const services = [
      'Good Service',
      'Bad Service'
    ];

    const methods = [
      'Slack',
      'Email',
      'WeChat'
    ];

    const shouldBes = [
      'Less Than',
      'Greater Than',
      'Equal'
    ];

    const clusters = [
      'New Cluster',
      'Complicated Cluster',
      'Simple Cluster'
    ];

    return {
      name:      '',
      metric:   metrics[0],
      metrics,
      formula:  formulas[0],
      formulas,
      service:  services[0],
      services,
      method:   methods[0],
      methods,
      shouldBes,
      shouldBe: shouldBes[0],
      cluster:  clusters[0],
      clusters
    };
  },

  methods: {
    save() {
      this.$router.replace({ name: 'SLOs' });
    }
  },

  computed: {
    roleOptions() {
      return this.roles.map(role => ({
        label: role.name,
        value: role.id
      }));
    }
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row">
      <div class="col span-12 mb-20">
        <LabeledInput v-model="name" label="Name" />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <Card :show-highlight-border="false" :show-actions="false">
          <template v-slot:title>
            <h2>
              {{ t('opni.slo.tab.source') }}
            </h2>
          </template>
          <template v-slot:body>
            <h3 class="mt-20">
              Data
            </h3>
            <div class="row mb-20">
              <div class="col span-3">
                <LabeledSelect v-model="cluster" label="Cluster" :options="clusters" :taggable="true" :searchable="true" />
              </div>
              <div class="col span-3">
                <LabeledSelect v-model="service" label="Service" :options="services" :taggable="true" :searchable="true" />
              </div>
              <div class="col span-3">
                <LabeledSelect v-model="metric" label="Metric" :options="metrics" :taggable="true" :searchable="true" />
              </div>
              <div class="col span-3">
                <LabeledSelect v-model="formula" label="Formula" :options="formulas" />
              </div>
            </div>
            <h3>Threshold</h3>
            <div class="row">
              <div class="col span-6">
                <LabeledSelect v-model="shouldBe" label="Should Be" :options="shouldBes" />
              </div>
              <div class="col span-6">
                <LabeledInput v-model="threshold" label="Value" />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <Card :show-highlight-border="false" :show-actions="false">
          <template v-slot:title>
            <h2>
              {{ t('opni.slo.tab.target') }}
            </h2>
          </template>
          <template v-slot:body>
            <div class="row mt-20">
              <div class="col span-6">
                <LabeledInput label="Target">
                  <template #suffix>
                    <div class="addon">
                      %
                    </div>
                  </template>
                </LabeledInput>
              </div>
              <div class="col span-6">
                <LabeledInput label="Time Window">
                  <template #suffix>
                    <div class="addon">
                      Days
                    </div>
                  </template>
                </LabeledInput>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <Card :show-highlight-border="false" :show-actions="false">
          <template v-slot:title>
            <h2>
              {{ t('opni.slo.tab.alert') }}
            </h2>
          </template>
          <template v-slot:body>
            <div class="row mt-20 mb-10">
              <div class="col span-12">
                <LabeledSelect v-model="method" label="Method" :options="methods" />
              </div>
            </div>
            <div class="row">
              <div class="col span-12">
                <TextAreaAutoGrow label="Message" :min-height="200" placeholder="You may use {source}, {service}, {metric} and {formula} as placeholders in your message." />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <Card :show-highlight-border="false" :show-actions="false">
          <template v-slot:title>
            <h2>
              {{ t('opni.slo.tab.preview') }}
            </h2>
          </template>
          <template v-slot:body>
            <div class="preview mt-20">
              <img class="" src="~/assets/images/graph-poc.png" />
            </div>
          </template>
        </Card>
      </div>
    </div>
    <div class="resource-footer">
      <AsyncButton
        mode="edit"
        @click="save"
      >
      </asyncbutton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resource-footer {
  display: flex;
  flex-direction: row;

  justify-content: flex-end;
}

.install-command {
  width: 100%;
}

::v-deep {
  .warning {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .card-body {
    border-top: solid 1px var(--header-border);
  }

  .card-container {
    margin: 0;
  }
}

.preview {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>
