<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchDropoffActionLogs,
  fetchPathReplayAnalysis,
  type ActionLogItem,
  type DropoffItem,
  type GoldenPath,
} from '../../api/admin'

const loading = ref(false)
const golden = ref<GoldenPath | null>(null)
const dropoffs = ref<DropoffItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchPathReplayAnalysis()
    golden.value = res.golden
    dropoffs.value = res.dropoffs
  } finally {
    loading.value = false
  }
}

const activeStep = computed(() => {
  if (!golden.value) return 0
  return golden.value.steps.length - 1
})

function formatRate(rate?: number) {
  if (rate === undefined) return '-'
  return `${(rate * 100).toFixed(1)}%`
}

const logDialogVisible = ref(false)
const logLoading = ref(false)
const logTitle = ref('')
const logs = ref<ActionLogItem[]>([])

async function openLogs(row: DropoffItem) {
  logDialogVisible.value = true
  logTitle.value = `埋点日志 - ${row.page}`
  logLoading.value = true
  try {
    const res = await fetchDropoffActionLogs({ page: row.page })
    logs.value = res.list
  } catch {
    ElMessage.error('加载失败')
  } finally {
    logLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="12">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>黄金路径识别</span>
              <div class="meta">
                <el-tag size="small" type="success">成功率：{{ formatRate(golden?.successRate) }}</el-tag>
                <el-tag size="small" type="info">覆盖用户：{{ golden?.users ?? '-' }}</el-tag>
              </div>
            </div>
          </template>

          <template v-if="golden">
            <el-steps :active="activeStep" align-center finish-status="success">
              <el-step v-for="(s, idx) in golden.steps" :key="idx" :title="s" />
            </el-steps>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>卡点中断分析</template>
      <el-table :data="dropoffs" style="width: 100%">
        <el-table-column prop="page" label="最后访问页面" min-width="220" />
        <el-table-column prop="dropUsers" label="流失用户数" width="140" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="openLogs(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="logDialogVisible" :title="logTitle" width="720px" destroy-on-close>
      <div v-loading="logLoading">
        <el-timeline>
          <el-timeline-item v-for="(it, idx) in logs" :key="idx" :timestamp="it.time" placement="top">
            <div class="log-event">{{ it.event }}</div>
            <div v-if="it.detail" class="log-detail">{{ it.detail }}</div>
          </el-timeline-item>
        </el-timeline>
      </div>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
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

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.log-event {
  font-weight: 600;
}

.log-detail {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}
</style>

