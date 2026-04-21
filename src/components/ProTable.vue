<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

export type ProColumn = {
  label: string
  prop: string
  width?: number | string
  minWidth?: number | string
  slot?: string
}

const props = withDefaults(
  defineProps<{
    columns: ProColumn[]
    request: (params: Record<string, any>) => Promise<{ total: number; list: any[] }>
    params?: Record<string, any>
    rowKey?: string
    defaultPageSize?: number
    tableProps?: Record<string, any>
    pagination?: boolean
  }>(),
  {
    params: () => ({}),
    rowKey: 'id',
    defaultPageSize: 10,
    tableProps: () => ({}),
    pagination: true,
  },
)

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(props.defaultPageSize)

const queryParams = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  ...props.params,
}))

async function load() {
  loading.value = true
  try {
    const res = await props.request(queryParams.value)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetPageAndReload() {
  page.value = 1
  load()
}

function handlePageChange(p: number) {
  page.value = p
  load()
}

function handlePageSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  load()
}

defineExpose({
  reload: load,
  reset: resetPageAndReload,
})

onMounted(load)
</script>

<template>
  <div class="pro-table">
    <div v-if="$slots.search" class="pro-table-search">
      <slot name="search" :loading="loading" :reload="resetPageAndReload" />
    </div>
    <div v-if="$slots.toolbar" class="pro-table-toolbar">
      <slot name="toolbar" :loading="loading" :reload="resetPageAndReload" />
    </div>

    <el-table
      :data="tableData"
      v-loading="loading"
      style="width: 100%"
      :row-key="rowKey"
      v-bind="tableProps"
    >
      <template v-for="col in columns" :key="col.prop">
        <el-table-column
          v-if="!col.slot"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
        />
        <el-table-column
          v-else
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
        >
          <template #default="{ row }">
            <slot :name="col.slot" :row="row" :value="row[col.prop]" />
          </template>
        </el-table-column>
      </template>
    </el-table>

    <div v-if="pagination" class="pro-table-pagination">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.pro-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pro-table-search {
  padding: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  border-radius: 4px;
}

.pro-table-toolbar {
  display: flex;
  justify-content: flex-end;
}

.pro-table-pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
