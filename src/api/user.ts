import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export function getUserList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/user/list', { params })
}

export function createUser(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/user/create', data)
}

export function updateUser(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/user/update', data)
}

export function deleteUser(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/user/delete', { id })
}

export const userExportUrl = '/admin/user/export'
export const userImportUrl = '/admin/user/import'
