<script>
import { getInsights, getAnomolies, getLogs, getWorkloadLogs } from '@/utils/opni';
import Card from '@/components/Card';
import SortableTable from '@/components/SortableTable';
import { AGE } from '@/config/table-headers';

export default {
  components: { Card, SortableTable },

  async fetch() {
    const responses = await Promise.all([getInsights(), getAnomolies(), getLogs(), getWorkloadLogs()]);

    [this.insights, this.anomolies, this.logs, this.workloadLogs] = responses;

    console.log(this.insights, this.anomolies, this.logs, this.workloadLogs); // eslint-disable-line no-console
  },

  data() {
    return {
      insights:     [],
      anomolies:    [],
      logs:         [],
      workloadLogs: [],
      logHeaders:   [
        {
          name:     'level',
          labelKey: 'tableHeaders.level',
          value:    'level',
          sort:     ['level']
        },
        {
          name:     'component',
          labelKey: 'tableHeaders.component',
          value:    'component',
          sort:     ['component']
        },
        {
          name:      'feedback',
          labelKey:  'tableHeaders.feedback',
          formatter: 'Feedback'
        },
        {
          ...AGE,
          value:     'timestamp',
          sort:      ['timestamp'],
        },
      ]
    };
  },

  mounted() {
  },

  methods: {}
};
</script>

<template>
  <div>
    <Card :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text" v-html="'Insights'" />

      <div slot="body" class="pl-10 pr-10">
        {{ insights.length }}
      </div>
    </Card>
    <Card :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text" v-html="'Insight Logs'" />

      <div slot="body" class="pl-10 pr-10">
        <SortableTable
          :rows="logs"
          :headers="logHeaders"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="true"
          :sub-expand-column="true"
          default-sort-by="name"
          key-field="id"
        >
          <template #sub-row="{row, fullColspan}">
            <tr class="sub-row">
              <td :colspan="fullColspan">
                {{ row.message }} hello
              </td>
            </tr>
          </template>
        </SortableTable>
      </div>
    </Card>
    <Card :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text" v-html="'Anomolies'" />

      <div slot="body" class="pl-10 pr-10">
        {{ anomolies.length }}
      </div>
    </Card>
    <Card :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text" v-html="'Anomoly logs'" />

      <div slot="body" class="pl-10 pr-10">
        <SortableTable
          :rows="workloadLogs"
          :headers="logHeaders"
          :search="false"
          :table-actions="false"
          :row-actions="false"
          :paging="true"
          default-sort-by="name"
          key-field="id"
        />
      </div>
    </Card>
  </div>
</template>
