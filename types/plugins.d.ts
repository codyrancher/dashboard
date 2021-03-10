import { Vue } from 'vue-property-decorator';

declare module 'vue-property-decorator' {
  interface Vue {
    t: (key: string, placeholder?: {[key: string]: string}) => string;
  }
}
