<script setup lang="ts">
defineOptions({ name: 'OrderList' })
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getOrderList, getOrderDetail, createOrder, updateOrder, deleteOrder, setOrderStatus, getMaterialsByBom } from '@/api/order'
import { getBomList } from '@/api/bom'
import { getMaterialList } from '@/api/material'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useSearch } from '@/composables/useSearch'
import ColumnSettings from '@/components/ColumnSettings.vue'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SearchTags from '@/components/SearchTags.vue'

const columnDefs = [
  { prop: 'code', label: '工单编号', width: 150 },
  { prop: 'material_code', label: '物料编码', width: 120 },
  { prop: 'material_name', label: '物料名称', minWidth: 150 },
  { prop: 'material_spec', label: '规格型号', width: 120 },
  { prop: 'quantity', label: '计划数量', width: 100 },
  { prop: 'produced_quantity', label: '已完成', width: 80 },
  { prop: 'status_name', label: '状态', width: 80 },
  { prop: 'priority_name', label: '优先级', width: 80 },
  { prop: 'plan_start_date', label: '计划开始', width: 160 },
  { prop: 'plan_end_date', label: '计划结束', width: 160 },
  { prop: 'remark', label: '备注', minWidth: 150 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('order', columnDefs)

const statusOptions = [
  { label: '待生产', value: 1 },
  { label: '生产中', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已关闭', value: 4 },
]

const searchFields = [
  { key: 'code', label: '工单编号', type: 'input' as const },
  { key: 'material_code', label: '物料编码', type: 'input' as const },
  { key: 'material_name', label: '物料名称', type: 'input' as const },
  { key: 'status', label: '状态', type: 'select' as const, options: statusOptions },
  { key: 'start_date', label: '创建开始', type: 'input' as const },
  { key: 'end_date', label: '创建结束', type: 'input' as const },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('order', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)
const searchForm = ref<Record<string, unknown>>({})
const searchDialogRef = ref<any>()
const columnSettingsRef = ref()
const selectedIds = ref<number[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<any>(null)
const detailVisible = ref(false)
const detailData = ref<any>(null)

const bomOptions = ref<any[]>([])
const materialOptions = ref<any[]>([])

const form = ref({
  id: 0,
  code: '',
  bom_id: null as number | null,
  material_id: null as number | null,
  quantity: 1,
  priority: 1,
  plan_start_date: '',
  plan_end_date: '',
  sort: 0,
  remark: '',
  materials: [] as any[],
})

const rules = {
  code: [{ required: true, message: '请输入工单编号', trigger: 'blur' }],
  material_id: [{ required: true, message: '请选择生产物料', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.status === '' || params.status === undefined) delete params.status
    const res = await getOrderList(params)
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

async function loadBoms() {
  try {
    const res = await getBomList({ page: 1, pageSize: 9999 })
    bomOptions.value = ((res.data as any).list || []).map((b: any) => ({
      label: `${b.code} - ${b.material_name}`,
      value: b.id,
      bom: b,
    }))
  } catch {}
}

async function loadMaterials() {
  try {
    const res = await getMaterialList({ page: 1, pageSize: 9999 })
    materialOptions.value = ((res.data as any).list || []).map((m: any) => ({
      label: `${m.code} - ${m.name}`,
      value: m.id,
    }))
  } catch {}
}

async function onBomChange(bomId: number | null) {
  form.value.materials = []
  if (!bomId || !form.value.quantity) return
  try {
    const res = await getMaterialsByBom(bomId, form.value.quantity)
    form.value.materials = (res.data as any[]).map((m: any) => ({
      material_id: m.material_id,
      material_code: m.material_code,
      material_name: m.material_name,
      material_spec: m.material_spec,
      required_quantity: m.required_quantity,
      remark: m.remark || '',
    }))
  } catch {}
}

async function handleAdd() {
  await Promise.all([loadBoms(), loadMaterials()])
  dialogTitle.value = '新增工单'
  form.value = { id: 0, code: '', bom_id: null, material_id: null, quantity: 1, priority: 1, plan_start_date: '', plan_end_date: '', sort: 0, remark: '', materials: [] }
  dialogVisible.value = true
}

async function handleEdit(row: any) {
  await Promise.all([loadBoms(), loadMaterials()])
  dialogTitle.value = '编辑工单'
  try {
    const res = await getOrderDetail(row.id)
    const d = res.data as any
    form.value = {
      id: d.order.id,
      code: d.order.code,
      bom_id: d.order.bom_id ?? null,
      material_id: d.order.material_id,
      quantity: d.order.quantity,
      priority: d.order.priority,
      plan_start_date: d.order.plan_start_date || '',
      plan_end_date: d.order.plan_end_date || '',
      sort: d.order.sort ?? 0,
      remark: d.order.remark || '',
      materials: (d.materials || []).map((m: any) => ({
        material_id: m.material_id,
        material_code: m.material_code,
        material_name: m.material_name,
        material_spec: m.material_spec,
        required_quantity: m.required_quantity,
        remark: m.remark || '',
      })),
    }
  } catch (e: any) {
    ElMessage.error(e.message)
    return
  }
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该工单吗？', '提示', { type: 'warning' })
  await deleteOrder(id)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.value.id) {
    await updateOrder(form.value)
    ElMessage.success('修改成功')
  } else {
    await createOrder(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

async function handleStatus(row: any, status: number) {
  const statusNames: Record<number, string> = { 2: '开始生产', 3: '完成', 4: '关闭' }
  await ElMessageBox.confirm(`确定${statusNames[status]}该工单吗？`, '提示', { type: 'warning' })
  const data: Record<string, unknown> = { id: row.id, status }
  if (status === 3) {
    data.produced_quantity = row.quantity
  }
  await setOrderStatus(data)
  ElMessage.success(`${statusNames[status]}成功`)
  fetchData()
}

async function handleView(row: any) {
  try {
    const res = await getOrderDetail(row.id)
    detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message)
    return
  }
  detailVisible.value = true
}

function onSaveColumns(val: any[]) {
  columns.value = val
}

function onResetColumns() {
  resetColumns()
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="order-list">
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
          <el-button text type="primary" :icon="Plus" v-permission="'admin:order:create'" @click="handleAdd">新增工单</el-button>
        </div>
        <div class="toolbar-right">
          <ColumnSettings ref="columnSettingsRef" :columns="columns" @save="onSaveColumns" @reset="onResetColumns" />
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe @selection-change="(val: any[]) => selectedIds = val.map((v: any) => v.id)">
        <el-table-column type="selection" width="50" />
        <el-table-column v-for="col in visibleColumns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" show-overflow-tooltip>
          <template v-if="col.prop === 'status_name'" #default="{ row }">
            <el-tag v-if="row.status === 1" type="info" size="small">待生产</el-tag>
            <el-tag v-else-if="row.status === 2" type="warning" size="small">生产中</el-tag>
            <el-tag v-else-if="row.status === 3" type="success" size="small">已完成</el-tag>
            <el-tag v-else-if="row.status === 4" type="danger" size="small">已关闭</el-tag>
          </template>
          <template v-else-if="col.prop === 'priority_name'" #default="{ row }">
            <el-tag v-if="row.priority === 2" type="danger" size="small">紧急</el-tag>
            <span v-else style="color:#999">普通</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="240" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 1" text size="small" type="primary" v-permission="'admin:order:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 1" text size="small" type="success" v-permission="'admin:order:edit'" @click="handleStatus(row, 2)">开始生产</el-button>
            <el-button v-if="row.status === 2" text size="small" type="success" v-permission="'admin:order:edit'" @click="handleStatus(row, 3)">完成</el-button>
            <el-button v-if="row.status === 3" text size="small" type="warning" v-permission="'admin:order:edit'" @click="handleStatus(row, 4)">关闭</el-button>
            <el-button v-if="row.status === 1 || row.status === 4" text size="small" type="danger" v-permission="'admin:order:delete'" @click="handleDelete(row.id)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单编号" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联BOM">
              <el-select v-model="form.bom_id" placeholder="选择BOM展开物料" clearable filterable style="width:100%" @change="onBomChange">
                <el-option v-for="o in bomOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产物料" prop="material_id">
              <el-select v-model="form.material_id" placeholder="请选择" clearable filterable style="width:100%">
                <el-option v-for="o in materialOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="form.priority" style="width:100%">
                <el-option label="普通" :value="1" />
                <el-option label="紧急" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开始">
              <el-date-picker v-model="form.plan_start_date" type="datetime" placeholder="选择日期" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束">
              <el-date-picker v-model="form.plan_end_date" type="datetime" placeholder="选择日期" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item label="物料需求">
          <div class="sub-table-header">
            <span class="sub-table-title">需求明细（选择BOM后自动展开，也可手动添加）</span>
            <el-button text type="primary" size="small" :icon="Plus" @click="form.materials.push({ material_id: null, required_quantity: 0, remark: '' })">添加物料</el-button>
          </div>
          <el-table :data="form.materials" size="small" stripe>
            <el-table-column label="物料" min-width="200">
              <template #default="{ row, $index }">
                <el-select v-model="row.material_id" placeholder="请选择" clearable filterable style="width:100%">
                  <el-option v-for="o in materialOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="需求数量" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.required_quantity" :min="0" :precision="2" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="{ $index }">
                <el-button text size="small" type="danger" @click="form.materials.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="dialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="工单详情" width="700px" :close-on-click-modal="false">
      <template v-if="detailData">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="工单编号">{{ detailData.order.code }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="detailData.order.status === 1" type="info" size="small">待生产</el-tag>
            <el-tag v-else-if="detailData.order.status === 2" type="warning" size="small">生产中</el-tag>
            <el-tag v-else-if="detailData.order.status === 3" type="success" size="small">已完成</el-tag>
            <el-tag v-else-if="detailData.order.status === 4" type="danger" size="small">已关闭</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="生产物料">{{ detailData.order.material_code }} - {{ detailData.order.material_name }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ detailData.order.quantity }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ detailData.order.produced_quantity }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ detailData.order.priority === 2 ? '紧急' : '普通' }}</el-descriptions-item>
          <el-descriptions-item label="计划开始">{{ detailData.order.plan_start_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="计划结束">{{ detailData.order.plan_end_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="实际开始">{{ detailData.order.actual_start_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="实际结束">{{ detailData.order.actual_end_date || '—' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailData.order.remark || '—' }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top:16px;font-weight:600;font-size:14px">物料需求明细</div>
        <el-table :data="detailData.materials" size="small" stripe class="detail-table">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="material_code" label="物料编码" width="150" />
          <el-table-column prop="material_name" label="物料名称" min-width="150" />
          <el-table-column prop="required_quantity" label="需求数量" width="100" />
          <el-table-column prop="issued_quantity" label="已领料" width="80" />
        </el-table>
      </template>
      <template #footer>
        <el-button text @click="detailVisible = false">关闭</el-button>
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
.sub-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.sub-table-title {
  font-size: 13px;
  color: #999;
}
.detail-table {
  margin-top: 8px;
}
</style>
