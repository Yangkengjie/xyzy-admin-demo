<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInsightAIEffect } from '../../api/admin'

const loading = ref(false)
const table = ref<Array<{ model: string; hitRate: number; adoption: number; satisfaction: number }>>([])
const bar = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchInsightAIEffect()
    table.value = res.table
    bar.value = res.bar
  } finally {
    loading.value = false
  }
}

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: bar.value.map((p) => p.name) },
    yAxis: { type: 'value', max: 100 },
    series: [{ type: 'bar', data: bar.value.map((p) => p.value), name: '命中率(%)' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>模型效果</template>
          <el-table :data="table" v-loading="loading" style="width: 100%">
            <el-table-column prop="model" label="模型" min-width="160" />
            <el-table-column prop="hitRate" label="命中率" width="120">
              <template #default="{ row }">{{ row.hitRate }}%</template>
            </el-table-column>
            <el-table-column prop="adoption" label="采纳率" width="120">
              <template #default="{ row }">{{ row.adoption }}%</template>
            </el-table-column>
            <el-table-column prop="satisfaction" label="满意度" width="120">
              <template #default="{ row }">{{ row.satisfaction }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>命中率对比</template>
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

