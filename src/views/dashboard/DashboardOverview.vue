<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import {
  fetchDashboardOverview,
  type DashboardCourseTimeItem,
  type DashboardHotKnowledgeItem,
  type DashboardMetric,
} from '../../api/admin'

const loading = ref(false)
const metrics = ref<DashboardMetric[]>([])
const dauTrend7d = ref<Array<{ name: string; value: number }>>([])
const courseTimeShare = ref<DashboardCourseTimeItem[]>([])
const hotKnowledgeTop10 = ref<DashboardHotKnowledgeItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchDashboardOverview()
    metrics.value = res.metrics
    dauTrend7d.value = res.dauTrend7d
    courseTimeShare.value = res.courseTimeShare
    hotKnowledgeTop10.value = res.hotKnowledgeTop10
  } finally {
    loading.value = false
  }
}

const metricMap = computed(() => {
  const map = new Map(metrics.value.map((m) => [m.key, m]))
  return map
})

const lineOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: dauTrend7d.value.map((p) => p.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: dauTrend7d.value.map((p) => p.value), name: 'DAU' }],
  }
})

const pieOption = computed(() => {
  return {
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        data: courseTimeShare.value.map((c) => ({ name: c.courseName, value: c.minutes })),
      },
    ],
  }
})

function formatMetricValue(m?: DashboardMetric) {
  if (!m) return '-'
  if (m.key === 'masteryRate') return `${m.value}%`
  if (m.key === 'avgStudyMinutes') return `${m.value}${m.unit ? ` ${m.unit}` : ''}`
  return String(m.value)
}

function downloadBlob(filename: string, data: BlobPart, mime: string) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function exportExcel() {
  const wb = XLSX.utils.book_new()

  const metricRows = metrics.value.map((m) => ({
    指标: m.name,
    数值: m.key === 'masteryRate' ? `${m.value}%` : m.value,
    单位: m.unit ?? '',
  }))
  const wsMetric = XLSX.utils.json_to_sheet(metricRows)
  XLSX.utils.book_append_sheet(wb, wsMetric, '指标')

  const wsTrend = XLSX.utils.json_to_sheet(
    dauTrend7d.value.map((p) => ({ 日期: p.name, DAU: p.value })),
  )
  XLSX.utils.book_append_sheet(wb, wsTrend, '近7日DAU')

  const wsCourse = XLSX.utils.json_to_sheet(
    courseTimeShare.value.map((c) => ({ 课程: c.courseName, 学习时长分钟: c.minutes })),
  )
  XLSX.utils.book_append_sheet(wb, wsCourse, '课程时长占比')

  const wsHot = XLSX.utils.json_to_sheet(
    hotKnowledgeTop10.value.map((k, idx) => ({ 排名: idx + 1, 知识点: k.name, 学习人数: k.learners })),
  )
  XLSX.utils.book_append_sheet(wb, wsHot, '热门知识点Top10')

  const fileArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob('数据统计看板.xlsx', fileArray, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  ElMessage.success('已导出')
}

onMounted(load)
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="toolbar">
      <el-button @click="load">刷新</el-button>
      <el-button type="primary" @click="exportExcel">导出 Excel</el-button>
    </div>

    <el-row :gutter="12">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-name">日活 DAU</div>
          <div class="metric-value">{{ formatMetricValue(metricMap.get('dau')) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-name">平均学习时长</div>
          <div class="metric-value">{{ formatMetricValue(metricMap.get('avgStudyMinutes')) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-name">知识点掌握率</div>
          <div class="metric-value">{{ formatMetricValue(metricMap.get('masteryRate')) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-name">AI 问答次数</div>
          <div class="metric-value">{{ formatMetricValue(metricMap.get('aiQaCount')) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>近 7 日活跃趋势</template>
          <v-chart :option="lineOption" autoresize style="height: 320px" />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>课程学习时长占比</template>
          <v-chart :option="pieOption" autoresize style="height: 320px" />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>热门知识点 Top 10</template>
      <el-table :data="hotKnowledgeTop10" style="width: 100%">
        <el-table-column type="index" width="70" label="排名" />
        <el-table-column prop="name" label="知识点" min-width="220" />
        <el-table-column prop="learners" label="学习人数" width="140" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.metric-name {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.metric-value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 700;
}
</style>

