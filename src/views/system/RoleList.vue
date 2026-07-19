<script setup lang="ts">
defineOptions({ name: 'RoleList' })
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'
import { getRoleList, createRole, updateRole, deleteRole, getRolePermissionIds, bindRolePermissions, roleExportUrl, roleImportUrl } from '@/api/role'
import { getPermissionTree } from '@/api/permission'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useExport } from '@/composables/useExport'
import { useSearch } from '@/composables/useSearch'
import ColumnSettings from '@/components/ColumnSettings.vue'
import SearchBar from '@/components/SearchBar.vue'
import ImportDialog from '@/components/ImportDialog.vue'
import SearchDialog from '@/components/SearchDialog.vue'

const columnDefs = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '角色名称', width: 150 },
  { prop: 'code', label: '角色标识', width: 150 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'remark', label: '备注', width: 200 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('role', columnDefs)
const { doExport } = useExport()

const searchFields = [
  { key: 'name', label: '角色名称', type: 'input' as const },
  { key: 'code', label: '角色标识', type: 'input' as const },
  { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('role', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)

const selectedIds = ref<number[]>([])
const searchForm = ref<Record<string, unknown>>({})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const form = ref({ id: 0, name: '', code: '', status: 1, sort: 0, remark: '' })
const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
}

const permDialogVisible = ref(false)
const permRoleId = ref(0)
const permTree = ref<any[]>([])
const checkedPermIds = ref<number[]>([])
const defaultCheckedKeys = ref<number[]>([])
const permTreeRef = ref()

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (!params.status && params.status !== 0) {
      delete params.status
    }
    const res = await getRoleList(params)
    tableData.value = res.data.list as any[]
    total.value = res.data.total as number
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

function handleSearch(form: Record<string, unknown>) {
  searchForm.value = form
  page.value = 1
  fetchData()
}

function handleReset() {
  searchForm.value = {}
  page.value = 1
  fetchData()
}

function handleAdd() {
  dialogTitle.value = '新增角色'
  form.value = { id: 0, name: '', code: '', status: 1, sort: 0, remark: '' }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogTitle.value = '编辑角色'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该角色吗？', '提示', { type: 'warning' })
  await deleteRole(id)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.value.id) {
    await updateRole(form.value)
    ElMessage.success('修改成功')
  } else {
    await createRole(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

async function loadPermTree() {
  try {
    const res = await getPermissionTree()
    permTree.value = res.data as any[]
  } catch {}
}

async function openPermDialog(row: any) {
  permRoleId.value = row.id
  checkedPermIds.value = []
  defaultCheckedKeys.value = []

  try {
    const res = await getRolePermissionIds(row.id)
    checkedPermIds.value = res.data as number[]
    defaultCheckedKeys.value = [...checkedPermIds.value]
  } catch {}

  permDialogVisible.value = true

  setTimeout(() => {
    if (permTreeRef.value) {
      permTreeRef.value.setCheckedKeys(checkedPermIds.value)
    }
  }, 100)
}

async function handleSavePerm() {
  const checked = permTreeRef.value?.getCheckedKeys() ?? []
  const halfChecked = permTreeRef.value?.getHalfCheckedKeys() ?? []
  const allIds = [...checked, ...halfChecked]

  await bindRolePermissions(permRoleId.value, allIds)
  ElMessage.success('权限绑定成功')
  permDialogVisible.value = false
}

function handleExportAll() {
  doExport(roleExportUrl, '角色列表.xlsx')
}

function handleExportSelected() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要导出的角色')
    return
  }
  doExport(roleExportUrl, '角色列表.xlsx', selectedIds.value)
}

function onExpand(form: Record<string, unknown>) {
  searchForm.value = form
  searchDialogRef.value?.open(form)
}

const importDialogRef = ref<InstanceType<typeof ImportDialog>>()
const columnSettingsRef = ref<InstanceType<typeof ColumnSettings>>()
const searchDialogRef = ref<InstanceType<typeof SearchDialog>>()

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
  loadPermTree()
})
</script>

<template>
  <div class="role-list">
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

    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button text type="primary" :icon="Plus" v-permission="'admin:role:create'" @click="handleAdd">新增角色</el-button>
          <el-button text type="primary" :icon="Upload" v-permission="'admin:role:import'" @click="importDialogRef?.open()">导入</el-button>
          <el-button text type="primary" :icon="Download" v-permission="'admin:role:export'" @click="handleExportAll">全部导出</el-button>
          <el-button text type="primary" :icon="Download" :disabled="selectedIds.length === 0" v-permission="'admin:role:export'" @click="handleExportSelected">导出选中</el-button>
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
          <template v-if="col.prop === 'status'" #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="primary" v-permission="'admin:role:edit'" @click="openPermDialog(row)">分配权限</el-button>
            <el-button text size="small" type="primary" v-permission="'admin:role:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" v-permission="'admin:role:delete'" @click="handleDelete(row.id)">删除</el-button>
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
      title="导入角色"
      :action="roleImportUrl"
      @success="handleImportSuccess"
    />

    <SearchDialog
      ref="searchDialogRef"
      :fields="fields"
      :pinned-fields="pinnedFields"
      :unpinned-fields="unpinnedFields"
      :is-pinned="isPinned"
      :current-form="searchForm.value"
      @pin="pin"
      @unpin="unpin"
      @replace="replace"
      @reorder="reorder"
      @search="handleSearch"
      @reset="handleReset"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色标识" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button text @click="dialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permDialogVisible" title="分配权限" width="500px" :close-on-click-modal="false">
      <el-tree
        ref="permTreeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        :props="{ label: 'name', children: 'children' }"
        default-expand-all
      />
      <template #footer>
        <el-button text @click="permDialogVisible = false">取消</el-button>
        <el-button text type="primary" @click="handleSavePerm">保存</el-button>
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
  justify-content: end;
}
</style>
