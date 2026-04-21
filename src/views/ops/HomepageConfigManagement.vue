<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchHomepageConfig, saveHomepageConfig, type HomeCardConfig } from '../../api/admin'
import { useAccess } from '../../auth/access'

const loading = ref(false)
const saving = ref(false)
const list = ref<HomeCardConfig[]>([])
const draggingKey = ref<string>('')
const access = useAccess()
const canEdit = computed(() => access.hasPermission('ops:homepage:edit'))

const sortedList = computed(() => {
  return list.value.slice().sort((a, b) => a.sort - b.sort)
})

function normalizeSort() {
  const next = sortedList.value.map((it, idx) => ({ ...it, sort: idx + 1 }))
  list.value = next
}

async function load() {
  loading.value = true
  try {
    const res = await fetchHomepageConfig()
    list.value = res.list.slice().sort((a, b) => a.sort - b.sort)
    normalizeSort()
  } finally {
    loading.value = false
  }
}

function handleDragStart(key: string) {
  if (!canEdit.value) return
  draggingKey.value = key
}

function allowDrop(e: DragEvent) {
  if (!canEdit.value) return
  e.preventDefault()
}

function handleDrop(targetKey: string) {
  if (!canEdit.value) return
  const sourceKey = draggingKey.value
  if (!sourceKey || sourceKey === targetKey) return
  const arr = sortedList.value.slice()
  const fromIndex = arr.findIndex((x) => x.key === sourceKey)
  const toIndex = arr.findIndex((x) => x.key === targetKey)
  if (fromIndex < 0 || toIndex < 0) return
  const [moved] = arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, moved)
  list.value = arr.map((it, idx) => ({ ...it, sort: idx + 1 }))
  draggingKey.value = ''
}

function setEnabled(key: string, enabled: boolean) {
  list.value = list.value.map((it) => (it.key === key ? { ...it, enabled } : it))
}

function setNewWeight(key: string, newWeight: number) {
  const value = Math.max(0, Math.min(100, Math.round(newWeight)))
  list.value = list.value.map((it) => (it.key === key ? { ...it, newWeight: value } : it))
}

function handleSwitchUpdate(key: string, v: boolean) {
  if (!canEdit.value) return
  setEnabled(key, v)
}

function handleSliderUpdate(key: string, v: number) {
  if (!canEdit.value) return
  setNewWeight(key, v)
}

function reviewWeight(it: HomeCardConfig) {
  return 100 - it.newWeight
}

async function save() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  saving.value = true
  try {
    normalizeSort()
    await saveHomepageConfig({ list: list.value })
    ElMessage.success('已保存')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="toolbar">
      <el-button @click="load">刷新</el-button>
      <el-button type="primary" :disabled="!canEdit" :loading="saving" @click="save">保存</el-button>
    </div>

    <div class="card-list">
      <el-card
        v-for="item in sortedList"
        :key="item.key"
        shadow="never"
        class="config-card"
        @dragover="allowDrop"
        @drop="handleDrop(item.key)"
      >
        <div class="card-header">
          <div class="left">
            <span v-if="canEdit" class="drag" draggable="true" @dragstart="handleDragStart(item.key)">⠿</span>
            <span class="title">{{ item.name }}</span>
            <el-tag size="small" type="info">排序：{{ item.sort }}</el-tag>
          </div>
          <el-switch
            :model-value="item.enabled"
            :disabled="!canEdit"
            @update:model-value="handleSwitchUpdate(item.key, $event)"
          />
        </div>

        <div class="card-body">
          <div class="weight-title">推荐算法权重（新学 vs 复习）</div>
          <div class="weight-row">
            <div class="weight-label">新学 {{ item.newWeight }}%</div>
            <el-slider
              :model-value="item.newWeight"
              :min="0"
              :max="100"
              :disabled="!canEdit || !item.enabled"
              @update:model-value="handleSliderUpdate(item.key, $event)"
            />
            <div class="weight-label">复习 {{ reviewWeight(item) }}%</div>
          </div>
        </div>
      </el-card>
    </div>
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

.card-list {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;
}

.config-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drag {
  cursor: grab;
  user-select: none;
  color: var(--el-text-color-secondary);
}

.title {
  font-weight: 600;
}

.card-body {
  margin-top: 12px;
}

.weight-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.weight-row {
  display: grid;
  grid-template-columns: 90px 1fr 90px;
  align-items: center;
  gap: 10px;
}

.weight-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}
</style>
