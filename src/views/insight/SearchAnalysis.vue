<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchInsightSearchAnalysis } from '../../api/admin'

const loading = ref(false)
const table = ref<Array<{ keyword: string; pv: number; uv: number; ctr: number }>>([])
const top = ref<Array<{ name: string; value: number }>>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchInsightSearchAnalysis()
    table.value = res.table
    top.value = res.top
  } finally {
    loading.value = false
  }
}

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: top.value.map((p) => p.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: top.value.map((p) => p.value), name: 'PV' }],
  }
})

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>关键词明细</template>
          <el-table :data="table" v-loading="loading" style="width: 100%">
            <el-table-column prop="keyword" label="关键词" min-width="180" />
            <el-table-column prop="pv" label="PV" width="110" />
            <el-table-column prop="uv" label="UV" width="110" />
            <el-table-column prop="ctr" label="CTR" width="120">
              <template #default="{ row }">{{ row.ctr }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>Top PV</template>
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

