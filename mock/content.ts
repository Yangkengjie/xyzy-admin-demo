import type { MockMethod } from 'vite-plugin-mock'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function makeList(total: number) {
  const categories = ['基础理论', '临床技能', '病例解析', '题库', '指南']
  const statuses: Array<'draft' | 'published' | 'archived'> = ['published', 'draft', 'archived']

  return Array.from({ length: total }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (i % 14))
    date.setMinutes(date.getMinutes() - (i % 60))
    return {
      id: `C${String(i + 1).padStart(5, '0')}`,
      title: `内容标题 ${i + 1}`,
      category: categories[i % categories.length],
      status: statuses[i % statuses.length],
      updatedAt: formatDate(date),
    }
  })
}

const mocks: MockMethod[] = [
  {
    url: '/api/content/list',
    method: 'get',
    response: ({ query }: { query: Record<string, any> }) => {
      const total = 57
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 10))
      const all = makeList(total)
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return { total, list: all.slice(start, end) }
    },
  },
] 

export default mocks
