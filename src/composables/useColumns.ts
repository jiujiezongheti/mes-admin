import { ref, watch } from 'vue'

export interface ColumnDef {
  prop: string
  label: string
  visible: boolean
  width?: number | string
  fixed?: 'left' | 'right'
  sort?: number
}

const STORAGE_PREFIX = 'columns_'

export function useColumns(key: string, defaults: ColumnDef[]) {
  const storageKey = STORAGE_PREFIX + key

  function load(): ColumnDef[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw)
    } catch {}
    return defaults.map((c, i) => ({ ...c, sort: i, visible: true }))
  }

  const columns = ref<ColumnDef[]>(load())

  watch(columns, (val) => {
    localStorage.setItem(storageKey, JSON.stringify(val))
  }, { deep: true })

  function reset() {
    columns.value = defaults.map((c, i) => ({ ...c, sort: i, visible: true }))
  }

  const visibleColumns = ref()

  watch(columns, (val) => {
    visibleColumns.value = val
      .filter((c) => c.visible)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
  }, { immediate: true, deep: true })

  return { columns, visibleColumns, reset }
}
