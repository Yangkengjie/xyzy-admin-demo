<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchMasteryDistributionAnalysis,
  fetchMasteryTrajectory,
  type MasteryScope,
  type MasteryTrajectoryPoint,
  type TreemapNode,
} from '../../api/admin'

const scope = ref<MasteryScope>('overall')
const grade = ref<string>('')
const classId = ref<string>('')

const gradeOptions = ['大一', '大二', '大三', '大四', '规培', '研究生']
const classOptionsByGrade: Record<string, string[]> = {
  大一: ['A班', 'B班', 'C班'],
  大二: ['A班', 'B班', 'C班'],
  大三: ['A班', 'B班'],
  大四: ['A班', 'B班'],
  规培: ['全科', '内科', '外科'],
  研究生: ['研一', '研二', '研三'],
}

const classOptions = computed(() => classOptionsByGrade[grade.value] ?? [])

const loadingTreemap = ref(false)
const treemap = ref<TreemapNode[]>([])

async function loadTreemap() {
  loadingTreemap.value = true
  try {
    const res = await fetchMasteryDistributionAnalysis({
      scope: scope.value,
      grade: scope.value === 'overall' ? undefined : grade.value || undefined,
      classId: scope.value === 'class' ? classId.value || undefined : undefined,
    })
    treemap.value = res.tree
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loadingTreemap.value = false
  }
}

function handleScopeChange() {
  grade.value = ''
  classId.value = ''
  loadTreemap()
}

function handleGradeChange() {
  classId.value = ''
  loadTreemap()
}

function handleClassChange() {
  loadTreemap()
}

const treemapOption = computed(() => {
  return {
    tooltip: {
      formatter: (p: any) => {
        const name = p?.data?.name ?? ''
        const value = p?.data?.value ?? 0
        return `${name}<br/>弱点比例：${Number(value).toFixed(1)}%`
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#ffecec', '#ffb3b3', '#ff6666', '#e53935'],
      },
    },
    series: [
      {
        type: 'treemap',
        data: treemap.value,
        leafDepth: 1,
        roam: false,
        breadcrumb: { show: true },
        label: { show: true, formatter: '{b}' },
        upperLabel: { show: true, height: 20 },
        itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
      },
    ],
  }
})

const userId = ref('LP000001')
const trajectoryLoading = ref(false)
const points = ref<MasteryTrajectoryPoint[]>([])

async function searchTrajectory() {
  if (!userId.value.trim()) {
    ElMessage.warning('请输入用户 ID')
    return
  }
  trajectoryLoading.value = true
  try {
    const res = await fetchMasteryTrajectory({ userId: userId.value.trim() })
    points.value = res.points
  } catch {
    ElMessage.error('加载失败')
  } finally {
    trajectoryLoading.value = false
  }
}

const trajectoryOption = computed(() => {
  const x = points.value.map((p) => p.date)
  const weak = points.value.map((p) => p.weak)
  const familiar = points.value.map((p) => p.familiar)
  const mastery = points.value.map((p) => p.mastery)
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 24, right: 16, top: 32, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: x },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '弱点', type: 'line', data: weak, smooth: true },
      { name: '熟悉', type: 'line', data: familiar, smooth: true },
      { name: '掌握', type: 'line', data: mastery, smooth: true },
    ],
  }
})

onMounted(() => {
  loadTreemap()
  searchTrajectory()
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>筛选条件</template>
      <el-form :inline="true" label-width="80px">
        <el-form-item label="范围">
          <el-radio-group v-model="scope" @change="handleScopeChange">
            <el-radio-button value="overall">整体</el-radio-button>
            <el-radio-button value="grade">按年级</el-radio-button>
            <el-radio-button value="class">按班级</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="scope !== 'overall'" label="年级">
          <el-select v-model="grade" placeholder="请选择年级" clearable style="width: 160px" @change="handleGradeChange">
            <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="scope === 'class'" label="班级">
          <el-select
            v-model="classId"
            placeholder="请选择班级"
            clearable
            style="width: 160px"
            :disabled="!grade"
            @change="handleClassChange"
          >
            <el-option v-for="c in classOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" v-loading="loadingTreemap">
      <template #header>弱点聚集热力图</template>
      <v-chart :option="treemapOption" autoresize style="height: 420px" />
    </el-card>

    <el-card shadow="never" v-loading="trajectoryLoading">
      <template #header>
        <div class="card-header">
          <span>个体掌握轨迹回放</span>
          <div class="search">
            <el-input v-model="userId" placeholder="请输入用户 ID" style="width: 220px" @keyup.enter="searchTrajectory" />
            <el-button type="primary" @click="searchTrajectory">查询</el-button>
          </div>
        </div>
      </template>
      <v-chart :option="trajectoryOption" autoresize style="height: 320px" />
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

.search {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
