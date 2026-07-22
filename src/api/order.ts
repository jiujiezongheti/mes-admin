import request from '@/utils/request'
import type { ApiResponse, PageResult } from '@/types/api'

export function getOrderList(params: Record<string, unknown>) {
  return request.get<any, ApiResponse<PageResult<Record<string, unknown>>>>('/admin/production/order/list', { params })
}

export function getOrderDetail(id: number) {
  return request.get<any, ApiResponse<Record<string, unknown>>>('/admin/production/order/detail', { params: { id } })
}

export function createOrder(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/production/order/create', data)
}

export function updateOrder(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/production/order/update', data)
}

export function deleteOrder(id: number) {
  return request.post<any, ApiResponse<null>>('/admin/production/order/delete', { id })
}

export function setOrderStatus(data: Record<string, unknown>) {
  return request.post<any, ApiResponse<null>>('/admin/production/order/status', data)
}

export function getMaterialsByBom(bomId: number, quantity: number) {
  return request.get<any, ApiResponse<any[]>>('/admin/production/order/materials-by-bom', { params: { bom_id: bomId, quantity } })
}
