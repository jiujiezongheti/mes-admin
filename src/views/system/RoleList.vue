<script setup lang="ts">
defineOptions({ name: 'RoleList' })
import { ref, computed, onMounted } from 'vue'
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
import SearchTags from '@/components/SearchTags.vue'

const columnDefs = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '角色名称', width: 150 },
  { prop: 'code', label: '角色标识', width: 150 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'remark', label: '备注', width: 200 },
  { prop: 'sort', label: '排序', width: 70 },
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
const menuTreeRef = ref()

const selectedMenuId = ref<number | null>(null)
const btnCheckedMap = ref<Record<number, boolean>>({})

const menuTree = computed(() => {
  return permTree.value.map((dir: any) => ({
    ...dir,
    children: (dir.children || [])
      .filter((m: any) => m.type === 'menu')
      .map((m: any) => ({ ...m, children: undefined })),
  }))
})

const selectedMenuName = computed(() => {
  if (!selectedMenuId.value) return ''
  for (const dir of permTree.value) {
    for (const menu of (dir.children || [])) {
      if (menu.id === selectedMenuId.value) return menu.name
    }
  }
  return ''
})

const currentMenuBtns = computed(() => {
  if (!selectedMenuId.value) return []
  for (const dir of permTree.value) {
    for (const menu of (dir.children || [])) {
      if (menu.id === selectedMenuId.value) {
        return (menu.children || []).filter((c: any) => c.type === 'btn')
      }
    }
  }
  return []
})

const isAllBtnsChecked = computed(() => {
  const btns = currentMenuBtns.value
  if (btns.length === 0) return false
  return btns.every((b: any) => btnCheckedMap.value[b.id])
})

function onMenuCheck(data: any, _checked: any) {
  if (data.type === 'menu') {
    selectedMenuId.value = data.id
  }
  const checked = menuTreeRef.value?.getCheckedKeys() ?? []
  const halfChecked = menuTreeRef.value?.getHalfCheckedKeys() ?? []
  if (selectedMenuId.value && !checked.includes(selectedMenuId.value) && !halfChecked.includes(selectedMenuId.value)) {
    const btns = currentMenuBtns.value
    btns.forEach((b: any) => { btnCheckedMap.value[b.id] = false })
  }
}

function onViewMenu(data: any) {
  if (data.type !== 'menu') return
  selectedMenuId.value = data.id
}

function syncMenuCheck(menuId: number) {
  if (!menuTreeRef.value) return
  const anyChecked = currentMenuBtns.value.some((b: any) => btnCheckedMap.value[b.id])
  if (anyChecked) {
    menuTreeRef.value.setChecked(menuId, true, true)
  }
}

function toggleBtn(id: number) {
  btnCheckedMap.value[id] = !btnCheckedMap.value[id]
  if (selectedMenuId.value) syncMenuCheck(selectedMenuId.value)
}

function toggleAllBtns(checked: boolean) {
  currentMenuBtns.value.forEach((b: any) => {
    btnCheckedMap.value[b.id] = checked
  })
  if (selectedMenuId.value && menuTreeRef.value && checked) {
    menuTreeRef.value.setChecked(selectedMenuId.value, true, true)
  }
}

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
  form.value = { ...row, status: row.status ? 1 : 0 }
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
  selectedMenuId.value = null
  btnCheckedMap.value = {}

  let ids: number[] = []
  try {
    const res = await getRolePermissionIds(row.id)
    ids = res.data as number[]
    for (const id of ids) {
      btnCheckedMap.value[id] = true
    }
  } catch {}

  permDialogVisible.value = true

  setTimeout(() => {
    if (menuTreeRef.value) {
      const allMenuIds = new Set<number>()
      for (const dir of permTree.value) {
        for (const menu of (dir.children || [])) {
          if (menu.type === 'menu') allMenuIds.add(menu.id)
        }
      }
      const menuChecked = ids.filter((id: number) => allMenuIds.has(id))
      menuTreeRef.value.setCheckedKeys(menuChecked)
    }
  }, 100)
}

async function handleSavePerm() {
  const menuChecked = menuTreeRef.value?.getCheckedKeys() ?? []
  const menuHalf = menuTreeRef.value?.getHalfCheckedKeys() ?? []
  const btnIds = Object.keys(btnCheckedMap.value)
    .filter((k) => btnCheckedMap.value[Number(k)])
    .map(Number)
  const allIds = [...new Set([...menuChecked, ...menuHalf, ...btnIds])]

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
      :current-form="searchForm"
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
          <span style="font-size:12px;color:#999;margin-left:8px">数值越小排名越靠前，默认 0</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
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

    <el-dialog v-model="permDialogVisible" title="分配权限" width="640px" :close-on-click-modal="false">
      <div class="perm-layout">
        <div class="perm-menu">
          <div class="perm-section-title">菜单列表</div>
          <el-tree
            ref="menuTreeRef"
            :data="menuTree"
            show-checkbox
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            default-expand-all
            @check="onMenuCheck"
          >
            <template #default="{ data }">
              <span v-if="data.type === 'menu'" class="perm-menu-label" @click.stop="onViewMenu(data)">{{ data.name }}</span>
              <span v-else class="perm-menu-label">{{ data.name }}</span>
            </template>
          </el-tree>
        </div>
        <div class="perm-divider" />
        <div class="perm-btns">
          <div class="perm-section-title">
            {{ selectedMenuName ? selectedMenuName + ' - 按钮权限' : '按钮权限' }}
          </div>
          <div v-if="!selectedMenuId" class="perm-placeholder">请在左侧点击菜单以查看按钮权限</div>
          <template v-else-if="currentMenuBtns.length === 0">
            <div class="perm-placeholder">该菜单下没有按钮权限</div>
          </template>
          <template v-else>
            <el-checkbox
              :model-value="isAllBtnsChecked"
              :indeterminate="!isAllBtnsChecked && currentMenuBtns.some((b: any) => btnCheckedMap[b.id])"
              @change="toggleAllBtns"
            >
              全选/取消全选
            </el-checkbox>
            <div class="perm-btn-list">
              <el-checkbox
                v-for="btn in currentMenuBtns"
                :key="btn.id"
                :model-value="!!btnCheckedMap[btn.id]"
                @change="toggleBtn(btn.id)"
              >
                {{ btn.name }}
              </el-checkbox>
            </div>
          </template>
        </div>
      </div>
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
.perm-layout {
  display: flex;
  min-height: 360px;
}
.perm-menu {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
}
.perm-divider {
  width: 1px;
  background: var(--header-border, #e5e7eb);
  margin: 0 16px;
  flex-shrink: 0;
}
.perm-btns {
  flex: 1;
  overflow-y: auto;
  padding-left: 4px;
}
.perm-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}
.perm-placeholder {
  color: #999;
  font-size: 13px;
  margin-top: 60px;
  text-align: center;
}
.perm-btn-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.perm-btn-list .el-checkbox {
  margin-right: 0;
}
.perm-menu :deep(.el-tree-node__label) {
  flex: 1;
  overflow: hidden;
}
.perm-menu :deep(.el-tree-node__content) {
  pointer-events: none;
}
.perm-menu :deep(.el-tree-node__checkbox),
.perm-menu :deep(.el-tree-node__expand-icon),
.perm-menu-label {
  pointer-events: auto;
}
.perm-menu-label {
  display: inline-block;
  width: 100%;
  cursor: pointer;
}
.perm-menu-label:hover {
  color: var(--el-color-primary);
}
</style>
