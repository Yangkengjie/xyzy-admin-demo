<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccess } from '../../auth/access'
import {
  fetchReviewEfficiencyAnalysis,
  pushReviewReminder,
  type ReviewDisorderMetric,
  type ReviewKpi,
  type UncoveredWeakItem,
} from '../../api/admin'

const access = useAccess()
const canPush = computed(() => access.hasPermission('insight:review:push'))

const loading = ref(false)
const pushing = ref(false)
const kpis = ref<ReviewKpi[]>([])
const disorder = ref<ReviewDisorderMetric | null>(null)
const uncovered = ref<UncoveredWeakItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchReviewEfficiencyAnalysis()
    kpis.value = res.kpis
    disorder.value = res.disorder
    uncovered.value = res.uncovered
  } finally {
    loading.value = false
  }
}

function kpiBy(period: 'today' | 'week' | 'month') {
  return kpis.value.find((k) => k.period === period)
}

function formatRate(rate?: number) {
  if (rate === undefined) return '-'
  return `${(rate * 100).toFixed(1)}%`
}

const disorderTrendOption = computed(() => {
  const d = disorder.value
  if (!d) return { xAxis: { data: [] }, series: [] }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: d.trend7d.map((p) => p.name) },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{ type: 'line', data: d.trend7d.map((p) => p.value), name: '乱序指数(%)', smooth: true }],
  }
})

const suggestionText = computed(() => {
  const d = disorder.value
  if (!d) return '若乱序复习有效率低于顺序复习，建议强化引导'
  if (d.efficiencyDisorder < d.efficiencySequential) return '若乱序复习有效率低于顺序复习，建议强化引导'
  return '乱序复习有效率不低于顺序复习，可继续保持当前策略'
})

async function pushAll() {
  if (!canPush.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (uncovered.value.length === 0) {
    ElMessage.info('暂无未覆盖弱点')
    return
  }
  pushing.value = true
  try {
    await pushReviewReminder({ nodes: uncovered.value.map((x) => x.nodeName) })
    ElMessage.success('已推送复习提醒（模拟）')
  } finally {
    pushing.value = false
  }
}

async function pushOne(nodeName: string) {
  if (!canPush.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  pushing.value = true
  try {
    await pushReviewReminder({ nodes: [nodeName] })
    ElMessage.success('已推送（模拟）')
  } finally {
    pushing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="12">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi-title">今日复习有效率</div>
          <div class="kpi-value">{{ formatRate(kpiBy('today')?.efficiencyRate) }}</div>
          <div class="kpi-sub">弱点转掌握数 / 总复习次数：{{ kpiBy('today')?.weakToMastery ?? '-' }} / {{ kpiBy('today')?.totalReviews ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi-title">本周复习有效率</div>
          <div class="kpi-value">{{ formatRate(kpiBy('week')?.efficiencyRate) }}</div>
          <div class="kpi-sub">弱点转掌握数 / 总复习次数：{{ kpiBy('week')?.weakToMastery ?? '-' }} / {{ kpiBy('week')?.totalReviews ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="kpi-title">本月复习有效率</div>
          <div class="kpi-value">{{ formatRate(kpiBy('month')?.efficiencyRate) }}</div>
          <div class="kpi-sub">弱点转掌握数 / 总复习次数：{{ kpiBy('month')?.weakToMastery ?? '-' }} / {{ kpiBy('month')?.totalReviews ?? '-' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>复习乱序指数</span>
              <el-tag size="small" type="info">指数：{{ disorder?.disorderIndex ?? '-' }}</el-tag>
            </div>
          </template>
          <v-chart :option="disorderTrendOption" autoresize style="height: 260px" />
          <div class="hint">{{ suggestionText }}</div>
          <div v-if="disorder" class="compare">
            <el-tag size="small" type="success">顺序复习有效率：{{ disorder.efficiencySequential }}%</el-tag>
            <el-tag size="small" type="warning">乱序复习有效率：{{ disorder.efficiencyDisorder }}%</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>未覆盖弱点清单</span>
              <el-button type="primary" :disabled="!canPush" :loading="pushing" @click="pushAll">一键推送复习提醒</el-button>
            </div>
          </template>
          <el-table :data="uncovered" style="width: 100%">
            <el-table-column prop="nodeName" label="节点名称" min-width="180" />
            <el-table-column prop="lastMarkedAt" label="最后标记时间" width="180" />
            <el-table-column label="操作" width="170">
              <template #default="{ row }">
                <el-button link type="primary" :disabled="!canPush || pushing" @click="pushOne(row.nodeName)">一键推送复习提醒</el-button>
              </template>
            </el-table-column>
          </el-table>
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

.kpi-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.kpi-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
}

.kpi-sub {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hint {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.compare {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
