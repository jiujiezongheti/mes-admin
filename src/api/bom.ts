import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export function getBomList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/production/bom/list', { params })
}

export function getBomDetail(id: number) {
  return request.get<any, ApiResponse<Record<string, unknown>>>('/admin/production/bom/detail', { params: { id } })
}

export function createBom(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/production/bom/create', data)
}

export function updateBom(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/production/bom/update', data)
}

export function deleteBom(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/production/bom/delete', { id })
}

export function getBomTree(id: number) {
  return request.get<any, ApiResponse<Record<string, unknown>>>('/admin/production/bom/tree', { params: { id } })
}

export function getWhereUsed(materialId: number) {
  return request.get<any, ApiResponse<any[]>>('/admin/production/bom/where-used', { params: { material_id: materialId } })
}

export function copyBom(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/production/bom/copy', data)
}

export const bomExportUrl = '/admin/production/bom/export'
export const bomImportUrl = '/admin/production/bom/import'
