import { computed, ref } from 'vue'

export type RoleKey = 'super_admin' | 'content_editor' | 'ops_cs' | 'read_analyst'

export type PermissionKey =
  | 'content:course:edit'
  | 'content:graph:edit'
  | 'content:quiz:edit'
  | 'ops:homepage:edit'
  | 'ops:push:create'
  | 'insight:review:push'
  | 'insight:ai:prompt_fix'
  | 'insight:search:map_keywords'

const STORAGE_KEY = 'xyzy_role'

const role = ref<RoleKey>((localStorage.getItem(STORAGE_KEY) as RoleKey) || 'super_admin')

export const roleLabelMap: Record<RoleKey, string> = {
  super_admin: '超级管理员',
  content_editor: '内容编辑',
  ops_cs: '运营客服',
  read_analyst: '只读分析员',
}

const permissionsByRole: Record<RoleKey, PermissionKey[]> = {
  super_admin: [
    'content:course:edit',
    'content:graph:edit',
    'content:quiz:edit',
    'ops:homepage:edit',
    'ops:push:create',
    'insight:review:push',
    'insight:ai:prompt_fix',
    'insight:search:map_keywords',
  ],
  content_editor: ['content:course:edit', 'content:graph:edit', 'content:quiz:edit', 'insight:search:map_keywords'],
  ops_cs: ['ops:homepage:edit', 'ops:push:create', 'insight:review:push', 'insight:ai:prompt_fix'],
  read_analyst: [],
}

export function getRole() {
  return role.value
}

export function setRole(next: RoleKey) {
  role.value = next
  localStorage.setItem(STORAGE_KEY, next)
}

export function canAccessRoles(allowedRoles?: RoleKey[]) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.includes(role.value)
}

export function hasPermission(perm: PermissionKey) {
  return permissionsByRole[role.value]?.includes(perm) ?? false
}

export function useAccess() {
  return {
    role,
    roleLabel: computed(() => roleLabelMap[role.value]),
    hasPermission,
    canAccessRoles,
    setRole,
  }
}

