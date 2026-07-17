import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')

  function loadUserInfo(): Record<string, unknown> | null {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || 'null')
    } catch {
      return null
    }
  }
  const userInfo = ref<Record<string, unknown> | null>(loadUserInfo())

  function loadPermissions(): string[] {
    try {
      return JSON.parse(localStorage.getItem('permissions') || '[]')
    } catch {
      return []
    }
  }
  const permissions = ref<string[]>(loadPermissions())

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function setUserInfo(val: Record<string, unknown>) {
    userInfo.value = val
    localStorage.setItem('userInfo', JSON.stringify(val))
  }

  function setPermissions(val: string[]) {
    permissions.value = val
    localStorage.setItem('permissions', JSON.stringify(val))
  }

  function hasPerm(code: string): boolean {
    return permissions.value.includes(code)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('permissions')
  }

  return { token, userInfo, permissions, setToken, setUserInfo, setPermissions, hasPerm, logout }
})
