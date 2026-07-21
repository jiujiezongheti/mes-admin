import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export function getMaterialList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/material/list', { params })
}

export function getMaterialDetail(id: number) {
  return request.get<any, ApiResponse<Record<string, unknown>>>('/admin/material/detail', { params: { id } })
}

export function createMaterial(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/material/create', data)
}

export function updateMaterial(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/material/update', data)
}

export function deleteMaterial(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/material/delete', { id })
}

export const materialExportUrl = '/admin/material/export'
export const materialImportUrl = '/admin/material/import'
