<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { SearchField } from '@/composables/useSearch'
import { Search, StarFilled, Star, Rank, Filter } from '@element-plus/icons-vue'

const props = defineProps<{
  fields: SearchField[]
  pinnedFields: SearchField[]
  unpinnedFields: SearchField[]
  isPinned: (key: string) => boolean
  currentForm: Record<string, unknown>
}>()

const emit = defineEmits<{
  pin: [key: string]
  unpin: [key: string]
  replace: [oldKey: string, newKey: string]
  reorder: [keys: string[]]
  search: [form: Record<string, unknown>]
  reset: []
}>()

const dialogVisible = ref(false)
const dragIndex = ref<number | null>(null)

const form = reactive<Record<string, unknown>>({})
const replaceDialogVisible = ref(false)
const pendingPinKey = ref('')

function open(formData?: Record<string, unknown>) {
  const source = formData ?? props.currentForm
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, JSON.parse(JSON.stringify(source ?? {})))
  dialogVisible.value = true
}

function handleSearch() {
  emit('search', { ...form })
  dialogVisible.value = false
}

function handleReset() {
  Object.keys(form).forEach((k) => delete form[k])
  emit('reset')
  dialogVisible.value = false
}

function handlePin(key: string) {
  if (props.isPinned(key)) {
    emit('unpin', key)
  } else {
    if (props.pinnedFields.length >= 3) {
      pendingPinKey.value = key
      replaceDialogVisible.value = true
    } else {
      emit('pin', key)
    }
  }
}

function handleReplace(oldKey: string) {
  emit('replace', oldKey, pendingPinKey.value)
  replaceDialogVisible.value = false
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  const keys = props.pinnedFields.map((f) => f.key)
  const [moved] = keys.splice(dragIndex.value, 1)
  keys.splice(index, 0, moved)
  emit('reorder', keys)
  dragIndex.value = index
}

function onDragEnd() {
  dragIndex.value = null
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="dialogVisible" title="更多筛选" width="600px" append-to-body :close-on-click-modal="false">
    <div class="search-dialog-body">
      <div class="section">
        <div class="section-title">
          <el-icon><StarFilled /></el-icon> 常用搜索
          <span class="section-desc">（最多 3 个，拖拽排序）</span>
        </div>
        <div class="pinned-list">
          <div
            v-for="(f, i) in pinnedFields"
            :key="f.key"
            class="pinned-item"
            draggable="true"
            @dragstart="onDragStart(i)"
            @dragover="onDragOver($event, i)"
            @dragend="onDragEnd"
          >
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="field-label">{{ f.label }}</span>
            <el-input
              v-if="f.type === 'input'"
              v-model="form[f.key]"
              :placeholder="f.label"
              clearable
              size="small"
            />
            <el-select
              v-else
              v-model="form[f.key]"
              :placeholder="f.label"
              clearable
              size="small"
              style="width:130px"
            >
              <el-option v-for="opt in (f.options || [])" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-button text size="small" type="warning" @click="handlePin(f.key)">
              <el-icon><StarFilled /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">
          <el-icon><Star /></el-icon> 其他字段
        </div>
        <div class="unpinned-list">
          <div
            v-for="f in unpinnedFields"
            :key="f.key"
            class="unpinned-item"
          >
            <span class="field-label">{{ f.label }}</span>
            <el-input
              v-if="f.type === 'input'"
              v-model="form[f.key]"
              :placeholder="f.label"
              clearable
              size="small"
            />
            <el-select
              v-else
              v-model="form[f.key]"
              :placeholder="f.label"
              clearable
              size="small"
              style="width:130px"
            >
              <el-option v-for="opt in (f.options || [])" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-button text size="small" type="default" @click="handlePin(f.key)">
              <el-icon><Star /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button text @click="handleReset">重置并关闭</el-button>
      <el-button text type="primary" :icon="Filter" @click="handleSearch">筛选</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="replaceDialogVisible" title="替换常用搜索" width="400px" append-to-body :close-on-click-modal="false">
    <p style="margin-bottom:12px">常用搜索已达上限（3 个），请选择一个替换：</p>
    <div class="replace-list">
      <el-button
        text
        v-for="f in pinnedFields"
        :key="f.key"
        class="replace-item"
        @click="handleReplace(f.key)"
      >
        <el-icon><StarFilled /></el-icon> {{ f.label }}
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.search-dialog-body {
  max-height: 500px;
  overflow-y: auto;
}
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}
.section-desc {
  font-weight: 400;
  font-size: 12px;
  color: #999;
}
.pinned-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pinned-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 6px;
  cursor: grab;
}
.pinned-item:active {
  cursor: grabbing;
}
.drag-handle {
  color: #999;
  cursor: grab;
  flex-shrink: 0;
}
.field-label {
  font-size: 13px;
  white-space: nowrap;
  width: 70px;
  flex-shrink: 0;
}
.unpinned-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.unpinned-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--main-bg);
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}
.replace-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.replace-item {
  justify-content: flex-start;
  margin-left: 0 !important;
}
</style>
