<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTabsStore } from '@/stores/tabs'
import { Close } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()

const scrollRef = ref<HTMLElement>()

function switchTab(path: string) {
  if (path !== route.path) {
    router.push(path)
  }
}

function closeTab(path: string) {
  const targetPath = tabsStore.removeTab(path)
  if (targetPath) {
    router.push(targetPath)
  }
}

function handleWheel(e: WheelEvent) {
  if (scrollRef.value) {
    scrollRef.value.scrollLeft += e.deltaY
  }
}
</script>

<template>
  <div class="tabs-bar" v-if="tabsStore.tabs.length > 0">
    <div class="tabs-bar__scroll" ref="scrollRef" @wheel.prevent="handleWheel">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        class="tabs-bar__item"
        :class="{ 'is-active': tab.path === route.path }"
        @click="switchTab(tab.path)"
      >
        <span class="tabs-bar__label">{{ tab.title }}</span>
        <el-icon
          v-if="!tab.affix"
          class="tabs-bar__close"
          @click.stop="closeTab(tab.path)"
        >
          <Close />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs-bar {
  background: var(--header-bg);
  border-bottom: 1px solid var(--tabs-border);
  user-select: none;
}
.tabs-bar__scroll {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;
}
.tabs-bar__scroll::-webkit-scrollbar {
  display: none;
}
.tabs-bar__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  flex-shrink: 0;
  transition: color 0.2s, border-color 0.2s;
}
.tabs-bar__item:hover {
  color: #333;
}
.tabs-bar__item.is-active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}
.tabs-bar__label {
  line-height: 1;
}
.tabs-bar__close {
  font-size: 12px;
  color: #999;
  border-radius: 2px;
  padding: 1px;
  transition: color 0.2s, background 0.2s;
}
.tabs-bar__close:hover {
  color: #fff;
  background: #c0c4cc;
}
</style>
