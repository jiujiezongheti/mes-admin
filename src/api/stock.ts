import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

// ===== 仓库 =====
export function getWarehouseList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/warehouse/list', { params })
}

export function getAllWarehouses() {
  return request.get<any, ApiResponse<any[]>>('/admin/warehouse/all')
}

export function createWarehouse(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/warehouse/create', data)
}

export function updateWarehouse(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/warehouse/update', data)
}

export function deleteWarehouse(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/warehouse/delete', { id })
}

// ===== 库存台账 =====
export function getInventoryList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/stock/inventory-list', { params })
}

export function stockIn(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/stock/in', data)
}

export function stockOut(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/stock/out', data)
}

// ===== 库存流水 =====
export function getStockRecordList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/stock/record-list', { params })
}

// ===== 盘点 =====
export function getCheckList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/stock/check/list', { params })
}

export function createCheck(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/stock/check/create', data)
}

export function getCheckItems(id: number) {
  return request.get<any, ApiResponse<any>>('/admin/stock/check/items', { params: { id } })
}

export function completeCheck(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/stock/check/complete', data)
}

// ===== 盘点任务（移动端盲盘） =====
export function getCheckTaskList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/check-task/list', { params })
}

export function getCheckTaskDetail(id: number) {
  return request.get<any, ApiResponse<any>>('/admin/check-task/detail', { params: { id } })
}

export function approveCheckTask(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/check-task/approve', { id })
}

export function rejectCheckTask(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/check-task/reject', { id })
}

export function createCheckTask(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/check-task/create', data)
}
