<script>
import ArrayList from '@/components/form/ArrayList';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { mapGetters } from 'vuex';

const CLUSTER_FIRST = 'ClusterFirst';
const CLUSTER_FIRST_HOST = 'ClusterFirstWithHostNet';

export default {
  components: {
    ArrayList, KeyValue, LabeledInput, LabeledSelect
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    const hostAliases = (this.value.hostAliases || []).map((entry) => {
      return {
        ip:        entry.ip,
        hostnames: entry.hostnames.join(', ')
      };
    });
    const { dnsConfig = {}, hostname, subdomain } = this.value;
    const { nameservers, searches, options } = dnsConfig;

    const out = {
      dnsPolicy:   this.value.dnsPolicy || 'Default',
      networkMode: this.value.hostNetwork ? 'host' : 'normal',
      hostAliases,
      nameservers,
      searches,
      hostname,
      subdomain,
      options
    };

    return out;
  },

  computed: {
    dnsPolicyChoices() {
      return [
        {
          label: this.t('workload.networking.dnsPolicy.options.default'),
          value: 'Default'
        },
        {
          label: this.t('workload.networking.dnsPolicy.options.clusterFirst'),
          value: 'ClusterFirst'
        },
        {
          label: this.t('workload.networking.dnsPolicy.options.clusterFirstWithHostNet'),
          value: 'ClusterFirstWithHostNet'
        },
        {
          label: this.t('workload.networking.dnsPolicy.options.none'),
          value: 'None'
        },
      ];
    },

    networkModeChoices() {
      return [
        { label: this.t('workload.networking.networkMode.options.normal'), value: false },
        { label: this.t('workload.networking.networkMode.options.hostNetwork'), value: true },
      ];
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    networkMode(neu) {
      const on = neu;

      this.value.hostNetwork = on;
      if ( this.dnsPolicy === CLUSTER_FIRST ) {
        if ( on ) {
          this.value.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.value.dnsPolicy = CLUSTER_FIRST;
        }
      }
    },

    dnsPolicy(neu) {
      if ( neu === CLUSTER_FIRST ) {
        if ( this.networkMode ) {
          this.value.dnsPolicy = CLUSTER_FIRST_HOST;
        } else {
          this.value.dnsPolicy = CLUSTER_FIRST;
        }
      } else {
        this.value.dnsPolicy = neu;
      }
    }
  },

  created() {
    // const spec = this.spec;

    // if ( !spec.dnsNameservers ) {
    //   spec.dnsNameservers = [];
    // }

    // if ( !spec.searches ) {
    //   spec.searches = [];
    // }

    // if ( !spec.dnsPolicy ) {
    //   spec.dnsPolicy = 'Default';
    // }
  },

  methods: {
    updateHostAliases(neu) {
      this.hostAliases = neu.map((entry) => {
        const ip = entry.ip.trim();
        const hostnames = entry.hostnames.trim().split(/[\s,]+/).filter(x => !!x);

        return { ip, hostnames };
      }).filter(entry => entry.ip && entry.hostnames.length);
      this.update();
    },

    update() {
      const dnsConfig = {
        ...this.dnsConfig,
        nameservers: this.nameservers,
        searches:    this.searches,
        options:     this.options
      };
      const out = {
        ...this.value,
        dnsConfig,
        dnsPolicy:   this.dnsPolicy,
        hostname:    this.hostname,
        hostAliases: this.hostAliases,
        subdomain:   this.subdomain,
        hostNetwork: this.networkMode
      };

      this.$emit('input', out);
    }
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="networkMode"
          :mode="mode"
          :options="networkModeChoices"
          :label="t('workload.networking.networkMode.label')"
          :placeholder="t('workload.networking.networkMode.placeholder')"
          @input="update"
        />
      </div>

      <div class="col span-6">
        <LabeledSelect
          v-model="dnsPolicy"
          :mode="mode"
          :options="dnsPolicyChoices"
          :label="t('workload.networking.dnsPolicy.label')"
          :placeholder="t('workload.networking.dnsPolicy.placeholder')"
          @input="update"
        />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="hostname"
          :mode="mode"
          :label="t('workload.networking.hostname.label')"
          :placeholder="t('workload.networking.hostname.placeholder')"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="subdomain"
          :mode="mode"
          :label="t('workload.networking.subdomain.label')"
          :placeholder="t('workload.networking.subdomain.placeholder')"
          @input="update"
        />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <ArrayList
          key="dnsNameservers"
          v-model="nameservers"
          :title="t('workload.networking.nameservers.label')"
          :value-placeholder="t('workload.networking.nameservers.placeholder')"
          :add-label="t('workload.networking.nameservers.add')"
          :value-multiline="false"
          :mode="mode"
          :pad-left="false"
          :protip="false"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <ArrayList
          key="dnsSearches"
          v-model="searches"
          :title="t('workload.networking.searches.label')"
          :value-placeholder="t('workload.networking.searches.placeholder')"
          :add-label="t('workload.networking.searches.add')"
          :value-multiline="false"
          :mode="mode"
          :pad-left="false"
          :protip="false"
          @input="update"
        />
      </div>
    </div>

    <div class="spacer" />

    <div class="row">
      <KeyValue
        v-model="options"
        key-label="Name"
        :mode="mode"
        :title="t('workload.networking.resolver')"
        :read-allowed="false"
      >
        <template #title>
          <h3>{{ t('workload.networking.resolver') }}</h3>
        </template>
      </KeyValue>
    </div>

    <div class="row">
      <div class="col span-12">
        <KeyValue
          key="hostAliases"
          v-model="hostAliases"
          :mode="mode"
          :title="t('workload.networking.hostAliases.label')"
          :protip="t('workload.networking.hostAliases.tip')"
          :read-allowed="false"
          :as-map="false"
          key-name="ip"
          :key-label="t('workload.networking.hostAliases.keyLabel')"
          :key-placeholder="t('workload.networking.hostAliases.keyPlaceholder')"
          value-name="hostnames"
          :value-label="t('workload.networking.hostAliases.valueLabel')"
          :value-placeholder="t('workload.networking.hostAliases.valuePlaceholder')"
          :pad-left="false"
          :add-label="t('workload.networking.hostAliases.add')"
          @input="updateHostAliases"
        >
          <template #title>
            <h3>{{ t('workload.networking.hostAliases.label') }}</h3>
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>
