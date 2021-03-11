import BaseModel from '~/models/base-model';
export default class ConfigMapModel extends BaseModel {
  get data(): {} {
    return this.obj.data;
  }

  set data(value) {
    this.obj.data = value;
  }

  get binaryData(): {} {
    return this.obj.binaryData;
  }

  set binaryData(value) {
    this.obj.binaryData = value;
  }

  get keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  }
};
