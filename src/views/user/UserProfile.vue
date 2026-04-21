<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { UserProfileItem } from '../../api/admin'
import { fetchUserProfileList } from '../../api/admin'

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const list = ref<UserProfileItem[]>([])

async function load() {
  loading.value = true
  try {
    const res = await fetchUserProfileList({ page: page.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const levelStats = computed(() => {
  const map = new Map<string, number>()
  for (const item of list.value) {
    map.set(item.level, (map.get(item.level) ?? 0) + 1)
  }
  const labels = Array.from(map.keys())
  const values = labels.map((k) => map.get(k) ?? 0)
  return { labels, values }
})

const chartOption = computed(() => {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 24, right: 16, top: 24, bottom: 24, containLabel: true },
    xAxis: { type: 'category', data: levelStats.value.labels },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: levelStats.value.values, name: '人数' }],
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
          <template #header>用户列表</template>
          <el-table :data="list" v-loading="loading" style="width: 100%">
            <el-table-column prop="userId" label="用户ID" width="120" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="level" label="年级" width="110" />
            <el-table-column prop="specialty" label="方向" min-width="140" />
            <el-table-column prop="activeDays" label="活跃天数" width="110" />
            <el-table-column prop="lastActiveAt" label="最近活跃" width="180" />
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
          <template #header>年级分布</template>
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

