<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { WordCloud } from '@antv/g2plot'
import ProTable, { type ProColumn } from '../../components/ProTable.vue'
import { fetchAiEffectAnalysis, saveAiPromptFix, type AiFollowupWord, type AiLowScoreItem } from '../../api/admin'
import { useAccess } from '../../auth/access'

const access = useAccess()
const canFix = computed(() => access.hasPermission('insight:ai:prompt_fix'))

const loading = ref(false)
const solveRate = ref(0)
const threshold = ref(0.6)
const followups = ref<AiFollowupWord[]>([])
const lowScore = ref<AiLowScoreItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchAiEffectAnalysis()
    solveRate.value = res.solve.solveRate
    threshold.value = res.solve.threshold
    followups.value = res.followups
    lowScore.value = res.lowScore
  } finally {
    loading.value = false
  }
}

const solveRatePercent = computed(() => Math.round(solveRate.value * 1000) / 10)
const solveColor = computed(() => (solveRate.value < threshold.value ? '#e53935' : '#1677ff'))

const solveHint = computed(() => {
  if (solveRate.value < threshold.value) return '解决率低于 60%，建议优先排查提示词与知识库映射'
  return '解决率处于合理区间，可持续优化追问与低分样本'
})

const wordCloudRef = ref<HTMLDivElement | null>(null)
let wordPlot: WordCloud | null = null

function renderWordCloud() {
  if (!wordCloudRef.value) return
  if (wordPlot) {
    wordPlot.destroy()
    wordPlot = null
  }
  const data = followups.value.map((x) => ({ word: x.word, weight: x.count }))
  wordPlot = new WordCloud(wordCloudRef.value, {
    data,
    wordField: 'word',
    weightField: 'weight',
    colorField: 'word',
    height: 260,
    wordStyle: {
      fontFamily: 'system-ui, Segoe UI, sans-serif',
      fontWeight: 600,
    },
    interactions: [{ type: 'element-active' }],
  })
  wordPlot.render()
}

watch(
  () => followups.value,
  async () => {
    await nextTick()
    renderWordCloud()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  wordPlot?.destroy()
  wordPlot = null
})

const columns: ProColumn[] = [
  { label: '问题', prop: 'question', minWidth: 240 },
  { label: '用户反馈内容', prop: 'feedback', minWidth: 240 },
  { label: '操作', prop: 'actions', width: 200, slot: 'actions' },
]

async function requestTable(params: Record<string, any>) {
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = Math.max(1, Number(params.pageSize ?? 10))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return { total: lowScore.value.length, list: lowScore.value.slice(start, end) }
}

const detailDialogVisible = ref(false)
const detailSubmitting = ref(false)
const current = ref<AiLowScoreItem | null>(null)
const promptAfter = ref('')

function openDetail(row: AiLowScoreItem) {
  current.value = row
  promptAfter.value = row.promptAfter ?? row.promptBefore
  detailDialogVisible.value = true
}

async function saveFix() {
  if (!canFix.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (!current.value) return
  if (!promptAfter.value.trim()) {
    ElMessage.warning('请输入修正后的 Prompt')
    return
  }
  detailSubmitting.value = true
  try {
    await saveAiPromptFix({ id: current.value.id, promptAfter: promptAfter.value.trim() })
    ElMessage.success('已保存（模拟）')
    detailDialogVisible.value = false
    await load()
  } finally {
    detailSubmitting.value = false
  }
}

onMounted(async () => {
  await load()
  await nextTick()
  renderWordCloud()
})
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="12">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="solve-title">AI 解决率看板</div>
          <div class="solve-value" :style="{ color: solveColor }">{{ solveRatePercent }}%</div>
          <div class="solve-line">
            <div class="line-bg">
              <div class="line-fill" :style="{ width: `${Math.max(0, Math.min(100, solveRatePercent))}%`, background: solveColor }" />
              <div class="line-threshold" :style="{ left: `${threshold * 100}%` }" />
            </div>
            <div class="line-tip">阈值线：60%（低于阈值红色告警）</div>
          </div>
          <div class="hint" :style="{ color: solveColor }">{{ solveHint }}</div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="never">
          <template #header>追问聚类分析</template>
          <el-row :gutter="12">
            <el-col :span="14">
              <div ref="wordCloudRef" class="wordcloud" />
            </el-col>
            <el-col :span="10">
              <div class="suggestion-title">建议操作</div>
              <el-table :data="followups" size="small" style="width: 100%">
                <el-table-column prop="word" label="追问词" width="120" />
                <el-table-column prop="suggestion" label="优化建议" min-width="160" />
              </el-table>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>低分回答巡检</template>
      <pro-table :columns="columns" :request="requestTable">
        <template #actions="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看详情并修正 Prompt</el-button>
        </template>
      </pro-table>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="查看详情并修正 Prompt" width="860px" destroy-on-close>
      <div v-if="current" class="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="问题">{{ current.question }}</el-descriptions-item>
          <el-descriptions-item label="用户反馈">{{ current.feedback }}</el-descriptions-item>
          <el-descriptions-item label="评分">{{ current.score }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ current.createdAt }}</el-descriptions-item>
        </el-descriptions>

        <div class="prompt-area">
          <div class="prompt-title">原 Prompt</div>
          <el-input :model-value="current.promptBefore" type="textarea" :rows="4" readonly />
        </div>
        <div class="prompt-area">
          <div class="prompt-title">修正后的 Prompt</div>
          <el-input
            v-model="promptAfter"
            type="textarea"
            :rows="5"
            :disabled="!canFix"
            placeholder="请输入修正后的 Prompt"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canFix" :loading="detailSubmitting" @click="saveFix">保存</el-button>
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

.solve-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.solve-value {
  margin-top: 8px;
  font-size: 40px;
  font-weight: 800;
}

.solve-line {
  margin-top: 10px;
}

.line-bg {
  position: relative;
  height: 10px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}

.line-fill {
  height: 100%;
}

.line-threshold {
  position: absolute;
  top: -6px;
  width: 2px;
  height: 22px;
  background: #111827;
  opacity: 0.35;
}

.line-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
}

.wordcloud {
  height: 260px;
}

.suggestion-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.prompt-title {
  font-weight: 600;
}
</style>
