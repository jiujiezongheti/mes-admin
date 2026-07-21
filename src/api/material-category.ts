import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export function getCategoryList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/material/category/list', { params })
}

export function getCategoryTree() {
  return request.get<any, ApiResponse<Record<string, unknown>[]>>('/admin/material/category/tree')
}

export function getAllCategories() {
  return request.get<any, ApiResponse<Record<string, unknown>[]>>('/admin/material/category/all')
}

export function createCategory(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/material/category/create', data)
}

export function updateCategory(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/material/category/update', data)
}

export function deleteCategory(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/material/category/delete', { id })
}

export const categoryExportUrl = '/admin/material/category/export'
export const categoryImportUrl = '/admin/material/category/import'
