<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInsightReviewEfficiency } from '../../api/admin'

const loading = ref(false)
const table = ref<Array<{ day: string; sessions: number; avgGain: number }>>([])
const line = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchInsightReviewEfficiency()
    table.value = res.table
    line.value = res.line
  } finally {
    loading.value = false
  }
}

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: line.value.map((p) => p.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: line.value.map((p) => p.value), name: '平均增益(%)' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>复习记录</template>
          <el-table :data="table" v-loading="loading" style="width: 100%">
            <el-table-column prop="day" label="日期" width="140" />
            <el-table-column prop="sessions" label="复习次数" width="120" />
            <el-table-column prop="avgGain" label="平均增益" width="140">
              <template #default="{ row }">{{ row.avgGain }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>增益趋势</template>
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

