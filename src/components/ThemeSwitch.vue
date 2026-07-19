<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { Brush } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
</script>

<template>
  <el-dropdown trigger="click" @command="themeStore.setTheme">
    <el-button text>
      <el-icon :size="18"><Brush /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="theme in themeStore.themes"
          :key="theme.key"
          :command="theme.key"
        >
          <span class="theme-dot" :class="theme.key" />
          {{ theme.name }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.theme-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}
.theme-dot.blue {
  background: #409eff;
}
.theme-dot.green {
  background: #67c23a;
}
.theme-dot.orange {
  background: #e6a23c;
}
.theme-dot.purple {
  background: #722ed1;
}
</style>
