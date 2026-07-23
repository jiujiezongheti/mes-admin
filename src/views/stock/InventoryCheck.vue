<script setup lang="ts">
defineOptions({ name: 'InventoryCheck' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getAllWarehouses, getCheckTaskList, getCheckTaskDetail, createCheckTask, approveCheckTask, rejectCheckTask } from '@/api/stock'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'

const warehouseOptions = reactive<any[]>([])

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)

const searchForm = ref<Record<string, unknown>>({})

const createDialogVisible = ref(false)
const createForm = ref({ warehouse_id: null as number | null, remark: '' })
const createFormRef = ref()

const detailDialogVisible = ref(false)
const detailData = ref<any>(null)
const detailRecords = ref<any[]>([])
const detailLoading = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.warehouse_id === '' || params.warehouse_id === undefined) delete params.warehouse_id
    if (params.status === '' || params.status === undefined) delete params.status
    const res = await getCheckTaskList(params)
    tableData.value = res.data.list as any[]
    total.value = res.data.total as number
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  searchForm.value = {}
  page.value = 1
  fetchData()
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
  if (!createForm.value.warehouse_id) {
    ElMessage.warning('请选择仓库')
    return
  }
  await createCheckTask({
    warehouse_id: createForm.value.warehouse_id,
    remark: createForm.value.remark,
  })
  ElMessage.success('盘点任务创建成功')
  createDialogVisible.value = false
  createForm.value = { warehouse_id: null, remark: '' }
  fetchData()
}

async function handleView(row: any) {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    const res = await getCheckTaskDetail(row.id)
    detailData.value = res.data.task
    detailRecords.value = res.data.records as any[]
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    detailLoading.value = false
  }
}

function handleApprove(row: any) {
  ElMessageBox.confirm(
    `审核通过后，${row.code} 的 ${(row.records_count || 0)} 条盘点记录将自动调整库存。确定通过？`,
    '审核确认',
    { confirmButtonText: '通过', cancelButtonText: '取消', type: 'success' },
  ).then(async () => {
    try {
      await approveCheckTask(row.id)
      ElMessage.success('审核通过，库存已调整')
      fetchData()
    } catch (e: any) {
      ElMessage.error(e.message)
    }
  }).catch(() => {})
}

function handleReject(row: any) {
  ElMessageBox.confirm(
    `确定驳回任务 ${row.code}？`,
    '驳回确认',
    { confirmButtonText: '驳回', cancelButtonText: '取消', type: 'warning' },
  ).then(async () => {
    try {
      await rejectCheckTask(row.id)
      ElMessage.success('已驳回')
      fetchData()
    } catch (e: any) {
      ElMessage.error(e.message)
    }
  }).catch(() => {})
}

async function loadWarehouses() {
  try {
    const res = await getAllWarehouses()
    warehouseOptions.length = 0
    warehouseOptions.push(...(res.data as any[]).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id })))
  } catch {}
}

function statusText(s: number) {
  const map: Record<number, string> = { 0: '待盘点', 1: '已完成', 2: '已审核', 3: '已驳回' }
  return map[s] ?? '未知'
}

function statusType(s: number) {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: '', 3: 'danger' }
  return map[s] ?? 'info'
}

onMounted(() => {
  fetchData()
  loadWarehouses()
})
</script>

<template>
  <div class="inventory-check">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse_id" placeholder="全部" clearable style="width:180px" @change="handleSearch">
            <el-option v-for="o in warehouseOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width:140px" @change="handleSearch">
            <el-option label="待盘点" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已审核" :value="2" />
            <el-option label="已驳回" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button text type="primary" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button text type="primary" :icon="Plus" v-permission="'admin:stock:check'" @click="createDialogVisible = true">创建盘点任务</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="code" label="任务编号" width="180" />
        <el-table-column label="仓库" width="150">
          <template #default="{ row }">
            {{ row.warehouse?.name || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已盘物料" width="100">
          <template #default="{ row }">
            {{ row.records_count || 0 }} 条
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" minWidth="200" show-overflow-tooltip />
        <el-table-column prop="created_by" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" minWidth="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 1" text size="small" type="success" v-permission="'admin:stock:check'" @click="handleApprove(row)">审核通过</el-button>
            <el-button v-if="row.status === 1" text size="small" type="danger" v-permission="'admin:stock:check'" @click="handleReject(row)">驳回</el-button>
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

    <el-dialog v-model="createDialogVisible" title="创建盘点任务" width="400px" :close-on-click-modal="false">
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

    <el-dialog v-model="detailDialogVisible" title="盘点任务明细" width="860px" :close-on-click-modal="false">
      <template v-if="detailData">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="任务编号">{{ detailData.code }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detailData.warehouse_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detailData.status)" size="small">{{ statusText(detailData.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailData.created_at }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <el-table :data="detailRecords" v-loading="detailLoading" stripe class="detail-table">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="material_code" label="物料编码" width="150" />
        <el-table-column prop="material_name" label="物料名称" width="200" show-overflow-tooltip />
        <el-table-column label="规格" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.material_spec || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_quantity" label="实盘数量" width="100" />
        <el-table-column label="批次号" width="120">
          <template #default="{ row }">
            {{ row.batch_no || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" minWidth="150" show-overflow-tooltip />
        <el-table-column prop="created_at" label="盘点时间" width="180" />
      </el-table>
      <template #footer>
        <el-button text @click="detailDialogVisible = false">关闭</el-button>
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
