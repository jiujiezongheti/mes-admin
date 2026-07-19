import { defineStore } from 'pinia'
import { ref } from 'vue'
import { themes, DEFAULT_THEME, getTheme } from '@/config/themes'

const THEME_KEY = 'mes-theme'

function loadTheme(): string {
  return localStorage.getItem(THEME_KEY) || DEFAULT_THEME
}

function applyTheme(key: string) {
  const theme = getTheme(key)
  const html = document.documentElement
  html.dataset.theme = key
  for (const [name, value] of Object.entries(theme.colors)) {
    html.style.setProperty(name, value)
  }
  localStorage.setItem(THEME_KEY, key)
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref(loadTheme())

  function initTheme() {
    applyTheme(currentTheme.value)
  }

  function setTheme(key: string) {
    currentTheme.value = key
    applyTheme(key)
  }

  return { currentTheme, themes, initTheme, setTheme }
})
