import type { App } from 'vue'
import { useUserStore } from '@/stores/user'

function checkPermission(code: string): boolean {
  const store = useUserStore()
  return store.permissions.includes(code)
}

export default function setupPermission(app: App) {
  app.directive('permission', {
    mounted(el, binding) {
      if (!checkPermission(binding.value)) {
        el.parentNode?.removeChild(el)
      }
    },
  })
}
