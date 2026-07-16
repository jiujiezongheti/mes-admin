import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<{ username: string; avatar: string } | null>(null)

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, setToken, logout }
})
