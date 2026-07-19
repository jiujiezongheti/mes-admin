<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Expand, Fold, Odometer, UserFilled, Setting, User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTabsStore } from '@/stores/tabs'
import TabsBar from '@/components/TabsBar.vue'
import ThemeSwitch from '@/components/ThemeSwitch.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const tabsStore = useTabsStore()

const sidebarCollapsed = ref(false)

interface SubMenuItem {
  path: string
  label: string
  perm?: string
}

interface MenuGroup {
  label: string
  icon: any
  perm?: string
  children: SubMenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    label: '工作台',
    icon: Odometer,
    children: [{ path: '/dashboard', label: '工作台' }],
  },
  {
    label: '系统管理',
    icon: Setting,
    children: [
      { path: '/system/user', label: '用户管理', perm: 'admin:user:list' },
      { path: '/system/role', label: '角色管理', perm: 'admin:role:list' },
    ],
  },
]

const filteredMenuGroups = computed(() =>
  menuGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((child) => !child.perm || userStore.hasPerm(child.perm)),
    }))
    .filter((group) => group.children.length > 0)
)

const activeMenu = computed(() => route.path)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function handleLogout() {
  ElMessageBox.confirm('确定退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
}
</script>

<template>
  <el-container class="layout">
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="sidebar-logo" @click="router.push('/dashboard')">
        <div class="logo-icon">M</div>
        <span v-show="!sidebarCollapsed" class="logo-text">MES 系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :router="true"
        class="sidebar-menu"
        background-color="var(--sidebar-bg)"
        text-color="var(--sidebar-text)"
        active-text-color="var(--el-color-primary)"
      >
        <template v-for="group in filteredMenuGroups" :key="group.label">
          <el-menu-item v-if="group.children.length === 1" :index="group.children[0].path">
            <el-icon><component :is="group.icon" /></el-icon>
            <template #title>{{ group.children[0].label }}</template>
          </el-menu-item>
          <el-sub-menu v-else :index="group.label">
            <template #title>
              <el-icon><component :is="group.icon" /></el-icon>
              <span>{{ group.label }}</span>
            </template>
            <el-menu-item v-for="child in group.children" :key="child.path" :index="child.path">
              {{ child.label }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button class="toggle-btn" text @click="toggleSidebar">
            <el-icon :size="20">
              <Expand v-if="sidebarCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>
          <span class="header-breadcrumb">{{ route.meta?.title as string || (route.name as string) }}</span>
        </div>
        <div class="header-right">
          <ThemeSwitch />
          <el-dropdown trigger="click" @command="handleLogout">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <TabsBar />
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <keep-alive :include="tabsStore.tabComponentNames">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100vh;
}
.sidebar {
  background-color: var(--sidebar-bg);
  transition: width 0.3s;
  overflow: hidden;
}
.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.logo-icon {
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}
.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}
.sidebar-menu {
  border-right: none;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  padding: 0 20px;
  height: 60px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.toggle-btn {
  color: #666;
  font-size: 18px;
}
.toggle-btn:hover {
  color: var(--el-color-primary);
}
.header-breadcrumb {
  font-size: 16px;
  color: #333;
}
.header-right {
  display: flex;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: #333;
}
.main {
  background: var(--main-bg);
  padding: 20px;
  overflow-y: auto;
  min-width: 1250px;
}
</style>
