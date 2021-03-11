import { ANNOTATIONS_TO_IGNORE_REGEX, LABELS_TO_IGNORE_REGEX, NORMAN_NAME } from '@/config/labels-annotations';
import pickBy from 'lodash/pickBy';
import omitBy from 'lodash/omitBy';
import { matchesSomeRegex } from '@/utils/string';
import { removeAt } from '@/utils/array';
import Vue from 'vue';

export type Metadata = any;

class BaseModel {
  isTypescript = true;
  metadata: Metadata;
  type: string;
  id: string;
  $getters: any;
  $rootGetters: any;
  displayName?: string;
  spec: any;

  constructor(object?: any, ctx?: any) {
    const context = { $getters: ctx.getters, $rootGetters: ctx.rootGetters };

    Object.assign(this, object, context);
  }

  get customValidationRules() {
    return [
      /**
       * Essentially a fake schema object with additonal params to extend validation
       *
       * @param {nullable} Value is nullabel
       * @param {path} Path on the resource to the value to validate
       * @param {required} Value required
       * @param {requiredIf} Value required if value at path not empty
       * @param {translationKey} Human readable display key for param in path e.g. metadata.name === Name
       * @param {type} Type of field to validate
       * @param {validators} array of strings where item is name of exported validator function in custom-validtors, args can be passed by prepending args seperated by colon. e.g maxLength:63
       */
      /* {
        nullable:       false,
        path:           'spec.ports',
        required:       true,
        type:           'array',
        validators:     ['servicePort'],
      } */
    ];
  }

  get _detailLocation() {
    if (!this.$getters) {
      return null;
    }

    const schema = this.$getters['schemaFor'](this.type);

    const id = this.id?.replace(/.*\//, '');

    return {
      name:   `c-cluster-product-resource${ schema?.attributes?.namespaced ? '-namespace' : '' }-id`,
      params: {
        product:   this.$rootGetters['productId'],
        cluster:   this.$rootGetters['clusterId'],
        resource:  this.type,
        namespace: this.metadata?.namespace,
        id,
      }
    };
  }

  get detailLocation() {
    return this._detailLocation;
  }

  save(opts?: any): Promise<any> {
    return Promise.resolve();
  }

  $dispatch(a: any, b: any, c:any) {

  }

  get nameDisplay() {
    return this.displayName || this.spec?.displayName || this.metadata?.annotations?.[NORMAN_NAME] || this.metadata?.name || this.id || 'failure';
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  setLabels(val) {
    if ( !this.metadata ) {
      this.metadata = {};
    }

    const all = this.metadata.labels || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });

    Vue.set(this.metadata, 'labels', { ...wasIgnored, ...val });
  }

  setAnnotations(val) {
    if ( !this.metadata ) {
      this.metadata = {};
    }

    const all = this.metadata.annotations || {};
    const wasIgnored = pickBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });

    Vue.set(this.metadata, 'annotations', { ...wasIgnored, ...val });
  }

  get labels() {
    const all = this.metadata?.labels || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, LABELS_TO_IGNORE_REGEX);
    });
  }

  get annotations() {
    const all = this.metadata?.annotations || {};

    return omitBy(all, (value, key) => {
      return matchesSomeRegex(key, ANNOTATIONS_TO_IGNORE_REGEX);
    });
  }

  get _key() {
    const m = this.metadata;

    if ( m ) {
      if ( m.uid ) {
        return m.uid;
      }

      if ( m.namespace ) {
        return `${ this.type }/${ m.namespace }/${ m.name }`;
      }
    }

    if ( this.id ) {
      return `${ this.type }/${ this.id }`;
    }

    return `${ this.type }/${ Math.random() }`;
  }

  get schema() {
    console.log('got to schema');

    return this.$getters['schemaFor'](this.type);
  }

  get toString() {
    return () => {
      return `[${ this.type }: ${ this.id }]`;
    };
  }

  get availableActions() {
    const all = this._availableActions;

    // Remove disabled items and consecutive dividers
    let last = null;
    const out = all.filter((item) => {
      if ( item.enabled === false ) {
        return false;
      }

      const cur = item.divider;
      const ok = !cur || (cur && !last);

      last = cur;

      return ok;
    });

    // Remove dividers at the beginning
    while ( out.length && out[0].divider ) {
      out.shift();
    }

    // Remove dividers at the end
    while ( out.length && out[out.length - 1].divider ) {
      out.pop();
    }

    // Remove consecutive dividers in the middle
    for ( let i = 1 ; i < out.length ; i++ ) {
      if ( out[i].divider && out[i - 1].divider ) {
        removeAt(out, i, 1);
        i--;
      }
    }

    return out;
  }

  // You can add custom actions by overriding your own availableActions (and probably reading _standardActions)
  get _availableActions() {
    return this._standardActions;
  }

  get canUpdate() {
    return true;
  }

  get canCustomEdit() {
    return true;
  }

  get canYaml() {
    return true;
  }

  get canCreate() {
    return true;
  }

  get canDelete() {
    return true;
  }

  get canViewInApi() {
    return true;
  }

  t(key: string, placeholders?: {[key: string]: string}, options?: {[key: string]: string}): string {
    return this.$rootGetters?.['i18n/t'](key, placeholders, options) || 'failed to get string';
  }

  get _standardActions() {
    const all = [
      { divider: true },
      {
        action:  this.canUpdate ? 'goToEdit' : 'goToViewConfig',
        label:   this.canUpdate ? 'action.edit' : 'action.view',
        icon:    'icon icon-edit',
        enabled:  this.canCustomEdit,
      },
      {
        action:  this.canUpdate ? 'goToEditYaml' : 'goToViewYaml',
        label:   this.t(this.canUpdate ? 'action.editYaml' : 'action.viewYaml'),
        icon:    'icon icon-file',
        enabled: this.canYaml,
      },
      {
        action:     'download',
        label:      this.t('action.download'),
        icon:       'icon icon-download',
        bulkable:   true,
        bulkAction: 'downloadBulk',
        enabled:    this.canYaml
      },
      {
        action:  (this.canCustomEdit ? 'goToClone' : 'cloneYaml'),
        label:   this.t('action.clone'),
        icon:    'icon icon-copy',
        enabled:  this.canCreate && (this.canCustomEdit || this.canYaml),
      },
      { divider: true },
      {
        action:     'promptRemove',
        altAction:  'remove',
        label:      this.t('action.remove'),
        icon:       'icon icon-trash',
        bulkable:   true,
        enabled:    this.canDelete,
        bulkAction: 'promptRemove',
      },
      {
        action:  'viewInApi',
        label:   this.t('action.viewInApi'),
        icon:    'icon icon-external-link',
        enabled:  this.canViewInApi,
      }
    ];

    return all;
  }
}

BaseModel['isTypescript'] = true;

export default BaseModel;
