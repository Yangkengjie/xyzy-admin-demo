<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ContentItem } from '../../api/admin'
import { fetchContentList } from '../../api/admin'

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const list = ref<ContentItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchContentList({ page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const categoryStats = computed(() => {
  const map = new Map<string, number>()
  for (const item of list.value) {
    map.set(item.category, (map.get(item.category) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
})

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        name: '内容分类',
        type: 'pie',
        radius: ['35%', '65%'],
        data: categoryStats.value,
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
          <template #header>内容列表</template>
          <el-table :data="list" v-loading="loading" style="width: 100%">
            <el-table-column prop="title" label="标题" min-width="220" />
            <el-table-column prop="category" label="分类" width="120" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'published'" type="success">已发布</el-tag>
                <el-tag v-else-if="row.status === 'draft'" type="info">草稿</el-tag>
                <el-tag v-else type="warning">已归档</el-tag>
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
          <template #header>分类分布</template>
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
