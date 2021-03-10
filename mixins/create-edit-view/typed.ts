import { Prop } from 'vue-property-decorator';
import { _CREATE, _EDIT, _VIEW, _YAML } from '@/config/query-params';
import { exceptionToErrorsArray } from '@/utils/error';
import { RawLocation } from 'vue-router';
import { LAST_NAMESPACE } from '@/typed-store/prefs';
import { ProxiedResource } from '@/plugins/steve/resource.types';
import ChildHook from '@/mixins/child-hook-typed';

export default class CreateEditViewTyped<T extends ProxiedResource> extends ChildHook {
    @Prop({ default: _EDIT, type: String }) mode: string;
    @Prop({ default: _EDIT, type: String }) realMode: string;
    @Prop({ default: _YAML, type: String }) as: string;
    @Prop({ required: true, type: Object }) value: T;
    @Prop({ default: null, type: Object }) originalValue: any;

    errors: string[];
    doneLocationOverride?: RawLocation;

    fetch(): void | Promise<void> {}

    mounted() {
      // For easy access debugging...
      if ( typeof window !== 'undefined' ) {
        (window as any).v = this.value;
        (window as any).c = this;
      }
    }

    data() {
      // Keep label and annotation filters in data so each resource CRUD page can alter individually
      return { errors: [] };
    }

    get isCreate() {
      return this.mode === _CREATE;
    }

    get isEdit() {
      return this.mode === _EDIT;
    }

    get isView() {
      return this.mode === _VIEW;
    }

    get schema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`](this.value.type);
    }

    get isNamespaced() {
      return this.schema?.attributes?.namespaced || false;
    }

    get labels() {
      return this.value?.labels;
    }

    set labels(neu) {
      this.value.setLabels(neu);
    }

    get annotations() {
      return this.value?.annotations;
    }

    set annotations(neu) {
      this.value.setAnnotations(neu);
    }

    get doneRoute() {
      let name = this.$route.name;

      if ( name.endsWith('-id') ) {
        name = name.replace(/(-namespace)?-id$/, '');
      } else if ( name.endsWith('-create') ) {
        name = name.replace(/-create$/, '');
      }

      return name;
    }

    get doneParams() {
      const out = { ...this.$route.params };

      delete out.namespace;
      delete out.id;

      return out;
    }

    done() {
      if ( this.doneLocationOverride) {
        return this.$router.replace(this.doneLocationOverride as RawLocation);
      }

      if ( !this.doneRoute ) {
        return;
      }

      this.$router.replace({
        name:   this.doneRoute,
        params: this.doneParams || { resource: this.value.type }
      });
    }

    save = async(buttonDone, url) => {
      this.errors = null;
      try {
        // await this.applyHooks(BEFORE_SAVE_HOOKS);

        // Remove the labels map if it's empty
        if ( this.value?.metadata?.labels && Object.keys(this.value.metadata.labels || {}).length === 0 ) {
          delete this.value.metadata.labels;
        }

        // Remove the annotations map if it's empty
        if ( this.value?.metadata?.annotations && Object.keys(this.value.metadata.annotations || {}).length === 0 ) {
          delete this.value.metadata.annotations;
        }

        if ( this.isCreate ) {
          if ( this.value?.metadata?.namespace ) {
            this.value.$dispatch('prefs/set', { key: LAST_NAMESPACE, value: this.value.metadata.namespace }, { root: true });
          }
        }

        await this.actuallySave(url);

        // If spoofed we need to reload the values as the server can't have watchers for them.
        if (this.$store.getters['type-map/isSpoofed'](this.value.type)) {
          await this.$store.dispatch('cluster/findAll', { type: this.value.type, opt: { force: true } }, { root: true });
        }

        // await this.applyHooks(AFTER_SAVE_HOOKS);
        buttonDone(true);

        this.done();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }

    actuallySave = async(url) => {
      if ( this.isCreate ) {
        url = url || this.schema.linkFor('collection');
        const res = await this.value.save({ url });

        if (res) {
          Object.assign(this.value, res);
        }
      } else {
        await this.value.save();
      }
    }
};
