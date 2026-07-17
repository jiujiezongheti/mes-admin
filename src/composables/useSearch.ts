import { ref, computed, watch } from 'vue'

export interface SearchField {
  key: string
  label: string
  type: 'input' | 'select'
  options?: { label: string; value: unknown }[]
}

const MAX_PINS = 3
const STORAGE_PREFIX = 'search_pins_'

export function useSearch(key: string, fields: SearchField[]) {
  const storageKey = STORAGE_PREFIX + key

  function loadPins(): string[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        return parsed.filter((k) => fields.some((f) => f.key === k)).slice(0, MAX_PINS)
      }
    } catch {}
    return fields.slice(0, MAX_PINS).map((f) => f.key)
  }

  const pinnedKeys = ref<string[]>(loadPins())

  watch(pinnedKeys, (val) => {
    localStorage.setItem(storageKey, JSON.stringify(val))
  }, { deep: true })

  const pinnedFields = computed(() =>
    fields
      .filter((f) => pinnedKeys.value.includes(f.key))
      .sort((a, b) => pinnedKeys.value.indexOf(a.key) - pinnedKeys.value.indexOf(b.key))
  )

  const unpinnedFields = computed(() =>
    fields.filter((f) => !pinnedKeys.value.includes(f.key))
  )

  function isPinned(key: string) {
    return pinnedKeys.value.includes(key)
  }

  function pin(key: string) {
    if (isPinned(key)) return
    if (pinnedKeys.value.length >= MAX_PINS) {
      return 'max' // caller should handle replacement dialog
    }
    pinnedKeys.value.push(key)
  }

  function replace(oldKey: string, newKey: string) {
    const idx = pinnedKeys.value.indexOf(oldKey)
    if (idx === -1) return
    pinnedKeys.value[idx] = newKey
  }

  function unpin(key: string) {
    pinnedKeys.value = pinnedKeys.value.filter((k) => k !== key)
  }

  function reorder(keys: string[]) {
    pinnedKeys.value = keys
  }

  function resetPins() {
    pinnedKeys.value = fields.slice(0, MAX_PINS).map((f) => f.key)
  }

  return {
    pinnedKeys,
    pinnedFields,
    unpinnedFields,
    isPinned,
    pin,
    replace,
    unpin,
    reorder,
    resetPins,
    fields,
  }
}
