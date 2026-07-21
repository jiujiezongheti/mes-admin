<script setup lang="ts">
defineOptions({ name: 'MaterialList' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'
import { getMaterialList, createMaterial, updateMaterial, deleteMaterial, materialExportUrl, materialImportUrl } from '@/api/material'
import { getAllCategories } from '@/api/material-category'
import { getAllUnits } from '@/api/unit'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useExport } from '@/composables/useExport'
import { useSearch } from '@/composables/useSearch'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SearchTags from '@/components/SearchTags.vue'
import ColumnSettings from '@/components/ColumnSettings.vue'
import ImportDialog from '@/components/ImportDialog.vue'

const typeOptions = [
  { label: '原材料', value: 1 },
  { label: '半成品', value: 2 },
  { label: '成品', value: 3 },
  { label: '辅料', value: 4 },
]

const categoryOptions = reactive<any[]>([])
const unitOptions = reactive<any[]>([])

const columnDefs = [
  { prop: 'code', label: '物料编码', width: 150 },
  { prop: 'name', label: '物料名称', width: 200 },
  { prop: 'spec', label: '规格型号', width: 150 },
  { prop: 'unit_name', label: '计量单位', width: 100 },
  { prop: 'type', label: '类型', width: 100 },
  { prop: 'category_name', label: '物料分类', width: 120 },
  { prop: 'shelf_life_days', label: '保质期(天)', width: 100 },
  { prop: 'is_expiry_controlled', label: '有效期管理', width: 100 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'sort', label: '排序', width: 80 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('material', columnDefs)
const { doExport } = useExport()

const searchFields = [
  { key: 'code', label: '物料编码', type: 'input' as const },
  { key: 'name', label: '物料名称', type: 'input' as const },
  { key: 'category_id', label: '物料分类', type: 'select' as const, options: categoryOptions },
  { key: 'unit_id', label: '计量单位', type: 'select' as const, options: unitOptions },
  { key: 'type', label: '类型', type: 'select' as const, options: typeOptions },
  { key: 'is_expiry_controlled', label: '有效期管理', type: 'select' as const, options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
  { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('material', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

const searchForm = ref<Record<string, unknown>>({})

const form = ref({
  id: 0,
  code: '',
  name: '',
  spec: '',
  unit_id: null as number | null,
  type: 1,
  category_id: null as number | null,
  shelf_life_days: null as number | null,
  is_expiry_controlled: false,
  status: 1,
  sort: 0,
  remark: '',
})

const rules = {
  code: [{ required: true, message: '请输入物料编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.type === '' || params.type === undefined) delete params.type
    if (params.category_id === '' || params.category_id === undefined) delete params.category_id
    if (params.unit_id === '' || params.unit_id === undefined) delete params.unit_id
    if (params.is_expiry_controlled === '' || params.is_expiry_controlled === undefined) delete params.is_expiry_controlled
    if (params.status === '' || params.status === undefined) delete params.status
    const res = await getMaterialList(params)
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

async function handleAdd() {
  await Promise.all([loadCategories(), loadUnits()])
  dialogTitle.value = '新增物料'
  form.value = { id: 0, code: '', name: '', spec: '', unit_id: null, type: 1, category_id: null, shelf_life_days: null, is_expiry_controlled: false, status: 1, sort: 0, remark: '' }
  dialogVisible.value = true
}

async function handleEdit(row: any) {
  await Promise.all([loadCategories(), loadUnits()])
  dialogTitle.value = '编辑物料'
  form.value = {
    id: row.id,
    code: row.code,
    name: row.name,
    spec: row.spec || '',
    unit_id: row.unit_id ?? null,
    type: row.type,
    category_id: row.category_id ?? null,
    shelf_life_days: row.shelf_life_days ?? null,
    is_expiry_controlled: row.is_expiry_controlled ?? false,
    status: row.status ? 1 : 0,
    sort: row.sort ?? 0,
    remark: row.remark || '',
  }
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该物料吗？', '提示', { type: 'warning' })
  await deleteMaterial(id)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.value.id) {
    await updateMaterial(form.value)
    ElMessage.success('修改成功')
  } else {
    await createMaterial(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

function onExpand(f: Record<string, unknown>) {
  searchForm.value = f
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

const selectedIds = ref<number[]>([])
const searchDialogRef = ref<InstanceType<typeof SearchDialog>>()
const importDialogRef = ref<InstanceType<typeof ImportDialog>>()
const columnSettingsRef = ref<InstanceType<typeof ColumnSettings>>()

function handleExportAll() {
  doExport(materialExportUrl, '物料档案.xlsx')
}

function handleExportSelected() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要导出的物料')
    return
  }
  doExport(materialExportUrl, '物料档案.xlsx', selectedIds.value)
}

function handleImportSuccess() {
  fetchData()
}

function onSaveColumns(val: any[]) {
  columns.value = val
}

function onResetColumns() {
  resetColumns()
}

async function loadCategories() {
  try {
    const res = await getAllCategories()
    categoryOptions.length = 0
    categoryOptions.push(...(res.data as any[]).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id })))
  } catch {}
}

async function loadUnits() {
  try {
    const res = await getAllUnits()
    unitOptions.length = 0
    unitOptions.push(...(res.data as any[]).map((u: any) => ({ label: u.name, value: u.id })))
  } catch {}
}

onMounted(() => {
  fetchData()
  loadCategories()
  loadUnits()
})
</script>

<template>
  <div class="material-list">
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
          <el-button text type="primary" :icon="Plus" v-permission="'admin:material:create'" @click="handleAdd">新增物料</el-button>
          <el-button text type="primary" :icon="Upload" v-permission="'admin:material:import'" @click="importDialogRef?.open()">导入</el-button>
          <el-button text type="primary" :icon="Download" v-permission="'admin:material:export'" @click="handleExportAll">全部导出</el-button>
          <el-button text type="primary" :icon="Download" :disabled="selectedIds.length === 0" v-permission="'admin:material:export'" @click="handleExportSelected">导出选中</el-button>
        </div>
        <div class="toolbar-right">
          <ColumnSettings
            ref="columnSettingsRef"
            :columns="columns"
            @save="onSaveColumns"
            @reset="onResetColumns"
          />
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        @selection-change="(val: any[]) => selectedIds = val.map((v: any) => v.id)"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column
          v-for="col in visibleColumns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          show-overflow-tooltip
        >
          <template v-if="col.prop === 'type'" #default="{ row }">
            <el-tag size="small">
              {{ typeOptions.find(o => o.value === row.type)?.label || '未知' }}
            </el-tag>
          </template>
          <template v-else-if="col.prop === 'status'" #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
          <template v-else-if="col.prop === 'is_expiry_controlled'" #default="{ row }">
            <el-tag :type="row.is_expiry_controlled ? 'warning' : 'info'" size="small">
              {{ row.is_expiry_controlled ? '启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="140" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" v-permission="'admin:material:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" v-permission="'admin:material:delete'" @click="handleDelete(row.id)">删除</el-button>
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

    <ImportDialog
      ref="importDialogRef"
      title="导入物料"
      :action="materialImportUrl"
      @success="handleImportSuccess"
    />

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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="物料编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="form.spec" />
        </el-form-item>
        <el-form-item label="计量单位">
          <el-select v-model="form.unit_id" placeholder="请选择计量单位" clearable style="width:100%">
            <el-option v-for="o in unitOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料分类">
          <el-select v-model="form.category_id" placeholder="请选择物料分类" clearable style="width:100%">
            <el-option v-for="o in categoryOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期管理">
          <el-switch v-model="form.is_expiry_controlled" :active-value="true" :inactive-value="false" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="保质期(天)">
          <el-input-number v-model="form.shelf_life_days" :min="0" :max="99999" style="width:100%" :disabled="!form.is_expiry_controlled" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="dialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleSave">保存</el-button>
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
