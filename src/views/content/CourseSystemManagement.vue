<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable, { type ProColumn } from '../../components/ProTable.vue'
import { useAccess } from '../../auth/access'
import {
  bindCourseGraph,
  createCourse,
  fetchCourseList,
  fetchGraphNodeTree,
  updateCourse,
  type CourseCategory,
  type CourseItem,
  type CourseStatus,
  type GraphNode,
} from '../../api/admin'

type CourseFormModel = {
  id?: string
  name: string
  category: CourseCategory | ''
  coverUrl: string
  sort: number
  status: CourseStatus
}

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null)
const access = useAccess()
const canEdit = computed(() => access.hasPermission('content:course:edit'))

const searchModel = reactive({
  name: '',
  category: '' as CourseCategory | '',
})

const columns: ProColumn[] = [
  { label: '课程名称', prop: 'name', minWidth: 180 },
  { label: '分类', prop: 'category', width: 120, slot: 'category' },
  { label: '封面图', prop: 'coverUrl', width: 120, slot: 'cover' },
  { label: '排序', prop: 'sort', width: 90 },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
  { label: '操作', prop: 'actions', width: 260, slot: 'actions' },
]

const categoryOptions = [
  { label: '中医基础', value: 'tcm-basic' },
  { label: '西医基础', value: 'wm-basic' },
  { label: '临床', value: 'clinical' },
] as const

const categoryLabelMap = new Map<CourseCategory, string>(
  categoryOptions.map((o) => [o.value, o.label]),
)

function getCategoryLabel(v: CourseCategory) {
  return categoryLabelMap.get(v) ?? v
}

async function requestTable(params: Record<string, any>) {
  return fetchCourseList({
    page: Number(params.page),
    pageSize: Number(params.pageSize),
    name: searchModel.name || undefined,
    category: searchModel.category || '',
  })
}

function handleSearch() {
  proTableRef.value?.reset()
}

function handleReset() {
  searchModel.name = ''
  searchModel.category = ''
  proTableRef.value?.reset()
}

const editDialogVisible = ref(false)
const editMode = ref<'create' | 'edit'>('create')
const editSubmitting = ref(false)
const editFormRef = ref()
const editForm = reactive<CourseFormModel>({
  name: '',
  category: '',
  coverUrl: '',
  sort: 1,
  status: 'enabled',
})

const editDialogTitle = computed(() => (editMode.value === 'create' ? '新增课程' : '编辑课程'))

function openCreate() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  editMode.value = 'create'
  editDialogVisible.value = true
  editForm.id = undefined
  editForm.name = ''
  editForm.category = ''
  editForm.coverUrl = ''
  editForm.sort = 1
  editForm.status = 'enabled'
}

function openEdit(row: CourseItem) {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  editMode.value = 'edit'
  editDialogVisible.value = true
  editForm.id = row.id
  editForm.name = row.name
  editForm.category = row.category
  editForm.coverUrl = row.coverUrl
  editForm.sort = row.sort
  editForm.status = row.status
}

function handleUploadSuccess(res: any) {
  if (res?.url) {
    editForm.coverUrl = String(res.url)
  }
}

async function submitEdit() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (!editFormRef.value) return
  await editFormRef.value.validate()

  editSubmitting.value = true
  try {
    const payload = {
      name: editForm.name,
      category: editForm.category as CourseCategory,
      coverUrl: editForm.coverUrl,
      sort: editForm.sort,
      status: editForm.status,
    }

    if (editMode.value === 'create') {
      await createCourse(payload)
      ElMessage.success('已新增')
    } else {
      await updateCourse({ ...(payload as any), id: editForm.id as string })
      ElMessage.success('已保存')
    }
    editDialogVisible.value = false
    proTableRef.value?.reload()
  } finally {
    editSubmitting.value = false
  }
}

const bindDialogVisible = ref(false)
const bindSubmitting = ref(false)
const bindCourseId = ref<string>('')
const bindCourseName = ref<string>('')
const graphTreeLoading = ref(false)
const graphTreeData = ref<GraphNode[]>([])
const graphTreeRef = ref()
const selectedNodeId = ref<string>('')

async function ensureGraphTreeLoaded() {
  if (graphTreeData.value.length > 0) return
  graphTreeLoading.value = true
  try {
    const res = await fetchGraphNodeTree()
    graphTreeData.value = res.tree
  } finally {
    graphTreeLoading.value = false
  }
}

async function openBindGraph(row: CourseItem) {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  bindCourseId.value = row.id
  bindCourseName.value = row.name
  selectedNodeId.value = row.graphNodeId ?? ''
  bindDialogVisible.value = true
  await ensureGraphTreeLoaded()
  if (selectedNodeId.value) {
    graphTreeRef.value?.setCurrentKey(selectedNodeId.value)
  }
}

function handleTreeCurrentChange(data: any) {
  if (data?.id) selectedNodeId.value = String(data.id)
}

async function submitBind() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (!bindCourseId.value) return
  if (!selectedNodeId.value) {
    ElMessage.warning('请选择一个节点')
    return
  }
  bindSubmitting.value = true
  try {
    await bindCourseGraph({ courseId: bindCourseId.value, nodeId: selectedNodeId.value })
    ElMessage.success('已绑定')
    bindDialogVisible.value = false
    proTableRef.value?.reload()
  } finally {
    bindSubmitting.value = false
  }
}

const statusOptions = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
] as const

function getStatusLabel(v: CourseStatus) {
  return statusOptions.find((o) => o.value === v)?.label ?? v
}

onMounted(() => {
  ensureGraphTreeLoaded()
})
</script>

<template>
  <div class="page">
    <pro-table ref="proTableRef" :columns="columns" :request="requestTable">
      <template #search>
        <el-form :inline="true" label-width="80px">
          <el-form-item label="名称">
            <el-input v-model="searchModel.name" placeholder="请输入课程名称" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="searchModel.category" placeholder="请选择分类" clearable style="width: 180px">
              <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button type="primary" :disabled="!canEdit" @click="openCreate">新增课程</el-button>
      </template>

      <template #category="{ value }">
        <span>{{ getCategoryLabel(value) }}</span>
      </template>

      <template #cover="{ value }">
        <el-image
          v-if="value"
          :src="value"
          fit="cover"
          style="width: 84px; height: 48px; border-radius: 4px"
        />
        <span v-else>-</span>
      </template>

      <template #status="{ value }">
        <el-tag v-if="value === 'enabled'" type="success">{{ getStatusLabel(value) }}</el-tag>
        <el-tag v-else type="info">{{ getStatusLabel(value) }}</el-tag>
      </template>

      <template #actions="{ row }">
        <el-button link type="primary" :disabled="!canEdit" @click="openEdit(row)">编辑</el-button>
        <el-button link type="primary" :disabled="!canEdit" @click="openBindGraph(row)">配置图谱绑定</el-button>
      </template>
    </pro-table>

    <el-dialog v-model="editDialogVisible" :title="editDialogTitle" width="640px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" label-width="90px">
        <el-form-item
          label="课程名称"
          prop="name"
          :rules="[{ required: true, message: '请输入课程名称', trigger: 'blur' }]"
        >
          <el-input v-model="editForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item
          label="分类"
          prop="category"
          :rules="[{ required: true, message: '请选择分类', trigger: 'change' }]"
        >
          <el-select v-model="editForm.category" placeholder="请选择分类" style="width: 240px">
            <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>

        <el-form-item
          label="封面图"
          prop="coverUrl"
          :rules="[{ required: true, message: '请上传封面图', trigger: 'change' }]"
        >
          <div class="cover-upload">
            <el-upload
              action="/api/upload"
              :show-file-list="false"
              accept="image/*"
              :on-success="handleUploadSuccess"
            >
              <el-button>上传封面</el-button>
            </el-upload>
            <el-image
              v-if="editForm.coverUrl"
              :src="editForm.coverUrl"
              fit="cover"
              style="width: 140px; height: 80px; border-radius: 6px"
            />
            <span v-else class="cover-empty">未上传</span>
          </div>
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="editForm.sort" :min="1" :max="9999" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" style="width: 160px">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canEdit" :loading="editSubmitting" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindDialogVisible" title="配置图谱绑定" width="560px" destroy-on-close>
      <div class="bind-title">当前课程：{{ bindCourseName }}</div>
      <el-skeleton :loading="graphTreeLoading" animated>
        <el-tree
          ref="graphTreeRef"
          :data="graphTreeData"
          node-key="id"
          highlight-current
          default-expand-all
          :props="{ label: 'label', children: 'children' }"
          @current-change="handleTreeCurrentChange"
        />
      </el-skeleton>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canEdit" :loading="bindSubmitting" @click="submitBind">确定</el-button>
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

.cover-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-empty {
  color: var(--el-text-color-secondary);
}

.bind-title {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
}
</style>
