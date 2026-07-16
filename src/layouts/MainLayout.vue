<script setup lang="ts">
import { ElContainer, ElAside, ElHeader, ElMain } from 'element-plus'
</script>

<template>
  <ElContainer style="height: 100vh">
    <ElAside width="220px">
      <div class="logo">MES</div>
    </ElAside>
    <ElContainer>
      <ElHeader>header</ElHeader>
      <ElMain>
        <router-view />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}
</style>
