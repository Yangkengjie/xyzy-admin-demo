<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { roleLabelMap, useAccess, type RoleKey } from '../auth/access'

type MenuItem = {
  index: string
  title: string
  children?: MenuItem[]
  roles?: RoleKey[]
}

const router = useRouter()
const route = useRoute()
const access = useAccess()

const menuItems = computed<MenuItem[]>(() => {
  return [
    { index: '/dashboard', title: '数据统计看板' },
    {
      index: '/content',
      title: '内容管理',
      roles: ['super_admin', 'content_editor'],
      children: [
        { index: '/content/list', title: '内容列表' },
        { index: '/content/course-system', title: '课程体系管理' },
        { index: '/content/graph-node', title: '知识图谱节点管理' },
        { index: '/content/syndrome-question-bank', title: '辨证题库管理' },
      ],
    },
    {
      index: '/user-profile',
      title: '用户画像',
      roles: ['super_admin', 'read_analyst', 'ops_cs'],
      children: [
        { index: '/user-profile/list', title: '用户列表', roles: ['super_admin'] },
        { index: '/user-profile/learner-portrait', title: '学习者画像管理' },
      ],
    },
    {
      index: '/operation-config',
      title: '运营配置',
      roles: ['super_admin', 'ops_cs'],
      children: [
        { index: '/operation-config/list', title: '配置列表' },
        { index: '/operation-config/homepage', title: '首页配置管理' },
        { index: '/operation-config/push', title: '消息推送管理' },
      ],
    },
    { index: '/system-data', title: '系统数据', roles: ['super_admin', 'read_analyst', 'ops_cs'] },
    {
      index: '/data-insight',
      title: '数据洞察',
      roles: ['super_admin', 'read_analyst', 'ops_cs'],
      children: [
        { index: '/data-insight/graph-behavior', title: '图谱行为' },
        { index: '/data-insight/graph-behavior-analysis', title: '图谱行为分析' },
        { index: '/data-insight/mastery-distribution', title: '掌握度分布' },
        { index: '/data-insight/mastery-distribution-analysis', title: '掌握度分布分析' },
        { index: '/data-insight/review-efficiency', title: '复习效能' },
        { index: '/data-insight/review-efficiency-analysis', title: '复习效能分析' },
        { index: '/data-insight/search-analysis', title: '搜索分析' },
        { index: '/data-insight/search-behavior-analysis', title: '搜索行为分析' },
        { index: '/data-insight/ai-effect', title: 'AI效果' },
        { index: '/data-insight/ai-effect-analysis', title: 'AI 效果分析' },
        { index: '/data-insight/path-replay', title: '路径还原' },
        { index: '/data-insight/path-replay-analysis', title: '学习路径还原分析' },
      ],
    },
  ]
})

function filterMenuItems(items: MenuItem[]): MenuItem[] {
  return items
    .filter((it) => access.canAccessRoles(it.roles))
    .map((it) => {
      if (!it.children?.length) return it
      const nextChildren = filterMenuItems(it.children)
      if (nextChildren.length === 0) return { ...it, children: undefined }
      return { ...it, children: nextChildren }
    })
}

const visibleMenuItems = computed(() => filterMenuItems(menuItems.value))

const activeMenu = computed(() => route.path)

function handleSelect(index: string) {
  router.push(index)
}

const roleOptions: Array<{ key: RoleKey; label: string }> = [
  { key: 'super_admin', label: roleLabelMap.super_admin },
  { key: 'content_editor', label: roleLabelMap.content_editor },
  { key: 'ops_cs', label: roleLabelMap.ops_cs },
  { key: 'read_analyst', label: roleLabelMap.read_analyst },
]

function switchRole(next: RoleKey) {
  access.setRole(next)
  router.replace('/dashboard')
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="220px" class="app-aside">
      <div class="brand">
        <div class="brand-title">学医智用·管理端</div>
      </div>
      <el-menu :default-active="activeMenu" class="app-menu" @select="handleSelect">
        <template v-for="item in visibleMenuItems" :key="item.index">
          <el-sub-menu v-if="item.children?.length" :index="item.index">
            <template #title>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="item.index">
            {{ item.title }}
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header height="56px" class="app-header">
        <div class="header-left">
          <div class="page-title">{{ (route.meta.title as string) || '' }}</div>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="switchRole">
            <div class="user">
              <div class="role-text">{{ access.roleLabel }}</div>
              <el-avatar size="small" class="avatar">R</el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="opt in roleOptions" :key="opt.key" :command="opt.key">
                  {{ opt.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-aside {
  border-right: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.brand {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.brand-title {
  font-weight: 600;
  font-size: 14px;
}

.app-menu {
  border-right: none;
}

.app-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.header-left {
  display: flex;
  align-items: center;
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
}

.page-title {
  font-weight: 600;
}

.user {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.role-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.avatar {
  background: var(--el-color-primary);
}

.app-main {
  padding: 16px;
}
</style>
