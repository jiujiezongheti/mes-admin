<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, deleteUser, userExportUrl, userImportUrl } from '@/api/user'
import { getAllRoles } from '@/api/role'
import { PAGE_SIZES, DEFAULT_PAGE_SIZE } from '@/config/pagination'
import { useColumns } from '@/composables/useColumns'
import { useExport } from '@/composables/useExport'
import { useSearch } from '@/composables/useSearch'
import ColumnSettings from '@/components/ColumnSettings.vue'
import ImportDialog from '@/components/ImportDialog.vue'
import SearchBar from '@/components/SearchBar.vue'
import SearchDialog from '@/components/SearchDialog.vue'

const columnDefs = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'username', label: '用户名', width: 150 },
  { prop: 'nickname', label: '昵称', width: 150 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'email', label: '邮箱', width: 180 },
  { prop: 'role_name', label: '角色', width: 130 },
  { prop: 'status', label: '状态', width: 80 },
]

const { columns, visibleColumns, reset: resetColumns } = useColumns('user', columnDefs)
const { doExport } = useExport()

const searchFields = [
  { key: 'username', label: '用户名', type: 'input' as const },
  { key: 'nickname', label: '昵称', type: 'input' as const },
  { key: 'phone', label: '手机号', type: 'input' as const },
  { key: 'email', label: '邮箱', type: 'input' as const },
  { key: 'status', label: '状态', type: 'select' as const, options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
]

const {
  pinnedFields, unpinnedFields, isPinned, fields,
  pin, unpin, replace, reorder,
} = useSearch('user', searchFields)

const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const roles = ref<any[]>([])

const selectedIds = ref<number[]>([])
const searchForm = ref<Record<string, unknown>>({})

const form = ref({
  id: 0,
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  status: 1,
  role_ids: [] as number[],
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, ...searchForm.value }
    if (!params.status && params.status !== 0) {
      delete params.status
    }
    const res = await getUserList(params)
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
  dialogTitle.value = '新增用户'
  form.value = { id: 0, username: '', password: '', nickname: '', phone: '', email: '', status: 1, role_ids: [] }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogTitle.value = '编辑用户'
  form.value = {
    id: row.id,
    username: row.username,
    password: '',
    nickname: row.nickname,
    phone: row.phone || '',
    email: row.email || '',
    status: row.status,
    role_ids: row.role_ids || [],
  }
  dialogVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' })
  await deleteUser(id)
  ElMessage.success('删除成功')
  fetchData()
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.value.id) {
    await updateUser(form.value)
    ElMessage.success('修改成功')
  } else {
    await createUser(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchData()
}

async function loadRoles() {
  try {
    const res = await getAllRoles()
    roles.value = res.data as any[]
  } catch {}
}

function handleExportAll() {
  doExport(userExportUrl, '用户列表.xlsx')
}

function handleExportSelected() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要导出的用户')
    return
  }
  doExport(userExportUrl, '用户列表.xlsx', selectedIds.value)
}

function onExpand(form: Record<string, unknown>) {
  searchForm.value = form
  searchDialogRef.value?.open(form)
}

const importDialogRef = ref<InstanceType<typeof ImportDialog>>()
const searchDialogRef = ref<InstanceType<typeof SearchDialog>>()

function handleImportSuccess() {
  fetchData()
}

const columnSettingsRef = ref<InstanceType<typeof ColumnSettings>>()

function onSaveColumns(val: any[]) {
  columns.value = val
}

function onResetColumns() {
  resetColumns()
}

onMounted(() => {
  fetchData()
  loadRoles()
})
</script>

<template>
  <div class="user-list">
    <el-card>
      <SearchBar
        v-model="searchForm"
        :fields="fields"
        :pinned-fields="pinnedFields"
        @search="handleSearch"
        @reset="handleReset"
        @expand="onExpand"
      />

      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" v-permission="'admin:user:create'" @click="handleAdd">新增用户</el-button>
          <el-button type="success" :icon="Upload" v-permission="'admin:user:import'" @click="importDialogRef?.open()">导入</el-button>
          <el-button type="warning" :icon="Download" v-permission="'admin:user:export'" @click="handleExportAll">全部导出</el-button>
          <el-button type="warning" :icon="Download" :disabled="selectedIds.length === 0" v-permission="'admin:user:export'" @click="handleExportSelected">导出选中</el-button>
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
        border
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
        <el-table-column label="操作" min-width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" v-permission="'admin:user:edit'" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" v-permission="'admin:user:delete'" @click="handleDelete(row.id)">删除</el-button>
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
      :current-form="searchForm.value"
      @pin="pin"
      @unpin="unpin"
      @replace="replace"
      @reorder="reorder"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ImportDialog
      ref="importDialogRef"
      title="导入用户"
      :action="userImportUrl"
      @success="handleImportSuccess"
    />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" :placeholder="form.id ? '留空则不修改' : ''" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="form.role_ids">
            <el-checkbox v-for="r in roles" :key="r.id" :label="r.id" :value="r.id">{{ r.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
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
