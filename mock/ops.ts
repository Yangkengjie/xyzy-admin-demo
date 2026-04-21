import type { MockMethod } from 'vite-plugin-mock'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function makeList(total: number) {
  const names = [
    '首页运营位',
    '内容推荐策略',
    'Push 推送',
    '活动配置',
    'AB 实验开关',
    '热词配置',
    '内容审核规则',
    'AI 提示词模板',
    '搜索召回权重',
    '新手引导',
    '版本灰度',
    '用户分群',
  ]

  return Array.from({ length: total }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (i % 12))
    date.setMinutes(date.getMinutes() - (i % 60))
    return {
      key: `OPS_${String(i + 1).padStart(3, '0')}`,
      name: names[i % names.length],
      enabled: i % 3 !== 0,
      updatedAt: formatDate(date),
    }
  })
}

type HomeCardKey = 'today-suggestion' | 'continue-learning' | 'learning-status'

type HomeCardConfig = {
  key: HomeCardKey
  name: string
  enabled: boolean
  sort: number
  newWeight: number
}

let homepageConfig: HomeCardConfig[] = [
  { key: 'today-suggestion', name: '今日学习建议', enabled: true, sort: 1, newWeight: 60 },
  { key: 'continue-learning', name: '继续学习', enabled: true, sort: 2, newWeight: 40 },
  { key: 'learning-status', name: '学习状态卡片', enabled: false, sort: 3, newWeight: 50 },
]

function normalizeHomepageConfig(list: HomeCardConfig[]) {
  const next = list
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((it, idx) => ({
      ...it,
      sort: idx + 1,
      newWeight: Math.max(0, Math.min(100, Math.round(it.newWeight))),
    }))
  return next
}

type PushScope = 'all' | 'targeted'
type PushStatus = 'sent' | 'draft'

type PushRecord = {
  id: string
  title: string
  content: string
  link?: string
  templateId: string
  scope: PushScope
  targetGrades: string[]
  targetPersonas: string[]
  pushedAt: string
  status: PushStatus
}

type PushTemplate = {
  id: string
  name: string
}

const pushTemplates: PushTemplate[] = [
  { id: 'TMPL_001', name: '学习提醒' },
  { id: 'TMPL_002', name: '测评通知' },
  { id: 'TMPL_003', name: '课程更新' },
]

let pushRecords: PushRecord[] = [
  {
    id: 'PUSH_001',
    title: '今日学习建议已更新',
    content: '为你推荐 3 个适合当前阶段的知识点，点击查看。',
    link: 'https://example.com/learn',
    templateId: 'TMPL_001',
    scope: 'all',
    targetGrades: [],
    targetPersonas: [],
    pushedAt: formatDate(new Date()),
    status: 'sent',
  },
]

const mocks: MockMethod[] = [
  {
    url: '/api/ops/config/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const total = 24
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const all = makeList(total)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { total, list: all.slice(start, end) }
    },
  },
  {
    url: '/api/home-config/get',
    method: 'get',
    response: () => {
      homepageConfig = normalizeHomepageConfig(homepageConfig)
      return { list: homepageConfig }
    },
  },
  {
    url: '/api/home-config/save',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const list = Array.isArray(body.list) ? body.list : []
      const next: HomeCardConfig[] = list
        .map((it: any) => ({
          key: it.key as HomeCardKey,
          name: String(it.name ?? ''),
          enabled: Boolean(it.enabled),
          sort: Number(it.sort ?? 1),
          newWeight: Number(it.newWeight ?? 50),
        }))
        .filter((it) => it.key && it.name)
      homepageConfig = normalizeHomepageConfig(next)
      return { ok: true }
    },
  },
  {
    url: '/api/push/templates',
    method: 'get',
    response: () => {
      return { list: pushTemplates }
    },
  },
  {
    url: '/api/push/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const sorted = pushRecords.slice().sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1))
      const total = sorted.length
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { total, list: sorted.slice(start, end) }
    },
  },
  {
    url: '/api/push/create',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const id = `PUSH_${String(Date.now()).slice(-6)}`
      const scope = (body.scope === 'targeted' ? 'targeted' : 'all') as PushScope
      const record: PushRecord = {
        id,
        title: String(body.title ?? ''),
        content: String(body.content ?? ''),
        link: body.link ? String(body.link) : undefined,
        templateId: String(body.templateId ?? ''),
        scope,
        targetGrades: Array.isArray(body.targetGrades) ? body.targetGrades.map((x: any) => String(x)) : [],
        targetPersonas: Array.isArray(body.targetPersonas) ? body.targetPersonas.map((x: any) => String(x)) : [],
        pushedAt: formatDate(new Date()),
        status: 'sent',
      }
      pushRecords = [record, ...pushRecords]
      return { id }
    },
  },
]

export default mocks
