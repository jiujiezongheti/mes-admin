import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/styles/theme.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import setupPermission from '@/directives/permission'
import { useTabsStore } from '@/stores/tabs'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.use(createPinia())

setupPermission(app)

import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
themeStore.initTheme()

router.afterEach((to) => {
  if (to.name && to.name !== 'Login') {
    const tabsStore = useTabsStore()
    tabsStore.addTab(to)
  }
})

app.mount('#app')
