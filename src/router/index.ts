import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import { canAccessRoles, getRole, type RoleKey } from '../auth/access'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../views/dashboard/DashboardOverview.vue'),
        meta: { title: '数据统计看板' },
      },
      {
        path: '/content',
        name: 'content',
        redirect: '/content/list',
        meta: { title: '内容管理', roles: ['super_admin', 'content_editor'] satisfies RoleKey[] },
        children: [
          {
            path: 'list',
            name: 'content-list',
            component: () => import('../views/content/ContentManagement.vue'),
            meta: { title: '内容列表' },
          },
          {
            path: 'course-system',
            name: 'course-system',
            component: () => import('../views/content/CourseSystemManagement.vue'),
            meta: { title: '课程体系管理' },
          },
          {
            path: 'graph-node',
            name: 'graph-node',
            component: () => import('../views/content/GraphNodeManagement.vue'),
            meta: { title: '知识图谱节点管理' },
          },
          {
            path: 'syndrome-question-bank',
            name: 'syndrome-question-bank',
            component: () => import('../views/content/SyndromeQuestionBank.vue'),
            meta: { title: '辨证题库管理' },
          },
        ],
      },
      {
        path: '/user-profile',
        name: 'user-profile',
        redirect: '/user-profile/list',
        meta: { title: '用户画像', roles: ['super_admin', 'read_analyst', 'ops_cs'] satisfies RoleKey[] },
        children: [
          {
            path: 'list',
            name: 'user-profile-list',
            component: () => import('../views/user/UserProfile.vue'),
            meta: { title: '用户列表', roles: ['super_admin'] satisfies RoleKey[] },
          },
          {
            path: 'learner-portrait',
            name: 'learner-portrait',
            component: () => import('../views/user/LearnerPortraitManagement.vue'),
            meta: { title: '学习者画像管理' },
          },
        ],
      },
      {
        path: '/operation-config',
        name: 'operation-config',
        redirect: '/operation-config/list',
        meta: { title: '运营配置', roles: ['super_admin', 'ops_cs'] satisfies RoleKey[] },
        children: [
          {
            path: 'list',
            name: 'operation-config-list',
            component: () => import('../views/ops/OperationConfig.vue'),
            meta: { title: '运营配置' },
          },
          {
            path: 'homepage',
            name: 'homepage-config',
            component: () => import('../views/ops/HomepageConfigManagement.vue'),
            meta: { title: '首页配置管理' },
          },
          {
            path: 'push',
            name: 'push-management',
            component: () => import('../views/ops/PushManagement.vue'),
            meta: { title: '消息推送管理' },
          },
        ],
      },
      {
        path: '/system-data',
        name: 'system-data',
        component: () => import('../views/system/SystemData.vue'),
        meta: { title: '系统数据', roles: ['super_admin', 'read_analyst', 'ops_cs'] satisfies RoleKey[] },
      },
      {
        path: '/data-insight',
        name: 'data-insight',
        redirect: '/data-insight/graph-behavior',
        meta: { title: '数据洞察', roles: ['super_admin', 'read_analyst', 'ops_cs'] satisfies RoleKey[] },
        children: [
          {
            path: 'graph-behavior',
            name: 'graph-behavior',
            component: () => import('../views/insight/GraphBehavior.vue'),
            meta: { title: '图谱行为' },
          },
          {
            path: 'graph-behavior-analysis',
            name: 'graph-behavior-analysis',
            component: () => import('../views/insight/GraphBehaviorAnalysis.vue'),
            meta: { title: '图谱行为分析' },
          },
          {
            path: 'mastery-distribution',
            name: 'mastery-distribution',
            component: () => import('../views/insight/MasteryDistribution.vue'),
            meta: { title: '掌握度分布' },
          },
          {
            path: 'mastery-distribution-analysis',
            name: 'mastery-distribution-analysis',
            component: () => import('../views/insight/MasteryDistributionAnalysis.vue'),
            meta: { title: '掌握度分布分析' },
          },
          {
            path: 'review-efficiency',
            name: 'review-efficiency',
            component: () => import('../views/insight/ReviewEfficiency.vue'),
            meta: { title: '复习效能' },
          },
          {
            path: 'review-efficiency-analysis',
            name: 'review-efficiency-analysis',
            component: () => import('../views/insight/ReviewEfficiencyAnalysis.vue'),
            meta: { title: '复习效能分析' },
          },
          {
            path: 'search-analysis',
            name: 'search-analysis',
            component: () => import('../views/insight/SearchAnalysis.vue'),
            meta: { title: '搜索分析' },
          },
          {
            path: 'search-behavior-analysis',
            name: 'search-behavior-analysis',
            component: () => import('../views/insight/SearchBehaviorAnalysis.vue'),
            meta: { title: '搜索行为分析' },
          },
          {
            path: 'ai-effect',
            name: 'ai-effect',
            component: () => import('../views/insight/AIEffect.vue'),
            meta: { title: 'AI效果' },
          },
          {
            path: 'ai-effect-analysis',
            name: 'ai-effect-analysis',
            component: () => import('../views/insight/AIEffectAnalysis.vue'),
            meta: { title: 'AI 效果分析' },
          },
          {
            path: 'path-replay',
            name: 'path-replay',
            component: () => import('../views/insight/PathReplay.vue'),
            meta: { title: '路径还原' },
          },
          {
            path: 'path-replay-analysis',
            name: 'path-replay-analysis',
            component: () => import('../views/insight/PathReplayAnalysis.vue'),
            meta: { title: '学习路径还原分析' },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const currentRole = getRole()
  const allowedRoles = to.matched
    .map((r) => (r.meta as any)?.roles as RoleKey[] | undefined)
    .filter((x): x is RoleKey[] => Array.isArray(x) && x.length > 0)

  if (allowedRoles.length === 0) return true
  const ok = allowedRoles.every((roles) => roles.includes(currentRole)) && canAccessRoles(allowedRoles[allowedRoles.length - 1])
  if (ok) return true
  return { path: '/dashboard' }
})

export default router
