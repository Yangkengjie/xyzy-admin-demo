<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Gauge, WordCloud } from '@antv/g2plot'
import { useAccess } from '../../auth/access'
import {
  addAliasFromWord,
  createGraphNodeFromWord,
  fetchSearchBehaviorAnalysis,
  type SearchBehaviorAnalysis,
  type SearchIntentItem,
  type SearchNoResultWord,
} from '../../api/admin'

const access = useAccess()
const canMapKeywords = computed(() => access.hasPermission('insight:search:map_keywords'))

const loading = ref(false)
const data = ref<SearchBehaviorAnalysis | null>(null)

async function load() {
  loading.value = true
  try {
    data.value = await fetchSearchBehaviorAnalysis()
  } finally {
    loading.value = false
  }
}

const noResultWords = computed<SearchNoResultWord[]>(() => data.value?.noResultWords ?? [])
const bounceRate = computed(() => data.value?.bounceRate ?? 0)
const bounceThreshold = computed(() => data.value?.bounceThreshold ?? 0.6)
const intents = computed<SearchIntentItem[]>(() => data.value?.intents ?? [])

const gaugeHint = computed(() => {
  const rate = bounceRate.value
  const threshold = bounceThreshold.value
  if (rate > threshold) return '跳出率高于阈值时，建议检查节点关键字映射'
  return '跳出率处于合理区间，可持续观察'
})

const intentBarOption = computed(() => {
  const sorted = intents.value.slice().sort((a, b) => b.percent - a.percent)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 16, bottom: 16, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    yAxis: { type: 'category', data: sorted.map((x) => x.intent) },
    series: [
      {
        type: 'bar',
        data: sorted.map((x) => x.percent),
        name: '占比',
        label: { show: true, position: 'right', formatter: '{c}%' },
      },
    ],
  }
})

const wordCloudRef = ref<HTMLDivElement | null>(null)
const gaugeRef = ref<HTMLDivElement | null>(null)
let wordPlot: WordCloud | null = null
let gaugePlot: Gauge | null = null

const actionDialogVisible = ref(false)
const actionLoading = ref(false)
const selectedWord = ref('')

function openAction(word: string) {
  selectedWord.value = word
  actionDialogVisible.value = true
}

async function handleCreateNode() {
  if (!canMapKeywords.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  actionLoading.value = true
  try {
    await createGraphNodeFromWord({ word: selectedWord.value })
    ElMessage.success('已创建新节点（模拟）')
    actionDialogVisible.value = false
  } finally {
    actionLoading.value = false
  }
}

async function handleAddAlias() {
  if (!canMapKeywords.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  actionLoading.value = true
  try {
    await addAliasFromWord({ word: selectedWord.value })
    ElMessage.success('已添加别名（模拟）')
    actionDialogVisible.value = false
  } finally {
    actionLoading.value = false
  }
}

function renderWordCloud() {
  if (!wordCloudRef.value) return
  if (wordPlot) {
    wordPlot.destroy()
    wordPlot = null
  }
  const words = noResultWords.value.map((w) => ({ word: w.word, weight: w.count }))
  wordPlot = new WordCloud(wordCloudRef.value, {
    data: words,
    wordField: 'word',
    weightField: 'weight',
    colorField: 'word',
    height: 280,
    wordStyle: {
      fontFamily: 'system-ui, Segoe UI, sans-serif',
      fontWeight: 600,
    },
    interactions: [{ type: 'element-active' }],
  })
  wordPlot.on('element:click', (evt: any) => {
    const word = evt?.data?.data?.word
    if (word) openAction(String(word))
  })
  wordPlot.render()
}

function renderGauge() {
  if (!gaugeRef.value) return
  if (gaugePlot) {
    gaugePlot.destroy()
    gaugePlot = null
  }
  gaugePlot = new Gauge(gaugeRef.value, {
    percent: bounceRate.value,
    range: {
      color: bounceRate.value > bounceThreshold.value ? '#e53935' : '#1677ff',
    },
    indicator: {
      pointer: { style: { stroke: '#d0d0d0' } },
      pin: { style: { stroke: '#d0d0d0' } },
    },
    statistic: {
      title: { formatter: () => '跳出率' },
      content: {
        formatter: (datum: any) => {
          const p = typeof datum?.percent === 'number' ? datum.percent : bounceRate.value
          return `${Math.round(p * 1000) / 10}%`
        },
      },
    },
    height: 280,
  })
  gaugePlot.render()
}

watch(
  () => noResultWords.value,
  async () => {
    await nextTick()
    renderWordCloud()
  },
  { deep: true },
)

watch(
  () => [bounceRate.value, bounceThreshold.value],
  async () => {
    await nextTick()
    renderGauge()
  },
)

onBeforeUnmount(() => {
  wordPlot?.destroy()
  gaugePlot?.destroy()
  wordPlot = null
  gaugePlot = null
})

onMounted(async () => {
  await load()
  await nextTick()
  renderWordCloud()
  renderGauge()
})
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>搜索无结果词云</template>
          <div class="hint">点击词汇可快捷执行“创建新节点”或“添加别名”</div>
          <div ref="wordCloudRef" class="wordcloud" />
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>搜索后跳出率</template>
          <div ref="gaugeRef" class="gauge" />
          <div class="hint" :class="{ warn: bounceRate > bounceThreshold }">{{ gaugeHint }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>热门搜索意图分类</template>
      <v-chart :option="intentBarOption" autoresize style="height: 320px" />
    </el-card>

    <el-dialog v-model="actionDialogVisible" title="快捷操作" width="420px" destroy-on-close>
      <div class="action-title">词汇：{{ selectedWord }}</div>
      <div class="action-body">
        <el-button type="primary" :disabled="!canMapKeywords" :loading="actionLoading" @click="handleCreateNode">
          创建新节点
        </el-button>
        <el-button :disabled="!canMapKeywords" :loading="actionLoading" @click="handleAddAlias">添加别名</el-button>
      </div>
      <template #footer>
        <el-button @click="actionDialogVisible = false">关闭</el-button>
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

.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.hint.warn {
  color: var(--el-color-danger);
}

.wordcloud {
  height: 280px;
}

.gauge {
  height: 280px;
}

.action-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.action-body {
  display: flex;
  gap: 10px;
}
</style>
