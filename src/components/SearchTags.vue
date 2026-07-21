<script setup lang="ts">
import { computed } from 'vue'
import type { SearchField } from '@/composables/useSearch'

const props = defineProps<{
  fields: SearchField[]
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  remove: [key: string]
  clear: []
}>()

const tags = computed(() => {
  const result: { key: string; label: string; text: string }[] = []
  for (const [key, value] of Object.entries(props.modelValue || {})) {
    if (value === '' || value === null || value === undefined) continue
    const field = props.fields.find(f => f.key === key)
    if (!field) continue
    let text = String(value)
    if (field.type === 'select' && field.options) {
      const opt = field.options.find(o => o.value === value)
      if (opt) text = opt.label
    }
    result.push({ key, label: field.label, text })
  }
  return result
})
</script>

<template>
  <div v-if="tags.length" class="search-tags">
    <span class="search-tags__label">搜索条件：</span>
    <el-tag
      v-for="tag in tags"
      :key="tag.key"
      closable
      size="small"
      type="info"
      @close="emit('remove', tag.key)"
    >
      {{ tag.label }}: {{ tag.text }}
    </el-tag>
    <el-button text size="small" type="primary" @click="emit('clear')">清空</el-button>
  </div>
</template>

<style scoped>
.search-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: var(--main-bg);
  border: 1px solid var(--header-border);
  border-radius: 8px;
}
.search-tags__label {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
}
</style>
