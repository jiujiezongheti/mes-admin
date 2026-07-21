<script setup lang="ts">
defineOptions({ name: 'BomList' })
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload, Delete, Expand, CopyDocument, Search } from '@element-plus/icons-vue'
import { getBomList, getBomDetail, createBom, updateBom, deleteBom, getBomTree, getWhereUsed, copyBom, bomExportUrl, bomImportUrl } from '@/api/bom'
import { getMaterialList } from '@/api/material'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useExport } from '@/composables/useExport'
import { useSearch } from '@/composables/useSearch'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SearchTags from '@/components/SearchTags.vue'
import ColumnSettings from '@/components/ColumnSettings.vue'
import ImportDialog from '@/components/ImportDialog.vue'

const columnDefs = [
  { prop: 'code', label: 'BOM编号', width: 150 },
  { prop: 'name', label: 'BOM名称', width: 200 },
  { prop: 'material_code', label: '成品编码', width: 120 },
  { prop: 'material_name', label: '成品名称', width: 150 },
  { prop: 'quantity', label: '产出数量', width: 100 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'sort', label: '排序', width: 80 },
  { prop: 'remark', label: '备注', minWidth: 150 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('bom', columnDefs)
const { doExport } = useExport()

const searchFields = [
  { key: 'code', label: 'BOM编号', type: 'input' as const },
  { key: 'name', label: 'BOM名称', type: 'input' as const },
  { key: 'material_code', label: '成品编码', type: 'input' as const },
  { key: 'material_name', label: '成品名称', type: 'input' as const },
  { key: 'quantity', label: '产出数量', type: 'input' as const },
  { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
  { key: 'remark', label: '备注', type: 'input' as const },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('bom', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)
const searchForm = ref<Record<string, unknown>>({})
const searchDialogRef = ref<any>(null)
const columnSettingsRef = ref<any>(null)
const importDialogRef = ref<InstanceType<typeof ImportDialog>>()
const selectedIds = ref<number[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref<any>(null)

const form = ref({
  id: 0,
  code: '',
  name: '',
  material_id: null as number | null,
  quantity: 1,
  status: 1,
  sort: 0,
  remark: '',
  materials: [] as any[],
})

const mainMaterialOptions = ref<any[]>([])
const materialOptions = ref<any[]>([])

async function loadMaterials() {
  try {
    const res = await getMaterialList({ page: 1, pageSize: 9999 })
    materialOptions.value = (res.data.list as any[]).map((m: any) => ({
      label: `${m.code} - ${m.name}`,
      value: m.id,
    }))
  } catch {}
}

const rules = {
  code: [{ required: true, message: '请输入BOM编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入BOM名称', trigger: 'blur' }],
  material_id: [{ required: true, message: '请选择成品物料', trigger: 'change' }],
}

// BOM Tree
const treeDialogVisible = ref(false)
const treeData = ref<any[]>([])
const treeLoading = ref(false)
const treeDialogTitle = ref('')
const treeRootKey = ref<string>('')

// Where-used
const whereUsedDialogVisible = ref(false)
const whereUsedData = ref<any[]>([])
const whereUsedMaterialName = ref('')

// Copy BOM
const copyDialogVisible = ref(false)
const copyForm = ref({ id: 0, code: '', name: '', material_id: null as number | null })
const copyFormRef = ref<any>(null)
const copyRules = {
  code: [{ required: true, message: '请输入BOM编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入BOM名称', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.status === '' || params.status === undefined) delete params.status
    if (params.quantity === '' || params.quantity === undefined) delete params.quantity
    if (params.sort === '' || params.sort === undefined) delete params.sort
    const res = await getBomList(params)
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

function searchMainMaterial(query: string) {
  if (!query) { mainMaterialOptions.value = []; return }
  getMaterialList({ page: 1, pageSize: 20, code: query, name: query })
    .then((res: any) => {
      mainMaterialOptions.value = (res.data.list as any[]).map((m: any) => ({
        label: `${m.code} - ${m.name}`,
        value: m.id,
      }))
    })
    .catch(() => {})
}

async function handleAdd() {
  await loadMaterials()
  dialogTitle.value = '新增BOM'
  form.value = {
    id: 0, code: '', name: '', material_id: null, quantity: 1, status: 1, sort: 0, remark: '',
    materials: [],
  }
  mainMaterialOptions.value = []
  dialogVisible.value = true
}

async function handleEdit(row: any) {
  await loadMaterials()
  dialogTitle.value = '编辑BOM'
  try {
    const res = await getBomDetail(row.id)
    const data = res.data as any
    mainMaterialOptions.value = data.material_id
      ? [{ label: `${data.material_code} - ${data.material_name}`, value: data.material_id }]
      : []

    const materials = (data.materials || []).map((m: any) => {
      const rowData: any = {
        material_id: m.material_id,
        quantity: m.quantity,
        loss_rate: m.loss_rate ?? 0,
        child_bom_id: m.child_bom_id ?? null,
        remark: m.remark || '',
        _key: Date.now() + Math.random(),
        _bomOptions: [] as any[],
        _bomLoaded: false,
      }

      return rowData
    })

    form.value = {
      id: data.id,
      code: data.code || '',
      name: data.name || '',
      material_id: data.material_id ?? null,
      quantity: data.quantity ?? 1,
      status: data.status ? 1 : 0,
      sort: data.sort ?? 0,
      remark: data.remark || '',
      materials,
    }
    dialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该BOM吗？', '提示', { type: 'warning' })
  await deleteBom(id)
  ElMessage.success('删除成功')
  fetchData()
}

function addMaterialRow() {
  form.value.materials.push({
    material_id: null,
    quantity: 1,
    loss_rate: 0,
    child_bom_id: null,
    remark: '',
    _key: Date.now() + Math.random(),
    _bomOptions: [],
    _bomLoaded: false,
  })
}

function loadChildBomsForRow(row: any) {
  if (!row.material_id || row._bomLoaded) return
  row._bomLoaded = true
  getBomList({ page: 1, pageSize: 9999, material_id: row.material_id })
    .then((res: any) => {
      row._bomOptions = ((res.data as any).list as any[]).map((b: any) => ({
        label: `${b.code} - ${b.name}`,
        value: b.id,
      }))
    })
    .catch(() => {})
}

function onMaterialChange(row: any) {
  if (row.child_bom_id) {
    const valid = row._bomOptions.some((o: any) => o.value === row.child_bom_id)
    if (!valid) row.child_bom_id = null
  }
  row._bomOptions = []
  row._bomLoaded = false
}

function removeMaterialRow(index: number) {
  form.value.materials.splice(index, 1)
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const payload = {
    ...form.value,
    materials: form.value.materials.map((m: any) => ({
      material_id: m.material_id,
      quantity: m.quantity,
      loss_rate: m.loss_rate ?? 0,
      child_bom_id: m.child_bom_id || null,
      remark: m.remark,
    })),
  }
  delete payload._key

  if (form.value.id) {
    await updateBom(payload)
    ElMessage.success('修改成功')
  } else {
    await createBom(payload)
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

function handleExportAll() {
  doExport(bomExportUrl, 'BOM数据.xlsx')
}

function handleExportSelected() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要导出的BOM')
    return
  }
  doExport(bomExportUrl, 'BOM数据.xlsx', selectedIds.value)
}

function handleImportSuccess() {
  fetchData()
}

// BOM Tree
async function handleShowTree(row: any) {
  treeLoading.value = true
  treeDialogVisible.value = true
  try {
    const res = await getBomTree(row.id)
    treeData.value = [res.data as any]
    treeDialogTitle.value = `${row.code} - ${row.name}`
    treeRootKey.value = 'bom_' + row.id
  } catch (e: any) {
    ElMessage.error(e.message)
    treeDialogVisible.value = false
  } finally {
    treeLoading.value = false
  }
}

function mapTreeNode(node: any): any {
  if (!node) return node
  return {
    ...node,
    _key: node.type + '_' + node.id,
    children: (node.children || []).map(mapTreeNode),
  }
}

// Where-used
async function handleShowWhereUsed(materialId: number, materialName: string) {
  try {
    const res = await getWhereUsed(materialId)
    whereUsedData.value = res.data as any[]
    whereUsedMaterialName.value = materialName
    whereUsedDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

// Copy BOM
async function handleCopy(row: any) {
  copyForm.value = {
    id: row.id,
    code: `${row.code}-copy`,
    name: `${row.name}(复制)`,
    material_id: row.material_id ?? null,
  }
  copyDialogVisible.value = true
}

async function handleCopySave() {
  const valid = await copyFormRef.value.validate().catch(() => false)
  if (!valid) return
  const payload: Record<string, unknown> = { id: copyForm.value.id, code: copyForm.value.code, name: copyForm.value.name }
  if (copyForm.value.material_id) {
    payload.material_id = copyForm.value.material_id
  }
  try {
    await copyBom(payload)
    ElMessage.success('复制成功')
    copyDialogVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message)
  }
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
  <div class="bom-list">
    <el-card class="search-card">
      <SearchBar
        v-model="searchForm"
        :fields="pinnedFields"
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
          <el-button text type="primary" :icon="Plus" v-permission="'admin:bom:create'" @click="handleAdd">新增BOM</el-button>
          <el-button text type="primary" :icon="Upload" v-permission="'admin:bom:import'" @click="importDialogRef?.open()">导入</el-button>
          <el-button text type="primary" :icon="Download" v-permission="'admin:bom:export'" @click="handleExportAll">全部导出</el-button>
          <el-button text type="primary" :icon="Download" :disabled="selectedIds.length === 0" v-permission="'admin:bom:export'" @click="handleExportSelected">导出选中</el-button>
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
          :min-width="col.minWidth"
          show-overflow-tooltip
        >
          <template v-if="col.prop === 'status'" #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" v-permission="'admin:bom:list'" :icon="Expand" @click="handleShowTree(row)">展开</el-button>
            <el-button text size="small" type="primary" v-permission="'admin:bom:edit'" :icon="CopyDocument" @click="handleCopy(row)">复制</el-button>
            <el-button text size="small" type="primary" v-permission="'admin:bom:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" v-permission="'admin:bom:delete'" @click="handleDelete(row.id)">删除</el-button>
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
      title="导入BOM"
      :action="bomImportUrl"
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

    <!-- BOM 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="BOM编号" prop="code">
              <el-input v-model="form.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="BOM名称" prop="name">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="成品物料" prop="material_id">
              <el-select v-model="form.material_id" placeholder="请搜索选择成品物料" clearable filterable remote :remote-method="searchMainMaterial" style="width:100%">
                <el-option v-for="o in mainMaterialOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产出数量">
              <el-input-number v-model="form.quantity" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="物料明细">
          <div class="material-sub-table">
            <div class="sub-table-header">
              <span class="sub-table-title">BOM物料清单</span>
              <el-button text type="primary" size="small" :icon="Plus" @click="addMaterialRow">添加物料</el-button>
            </div>
            <el-table :data="form.materials" size="small" stripe>
              <el-table-column label="物料" min-width="220">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.material_id"
                    placeholder="请选择物料"
                    clearable
                    filterable
                    @change="onMaterialChange(row)"
                    style="width:100%"
                  >
                    <el-option v-for="o in materialOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="用量" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :min="0" :precision="2" :controls="false" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="损耗率(%)" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.loss_rate" :min="0" :max="100" :precision="2" :controls="false" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="子BOM" min-width="200">
                <template #default="{ row }">
                  <el-select
                    v-model="row.child_bom_id"
                    placeholder="可选子BOM"
                    clearable
                    filterable
                    @focus="loadChildBomsForRow(row)"
                    style="width:100%"
                  >
                    <el-option v-for="o in row._bomOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="150">
                <template #default="{ row }">
                  <el-input v-model="row.remark" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60">
                <template #default="{ $index }">
                  <el-button text size="small" type="danger" :icon="Delete" @click="removeMaterialRow($index)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="dialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- BOM 树展开弹窗 -->
    <el-dialog :model-value="treeDialogVisible" @update:model-value="treeDialogVisible = $event" title="BOM结构" :width="850" :close-on-click-modal="false" top="5vh">
      <template #header>
        <span>BOM结构: {{ treeDialogTitle }}</span>
      </template>
      <div v-loading="treeLoading" style="min-height:100px">
        <el-table
          v-if="treeData.length > 0"
          :data="treeData.map(mapTreeNode)"
          row-key="_key"
          :tree-props="{ children: 'children' }"
          :indent="0"
          stripe
          size="small"
          default-expand-all
        >
          <el-table-column label="类型" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.type === 'bom'" size="small" type="warning">BOM</el-tag>
              <el-tag v-else size="small" type="success">物料</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="编码" prop="code" width="150" />
          <el-table-column label="名称" prop="name" min-width="160" />
          <el-table-column label="用量" prop="quantity" width="80" align="center" />
          <el-table-column label="损耗率" width="80" align="center">
            <template #default="{ row }">
              <span v-if="row.type === 'material'" style="color:#e6a23c">{{ row.loss_rate ?? 0 }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="说明" min-width="200">
            <template #default="{ row }">
              <span v-if="row.type === 'bom'" style="color:#909399">产出: {{ row.material_code }} - {{ row.material_name }}</span>
              <el-button v-else text size="small" type="primary" :icon="Search" @click="handleShowWhereUsed(row.id, row.name)">反查</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!treeLoading" description="暂无数据" />
      </div>
    </el-dialog>

    <!-- Where-used 反查弹窗 -->
    <el-dialog v-model="whereUsedDialogVisible" title="物料使用情况" width="700px" :close-on-click-modal="false">
      <div style="margin-bottom:12px;color:#606266">
        物料：<strong>{{ whereUsedMaterialName }}</strong>
      </div>
      <el-table :data="whereUsedData" stripe v-if="whereUsedData.length > 0">
        <el-table-column prop="bom_code" label="BOM编号" width="150" />
        <el-table-column prop="bom_name" label="BOM名称" min-width="180" />
        <el-table-column prop="quantity" label="用量" width="100" />
        <el-table-column prop="parent_material_code" label="成品编码" width="120" />
        <el-table-column prop="parent_material_name" label="成品名称" min-width="150" />
      </el-table>
      <el-empty v-else description="该物料未被任何BOM使用" />
    </el-dialog>

    <!-- 复制BOM弹窗 -->
    <el-dialog v-model="copyDialogVisible" title="复制BOM" width="500px" :close-on-click-modal="false">
      <el-form ref="copyFormRef" :model="copyForm" :rules="copyRules" label-width="100px">
        <el-form-item label="BOM编号" prop="code">
          <el-input v-model="copyForm.code" />
        </el-form-item>
        <el-form-item label="BOM名称" prop="name">
          <el-input v-model="copyForm.name" />
        </el-form-item>
        <el-form-item label="成品物料">
          <el-select v-model="copyForm.material_id" placeholder="请搜索选择成品物料" clearable filterable remote :remote-method="searchMainMaterial" style="width:100%">
            <el-option v-for="o in mainMaterialOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="copyDialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleCopySave">确定</el-button>
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
.material-sub-table {
  width: 100%;
}
.sub-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.sub-table-title {
  font-size: 13px;
  color: #606266;
}

</style>
