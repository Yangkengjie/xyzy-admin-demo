<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable, { type ProColumn } from '../../components/ProTable.vue'
import { useAccess } from '../../auth/access'
import {
  fetchCourseDirectoryTree,
  fetchGraphNodeList,
  moveGraphNode,
  updateGraphNodeColor,
  type CourseDirectoryNode,
  type GraphNodeColor,
  type GraphNodeItem,
} from '../../api/admin'

const access = useAccess()
const canEditGraph = computed(() => access.hasPermission('content:graph:edit'))

const directoryLoading = ref(false)
const directoryTree = ref<CourseDirectoryNode[]>([])
const currentCourseId = ref<string>('')
const directoryRef = ref()

const searchModel = reactive({
  name: '',
})

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null)

const columns: ProColumn[] = [
  { label: '节点名称', prop: 'name', minWidth: 220, slot: 'name' },
  { label: '层级', prop: 'level', width: 90 },
  { label: '父节点', prop: 'parentName', minWidth: 160 },
  { label: '默认标记颜色', prop: 'color', width: 160, slot: 'color' },
]

const tableTree = ref<GraphNodeItem[]>([])
const selectedNodeId = ref<string>('')

function flattenTree(nodes: GraphNodeItem[]) {
  const list: GraphNodeItem[] = []
  const walk = (arr: GraphNodeItem[]) => {
    for (const n of arr) {
      list.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return list
}

const nodeMap = computed(() => {
  return new Map(flattenTree(tableTree.value).map((n) => [n.id, n]))
})

const previewFocus = computed(() => {
  const focus = selectedNodeId.value ? nodeMap.value.get(selectedNodeId.value) : undefined
  if (focus) return focus
  const first = flattenTree(tableTree.value)[0]
  return first
})

const colorHex: Record<GraphNodeColor, string> = {
  brown: '#8D6E63',
  yellow: '#FBC02D',
  gray: '#9E9E9E',
  red: '#E53935',
}

const previewOption = computed(() => {
  const focus = previewFocus.value
  if (!focus) return { series: [] }

  const all = nodeMap.value
  const ids = new Set<string>()
  ids.add(focus.id)
  if (focus.parentId) ids.add(focus.parentId)

  const focusChildren = (focus.children ?? []).slice(0, 12)
  for (const c of focusChildren) ids.add(c.id)

  if (focus.parentId) {
    const parent = all.get(focus.parentId)
    const siblings = (parent?.children ?? []).filter((x) => x.id !== focus.id).slice(0, 8)
    for (const s of siblings) ids.add(s.id)
  }

  const nodes = Array.from(ids)
    .map((id) => all.get(id))
    .filter(Boolean) as GraphNodeItem[]

  const links = nodes
    .filter((n) => n.parentId && ids.has(n.parentId))
    .map((n) => ({ source: n.parentId as string, target: n.id }))

  const data = nodes.map((n) => {
    const base = Math.max(18, 46 - n.level * 6)
    const symbolSize = n.id === focus.id ? base + 10 : base
    return {
      id: n.id,
      name: n.name,
      value: n.level,
      symbolSize,
      itemStyle: { color: colorHex[n.color] },
      label: { show: true },
    }
  })

  return {
    tooltip: {
      formatter: (p: any) => {
        const name = p?.data?.name ?? ''
        return name
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data,
        links,
        roam: true,
        draggable: false,
        emphasis: { focus: 'adjacency' },
        force: {
          repulsion: 220,
          edgeLength: 90,
        },
        lineStyle: { color: '#c0c4cc', width: 1 },
      },
    ],
  }
})

const colorOptions: Array<{ label: string; value: GraphNodeColor }> = [
  { label: '棕', value: 'brown' },
  { label: '黄', value: 'yellow' },
  { label: '灰', value: 'gray' },
  { label: '红', value: 'red' },
]

const draggingNodeId = ref<string>('')

async function loadDirectory() {
  directoryLoading.value = true
  try {
    const res = await fetchCourseDirectoryTree()
    directoryTree.value = res.tree

    if (!currentCourseId.value) {
      const firstCourse = findFirstCourseNode(res.tree)
      if (firstCourse?.courseId) {
        currentCourseId.value = firstCourse.courseId
        directoryRef.value?.setCurrentKey(firstCourse.id)
      }
    }
  } finally {
    directoryLoading.value = false
  }
}

function findFirstCourseNode(nodes: CourseDirectoryNode[]): CourseDirectoryNode | undefined {
  for (const n of nodes) {
    if (n.type === 'course') return n
    if (n.children?.length) {
      const found = findFirstCourseNode(n.children)
      if (found) return found
    }
  }
}

function extractCourseIdFromNode(node: CourseDirectoryNode) {
  if (node.type === 'course') return node.courseId ?? ''
  if (node.type === 'chapter') return node.courseId ?? ''
  return ''
}

function handleDirectoryCurrentChange(data: CourseDirectoryNode) {
  const courseId = extractCourseIdFromNode(data)
  if (!courseId) return
  currentCourseId.value = courseId
  proTableRef.value?.reset()
}

const tableProps = computed(() => {
  return {
    rowKey: 'id',
    defaultExpandAll: true,
    treeProps: { children: 'children' },
    highlightCurrentRow: true,
    currentRowKey: selectedNodeId.value,
    onRowClick: (row: GraphNodeItem) => {
      selectedNodeId.value = row.id
    },
  }
})

async function requestTable() {
  if (!currentCourseId.value) return { total: 0, list: [] }
  return fetchGraphNodeList({
    courseId: currentCourseId.value,
    name: searchModel.name || undefined,
  })
}

function handleSearch() {
  proTableRef.value?.reset()
}

function handleReset() {
  searchModel.name = ''
  proTableRef.value?.reset()
}

function handleDragStart(nodeId: string) {
  draggingNodeId.value = nodeId
}

async function dropToTarget(targetId?: string) {
  if (!canEditGraph.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  const nodeId = draggingNodeId.value
  if (!nodeId) return
  if (!currentCourseId.value) return
  if (targetId && targetId === nodeId) return
  await moveGraphNode({ courseId: currentCourseId.value, nodeId, targetId })
  ElMessage.success('已调整层级关系')
  draggingNodeId.value = ''
  proTableRef.value?.reload()
}

async function changeColor(nodeId: string, color: GraphNodeColor) {
  if (!canEditGraph.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (!currentCourseId.value) return
  await updateGraphNodeColor({ courseId: currentCourseId.value, nodeId, color })
  ElMessage.success('已更新颜色')
  proTableRef.value?.reload()
}

function allowRootDrop(e: DragEvent) {
  if (!canEditGraph.value) return
  e.preventDefault()
}

const rootDropActive = ref(false)

function handleRootDragEnter() {
  rootDropActive.value = true
}

function handleRootDragLeave() {
  rootDropActive.value = false
}

async function handleRootDrop(e: DragEvent) {
  if (!canEditGraph.value) return
  e.preventDefault()
  rootDropActive.value = false
  await dropToTarget(undefined)
}

function flattenCount(nodes: GraphNodeItem[]) {
  let count = 0
  const walk = (list: GraphNodeItem[]) => {
    for (const n of list) {
      count += 1
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return count
}

const totalText = ref('')

async function requestTableWithTotalHint() {
  const res = await requestTable()
  tableTree.value = res.list
  if (tableTree.value.length > 0) {
    const map = new Map(flattenTree(tableTree.value).map((n) => [n.id, true]))
    if (!selectedNodeId.value || !map.has(selectedNodeId.value)) {
      selectedNodeId.value = flattenTree(tableTree.value)[0]?.id ?? ''
    }
  } else {
    selectedNodeId.value = ''
  }
  totalText.value = `共 ${flattenCount(res.list)} 个节点`
  return res
}

onMounted(loadDirectory)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="6">
        <el-card shadow="never" class="left-card" v-loading="directoryLoading">
          <template #header>课程目录</template>
          <el-tree
            ref="directoryRef"
            :data="directoryTree"
            node-key="id"
            highlight-current
            default-expand-all
            :props="{ label: 'label', children: 'children' }"
            @current-change="handleDirectoryCurrentChange"
          />
        </el-card>
      </el-col>

      <el-col :span="10">
        <div
          class="root-drop"
          :class="{ active: rootDropActive }"
          @dragover="allowRootDrop"
          @dragenter="handleRootDragEnter"
          @dragleave="handleRootDragLeave"
          @drop="handleRootDrop"
        >
          拖拽到此处：设为根节点
        </div>

        <pro-table
          ref="proTableRef"
          :columns="columns"
          :request="requestTableWithTotalHint"
          :table-props="tableProps"
          :pagination="false"
          row-key="id"
        >
          <template #search>
            <el-form :inline="true" label-width="80px">
              <el-form-item label="节点名称">
                <el-input v-model="searchModel.name" placeholder="请输入节点名称" clearable style="width: 260px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
              </el-form-item>
              <el-form-item>
                <span class="total-hint">{{ totalText }}</span>
              </el-form-item>
            </el-form>
          </template>

          <template #name="{ row }">
            <div
              class="name-cell"
              @dragover.prevent
              @drop="
                async () => {
                  if (canEditGraph) await dropToTarget(row.id)
                }
              "
            >
              <span v-if="canEditGraph" class="drag-handle" draggable="true" @dragstart="handleDragStart(row.id)">
                ⠿
              </span>
              <span>{{ row.name }}</span>
            </div>
          </template>

          <template #color="{ row }">
            <el-select
              :model-value="row.color"
              style="width: 120px"
              :disabled="!canEditGraph"
              @update:model-value="
                async (val: GraphNodeColor) => {
                  await changeColor(row.id, val)
                }
              "
            >
              <el-option v-for="opt in colorOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </template>
        </pro-table>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="preview-card">
          <template #header>
            <div class="preview-header">
              <span>关系预览</span>
              <el-tag v-if="previewFocus" size="small" type="info">{{ previewFocus.name }}</el-tag>
            </div>
          </template>
          <div class="preview-body">
            <v-chart :option="previewOption" autoresize style="height: 420px" />
            <div class="preview-hint">单击左侧列表中的节点以更新预览</div>
          </div>
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

.left-card {
  height: calc(100vh - 120px);
  overflow: auto;
}

.name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;
}

.drag-handle {
  cursor: grab;
  user-select: none;
  color: var(--el-text-color-secondary);
}

.root-drop {
  height: 36px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.root-drop.active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.total-hint {
  color: var(--el-text-color-secondary);
}

.preview-card {
  height: calc(100vh - 120px);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.preview-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
