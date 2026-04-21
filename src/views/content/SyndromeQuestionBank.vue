<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable, { type ProColumn } from '../../components/ProTable.vue'
import RichTextEditor from '../../components/RichTextEditor.vue'
import { useAccess } from '../../auth/access'
import {
  createSyndromeQuestion,
  fetchCourseAll,
  fetchSyndromeQuestionList,
  importSyndromeQuestions,
  type SyndromeMode,
} from '../../api/admin'

const access = useAccess()
const canEdit = computed(() => access.hasPermission('content:quiz:edit'))

const mode = ref<SyndromeMode>('basic')
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null)

const courseOptions = ref<Array<{ id: string; name: string }>>([])
const courseLoading = ref(false)

const searchModel = reactive({
  keyword: '',
  courseId: '',
})

const columns: ProColumn[] = [
  { label: '题目内容', prop: 'stemText', minWidth: 260, slot: 'stem' },
  { label: '症状标签', prop: 'symptomTags', minWidth: 200, slot: 'tags' },
  { label: '标准答案', prop: 'standardAnswer', minWidth: 180 },
  { label: '所属课程', prop: 'courseName', width: 160 },
]

async function requestTable(params: Record<string, any>) {
  return fetchSyndromeQuestionList({
    mode: mode.value,
    page: Number(params.page),
    pageSize: Number(params.pageSize),
    keyword: searchModel.keyword || undefined,
    courseId: searchModel.courseId || undefined,
  })
}

function handleSearch() {
  proTableRef.value?.reset()
}

function handleReset() {
  searchModel.keyword = ''
  searchModel.courseId = ''
  proTableRef.value?.reset()
}

function handleTabChange() {
  proTableRef.value?.reset()
}

const createDialogVisible = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref()

const createForm = reactive({
  stemHtml: '',
  symptomTags: [] as string[],
  standardAnswer: '',
  courseId: '',
  aiTemplate: '',
})

function openCreate() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  createDialogVisible.value = true
  createForm.stemHtml = ''
  createForm.symptomTags = []
  createForm.standardAnswer = ''
  createForm.courseId = ''
  createForm.aiTemplate = ''
}

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim()
}

async function submitCreate() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (!createFormRef.value) return
  await createFormRef.value.validate()

  createSubmitting.value = true
  try {
    await createSyndromeQuestion({
      mode: mode.value,
      stemHtml: createForm.stemHtml,
      symptomTags: createForm.symptomTags,
      standardAnswer: createForm.standardAnswer,
      courseId: createForm.courseId,
      aiTemplate: createForm.aiTemplate,
    })
    ElMessage.success('已新增')
    createDialogVisible.value = false
    proTableRef.value?.reload()
  } finally {
    createSubmitting.value = false
  }
}

const importDialogVisible = ref(false)
const importSubmitting = ref(false)
const importError = ref('')
const importItems = ref<
  Array<{
    stemText: string
    symptomTags: string[]
    standardAnswer: string
    courseId: string
    aiTemplate: string
  }>
>([])
const importPreview = computed(() => importItems.value.slice(0, 10))

function openImport() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  importDialogVisible.value = true
  importSubmitting.value = false
  importError.value = ''
  importItems.value = []
}

function parseCsvLine(line: string) {
  const res: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      res.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  res.push(cur)
  return res.map((s) => s.trim())
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const idxStem = header.indexOf('stem')
  const idxTags = header.indexOf('tags')
  const idxAnswer = header.indexOf('answer')
  const idxCourseId = header.indexOf('courseid')
  const idxAi = header.indexOf('aitemplate')

  if (idxStem < 0 || idxTags < 0 || idxAnswer < 0 || idxCourseId < 0) {
    throw new Error('CSV 表头需包含：stem,tags,answer,courseId（aiTemplate 可选）')
  }

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line)
    const stemText = cols[idxStem] ?? ''
    const tagsRaw = cols[idxTags] ?? ''
    const standardAnswer = cols[idxAnswer] ?? ''
    const courseId = cols[idxCourseId] ?? ''
    const aiTemplate = idxAi >= 0 ? cols[idxAi] ?? '' : ''
    const symptomTags = tagsRaw
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean)

    return { stemText, symptomTags, standardAnswer, courseId, aiTemplate }
  })
}

async function handleCsvFile(file: File) {
  importError.value = ''
  importItems.value = []
  const text = await file.text()
  const items = parseCsv(text)
  importItems.value = items
}

async function submitImport() {
  if (!canEdit.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  if (importItems.value.length === 0) {
    ElMessage.warning('请先选择 CSV 文件')
    return
  }
  importSubmitting.value = true
  try {
    const res = await importSyndromeQuestions({ mode: mode.value, items: importItems.value })
    ElMessage.success(`已导入 ${res.created} 条`)
    importDialogVisible.value = false
    proTableRef.value?.reload()
  } finally {
    importSubmitting.value = false
  }
}

async function handleUploadChange(uploadFile: any) {
  try {
    if (uploadFile.raw) await handleCsvFile(uploadFile.raw)
  } catch (e: any) {
    importError.value = e?.message ?? String(e)
    importItems.value = []
  }
}

const displayModeLabel = computed(() => (mode.value === 'basic' ? '基础模式题库' : '进阶模式题库'))

async function loadCourses() {
  courseLoading.value = true
  try {
    const res = await fetchCourseAll()
    courseOptions.value = res.list
  } finally {
    courseLoading.value = false
  }
}

function truncate(text: string, max = 48) {
  const t = (text ?? '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}...`
}

onMounted(loadCourses)
</script>

<template>
  <div class="page">
    <el-tabs v-model="mode" @tab-change="handleTabChange">
      <el-tab-pane label="基础模式题库" name="basic" />
      <el-tab-pane label="进阶模式题库" name="advanced" />
    </el-tabs>

    <pro-table ref="proTableRef" :columns="columns" :request="requestTable">
      <template #search>
        <el-form :inline="true" label-width="80px">
          <el-form-item label="题目内容">
            <el-input v-model="searchModel.keyword" placeholder="支持模糊搜索" clearable style="width: 260px" />
          </el-form-item>
          <el-form-item label="课程">
            <el-select
              v-model="searchModel.courseId"
              placeholder="请选择课程"
              clearable
              filterable
              style="width: 220px"
              :loading="courseLoading"
            >
              <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <template #toolbar>
        <el-button :disabled="!canEdit" @click="openImport">批量导入 CSV</el-button>
        <el-button type="primary" :disabled="!canEdit" @click="openCreate">新增题目</el-button>
      </template>

      <template #stem="{ row }">
        <el-tooltip :content="row.stemText" placement="top-start" :show-after="350">
          <div class="stem-cell">{{ truncate(row.stemText) }}</div>
        </el-tooltip>
      </template>

      <template #tags="{ row }">
        <div class="tag-cell">
          <el-tag v-for="t in row.symptomTags" :key="t" size="small" type="info">{{ t }}</el-tag>
        </div>
      </template>
    </pro-table>

    <el-dialog v-model="createDialogVisible" :title="`新增题目 - ${displayModeLabel}`" width="760px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" label-width="110px">
        <el-form-item
          label="题干"
          prop="stemHtml"
          :rules="[
            {
              required: true,
              validator: (_: any, v: string, cb: (err?: Error) => void) => {
                if (!stripHtml(v || '')) cb(new Error('请输入题干'))
                else cb()
              },
              trigger: 'blur',
            },
          ]"
        >
          <rich-text-editor v-model="createForm.stemHtml" placeholder="请输入题干（支持简单富文本）" :height="180" />
        </el-form-item>

        <el-form-item
          label="症状标签"
          prop="symptomTags"
          :rules="[{ required: true, message: '请输入症状标签', trigger: 'change' }]"
        >
          <el-select
            v-model="createForm.symptomTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入后回车创建；多个标签"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item
          label="标准答案"
          prop="standardAnswer"
          :rules="[{ required: true, message: '请输入标准答案', trigger: 'blur' }]"
        >
          <el-input v-model="createForm.standardAnswer" placeholder="请输入标准答案" />
        </el-form-item>

        <el-form-item
          label="所属课程"
          prop="courseId"
          :rules="[{ required: true, message: '请选择所属课程', trigger: 'change' }]"
        >
          <el-select v-model="createForm.courseId" placeholder="请选择课程" filterable style="width: 320px">
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="AI 分析反馈模板" prop="aiTemplate">
          <el-input
            v-model="createForm.aiTemplate"
            type="textarea"
            :rows="4"
            placeholder="可配置 AI 分析反馈模板"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canEdit" :loading="createSubmitting" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" :title="`批量导入 CSV - ${displayModeLabel}`" width="760px" destroy-on-close>
      <div class="import-hint">
        CSV 表头示例：stem,tags,answer,courseId,aiTemplate（tags 用 | 分隔；aiTemplate 可选）
      </div>
      <el-upload
        accept=".csv"
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        :on-change="handleUploadChange"
      >
        <el-button>选择 CSV 文件</el-button>
      </el-upload>
      <div v-if="importError" class="import-error">{{ importError }}</div>
      <el-table v-if="importPreview.length" :data="importPreview" style="width: 100%; margin-top: 12px">
        <el-table-column prop="stemText" label="题干(预览)" min-width="260" />
        <el-table-column prop="symptomTags" label="标签" min-width="180">
          <template #default="{ row }">
            <div class="tag-cell">
              <el-tag v-for="t in row.symptomTags" :key="t" size="small" type="info">{{ t }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="standardAnswer" label="答案" min-width="140" />
        <el-table-column prop="courseId" label="课程ID" width="160" />
      </el-table>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canEdit" :loading="importSubmitting" @click="submitImport">导入</el-button>
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

.stem-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.import-hint {
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.import-error {
  margin-top: 8px;
  color: var(--el-color-danger);
}
</style>
