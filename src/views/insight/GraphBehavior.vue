<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInsightGraphBehavior } from '../../api/admin'

const loading = ref(false)
const table = ref<Array<{ action: string; count: number; users: number }>>([])
const trend = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchInsightGraphBehavior()
    table.value = res.table
    trend.value = res.trend
  } finally {
    loading.value = false
  }
}

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: trend.value.map((p) => p.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: trend.value.map((p) => p.value), name: '行为量' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>行为明细</template>
          <el-table :data="table" v-loading="loading" style="width: 100%">
            <el-table-column prop="action" label="行为" min-width="180" />
            <el-table-column prop="count" label="次数" width="120" />
            <el-table-column prop="users" label="人数" width="120" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>近7天趋势</template>
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

