import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export function getUnitList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/unit/list', { params })
}

export function getAllUnits() {
  return request.get<any, ApiResponse<Record<string, unknown>[]>>('/admin/unit/all')
}

export function createUnit(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/unit/create', data)
}

export function updateUnit(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/unit/update', data)
}

export function deleteUnit(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/unit/delete', { id })
}

export const unitExportUrl = '/admin/unit/export'
export const unitImportUrl = '/admin/unit/import'
