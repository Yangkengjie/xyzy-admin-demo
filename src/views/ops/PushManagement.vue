<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable, { type ProColumn } from '../../components/ProTable.vue'
import { useAccess } from '../../auth/access'
import {
  createPush,
  fetchPushRecordList,
  fetchPushTemplates,
  type PushScope,
  type PushTemplate,
} from '../../api/admin'

const proTableRef = ref<InstanceType<typeof ProTable> | null>(null)
const access = useAccess()
const canCreate = computed(() => access.hasPermission('ops:push:create'))

const columns: ProColumn[] = [
  { label: '标题', prop: 'title', minWidth: 200 },
  { label: '推送时间', prop: 'pushedAt', width: 180 },
  { label: '推送范围', prop: 'scope', width: 110, slot: 'scope' },
  { label: '状态', prop: 'status', width: 100, slot: 'status' },
]

async function requestTable(params: Record<string, any>) {
  return fetchPushRecordList({ page: Number(params.page), pageSize: Number(params.pageSize) })
}

function scopeLabel(scope: PushScope) {
  return scope === 'all' ? '全量' : '定向'
}

function statusLabel(status: string) {
  return status === 'sent' ? '已推送' : '草稿'
}

const dialogVisible = ref(false)
const step = ref(0)
const submitting = ref(false)

const templatesLoading = ref(false)
const templates = ref<PushTemplate[]>([])

const step1FormRef = ref()
const step2FormRef = ref()

const step1Model = reactive({
  title: '',
  content: '',
  link: '',
  templateId: '',
})

const step2Model = reactive({
  grades: [] as string[],
  personas: [] as string[],
})

const gradeOptions = ['大一', '大二', '大三', '大四', '规培', '研究生']
const personaOptions = ['稳扎稳打型', '备考冲刺型', '探索拓展型', '高效掌握型']

const computedScope = computed<PushScope>(() => {
  const hasTarget = step2Model.grades.length > 0 || step2Model.personas.length > 0
  return hasTarget ? 'targeted' : 'all'
})

function resetDialog() {
  step.value = 0
  step1Model.title = ''
  step1Model.content = ''
  step1Model.link = ''
  step1Model.templateId = ''
  step2Model.grades = []
  step2Model.personas = []
}

async function openDialog() {
  if (!canCreate.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  dialogVisible.value = true
  resetDialog()
  if (templates.value.length === 0) {
    templatesLoading.value = true
    try {
      const res = await fetchPushTemplates()
      templates.value = res.list
    } finally {
      templatesLoading.value = false
    }
  }
}

async function nextStep() {
  if (step.value === 0) {
    await step1FormRef.value?.validate()
    step.value = 1
    return
  }
}

function prevStep() {
  if (step.value > 0) step.value -= 1
}

async function submit() {
  if (!canCreate.value) {
    ElMessage.warning('当前角色无权限操作')
    return
  }
  await step2FormRef.value?.validate()
  submitting.value = true
  try {
    await createPush({
      title: step1Model.title,
      content: step1Model.content,
      link: step1Model.link || undefined,
      templateId: step1Model.templateId,
      scope: computedScope.value,
      targetGrades: step2Model.grades,
      targetPersonas: step2Model.personas,
    })
    ElMessage.success('已推送（模拟）')
    dialogVisible.value = false
    proTableRef.value?.reload()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPushTemplates()
    .then((res) => {
      templates.value = res.list
    })
    .catch(() => {})
})
</script>

<template>
  <div class="page">
    <pro-table ref="proTableRef" :columns="columns" :request="requestTable">
      <template #toolbar>
        <el-button type="primary" :disabled="!canCreate" @click="openDialog">新建推送</el-button>
      </template>

      <template #scope="{ value }">
        <el-tag size="small" type="info">{{ scopeLabel(value) }}</el-tag>
      </template>

      <template #status="{ value }">
        <el-tag v-if="value === 'sent'" size="small" type="success">{{ statusLabel(value) }}</el-tag>
        <el-tag v-else size="small" type="info">{{ statusLabel(value) }}</el-tag>
      </template>
    </pro-table>

    <el-dialog v-model="dialogVisible" title="新建推送" width="760px" destroy-on-close>
      <el-steps :active="step" finish-status="success" align-center>
        <el-step title="内容配置" />
        <el-step title="人群选择" />
      </el-steps>

      <div class="step-body">
        <el-form v-if="step === 0" ref="step1FormRef" :model="step1Model" label-width="120px">
          <el-form-item
            label="标题"
            prop="title"
            :rules="[{ required: true, message: '请输入标题', trigger: 'blur' }]"
          >
            <el-input v-model="step1Model.title" placeholder="请输入标题" />
          </el-form-item>

          <el-form-item
            label="内容"
            prop="content"
            :rules="[{ required: true, message: '请输入内容', trigger: 'blur' }]"
          >
            <el-input v-model="step1Model.content" type="textarea" :rows="4" placeholder="请输入推送内容" />
          </el-form-item>

          <el-form-item label="跳转链接" prop="link">
            <el-input v-model="step1Model.link" placeholder="https://..." />
          </el-form-item>

          <el-form-item
            label="模板消息 ID"
            prop="templateId"
            :rules="[{ required: true, message: '请选择模板消息 ID', trigger: 'change' }]"
          >
            <el-select
              v-model="step1Model.templateId"
              placeholder="请选择"
              filterable
              style="width: 360px"
              :loading="templatesLoading"
            >
              <el-option v-for="t in templates" :key="t.id" :label="`${t.name}（${t.id}）`" :value="t.id" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-form v-else ref="step2FormRef" :model="step2Model" label-width="120px">
          <el-form-item label="推送范围">
            <el-tag size="small" type="info">{{ computedScope === 'all' ? '全量' : '定向' }}</el-tag>
            <span class="scope-hint">（选择筛选条件则为定向，否则为全量）</span>
          </el-form-item>

          <el-form-item label="按年级筛选" prop="grades">
            <el-select v-model="step2Model.grades" multiple clearable filterable placeholder="请选择年级" style="width: 520px">
              <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>

          <el-form-item label="按画像筛选" prop="personas">
            <el-select
              v-model="step2Model.personas"
              multiple
              clearable
              filterable
              placeholder="请选择画像类型"
              style="width: 520px"
            >
              <el-option v-for="p in personaOptions" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-alert
              type="info"
              :closable="false"
              title="模拟推送：提交后会写入 Mock 推送记录列表"
              show-icon
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button v-if="step === 1" @click="prevStep">上一步</el-button>
        <el-button v-if="step === 0" type="primary" :disabled="!canCreate" @click="nextStep">下一步</el-button>
        <el-button v-else type="primary" :disabled="!canCreate" :loading="submitting" @click="submit">推送</el-button>
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

.step-body {
  margin-top: 16px;
}

.scope-hint {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
