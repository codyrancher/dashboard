<script>
export default {
  props: {
    options: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    defaultOption() {
      return this.options[0];
    },

    otherOptions() {
      const [_, ...rest] = this.options; // eslint-disable-line no-unused-vars

      return rest;
    }
  },

  methods: {
    click(value) {
      this.$emit('click', value);
    }
  }
};
</script>
<template>
  <div class="dropdown-button-group">
    <div
      class="split-button"
    >
      <button
        ref="popoverButton"
        class="btn icon-container bg-primary pr-10"
        type="button"
      >
        <span class="mr-5 split" @click="click(defaultOption.value)">{{ defaultOption.label }}</span>
        <v-popover
          placement="bottom"
          :container="false"
          :popper-options="{modifiers: { flip: { enabled: false } } }"
        >
          <i class="ml-5 icon icon-chevron-down" />
          <template slot="popover">
            <ul class="list-unstyled menu">
              <li
                v-for="option in otherOptions"
                :key="option.value"
                v-close-popover
                @click="click(option.value)"
              >
                <span>{{ option.label }}</span>
              </li>
            </ul>
          </template>
        </v-popover>
      </button>
    </div>
  </div>
</template>

<style lang="scss">
// load here instead of component so SSR render isn't all wonky
.dropdown-button-group {
  $xs-padding: 2px 3px;

  .btn {
    line-height: normal;
    border: 0px;
  }

  .icon {
    display: inline-block;
    width: 20px;
    height: 100%;
  }

  // this matches the top/bottom padding of the default button
  $trigger-padding: 15px 10px 15px 10px;
  $xs-trigger-padding: 2px 4px 4px 4px;
  $sm-trigger-padding: 10px 10px 10px 10px;
  $lg-trigger-padding: 18px 10px 10px 10px;

  .v-popover {
    .text-right {
      margin-top: 5px;
    }
    .trigger {
      height: 100%;
    }
    .popover {
      left: -15px !important;
      top: 3px !important;
    }
  }

  .dropdown-button {
    background: var(--tooltip-bg);
    color: var(--link-text);
    padding: 0;
    display: inline-flex;

    .wrapper-content {
      button {
        border-right: 0px;
      }
    }

    &>*, .icon-chevron-down {
      color: var(--primary);
      background-color: rgba(0,0,0,0);
    }

    &.bg-primary:hover {
      background: var(--accent-btn-hover);
    }
  }
  .popover {
    border: none;
  }

  .split {
    padding-right: 15px;
    border-right: 1px solid rgba(255, 255, 255, 0.5);
  }
}

</style>
