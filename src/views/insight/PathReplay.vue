<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInsightPathReplay } from '../../api/admin'

const loading = ref(false)
const table = ref<Array<{ step: string; users: number; dropRate: number }>>([])
const bar = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchInsightPathReplay()
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
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: bar.value.map((p) => p.value), name: '人数' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>路径步骤</template>
          <el-table :data="table" v-loading="loading" style="width: 100%">
            <el-table-column prop="step" label="步骤" min-width="180" />
            <el-table-column prop="users" label="人数" width="120" />
            <el-table-column prop="dropRate" label="流失率" width="140">
              <template #default="{ row }">{{ row.dropRate }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>步骤人数</template>
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

