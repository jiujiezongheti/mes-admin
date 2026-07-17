<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPermissionTree } from '@/api/permission'

const treeData = ref<any[]>([])
const loading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const res = await getPermissionTree()
    treeData.value = res.data as any[]
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="perm-list">
    <el-card>
      <div class="table-header">
        <span class="table-title">权限列表</span>
      </div>
      <el-table :data="treeData" v-loading="loading" stripe row-key="id" default-expand-all border>
        <el-table-column prop="name" label="权限名称" width="200" />
        <el-table-column prop="code" label="权限标识" width="250" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'dir'" size="small">目录</el-tag>
            <el-tag v-else-if="row.type === 'menu'" type="success" size="small">菜单</el-tag>
            <el-tag v-else type="warning" size="small">按钮</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.table-header {
  margin-bottom: 16px;
}
.table-title {
  font-size: 16px;
  font-weight: 600;
}
</style>
