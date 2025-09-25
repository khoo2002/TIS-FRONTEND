import type { UserInfo } from './auth'

// Define application permissions and a simple role-to-permissions map.
export type Permission = 'manageUsers' | 'hardRefreshView' | 'ADMIN_FUNCTIONS'

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['manageUsers', 'hardRefreshView', 'ADMIN_FUNCTIONS'],
}

export function hasRole(user: UserInfo | undefined, role: string): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false
  return user.roles.some((r) => r.toLowerCase() === role.toLowerCase())
}

export function hasPermission(user: UserInfo | undefined, perm: Permission): boolean {
  if (!user || !user.roles) return false
  const perms = new Set<Permission>()
  for (const role of user.roles) {
    const list = ROLE_PERMISSIONS[role.toLowerCase()]
    if (list) list.forEach((p) => perms.add(p))
  }
  return perms.has(perm)
}
