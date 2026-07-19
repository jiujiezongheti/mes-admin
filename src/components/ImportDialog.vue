<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  title?: string
  action: string
  template?: { label: string; prop: string }[]
}>()

const emit = defineEmits<{
  success: [result: { imported: number; errors: string[] }]
}>()

const dialogVisible = ref(false)
const uploading = ref(false)
const result = ref<{ imported: number; errors: string[] } | null>(null)

function open() {
  result.value = null
  dialogVisible.value = true
}

function handleClose() {
  if (result.value) {
    emit('success', result.value)
  }
  dialogVisible.value = false
}

async function handleUpload(rawFile: File) {
  const formData = new FormData()
  formData.append('file', rawFile)

  uploading.value = true
  try {
    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    const res = await fetch(`${baseUrl}${props.action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    const json = await res.json()
    if (json.code === 0) {
      result.value = json.data as { imported: number; errors: string[] }
      ElMessage.success(`导入成功 ${json.data.imported} 条`)
    } else {
      ElMessage.error(json.message || '导入失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    uploading.value = false
  }

  return false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="title || '导入'" width="500px" @close="handleClose" :close-on-click-modal="false">
    <template v-if="!result">
      <el-alert v-if="template" :title="`请下载模板填写后上传`" type="info" :closable="false" style="margin-bottom:16px" />
      <el-upload
        drag
        :auto-upload="false"
        :show-file-list="false"
        :on-change="(e: any) => handleUpload(e.raw)"
        accept=".xlsx,.xls"
      >
        <el-icon :size="40" color="var(--el-color-primary)"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 .xlsx 文件</div>
        </template>
      </el-upload>
    </template>
    <template v-else>
      <el-result icon="success" title="导入完成">
        <template #sub-title>
          <p>成功导入 {{ result.imported }} 条数据</p>
          <p v-if="result.errors.length" style="color:#e6a23c">
            {{ result.errors.length }} 条失败：
          </p>
          <div v-for="(err, i) in result.errors" :key="i" style="font-size:12px;color:#999">{{ err }}</div>
        </template>
      </el-result>
    </template>
  </el-dialog>
</template>
