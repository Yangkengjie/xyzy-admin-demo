import type { MockMethod } from 'vite-plugin-mock'

type CourseCategory = 'tcm-basic' | 'wm-basic' | 'clinical'
type CourseStatus = 'enabled' | 'disabled'

type CourseItem = {
  id: string
  name: string
  category: CourseCategory
  coverUrl: string
  sort: number
  status: CourseStatus
  graphNodeId?: string
}

type CourseDirectoryNode = {
  id: string
  label: string
  type: 'category' | 'course' | 'chapter'
  courseId?: string
  children?: CourseDirectoryNode[]
}

type GraphNodeColor = 'brown' | 'yellow' | 'gray' | 'red'

type GraphNodeItem = {
  id: string
  name: string
  parentId?: string
  sort: number
  color: GraphNodeColor
}

type SyndromeMode = 'basic' | 'advanced'

type SyndromeQuestion = {
  id: string
  mode: SyndromeMode
  stemHtml: string
  stemText: string
  symptomTags: string[]
  standardAnswer: string
  courseId: string
  aiTemplate: string
}

function seedCover(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/280/160`
}

let courses: CourseItem[] = [
  {
    id: 'COURSE_001',
    name: '中医基础入门',
    category: 'tcm-basic',
    coverUrl: seedCover('tcm-1'),
    sort: 10,
    status: 'enabled',
    graphNodeId: 'tcm/root',
  },
  {
    id: 'COURSE_002',
    name: '西医基础总论',
    category: 'wm-basic',
    coverUrl: seedCover('wm-1'),
    sort: 20,
    status: 'enabled',
  },
  {
    id: 'COURSE_003',
    name: '临床思维训练',
    category: 'clinical',
    coverUrl: seedCover('cl-1'),
    sort: 30,
    status: 'disabled',
  },
]

function listCourses(params: { name?: string; category?: CourseCategory | ''; page: number; pageSize: number }) {
  const name = (params.name ?? '').trim()
  const category = params.category ?? ''
  const filtered = courses
    .filter((c) => (name ? c.name.includes(name) : true))
    .filter((c) => (category ? c.category === category : true))
    .sort((a, b) => a.sort - b.sort)

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize
  return { total, list: filtered.slice(start, end) }
}

const graphTree = [
  {
    id: 'tcm/root',
    label: '中医基础',
    children: [
      { id: 'tcm/diagnosis', label: '中医诊断学' },
      { id: 'tcm/formula', label: '方剂学' },
      { id: 'tcm/herb', label: '中药学' },
    ],
  },
  {
    id: 'wm/root',
    label: '西医基础',
    children: [
      { id: 'wm/physiology', label: '生理学' },
      { id: 'wm/pathology', label: '病理学' },
      { id: 'wm/pharmacology', label: '药理学' },
    ],
  },
  {
    id: 'clinical/root',
    label: '临床',
    children: [
      { id: 'clinical/internal', label: '内科学' },
      { id: 'clinical/surgery', label: '外科学' },
      { id: 'clinical/pediatrics', label: '儿科学' },
    ],
  },
]

function buildCourseDirectoryTree(): CourseDirectoryNode[] {
  const categoryLabelMap: Record<CourseCategory, string> = {
    'tcm-basic': '中医基础',
    'wm-basic': '西医基础',
    clinical: '临床',
  }

  const group = new Map<CourseCategory, CourseItem[]>()
  for (const c of courses) {
    const list = group.get(c.category) ?? []
    list.push(c)
    group.set(c.category, list)
  }

  const buildChapters = (courseId: string): CourseDirectoryNode[] => {
    return [
      { id: `${courseId}_CH1`, label: '第一章', type: 'chapter', courseId },
      { id: `${courseId}_CH2`, label: '第二章', type: 'chapter', courseId },
      { id: `${courseId}_CH3`, label: '第三章', type: 'chapter', courseId },
    ]
  }

  return (Object.keys(categoryLabelMap) as CourseCategory[]).map((cat) => {
    const courseChildren: CourseDirectoryNode[] = (group.get(cat) ?? [])
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map(
        (c): CourseDirectoryNode => ({
          id: `DIR_${c.id}`,
          label: c.name,
          type: 'course',
          courseId: c.id,
          children: buildChapters(c.id),
        }),
      )
    return {
      id: `CAT_${cat}`,
      label: categoryLabelMap[cat],
      type: 'category',
      children: courseChildren,
    }
  })
}

const defaultGraphNodesByCourseId: Record<string, GraphNodeItem[]> = {
  COURSE_001: [
    { id: 'N100', name: '阴阳学说', sort: 1, color: 'brown' },
    { id: 'N101', name: '五行学说', sort: 2, color: 'yellow' },
    { id: 'N102', name: '脏腑学说', sort: 3, color: 'gray' },
    { id: 'N110', name: '望诊', parentId: 'N102', sort: 1, color: 'red' },
    { id: 'N111', name: '闻诊', parentId: 'N102', sort: 2, color: 'brown' },
    { id: 'N112', name: '问诊', parentId: 'N102', sort: 3, color: 'yellow' },
  ],
  COURSE_002: [
    { id: 'N200', name: '细胞结构', sort: 1, color: 'gray' },
    { id: 'N201', name: '组织学', sort: 2, color: 'yellow' },
    { id: 'N210', name: '神经系统', sort: 3, color: 'brown' },
    { id: 'N211', name: '内分泌', parentId: 'N210', sort: 1, color: 'red' },
  ],
  COURSE_003: [
    { id: 'N300', name: '病史采集', sort: 1, color: 'brown' },
    { id: 'N301', name: '体格检查', sort: 2, color: 'yellow' },
    { id: 'N310', name: '辅助检查', sort: 3, color: 'gray' },
    { id: 'N311', name: '影像学', parentId: 'N310', sort: 1, color: 'red' },
  ],
}

let graphNodesByCourseId: Record<string, GraphNodeItem[]> = JSON.parse(
  JSON.stringify(defaultGraphNodesByCourseId),
)

function buildGraphTree(courseId: string) {
  const nodes = (graphNodesByCourseId[courseId] ?? []).slice()
  const byId = new Map<string, GraphNodeItem>(nodes.map((n) => [n.id, n]))
  const childrenMap = new Map<string, GraphNodeItem[]>()
  const roots: GraphNodeItem[] = []

  for (const n of nodes) {
    if (n.parentId && byId.has(n.parentId)) {
      const list = childrenMap.get(n.parentId) ?? []
      list.push(n)
      childrenMap.set(n.parentId, list)
    } else {
      roots.push(n)
    }
  }

  const build = (item: GraphNodeItem, parentName?: string, level = 1): any => {
    const children = (childrenMap.get(item.id) ?? []).sort((a, b) => a.sort - b.sort)
    const builtChildren = children.map((c) => build(c, item.name, level + 1))
    return {
      id: item.id,
      name: item.name,
      level,
      parentId: item.parentId,
      parentName: parentName ?? '',
      color: item.color,
      sort: item.sort,
      children: builtChildren.length ? builtChildren : undefined,
    }
  }

  return roots.sort((a, b) => a.sort - b.sort).map((r) => build(r, '', 1))
}

function filterGraphTreeByName(tree: any[], keyword: string) {
  const k = keyword.trim()
  if (!k) return tree

  const filterNode = (node: any): any | null => {
    const match = String(node.name ?? '').includes(k)
    const children = Array.isArray(node.children) ? node.children : []
    const filteredChildren = children.map(filterNode).filter(Boolean)
    if (match || filteredChildren.length) {
      return {
        ...node,
        children: filteredChildren.length ? filteredChildren : undefined,
      }
    }
    return null
  }

  return tree.map(filterNode).filter(Boolean)
}

function updateNodeColor(courseId: string, nodeId: string, color: GraphNodeColor) {
  const list = graphNodesByCourseId[courseId] ?? []
  graphNodesByCourseId[courseId] = list.map((n) => (n.id === nodeId ? { ...n, color } : n))
}

function moveNode(courseId: string, nodeId: string, targetId?: string) {
  const list = graphNodesByCourseId[courseId] ?? []
  const targetParentId = targetId ? String(targetId) : undefined
  let maxSort = 0
  for (const n of list) {
    if ((n.parentId ?? undefined) === targetParentId) maxSort = Math.max(maxSort, n.sort)
  }
  graphNodesByCourseId[courseId] = list.map((n) => {
    if (n.id !== nodeId) return n
    return { ...n, parentId: targetParentId, sort: maxSort + 1 }
  })
}

function stripHtml(html: string) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(text: string) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function courseNameById(courseId: string) {
  return courses.find((c) => c.id === courseId)?.name ?? courseId
}

let syndromeQuestions: Record<SyndromeMode, SyndromeQuestion[]> = {
  basic: [
    {
      id: 'SQB_001',
      mode: 'basic',
      stemHtml: '<p>患者畏寒发热，头痛身痛，无汗，鼻塞声重。</p><p>请辨证并给出治法。</p>',
      stemText: '患者畏寒发热，头痛身痛，无汗，鼻塞声重。请辨证并给出治法。',
      symptomTags: ['畏寒', '发热', '无汗', '鼻塞'],
      standardAnswer: '风寒束表证，辛温解表',
      courseId: 'COURSE_001',
      aiTemplate: '请从证候要点、辨证思路、治法三个维度反馈。',
    },
  ],
  advanced: [
    {
      id: 'SQA_001',
      mode: 'advanced',
      stemHtml: '<p>患者反复胸闷心悸，动则加重，舌暗有瘀点，脉涩。</p><p>请辨证并给出方药思路。</p>',
      stemText: '患者反复胸闷心悸，动则加重，舌暗有瘀点，脉涩。请辨证并给出方药思路。',
      symptomTags: ['胸闷', '心悸', '舌暗', '脉涩'],
      standardAnswer: '气虚血瘀，益气活血，通络止痛',
      courseId: 'COURSE_001',
      aiTemplate: '请给出辨证关键、证据链与可能的方药方向。',
    },
  ],
}

function listSyndromeQuestions(params: {
  mode: SyndromeMode
  page: number
  pageSize: number
  keyword?: string
  courseId?: string
}) {
  const keyword = (params.keyword ?? '').trim()
  const courseId = (params.courseId ?? '').trim()
  const all = syndromeQuestions[params.mode] ?? []
  const filtered = all
    .filter((q) => (courseId ? q.courseId === courseId : true))
    .filter((q) => (keyword ? q.stemText.includes(keyword) : true))
    .slice()

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize
  const list = filtered.slice(start, end).map((q) => ({
    ...q,
    courseName: courseNameById(q.courseId),
  }))
  return { total, list }
}

const mocks: MockMethod[] = [
  {
    url: '/api/course/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const name = typeof query.name === 'string' ? query.name : ''
      const category = typeof query.category === 'string' ? query.category : ''
      return listCourses({ page, pageSize, name, category: category as CourseCategory | '' })
    },
  },
  {
    url: '/api/course/all',
    method: 'get',
    response: () => {
      return {
        list: courses
          .slice()
          .sort((a, b) => a.sort - b.sort)
          .map((c) => ({ id: c.id, name: c.name })),
      }
    },
  },
  {
    url: '/api/course/create',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const id = `COURSE_${String(Date.now()).slice(-6)}`
      const item: CourseItem = {
        id,
        name: String(body.name ?? ''),
        category: body.category as CourseCategory,
        coverUrl: String(body.coverUrl ?? ''),
        sort: Number(body.sort ?? 1),
        status: (body.status as CourseStatus) ?? 'enabled',
      }
      courses = [item, ...courses]
      return { id }
    },
  },
  {
    url: '/api/course/update',
    method: 'put',
    response: ({ body }: { body: Record<string, any> }) => {
      const id = String(body.id ?? '')
      courses = courses.map((c) => {
        if (c.id !== id) return c
        return {
          ...c,
          name: String(body.name ?? c.name),
          category: (body.category as CourseCategory) ?? c.category,
          coverUrl: String(body.coverUrl ?? c.coverUrl),
          sort: Number(body.sort ?? c.sort),
          status: (body.status as CourseStatus) ?? c.status,
        }
      })
      return { ok: true }
    },
  },
  {
    url: '/api/course/bind-graph',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const courseId = String(body.courseId ?? '')
      const nodeId = String(body.nodeId ?? '')
      courses = courses.map((c) => (c.id === courseId ? { ...c, graphNodeId: nodeId } : c))
      return { ok: true }
    },
  },
  {
    url: '/api/graph/node-tree',
    method: 'get',
    response: () => {
      return { tree: graphTree }
    },
  },
  {
    url: '/api/course/directory-tree',
    method: 'get',
    response: () => {
      return { tree: buildCourseDirectoryTree() }
    },
  },
  {
    url: '/api/graph/node/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const courseId = String(query.courseId ?? '')
      const name = typeof query.name === 'string' ? query.name : ''
      const tree = filterGraphTreeByName(buildGraphTree(courseId), name)
      const count = (t: any[]): number => {
        let c = 0
        const walk = (list: any[]) => {
          for (const n of list) {
            c += 1
            if (n.children?.length) walk(n.children)
          }
        }
        walk(t)
        return c
      }
      return { total: count(tree), list: tree }
    },
  },
  {
    url: '/api/graph/node/update-color',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const courseId = String(body.courseId ?? '')
      const nodeId = String(body.nodeId ?? '')
      const color = String(body.color ?? '') as GraphNodeColor
      updateNodeColor(courseId, nodeId, color)
      return { ok: true }
    },
  },
  {
    url: '/api/graph/node/move',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const courseId = String(body.courseId ?? '')
      const nodeId = String(body.nodeId ?? '')
      const targetId = body.targetId ? String(body.targetId) : undefined
      moveNode(courseId, nodeId, targetId)
      return { ok: true }
    },
  },
  {
    url: '/api/quiz/syndrome/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const mode = (query.mode === 'advanced' ? 'advanced' : 'basic') as SyndromeMode
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const keyword = typeof query.keyword === 'string' ? query.keyword : ''
      const courseId = typeof query.courseId === 'string' ? query.courseId : ''
      return listSyndromeQuestions({ mode, page, pageSize, keyword, courseId })
    },
  },
  {
    url: '/api/quiz/syndrome/create',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const mode = (body.mode === 'advanced' ? 'advanced' : 'basic') as SyndromeMode
      const id = `${mode === 'basic' ? 'SQB' : 'SQA'}_${String(Date.now()).slice(-6)}`
      const stemHtml = String(body.stemHtml ?? '')
      const stemText = stripHtml(stemHtml)
      const symptomTags = Array.isArray(body.symptomTags) ? body.symptomTags.map((t) => String(t)) : []
      const standardAnswer = String(body.standardAnswer ?? '')
      const courseId = String(body.courseId ?? '')
      const aiTemplate = String(body.aiTemplate ?? '')

      const item: SyndromeQuestion = {
        id,
        mode,
        stemHtml,
        stemText,
        symptomTags,
        standardAnswer,
        courseId,
        aiTemplate,
      }
      syndromeQuestions[mode] = [item, ...(syndromeQuestions[mode] ?? [])]
      return { id }
    },
  },
  {
    url: '/api/quiz/syndrome/import',
    method: 'post',
    response: ({ body }: { body: Record<string, any> }) => {
      const mode = (body.mode === 'advanced' ? 'advanced' : 'basic') as SyndromeMode
      const items: any[] = Array.isArray(body.items) ? body.items : []
      const createdItems: SyndromeQuestion[] = items
        .map((it, idx) => {
          const stemText = String(it.stemText ?? '').trim()
          const symptomTags = Array.isArray(it.symptomTags) ? it.symptomTags.map((t: any) => String(t)) : []
          const standardAnswer = String(it.standardAnswer ?? '').trim()
          const courseId = String(it.courseId ?? '').trim()
          const aiTemplate = String(it.aiTemplate ?? '')
          if (!stemText || !standardAnswer || !courseId) return null
          const id = `${mode === 'basic' ? 'SQB' : 'SQA'}_${String(Date.now() + idx).slice(-6)}`
          return {
            id,
            mode,
            stemHtml: `<p>${escapeHtml(stemText)}</p>`,
            stemText,
            symptomTags,
            standardAnswer,
            courseId,
            aiTemplate,
          } satisfies SyndromeQuestion
        })
        .filter(Boolean) as SyndromeQuestion[]

      syndromeQuestions[mode] = [...createdItems, ...(syndromeQuestions[mode] ?? [])]
      return { ok: true, created: createdItems.length }
    },
  },
  {
    url: '/api/upload',
    method: 'post',
    response: () => {
      return { url: seedCover(String(Date.now())) }
    },
  },
]

export default mocks
