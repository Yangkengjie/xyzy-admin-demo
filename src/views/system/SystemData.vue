<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchSystemSummary, type SystemMetric } from '../../api/admin'

const loading = ref(false)
const metrics = ref<SystemMetric[]>([])
const trend = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchSystemSummary()
    metrics.value = res.metrics
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
    series: [{ type: 'line', data: trend.value.map((p) => p.value), name: '请求量' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="12">
      <el-col v-for="m in metrics" :key="m.key" :span="6">
        <el-card shadow="never" class="metric-card">
          <div class="metric-name">{{ m.name }}</div>
          <div class="metric-value">
            {{ m.value }}
            <span v-if="m.unit" class="metric-unit">{{ m.unit }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>系统趋势</template>
      <v-chart :option="chartOption" autoresize style="height: 360px" />
    </el-card>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-card {
  height: 96px;
}

.metric-name {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.metric-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.metric-unit {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}
</style>

