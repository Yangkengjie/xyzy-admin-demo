<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable, { type ProColumn } from '../../components/ProTable.vue'
import {
  fetchLearnerPortraitHistory,
  fetchLearnerPortraitList,
  fetchLearnerPortraitReport,
  fetchLearnerPortraitSummary,
  type LearnerPersonaType,
  type LearnerPortraitHistoryItem,
  type LearnerPortraitReport,
  type LearnerPortraitUser,
} from '../../api/admin'

const summaryLoading = ref(false)
const summary = ref<{ totalUsers: number; activeLearners: number; distribution: Array<{ name: string; value: number }> }>(
  {
    totalUsers: 0,
    activeLearners: 0,
    distribution: [],
  },
)

async function loadSummary() {
  summaryLoading.value = true
  try {
    summary.value = await fetchLearnerPortraitSummary()
  } finally {
    summaryLoading.value = false
  }
}

const pieOption = computed(() => {
  return {
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        data: summary.value.distribution,
      },
    ],
  }
})

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null)

const columns: ProColumn[] = [
  { label: '昵称', prop: 'nickname', width: 140 },
  { label: '学校', prop: 'school', minWidth: 180 },
  { label: '年级', prop: 'grade', width: 110 },
  { label: '专业', prop: 'major', minWidth: 140 },
  { label: '画像类型', prop: 'personaType', width: 140, slot: 'persona' },
  { label: '最近测试时间', prop: 'lastTestAt', width: 180 },
  { label: '操作', prop: 'actions', width: 220, slot: 'actions' },
]

async function requestTable(params: Record<string, any>) {
  return fetchLearnerPortraitList({ page: Number(params.page), pageSize: Number(params.pageSize) })
}

const personaLabel: Record<LearnerPersonaType, string> = {
  steady: '稳扎稳打型',
  exam: '备考冲刺型',
  explore: '探索拓展型',
  efficient: '高效掌握型',
}

function normalizePersona(v: unknown): LearnerPersonaType {
  if (v === 'steady' || v === 'exam' || v === 'explore' || v === 'efficient') return v
  return 'steady'
}

function personaTagType(v: unknown) {
  const p = normalizePersona(v)
  if (p === 'efficient') return 'success'
  if (p === 'exam') return 'warning'
  if (p === 'explore') return ''
  return 'info'
}

const reportDrawerVisible = ref(false)
const reportLoading = ref(false)
const report = ref<LearnerPortraitReport | null>(null)

const radarOption = computed(() => {
  if (!report.value) return { radar: { indicator: [] }, series: [] }
  return {
    tooltip: {},
    radar: {
      indicator: report.value.indicators,
      radius: 90,
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: report.value.values,
            name: report.value.nickname,
          },
        ],
      },
    ],
  }
})

async function openReport(row: LearnerPortraitUser) {
  reportDrawerVisible.value = true
  reportLoading.value = true
  try {
    report.value = await fetchLearnerPortraitReport({ userId: row.userId })
  } finally {
    reportLoading.value = false
  }
}

const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyList = ref<LearnerPortraitHistoryItem[]>([])
const historyTitle = ref('')

async function openHistory(row: LearnerPortraitUser) {
  historyDialogVisible.value = true
  historyTitle.value = `历史记录 - ${row.nickname}`
  historyLoading.value = true
  try {
    const res = await fetchLearnerPortraitHistory({ userId: row.userId })
    historyList.value = res.list
  } finally {
    historyLoading.value = false
  }
}

function handleRefresh() {
  loadSummary()
  proTableRef.value?.reload()
  ElMessage.success('已刷新')
}

onMounted(() => {
  loadSummary()
})
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="6">
        <el-card shadow="never" v-loading="summaryLoading">
          <div class="stat-title">总用户数</div>
          <div class="stat-value">{{ summary.totalUsers }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" v-loading="summaryLoading">
          <div class="stat-title">活跃学习者数</div>
          <div class="stat-value">{{ summary.activeLearners }}</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" v-loading="summaryLoading">
          <template #header>画像类型分布</template>
          <v-chart :option="pieOption" autoresize style="height: 160px" />
        </el-card>
      </el-col>
    </el-row>

    <pro-table ref="proTableRef" :columns="columns" :request="requestTable">
      <template #toolbar>
        <el-button @click="handleRefresh">刷新数据</el-button>
      </template>

      <template #persona="{ value }">
        <el-tag :type="personaTagType(value)">{{ personaLabel[normalizePersona(value)] }}</el-tag>
      </template>

      <template #actions="{ row }">
        <el-button link type="primary" @click="openReport(row)">查看画像报告</el-button>
        <el-button link type="primary" @click="openHistory(row)">查看历史记录</el-button>
      </template>
    </pro-table>

    <el-drawer v-model="reportDrawerVisible" title="画像报告" size="520px" :with-header="true">
      <div v-loading="reportLoading" class="drawer-body">
        <template v-if="report">
          <div class="drawer-title">{{ report.nickname }}</div>
          <v-chart :option="radarOption" autoresize style="height: 240px" />
          <el-table :data="report.dimensionScores" size="small" style="width: 100%; margin-top: 12px">
            <el-table-column prop="name" label="维度" min-width="140" />
            <el-table-column prop="score" label="分数" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.score" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-drawer>

    <el-dialog v-model="historyDialogVisible" :title="historyTitle" width="640px" destroy-on-close>
      <div v-loading="historyLoading">
        <el-timeline>
          <el-timeline-item v-for="(it, idx) in historyList" :key="idx" :timestamp="it.time" placement="top">
            <div class="history-title">{{ it.title }}</div>
            <div v-if="it.detail" class="history-detail">{{ it.detail }}</div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <template #footer>
        <el-button @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-title {
  font-weight: 600;
}

.history-title {
  font-weight: 600;
}

.history-detail {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
</style>
