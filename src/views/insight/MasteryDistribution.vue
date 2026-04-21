<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInsightMasteryDistribution } from '../../api/admin'

const loading = ref(false)
const table = ref<Array<{ band: string; users: number; avgMastery: number }>>([])
const distribution = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchInsightMasteryDistribution()
    table.value = res.table
    distribution.value = res.distribution
  } finally {
    loading.value = false
  }
}

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: distribution.value.map((d) => d.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: distribution.value.map((d) => d.value), name: '人数' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>分段明细</template>
          <el-table :data="table" v-loading="loading" style="width: 100%">
            <el-table-column prop="band" label="掌握度分段" min-width="180" />
            <el-table-column prop="users" label="人数" width="120" />
            <el-table-column prop="avgMastery" label="平均掌握度" width="140">
              <template #default="{ row }">{{ row.avgMastery }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>分布柱状图</template>
          <v-chart :option="chartOption" autoresize style="height: 360px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

