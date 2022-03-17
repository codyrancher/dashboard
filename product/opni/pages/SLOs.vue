<script>
import Main from '../components/Main';
import SLOs from '../components/SLOs';

export default {
  components: { SLOs, Main },
  layout:     'standalone',
  head() {
    return { title: 'Opni - Service Level Objectives' };
  }
};
</script>
<template>
  <Main>
    <SLOs />
  </Main>
</template>
