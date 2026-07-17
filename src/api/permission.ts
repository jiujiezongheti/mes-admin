import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

export function getPermissionTree() {
  return request.get<any, ApiResponse<Record<string, unknown>[]>>('/admin/permission/tree')
}

export function getAllPermissions() {
  return request.get<any, ApiResponse<Record<string, unknown>[]>>('/admin/permission/all')
}
