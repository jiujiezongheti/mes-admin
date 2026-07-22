<script setup lang="ts">
defineOptions({ name: 'StockRecord' })
import { ref, reactive, onMounted } from 'vue'
import { getStockRecordList, getAllWarehouses } from '@/api/stock'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useSearch } from '@/composables/useSearch'
import ColumnSettings from '@/components/ColumnSettings.vue'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SearchTags from '@/components/SearchTags.vue'

const columnDefs = [
  { prop: 'warehouse_name', label: '仓库', width: 120 },
  { prop: 'material_code', label: '物料编码', width: 150 },
  { prop: 'material_name', label: '物料名称', minWidth: 200 },
  { prop: 'type', label: '类型', width: 80 },
  { prop: 'quantity', label: '变动数量', width: 100 },
  { prop: 'before_quantity', label: '变动前', width: 100 },
  { prop: 'after_quantity', label: '变动后', width: 100 },
  { prop: 'source_type', label: '来源', width: 100 },
  { prop: 'remark', label: '备注', minWidth: 150 },
  { prop: 'created_by', label: '操作人', width: 100 },
  { prop: 'created_at', label: '时间', width: 180 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('stock-record', columnDefs)

const warehouseOptions = reactive<any[]>([])

const typeOptions = [
  { label: '入库', value: 1 },
  { label: '出库', value: 2 },
  { label: '盘盈', value: 3 },
  { label: '盘亏', value: 4 },
]

const searchFields = [
  { key: 'warehouse_id', label: '仓库', type: 'select' as const, options: warehouseOptions },
  { key: 'material_code', label: '物料编码', type: 'input' as const },
  { key: 'type', label: '类型', type: 'select' as const, options: typeOptions },
  { key: 'start_date', label: '开始日期', type: 'input' as const },
  { key: 'end_date', label: '结束日期', type: 'input' as const },
  { key: 'source_type', label: '来源', type: 'input' as const },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('stock-record', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)

const searchForm = ref<Record<string, unknown>>({})
const searchDialogRef = ref<any>()
const columnSettingsRef = ref()

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    for (const k of ['warehouse_id', 'type']) {
      if (params[k] === '' || params[k] === undefined) delete params[k]
    }
    const res = await getStockRecordList(params)
    tableData.value = res.data.list as any[]
    total.value = res.data.total as number
  } catch (e: any) {
    loading.value = false
  } finally {
    loading.value = false
  }
}

function handleSearch(f: Record<string, unknown>) {
  searchForm.value = f
  page.value = 1
  fetchData()
}

function handleReset() {
  searchForm.value = {}
  page.value = 1
  fetchData()
}

function onExpand(f: Record<string, unknown>) {
  searchDialogRef.value?.open(f)
}

function handleRemoveTag(key: string) {
  const newForm = { ...searchForm.value }
  delete newForm[key]
  searchForm.value = newForm
  page.value = 1
  fetchData()
}

function handleClearTags() {
  searchForm.value = {}
  page.value = 1
  fetchData()
}

async function loadWarehouses() {
  try {
    const res = await getAllWarehouses()
    warehouseOptions.length = 0
    warehouseOptions.push(...(res.data as any[]).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id })))
  } catch {}
}

function onSaveColumns(val: any[]) {
  columns.value = val
}

function onResetColumns() {
  resetColumns()
}

onMounted(() => {
  fetchData()
  loadWarehouses()
})
</script>

<template>
  <div class="stock-record">
    <el-card class="search-card">
      <SearchBar
        v-model="searchForm"
        :fields="fields"
        :pinned-fields="pinnedFields"
        @search="handleSearch"
        @reset="handleReset"
        @expand="onExpand"
      />
    </el-card>

    <SearchTags
      v-if="searchForm && Object.keys(searchForm).length > 0"
      :fields="searchFields"
      :model-value="searchForm"
      @remove="handleRemoveTag"
      @clear="handleClearTags"
    />

    <el-card>
      <div class="toolbar">
        <div class="toolbar-left" />
        <div class="toolbar-right">
          <ColumnSettings ref="columnSettingsRef" :columns="columns" @save="onSaveColumns" @reset="onResetColumns" />
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column v-for="col in visibleColumns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" show-overflow-tooltip>
          <template v-if="col.prop === 'type'" #default="{ row }">
            <el-tag v-if="row.type === 1" type="success" size="small">入库</el-tag>
            <el-tag v-else-if="row.type === 2" type="warning" size="small">出库</el-tag>
            <el-tag v-else-if="row.type === 3" type="primary" size="small">盘盈</el-tag>
            <el-tag v-else-if="row.type === 4" type="danger" size="small">盘亏</el-tag>
            <span v-else>{{ row.type }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="PAGE_SIZES"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>

    <SearchDialog
      ref="searchDialogRef"
      :fields="fields"
      :pinned-fields="pinnedFields"
      :unpinned-fields="unpinnedFields"
      :is-pinned="isPinned"
      :current-form="searchForm"
      @pin="pin"
      @unpin="unpin"
      @replace="replace"
      @reorder="reorder"
      @search="handleSearch"
      @reset="handleReset"
    />
  </div>
</template>

<style scoped>
.search-card {
  margin-bottom: 12px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
