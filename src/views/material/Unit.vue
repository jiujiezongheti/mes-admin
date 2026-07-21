<script setup lang="ts">
defineOptions({ name: 'UnitList' })
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'
import { getUnitList, getAllUnits, createUnit, updateUnit, deleteUnit, unitExportUrl, unitImportUrl } from '@/api/unit'
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
  { prop: 'name', label: '单位名称', minWidth: 200 },
  { prop: 'sort', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'remark', label: '备注', minWidth: 200 },
  { prop: 'created_at', label: '创建时间', width: 180 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('unit', columnDefs)
const { doExport } = useExport()

const searchFields = [
  { key: 'name', label: '单位名称', type: 'input' as const },
  { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('unit', searchFields)

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
const form = reactive({
  id: 0,
  name: '',
  sort: 0,
  status: 1,
  remark: '',
})

const rules = {
  name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (params.status === '' || params.status === undefined) delete params.status
    const res = await getUnitList(params)
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

function handleAdd() {
  dialogTitle.value = '新增单位'
  Object.assign(form, { id: 0, name: '', sort: 0, status: 1, remark: '' })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogTitle.value = '编辑单位'
  Object.assign(form, {
    id: row.id,
    name: row.name || '',
    sort: row.sort ?? 0,
    status: row.status ? 1 : 0,
    remark: row.remark || '',
  })
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该单位吗？', '提示', { type: 'warning' })
  await deleteUnit(id)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.id) {
    await updateUnit({ ...form })
    ElMessage.success('修改成功')
  } else {
    await createUnit({ ...form })
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
  doExport(unitExportUrl, '计量单位.xlsx')
}

function handleExportSelected() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要导出的单位')
    return
  }
  doExport(unitExportUrl, '计量单位.xlsx', selectedIds.value)
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="unit-list">
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
          <el-button text type="primary" :icon="Plus" v-permission="'admin:unit:create'" @click="handleAdd">新增单位</el-button>
          <el-button text type="primary" :icon="Upload" v-permission="'admin:unit:import'" @click="importDialogRef?.open()">导入</el-button>
          <el-button text type="primary" :icon="Download" v-permission="'admin:unit:export'" @click="handleExportAll">全部导出</el-button>
          <el-button text type="primary" :icon="Download" :disabled="selectedIds.length === 0" v-permission="'admin:unit:export'" @click="handleExportSelected">导出选中</el-button>
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
        <el-table-column label="操作" min-width="140" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" v-permission="'admin:unit:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" v-permission="'admin:unit:delete'" @click="handleDelete(row.id)">删除</el-button>
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
      title="导入计量单位"
      :action="unitImportUrl"
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
        <el-form-item label="单位名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入单位名称" maxlength="30" />
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
