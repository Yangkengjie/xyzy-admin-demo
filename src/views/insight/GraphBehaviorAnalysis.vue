<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Sankey as SankeyPlot } from '@antv/g2plot'
import { fetchCourseAll, fetchGraphBehaviorAnalysis, type GraphDifficultyItem, type GraphHeatItem, type SankeyLink, type SankeyNode } from '../../api/admin'

const loading = ref(false)
const coursesLoading = ref(false)
const courseOptions = ref<Array<{ id: string; name: string }>>([])
const courseId = ref<string>('')

const heatList = ref<GraphHeatItem[]>([])
const difficultyTop10 = ref<GraphDifficultyItem[]>([])
const sankeyData = ref<{ nodes: SankeyNode[]; links: SankeyLink[] }>({ nodes: [], links: [] })

async function loadCourses() {
  coursesLoading.value = true
  try {
    const res = await fetchCourseAll()
    courseOptions.value = res.list
  } finally {
    coursesLoading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const res = await fetchGraphBehaviorAnalysis({ courseId: courseId.value || undefined })
    heatList.value = res.heatList
    difficultyTop10.value = res.difficultyTop10
    sankeyData.value = res.sankey
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const difficultyBarOption = computed(() => {
  const x = difficultyTop10.value.map((x) => x.nodeName)
  const y = difficultyTop10.value.map((x) => x.difficultyIndex)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 60, containLabel: true },
    xAxis: {
      type: 'category',
      data: x,
      axisLabel: { rotate: 28 },
    },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: y, name: '难度指数' }],
  }
})

const sankeyRef = ref<HTMLDivElement | null>(null)
let sankeyPlot: SankeyPlot | null = null
let SankeyCtor: (new (...args: any[]) => SankeyPlot) | null = null

async function ensureSankeyCtor(): Promise<new (...args: any[]) => SankeyPlot> {
  if (SankeyCtor) return SankeyCtor
  const mod = await import('@antv/g2plot')
  const Ctor = mod.Sankey as any
  if (!Ctor) {
    throw new Error('Sankey constructor not found in @antv/g2plot')
  }
  SankeyCtor = Ctor
  return Ctor
}

async function renderSankey() {
  if (!sankeyRef.value) return

  const data = sankeyData.value
  const nodeIndex = new Map<string, number>()
  data.nodes.forEach((n, idx) => nodeIndex.set(n.id, idx))
  const links = data.links
    .map((l) => {
      const s = nodeIndex.get(l.source)
      const t = nodeIndex.get(l.target)
      if (s === undefined || t === undefined) return null
      return { source: s, target: t, value: l.value }
    })
    .filter(Boolean) as Array<{ source: number; target: number; value: number }>

  const nodeLinkData = { nodes: data.nodes, links }
  if (!sankeyPlot) {
    const Ctor = await ensureSankeyCtor()
    sankeyPlot = new Ctor(sankeyRef.value, {
      dataType: 'node-link',
      data: nodeLinkData,
      nodeWidthRatio: 0.02,
      nodePaddingRatio: 0.02,
      height: 360,
      animation: false,
      tooltip: {
        formatter: (datum: any) => {
          const srcName = datum?.source?.name ?? datum?.source
          const tgtName = datum?.target?.name ?? datum?.target
          if (srcName && tgtName) {
            return { name: `${srcName} → ${tgtName}`, value: datum.value }
          }
          if (datum?.name) return { name: datum.name, value: '' }
          return { name: '', value: '' }
        },
      },
    })
    sankeyPlot.render()
  } else {
    sankeyPlot.changeData(nodeLinkData as any)
  }
}

watch(
  () => sankeyData.value,
  async () => {
    await nextTick()
    requestAnimationFrame(() => {
      void renderSankey()
    })
  },
  { deep: false },
)

onBeforeUnmount(() => {
  sankeyPlot?.destroy()
  sankeyPlot = null
})

onMounted(async () => {
  await loadCourses()
  await load()
})
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="12">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>节点热度排行榜</span>
              <div class="filters">
                <el-select
                  v-model="courseId"
                  placeholder="按课程筛选"
                  clearable
                  filterable
                  style="width: 240px"
                  :loading="coursesLoading"
                  @change="load"
                  @clear="load"
                >
                  <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </div>
            </div>
          </template>
          <el-table :data="heatList" style="width: 100%">
            <el-table-column prop="nodeName" label="节点名称" min-width="180" />
            <el-table-column prop="courseName" label="所属课程" min-width="160" />
            <el-table-column prop="clicks" label="点击次数" width="120" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>节点难度指数榜</span>
            </div>
          </template>
          <div class="formula">难度指数 = 平均停留时长（秒） × 回访次数</div>
          <v-chart :option="difficultyBarOption" autoresize style="height: 320px" />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>高频学习路径流向图</template>
      <div ref="sankeyRef" class="sankey" />
    </el-card>
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

.filters {
  display: flex;
  align-items: center;
  gap: 8px;
}

.formula {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.sankey {
  height: 360px;
}
</style>
