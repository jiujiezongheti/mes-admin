<script setup lang="ts">
defineOptions({ name: 'InventoryList' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getInventoryList, getAllWarehouses, stockIn, stockOut } from '@/api/stock'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useSearch } from '@/composables/useSearch'
import ColumnSettings from '@/components/ColumnSettings.vue'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SearchTags from '@/components/SearchTags.vue'

const columnDefs = [
  { prop: 'warehouse_code', label: '仓库编码', width: 120 },
  { prop: 'warehouse_name', label: '仓库名称', width: 150 },
  { prop: 'material_code', label: '物料编码', width: 150 },
  { prop: 'material_name', label: '物料名称', minWidth: 200 },
  { prop: 'material_spec', label: '规格型号', width: 150 },
  { prop: 'quantity', label: '库存数量', width: 100 },
  { prop: 'locked_quantity', label: '锁定数量', width: 100 },
  { prop: 'available_quantity', label: '可用数量', width: 100 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('inventory', columnDefs)

const warehouseOptions = reactive<any[]>([])

const searchFields = [
  { key: 'warehouse_id', label: '仓库', type: 'select' as const, options: warehouseOptions },
  { key: 'material_code', label: '物料编码', type: 'input' as const },
  { key: 'material_name', label: '物料名称', type: 'input' as const },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('inventory', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)

const searchForm = ref<Record<string, unknown>>({})
const searchDialogRef = ref<any>()
const columnSettingsRef = ref()

const inDialogVisible = ref(false)
const outDialogVisible = ref(false)
const inFormRef = ref()
const outFormRef = ref()
const currentRow = ref<any>(null)

const inForm = ref({
  warehouse_id: null as number | null,
  material_id: null as number | null,
  quantity: 1,
  remark: '',
})

const outForm = ref({
  warehouse_id: null as number | null,
  material_id: null as number | null,
  quantity: 1,
  remark: '',
})

const rules = {
  warehouse_id: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.warehouse_id === '' || params.warehouse_id === undefined) delete params.warehouse_id
    const res = await getInventoryList(params)
    tableData.value = res.data.list as any[]
    total.value = res.data.total as number
  } catch (e: any) {
    ElMessage.error(e.message)
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

function handleIn(row: any) {
  currentRow.value = row
  inForm.value = { warehouse_id: row.warehouse_id, material_id: row.material_id, quantity: 1, remark: '' }
  inDialogVisible.value = true
}

function handleOut(row: any) {
  currentRow.value = row
  outForm.value = { warehouse_id: row.warehouse_id, material_id: row.material_id, quantity: 1, remark: '' }
  outDialogVisible.value = true
}

async function submitIn() {
  const valid = await inFormRef.value.validate().catch(() => false)
  if (!valid) return
  await stockIn(inForm.value)
  ElMessage.success('入库成功')
  inDialogVisible.value = false
  fetchData()
}

async function submitOut() {
  const valid = await outFormRef.value.validate().catch(() => false)
  if (!valid) return
  await stockOut(outForm.value)
  ElMessage.success('出库成功')
  outDialogVisible.value = false
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
  <div class="inventory-list">
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
        <el-table-column v-for="col in visibleColumns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" show-overflow-tooltip />
        <el-table-column label="操作" min-width="160" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" v-permission="'admin:stock:in'" @click="handleIn(row)">入库</el-button>
            <el-button text size="small" type="warning" v-permission="'admin:stock:out'" @click="handleOut(row)">出库</el-button>
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

    <el-dialog v-model="inDialogVisible" title="入库" width="400px" :close-on-click-modal="false">
      <el-form ref="inFormRef" :model="inForm" :rules="rules" label-width="100px">
        <el-form-item label="仓库">
          <el-select v-model="inForm.warehouse_id" disabled style="width:100%">
            <el-option v-for="o in warehouseOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料">
          <el-input :model-value="currentRow?.material_name" disabled />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="inForm.quantity" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="inDialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="submitIn">确定入库</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="outDialogVisible" title="出库" width="400px" :close-on-click-modal="false">
      <el-form ref="outFormRef" :model="outForm" :rules="rules" label-width="100px">
        <el-form-item label="仓库">
          <el-select v-model="outForm.warehouse_id" disabled style="width:100%">
            <el-option v-for="o in warehouseOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料">
          <el-input :model-value="currentRow?.material_name" disabled />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="outForm.quantity" :min="1" :max="currentRow?.available_quantity || 0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="outForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="outDialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="submitOut">确定出库</el-button>
      </template>
    </el-dialog>
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
