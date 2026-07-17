import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export function getRoleList(params?: Record<string, unknown>) {
  return request.get<any, ApiResponse<{ list: Record<string, unknown>[]; total: number }>>('/admin/role/list', { params })
}

export function getAllRoles() {
  return request.get<any, ApiResponse<Record<string, unknown>[]>>('/admin/role/all')
}

export function createRole(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/role/create', data)
}

export function updateRole(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/role/update', data)
}

export function deleteRole(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/role/delete', { id })
}

export function getRolePermissionIds(id: number) {
  return request.get<any, ApiResponse<number[]>>('/admin/role/permission-ids', { params: { id } })
}

export function bindRolePermissions(id: number, permissionIds: number[]) {
  return request.post<any, ApiResponse<null>>('/admin/role/bind-permissions', { id, permission_ids: permissionIds })
}

export const roleExportUrl = '/admin/role/export'
export const roleImportUrl = '/admin/role/import'
