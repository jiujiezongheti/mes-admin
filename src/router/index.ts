import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/system/Login.vue'),
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: '工作台',
        meta: { title: '工作台', componentName: 'DashboardIndex', affix: true },
        component: () => import('@/views/dashboard/Index.vue'),
      },
      {
        path: 'system/user',
        name: '用户管理',
        meta: { title: '用户管理', componentName: 'UserList' },
        component: () => import('@/views/system/UserList.vue'),
      },
      {
        path: 'system/role',
        name: '角色管理',
        meta: { title: '角色管理', componentName: 'RoleList' },
        component: () => import('@/views/system/RoleList.vue'),
      },
      {
        path: 'material/list',
        name: '物料档案',
        meta: { title: '物料档案', componentName: 'MaterialList' },
        component: () => import('@/views/material/List.vue'),
      },
      {
        path: 'material/category',
        name: '物料分类',
        meta: { title: '物料分类', componentName: 'MaterialCategory' },
        component: () => import('@/views/material/Category.vue'),
      },
      {
        path: 'material/unit',
        name: '计量单位',
        meta: { title: '计量单位', componentName: 'UnitList' },
        component: () => import('@/views/material/Unit.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) {
    return { name: 'Login' }
  }
})

export default router
