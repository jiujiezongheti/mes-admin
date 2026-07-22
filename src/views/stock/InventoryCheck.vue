<script setup lang="ts">
defineOptions({ name: 'InventoryCheck' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getCheckList, getAllWarehouses, createCheck, getCheckItems, completeCheck } from '@/api/stock'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useSearch } from '@/composables/useSearch'
import ColumnSettings from '@/components/ColumnSettings.vue'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SearchTags from '@/components/SearchTags.vue'

const columnDefs = [
  { prop: 'code', label: '盘点单号', width: 180 },
  { prop: 'warehouse_name', label: '仓库', width: 150 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'remark', label: '备注', minWidth: 200 },
  { prop: 'created_by', label: '创建人', width: 100 },
  { prop: 'created_at', label: '创建时间', width: 180 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('inventory-check', columnDefs)

const warehouseOptions = reactive<any[]>([])

const searchFields = [
  { key: 'code', label: '盘点单号', type: 'input' as const },
  { key: 'warehouse_id', label: '仓库', type: 'select' as const, options: warehouseOptions },
  { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '待盘点', value: 1 }, { label: '已完成', value: 2 }] },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('inventory-check', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)

const searchForm = ref<Record<string, unknown>>({})
const searchDialogRef = ref<any>()
const columnSettingsRef = ref()

const createDialogVisible = ref(false)
const createForm = ref({ warehouse_id: null as number | null, remark: '' })
const createFormRef = ref()

const detailDialogVisible = ref(false)
const detailData = ref<any>(null)
const detailItems = ref<any[]>([])
const detailLoading = ref(false)

const completeDialogVisible = ref(false)
const completeCheckId = ref(0)
const completeItems = ref<any[]>([])

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.warehouse_id === '' || params.warehouse_id === undefined) delete params.warehouse_id
    if (params.status === '' || params.status === undefined) delete params.status
    const res = await getCheckList(params)
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

async function handleCreate() {
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return
  await createCheck(createForm.value)
  ElMessage.success('盘点单创建成功')
  createDialogVisible.value = false
  fetchData()
}

async function handleView(row: any) {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    const res = await getCheckItems(row.id)
    detailData.value = res.data.check
    detailItems.value = res.data.items as any[]
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    detailLoading.value = false
  }
}

async function handleComplete(row: any) {
  completeCheckId.value = row.id
  try {
    const res = await getCheckItems(row.id)
    completeItems.value = (res.data.items as any[]).map((item: any) => ({
      material_id: item.material_id,
      actual_quantity: item.actual_quantity,
      remark: item.remark || '',
    }))
  } catch (e: any) {
    ElMessage.error(e.message)
    return
  }
  completeDialogVisible.value = true
}

async function submitComplete() {
  await completeCheck({
    id: completeCheckId.value,
    items: completeItems.value,
  })
  ElMessage.success('盘点完成')
  completeDialogVisible.value = false
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
  <div class="inventory-check">
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
        <div class="toolbar-left">
          <el-button text type="primary" :icon="Plus" v-permission="'admin:stock:check'" @click="createDialogVisible = true">创建盘点单</el-button>
        </div>
        <div class="toolbar-right">
          <ColumnSettings ref="columnSettingsRef" :columns="columns" @save="onSaveColumns" @reset="onResetColumns" />
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column v-for="col in visibleColumns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" show-overflow-tooltip>
          <template v-if="col.prop === 'status'" #default="{ row }">
            <el-tag :type="row.status === 2 ? 'success' : 'warning'" size="small">{{ row.status === 2 ? '已完成' : '待盘点' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="160" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 1" text size="small" type="success" v-permission="'admin:stock:check'" @click="handleComplete(row)">完成盘点</el-button>
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

    <el-dialog v-model="createDialogVisible" title="创建盘点单" width="400px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" label-width="100px">
        <el-form-item label="仓库" prop="warehouse_id" :rules="[{ required: true, message: '请选择仓库', trigger: 'change' }]">
          <el-select v-model="createForm.warehouse_id" placeholder="请选择仓库" style="width:100%">
            <el-option v-for="o in warehouseOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="createDialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleCreate">确定创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="盘点明细" width="860px" :close-on-click-modal="false">
      <template v-if="detailData">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="盘点单号">{{ detailData.code }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detailData.warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailData.status === 2 ? 'success' : 'warning'" size="small">{{ detailData.status === 2 ? '已完成' : '待盘点' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <el-table :data="detailItems" v-loading="detailLoading" stripe class="detail-table">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="material_code" label="物料编码" width="150" />
        <el-table-column prop="material_name" label="物料名称" width="200" show-overflow-tooltip />
        <el-table-column prop="book_quantity" label="账面数量" width="100" />
        <el-table-column prop="actual_quantity" label="实际数量" width="100" />
        <el-table-column prop="difference" label="差异" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.difference > 0 ? 'var(--el-color-success)' : row.difference < 0 ? 'var(--el-color-danger)' : '' }">
              {{ row.difference > 0 ? '+' : '' }}{{ row.difference }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" minWidth="150" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button text @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成盘点" width="720px" :close-on-click-modal="false">
      <el-table :data="completeItems" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="物料" min-width="220">
          <template #default="{ $index }">
            <span>{{ detailItems[$index]?.material_code }} - {{ detailItems[$index]?.material_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账面数量" width="100">
          <template #default="{ $index }">
            {{ detailItems[$index]?.book_quantity }}
          </template>
        </el-table-column>
        <el-table-column label="实际数量" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.actual_quantity" :min="0" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.remark" size="small" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button text @click="completeDialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="submitComplete">确认完成</el-button>
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
.detail-table {
  margin-top: 16px;
}
</style>
