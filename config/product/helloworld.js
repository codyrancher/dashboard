import { DSL } from '@/store/type-map';

export const NAME = 'helloworld';

export function init(store) {
  const {
    product,
    virtualType,
  } = DSL(store, NAME);

  product({ icon: 'globe', weight: 90 });

  virtualType({
    label:      'Helloworld',
    namespaced: false,
    name:       'helloworld-overview',
    weight:     105,
    route:      { name: 'c-cluster-helloworld' },
    exact:      true,
  });
}
