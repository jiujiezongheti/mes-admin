import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  title: string
  componentName: string
  affix: boolean
}

const TAB_KEY = 'mes-tabs'

function loadTabs(): TabItem[] {
  try {
    return JSON.parse(localStorage.getItem(TAB_KEY) || '[]')
  } catch {
    return []
  }
}

function saveTabs(tabs: TabItem[]) {
  localStorage.setItem(TAB_KEY, JSON.stringify(tabs))
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>(loadTabs())
  const activePath = ref('')

  const tabList = computed(() => tabs.value)

  const tabComponentNames = computed(() =>
    tabs.value.map(t => t.componentName)
  )

  function isOpen(path: string): boolean {
    return tabs.value.some(t => t.path === path)
  }

  function addTab(route: RouteLocationNormalized) {
    const path = route.path
    if (!isOpen(path)) {
      tabs.value.push({
        path,
        title: (route.meta?.title as string) || (route.name as string) || '',
        componentName: (route.meta?.componentName as string) || '',
        affix: route.meta?.affix === true,
      })
      saveTabs(tabs.value)
    }
    activePath.value = path
  }

  function removeTab(path: string): string | null {
    const idx = tabs.value.findIndex(t => t.path === path)
    if (idx === -1) return null
    if (tabs.value[idx].affix) return null

    tabs.value.splice(idx, 1)
    saveTabs(tabs.value)

    if (activePath.value === path) {
      if (tabs.value.length === 0) return null
      return tabs.value[Math.min(idx, tabs.value.length - 1)].path
    }
    return null
  }

  function setActivePath(path: string) {
    activePath.value = path
  }

  return { tabs, activePath, tabList, tabComponentNames, isOpen, addTab, removeTab, setActivePath }
})
