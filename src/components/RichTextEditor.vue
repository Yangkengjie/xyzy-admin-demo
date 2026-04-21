<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  height?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLDivElement | null>(null)
const internalHtml = ref(props.modelValue ?? '')

const editorStyle = computed(() => {
  const h = props.height ?? 160
  return {
    minHeight: `${h}px`,
  }
})

watch(
  () => props.modelValue,
  (v) => {
    const next = v ?? ''
    if (next === internalHtml.value) return
    internalHtml.value = next
    if (editorRef.value && editorRef.value.innerHTML !== next) {
      editorRef.value.innerHTML = next
    }
  },
)

function exec(command: string, value?: string) {
  document.execCommand(command, false, value)
  sync()
}

function sync() {
  const html = editorRef.value?.innerHTML ?? ''
  internalHtml.value = html
  emit('update:modelValue', html)
}

function handlePaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text/plain')
  if (!text) return
  e.preventDefault()
  document.execCommand('insertText', false, text)
  sync()
}

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = internalHtml.value
  }
})
</script>

<template>
  <div class="rte">
    <div class="rte-toolbar">
      <el-button-group>
        <el-button size="small" @click="exec('bold')">加粗</el-button>
        <el-button size="small" @click="exec('italic')">斜体</el-button>
        <el-button size="small" @click="exec('underline')">下划线</el-button>
      </el-button-group>
      <el-button-group>
        <el-button size="small" @click="exec('insertUnorderedList')">无序</el-button>
        <el-button size="small" @click="exec('insertOrderedList')">有序</el-button>
      </el-button-group>
      <el-button size="small" @click="exec('removeFormat')">清格式</el-button>
    </div>
    <div
      ref="editorRef"
      class="rte-editor"
      :style="editorStyle"
      contenteditable="true"
      :data-placeholder="placeholder || '请输入内容...'"
      @input="sync"
      @blur="sync"
      @paste="handlePaste"
    ></div>
  </div>
</template>

<style scoped>
.rte {
  width: 100%;
}

.rte-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.rte-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--el-bg-color);
  outline: none;
  overflow: auto;
  line-height: 1.6;
}

.rte-editor:empty:before {
  content: attr(data-placeholder);
  color: var(--el-text-color-secondary);
}
</style>

