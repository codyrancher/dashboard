<script lang="ts">
import CreateEditView from '@/mixins/create-edit-view/typed';
import { asciiLike } from '@/utils/string';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { Component, Watch } from 'vue-property-decorator';
import NameNsDescription from '@/components/form/NameNsDescription.vue';
import KeyValue from '@/components/form/KeyValue.vue';
import Labels from '@/components/form/Labels.vue';
import Tab from '@/components/Tabbed/Tab.vue';
import Tabbed from '@/components/Tabbed/index.vue';
import CruResource from '@/components/CruResource.vue';
import ConfigMapModel from '~/models/configmap';

@Component({
  components: {
    CruResource,
    NameNsDescription,
    KeyValue,
    Labels,
    Tab,
    Tabbed
  }
})
export default class ConfigMap extends CreateEditView<ConfigMapModel> {
  allData: {};

  fetch() {
    console.log('testing');
  }

  data(): any {
    const { binaryData = {}, data = {} } = this.value;

    console.log('dooiujikjkojk', this.value);

    const decodedBinaryData = {};

    Object.keys(binaryData).forEach((key) => {
      decodedBinaryData[key] = base64Decode(binaryData[key]);
    });

    return { ...super.data(), allData: { ...decodedBinaryData, ...data } };
  }

  @Watch('allData')
  onAllData(neu, old) {
    this.$set(this.value, 'data', {});
    this.$set(this.value, 'binaryData', {});

    Object.keys(neu).forEach((key) => {
      if (this.isBinary(neu[key])) {
        const encoded = base64Encode(neu[key]);

        this.$set(this.value.binaryData, key, encoded);
      } else {
        this.$set(this.value.data, key, neu[key]);
      }
    });
  }

  isBinary(value) {
    return typeof value === 'string' && !asciiLike(value);
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :mode="mode"
      :register-before-hook="registerBeforeHook"
    />

    <Tabbed :side-tabs="true">
      <Tab name="data" :label="t('configmap.tabs.data.label')" :weight="2">
        <KeyValue
          key="data"
          v-model="allData"
          :mode="mode"
          :protip="t('configmap.tabs.data.protip')"
          :initial-empty-row="true"
          :value-can-be-empty="true"
          :read-multiple="true"
          :read-accept="'*'"
        />
      </Tab>
      <Tab
        name="labels-and-annotations"
        :label="t('generic.labelsAndAnnotations')"
        :weight="-1"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
