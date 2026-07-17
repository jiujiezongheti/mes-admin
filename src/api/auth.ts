import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

interface LoginData {
  token: string
  userInfo: Record<string, unknown>
  permissions: string[]
}

export function login(data: { username: string; password: string }) {
  return request.post<any, ApiResponse<LoginData>>('/admin/auth/login', data)
}

export function refreshToken() {
  return request.post<any, ApiResponse<LoginData>>('/admin/auth/refresh')
}

export function getUserInfo() {
  return request.get<any, ApiResponse<Record<string, unknown>>>('/admin/auth/me')
}

export function updatePassword(data: { old_password: string; new_password: string }) {
  return request.post<any, ApiResponse<null>>('/admin/auth/password', data)
}
