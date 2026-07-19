<script setup lang="ts">
import { ref } from 'vue'
import type { ColumnDef } from '@/composables/useColumns'
import { Setting } from '@element-plus/icons-vue'

const props = defineProps<{
  columns: ColumnDef[]
}>()

const emit = defineEmits<{
  save: [columns: ColumnDef[]]
  reset: []
}>()

const dialogVisible = ref(false)
const localColumns = ref<ColumnDef[]>([])
const dragIndex = ref<number | null>(null)

const allChecked = ref(true)

function open() {
  localColumns.value = props.columns.map((c) => ({ ...c }))
  updateAllChecked()
  dialogVisible.value = true
}

function updateAllChecked() {
  allChecked.value = localColumns.value.every((c) => c.visible)
}

function toggleAll() {
  const val = !allChecked.value
  localColumns.value.forEach((c) => (c.visible = val))
  allChecked.value = val
}

function handleSave() {
  emit('save', localColumns.value.map((c, i) => ({ ...c, sort: i })))
  dialogVisible.value = false
}

function handleReset() {
  emit('reset')
  dialogVisible.value = false
}

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  const items = [...localColumns.value]
  const [moved] = items.splice(dragIndex.value, 1)
  items.splice(index, 0, moved)
  localColumns.value = items
  dragIndex.value = index
}

function onDragEnd() {
  dragIndex.value = null
}
</script>

<template>
  <el-button text :icon="Setting" @click="open">列设置</el-button>
  <el-dialog v-model="dialogVisible" title="列设置" width="520px" append-to-body :close-on-click-modal="false">
    <div class="column-toolbar">
      <el-checkbox :model-value="allChecked" @change="toggleAll">
        {{ allChecked ? '取消全选' : '全选' }}
      </el-checkbox>
      <span class="drag-tip">拖拽可排序</span>
    </div>
    <div class="column-list">
      <div
        v-for="(col, i) in localColumns"
        :key="col.prop"
        class="column-item"
        draggable="true"
        @dragstart="onDragStart(i)"
        @dragover="onDragOver($event, i)"
        @dragend="onDragEnd"
      >
        <el-icon class="drag-handle"><i class="el-icon-rank" /></el-icon>
        <el-checkbox v-model="col.visible" @change="updateAllChecked" />
        <span class="column-label">{{ col.label }}</span>
        <el-input
          v-model="col.width"
          placeholder="宽度"
          style="width: 80px"
          size="small"
        />
      </div>
    </div>
    <template #footer>
      <el-button text @click="handleReset">恢复默认</el-button>
      <el-button text @click="dialogVisible = false">取消</el-button>
      <el-button text type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.column-toolbar {
  padding: 0 12px 8px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.drag-tip {
  font-size: 12px;
  color: #999;
}
.column-list {
  max-height: 360px;
  overflow-y: auto;
}
.column-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  cursor: grab;
}
.column-item:active {
  cursor: grabbing;
}
.drag-handle {
  color: #999;
  cursor: grab;
}
.column-label {
  flex: 1;
  font-size: 14px;
}
</style>
