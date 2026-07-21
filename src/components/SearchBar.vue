<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { SearchField } from '@/composables/useSearch'
import { Search, Filter } from '@element-plus/icons-vue'

const props = defineProps<{
  fields: SearchField[]
  pinnedFields: SearchField[]
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [form: Record<string, unknown>]
  search: [form: Record<string, unknown>]
  reset: []
  expand: [form: Record<string, unknown>]
}>()

const form = reactive<Record<string, unknown>>({})

watch(() => props.modelValue, (val) => {
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, val)
}, { deep: true, immediate: true })

const shownFields = computed(() => props.pinnedFields)

function handleSearch() {
  emit('update:modelValue', { ...form })
  emit('search', { ...form })
}

function handleReset() {
  Object.keys(form).forEach((k) => delete form[k])
  emit('update:modelValue', {})
  emit('reset')
}
</script>

<template>
  <div class="search-bar">
    <div class="search-fields">
      <el-form inline class="search-inline">
        <el-form-item v-for="f in shownFields" :key="f.key" :label="f.label">
          <el-input
            v-if="f.type === 'input'"
            v-model="form[f.key]"
            :placeholder="f.label"
            clearable
            size="default"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-else
            v-model="form[f.key]"
            :placeholder="f.label"
            clearable
            size="default"
            style="width:130px"
          >
            <el-option
              v-for="opt in (f.options || [])"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button text type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button text @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-button text class="expand-btn" :icon="Filter" @click="emit('expand', { ...form })">更多筛选</el-button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: transparent;
  padding: 12px 16px;
  border-radius: 8px;

}
.search-fields {
  flex: 1;
}
.search-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.search-inline :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 12px;
}
.expand-btn {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
