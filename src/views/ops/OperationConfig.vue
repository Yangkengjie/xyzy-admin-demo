<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { OperationConfigItem } from '../../api/admin'
import { fetchOperationConfigList } from '../../api/admin'

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const list = ref<OperationConfigItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchOperationConfigList({ page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const enableStats = computed(() => {
  let enabled = 0
  let disabled = 0
  for (const item of list.value) {
    if (item.enabled) enabled += 1
    else disabled += 1
  }
  return [
    { name: '启用', value: enabled },
    { name: '停用', value: disabled },
  ]
})

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        data: enableStats.value,
      },
    ],
  }
})

function handlePageChange(p: number) {
  page.value = p
  load()
}

function handlePageSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <div class="page">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>配置列表</template>
          <el-table :data="list" v-loading="loading" style="width: 100%">
            <el-table-column prop="key" label="Key" width="170" />
            <el-table-column prop="name" label="名称" min-width="220" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.enabled" type="success">启用</el-tag>
                <el-tag v-else type="info">停用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" width="180" />
          </el-table>
          <div class="pager">
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
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never">
          <template #header>启用占比</template>
          <v-chart :option="chartOption" autoresize style="height: 360px" />
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

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

