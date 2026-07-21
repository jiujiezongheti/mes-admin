<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: 'admin',
  password: 'admin123',
})

const loading = ref(false)

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const formRef = ref()

const loginRef = ref<HTMLElement>()
const glowX = ref(50)
const glowY = ref(50)
let idleAngle = 0
let isIdle = false
let mouseTimer: ReturnType<typeof setTimeout> | null = null
let rafId = 0

function onMouseMove(e: MouseEvent) {
  if (!loginRef.value) return
  const rect = loginRef.value.getBoundingClientRect()
  glowX.value = ((e.clientX - rect.left) / rect.width) * 100
  glowY.value = ((e.clientY - rect.top) / rect.height) * 100
  isIdle = false

  if (mouseTimer) clearTimeout(mouseTimer)
  mouseTimer = setTimeout(() => {
    isIdle = true
  }, 2000)
}

function animate() {
  if (isIdle) {
    idleAngle += 0.003
    glowX.value = 50 + Math.sin(idleAngle) * 25
    glowY.value = 50 + Math.cos(idleAngle * 0.7) * 15
  }

  if (loginRef.value) {
    loginRef.value.style.setProperty('--gx', String(glowX.value))
    loginRef.value.style.setProperty('--gy', String(glowY.value))
  }

  rafId = requestAnimationFrame(animate)
}

onMounted(() => {
  rafId = requestAnimationFrame(animate)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login(form)
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.userInfo as any)
    userStore.setPermissions(res.data.permissions as string[])
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e: any) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div ref="loginRef" class="login" @mousemove="onMouseMove">
    <div class="login-grid" />
    <svg class="login-curves" viewBox="0 0 120 100" preserveAspectRatio="none">
      <path class="cv cv--1" d="M -10 22 C 30 18, 40 26, 130 22" />
      <path class="cv cv--2" d="M -10 50 C 30 46, 40 54, 130 50" />
      <path class="cv cv--3" d="M -10 78 C 30 74, 40 82, 130 78" />
    </svg>
    <div class="login-glow" />
    <div class="login-card">
      <h2 class="login-title">MES系统</h2>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0b1424;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.login-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(color-mix(in srgb, var(--el-color-primary) 3%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 3%, transparent) 1px, transparent 1px);
  background-size: 60px 60px;
  z-index: 1;
}
.login-curves {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}
.login-curves .cv {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-linecap: round;
}
.login-curves .cv--1 { stroke-width: 0.1; opacity: 0.08; }
.login-curves .cv--2 { stroke-width: 0.1; opacity: 0.08; }
.login-curves .cv--3 { stroke-width: 0.1; opacity: 0.06; }
.login-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}
.login-glow::before {
  content: '';
  position: absolute;
  border-radius: 50%;
  top: calc(var(--gy, 50) * 1% - 20vh);
  left: calc(var(--gx, 50) * 1% - 20vh);
  width: 40vh;
  height: 40vh;
  background: radial-gradient(circle, color-mix(in srgb, var(--el-color-primary) 6%, transparent) 0%, transparent 60%);
  filter: blur(80px);
}
.login-card {
  position: relative;
  z-index: 4;
  width: 400px;
  padding: 48px 40px 40px;
  background: rgba(255, 255, 255, 0.27);
  border-radius: 12px;
  box-shadow:
    0 0 40px color-mix(in srgb, var(--el-color-primary) 15%, transparent),
    0 8px 32px rgba(0, 0, 0, 0.2);
}
.login-title {
  margin: 0 0 36px;
  font-size: 24px;
  font-weight: 600;
  color: var(--sidebar-bg);
  text-align: center;
  letter-spacing: 2px;
}
</style>
