<template>
  <div class="org-structure">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">组织架构管理</h2>
        <p class="page-subtitle">维护多级部门树结构与部门负责人信息</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openAddModal(null)">
          <span class="btn-icon">➕</span>
          <span>新增根部门</span>
        </button>
      </div>
    </div>

    <div class="main-layout">
      <div class="left-panel card">
        <div class="panel-header">
          <h4 class="panel-title">部门架构</h4>
          <span class="panel-count">共 {{ totalDepartments }} 个部门</span>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索部门名称..."
          />
        </div>
        <div class="tree-container">
          <TreeNode
            v-for="node in filteredTree"
            :key="node.id"
            :node="node"
            :level="0"
            :selectedId="selectedDeptId"
            :expandedIds="expandedIds"
            :searchKeyword="searchKeyword"
            @select="selectDepartment"
            @toggle="toggleExpand"
            @add-child="openAddModal"
            @edit="openEditModal"
            @delete="confirmDelete"
          />
          <div v-if="filteredTree.length === 0" class="empty-tree">
            <span class="empty-icon">📂</span>
            <p>暂无部门数据</p>
          </div>
        </div>
      </div>

      <div class="right-panel card">
        <div v-if="!selectedDept" class="empty-detail">
          <span class="empty-icon">🏢</span>
          <h3>请选择一个部门查看详情</h3>
          <p>从左侧部门树中点击选择</p>
        </div>

        <div v-else class="dept-detail">
          <div class="detail-header">
            <div class="breadcrumb">
              <span
                v-for="(item, idx) in deptPath"
                :key="item.id"
                class="breadcrumb-item"
                @click="selectDepartment(item.id)"
              >
                {{ item.name }}
                <span v-if="idx < deptPath.length - 1" class="breadcrumb-sep">/</span>
              </span>
            </div>
            <div class="detail-actions">
              <button class="btn btn-ghost" @click="openAddModal(selectedDept.id)">
                <span>➕ 新增子部门</span>
              </button>
              <button class="btn btn-ghost" @click="openEditModal(selectedDept)">
                <span>✏️ 编辑</span>
              </button>
              <button class="btn btn-danger-ghost" @click="confirmDelete(selectedDept)">
                <span>🗑️ 删除</span>
              </button>
            </div>
          </div>

          <div class="dept-info-grid">
            <div class="info-card">
              <div class="info-label">部门名称</div>
              <div class="info-value">{{ selectedDept.name }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">部门编码</div>
              <div class="info-value">{{ selectedDept.code || '-' }}</div>
            </div>
            <div class="info-card">
              <div class="info-label">部门层级</div>
              <div class="info-value">
                <span class="level-badge">L{{ deptPath.length }}</span>
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">部门负责人</div>
              <div class="info-value">
                <template v-if="deptManager">
                  <span class="avatar-sm">{{ deptManager.avatar }}</span>
                  <span>{{ deptManager.name }}</span>
                </template>
                <template v-else>-</template>
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">直属员工</div>
              <div class="info-value highlight">{{ directEmployees.length }} 人</div>
            </div>
            <div class="info-card">
              <div class="info-label">子部门数</div>
              <div class="info-value highlight">{{ childCount }} 个</div>
            </div>
            <div class="info-card info-card-full">
              <div class="info-label">部门描述</div>
              <div class="info-value">{{ selectedDept.description || '暂无描述' }}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h5 class="section-title">子部门列表</h5>
              <span class="section-count">{{ childDepartments.length }} 个</span>
            </div>
            <div v-if="childDepartments.length === 0" class="empty-list">
              <span>暂无子部门</span>
            </div>
            <div v-else class="child-list">
              <div
                v-for="child in childDepartments"
                :key="child.id"
                class="child-item"
                @click="selectDepartment(child.id)"
              >
                <div class="child-icon">📁</div>
                <div class="child-info">
                  <div class="child-name">{{ child.name }}</div>
                  <div class="child-meta">
                    <span v-if="child.code">{{ child.code }}</span>
                    <span class="meta-dot">·</span>
                    <span>{{ getDeptEmployeeCount(child.id) }} 人</span>
                  </div>
                </div>
                <span class="child-arrow">›</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h5 class="section-title">部门成员</h5>
              <span class="section-count">{{ directEmployees.length }} 人</span>
            </div>
            <div v-if="directEmployees.length === 0" class="empty-list">
              <span>暂无员工</span>
            </div>
            <div v-else class="employee-grid">
              <div
                v-for="emp in directEmployees"
                :key="emp.id"
                class="emp-card"
              >
                <span class="emp-avatar">{{ emp.avatar }}</span>
                <div class="emp-info">
                  <div class="emp-name">{{ emp.name }}</div>
                  <div class="emp-position">{{ emp.position }}</div>
                </div>
                <span
                  v-if="emp.roles && emp.roles.length > 0"
                  class="role-tag"
                  :title="emp.roles.map(r => ROLE_LABELS[r]).join('、')"
                >
                  {{ emp.roles.length }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEdit ? '编辑部门' : (parentDept ? '新增子部门' : '新增根部门') }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="parentDept" class="form-notice">
              <span>📌 父级部门：{{ parentDept.name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">部门名称</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="请输入部门名称"
              />
            </div>
            <div class="form-group">
              <label class="form-label">部门编码</label>
              <input
                v-model="formData.code"
                type="text"
                class="form-input"
                placeholder="如：TECH-FE"
              />
            </div>
            <div class="form-group">
              <label class="form-label">部门负责人</label>
              <select v-model="formData.managerId" class="form-select">
                <option :value="null">请选择负责人</option>
                <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.id">
                  {{ emp.avatar }} {{ emp.name }} - {{ emp.position }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">部门描述</label>
              <textarea
                v-model="formData.description"
                class="form-textarea"
                rows="3"
                placeholder="请输入部门职能描述"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="submitForm">
              {{ isEdit ? '保存修改' : '确认新增' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">⚠️ 确认删除</h3>
          </div>
          <div class="modal-body">
            <p>确定要删除部门「<strong>{{ deleteTarget?.name }}</strong>」吗？</p>
            <p v-if="childCountForDelete > 0" class="warning-text">
              ⚠️ 该部门下还有 {{ childCountForDelete }} 个子部门，将一并删除！
            </p>
            <p v-if="getDeptEmployeeCount(deleteTarget?.id) > 0" class="warning-text">
              ⚠️ 该部门下还有 {{ getDeptEmployeeCount(deleteTarget?.id) }} 名员工，删除后员工部门将被清空！
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showDeleteConfirm = false">取消</button>
            <button class="btn btn-danger" @click="doDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useOrganizationStore } from '@/store/organization'
import { useEmployeeStore } from '@/store/employee'
import { ROLE_LABELS } from '@/data/employees'

const organizationStore = useOrganizationStore()
const employeeStore = useEmployeeStore()

const searchKeyword = ref('')
const expandedIds = ref(new Set([1, 2, 3, 4, 5, 11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43, 51, 52]))
const selectedDeptId = ref(null)
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const isEdit = ref(false)
const parentDept = ref(null)
const deleteTarget = ref(null)

const formData = reactive({
  name: '',
  code: '',
  managerId: null,
  description: ''
})

const totalDepartments = computed(() => organizationStore.flatDepartments.length)

const filteredTree = computed(() => {
  if (!searchKeyword.value) return organizationStore.departmentsTree
  const kw = searchKeyword.value.toLowerCase()
  function filterNodes(nodes) {
    const result = []
    for (const node of nodes) {
      const matchSelf = node.name.toLowerCase().includes(kw)
      const filteredChildren = node.children ? filterNodes(node.children) : []
      if (matchSelf || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren
        })
      }
    }
    return result
  }
  return filterNodes(organizationStore.departmentsTree)
})

const selectedDept = computed(() => {
  if (!selectedDeptId.value) return null
  return organizationStore.getDepartmentById(selectedDeptId.value)
})

const deptPath = computed(() => {
  if (!selectedDeptId.value) return []
  return organizationStore.getDepartmentPath(selectedDeptId.value)
})

const deptManager = computed(() => {
  if (!selectedDept.value?.managerId) return null
  return employeeStore.getEmployeeById(selectedDept.value.managerId)
})

const directEmployees = computed(() => {
  if (!selectedDeptId.value) return []
  return employeeStore.getEmployeesByDepartment(selectedDeptId.value)
})

const childDepartments = computed(() => {
  if (!selectedDeptId.value) return []
  return organizationStore.getChildDepartments(selectedDeptId.value)
})

const childCount = computed(() => {
  return childDepartments.value.length
})

const childCountForDelete = computed(() => {
  if (!deleteTarget.value?.id) return 0
  return organizationStore.getAllDescendantIds(deleteTarget.value.id).length
})

function getDeptEmployeeCount(deptId) {
  if (!deptId) return 0
  return employeeStore.getEmployeesByDepartment(deptId).length
}

function selectDepartment(id) {
  selectedDeptId.value = id
  if (!expandedIds.value.has(id)) {
    expandedIds.value.add(id)
  }
}

function toggleExpand(id) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
  expandedIds.value = new Set(expandedIds.value)
}

function openAddModal(parentId) {
  isEdit.value = false
  parentDept.value = parentId ? organizationStore.getDepartmentById(parentId) : null
  Object.assign(formData, {
    name: '',
    code: '',
    managerId: null,
    description: ''
  })
  showModal.value = true
}

function openEditModal(dept) {
  isEdit.value = true
  parentDept.value = dept.parentId ? organizationStore.getDepartmentById(dept.parentId) : null
  Object.assign(formData, {
    name: dept.name || '',
    code: dept.code || '',
    managerId: dept.managerId || null,
    description: dept.description || ''
  })
  formData._editId = dept.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function submitForm() {
  if (!formData.name.trim()) {
    alert('请输入部门名称')
    return
  }
  if (isEdit.value) {
    organizationStore.updateDepartment(formData._editId, {
      name: formData.name.trim(),
      code: formData.code.trim(),
      managerId: formData.managerId,
      description: formData.description.trim()
    })
  } else {
    const newDept = organizationStore.addDepartment({
      name: formData.name.trim(),
      code: formData.code.trim(),
      managerId: formData.managerId,
      description: formData.description.trim()
    }, parentDept.value ? parentDept.value.id : null)
    selectDepartment(newDept.id)
  }
  closeModal()
}

function confirmDelete(dept) {
  deleteTarget.value = dept
  showDeleteConfirm.value = true
}

function doDelete() {
  if (!deleteTarget.value) return
  const deptId = deleteTarget.value.id
  const allIds = [deptId, ...organizationStore.getAllDescendantIds(deptId)]
  allIds.forEach(id => {
    const emps = employeeStore.getEmployeesByDepartment(id)
    emps.forEach(emp => {
      employeeStore.updateEmployee(emp.id, { departmentId: null, department: '未分配' })
    })
  })
  organizationStore.removeDepartment(deptId)
  if (selectedDeptId.value === deptId) {
    selectedDeptId.value = null
  }
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

onMounted(() => {
  if (organizationStore.departmentsTree.length > 0) {
    selectedDeptId.value = organizationStore.departmentsTree[0].id
  }
})
</script>

<script>
import { defineComponent, h } from 'vue'

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: Object,
    level: Number,
    selectedId: [Number, String],
    expandedIds: Set,
    searchKeyword: String
  },
  emits: ['select', 'toggle', 'add-child', 'edit', 'delete'],
  setup(props, { emit }) {
    const hasChildren = () => props.node.children && props.node.children.length > 0
    const isExpanded = () => props.expandedIds.has(props.node.id)
    const isSelected = () => props.selectedId === props.node.id

    return () => h('div', { class: 'tree-node-wrapper' }, [
      h('div', {
        class: ['tree-node', { 'is-selected': isSelected(), 'is-expanded': isExpanded() }],
        style: { paddingLeft: (props.level * 16 + 8) + 'px' },
        onClick: (e) => {
          e.stopPropagation()
          emit('select', props.node.id)
          if (hasChildren()) emit('toggle', props.node.id)
        }
      }, [
        h('span', {
          class: ['tree-expand', { 'has-children': hasChildren() }],
          onClick: (e) => {
            e.stopPropagation()
            if (hasChildren()) emit('toggle', props.node.id)
          }
        }, hasChildren() ? (isExpanded() ? '▼' : '▶') : ''),
        h('span', { class: 'tree-icon' }, hasChildren() ? (isExpanded() ? '📂' : '📁') : '📄'),
        h('span', { class: 'tree-name' }, props.node.name),
        h('span', { class: 'tree-code' }, props.node.code || ''),
        h('div', {
          class: 'tree-actions',
          onClick: (e) => e.stopPropagation()
        }, [
          h('button', {
            class: 'tree-action-btn',
            title: '新增子部门',
            onClick: () => emit('add-child', props.node.id)
          }, '➕'),
          h('button', {
            class: 'tree-action-btn',
            title: '编辑',
            onClick: () => emit('edit', props.node)
          }, '✏️'),
          h('button', {
            class: 'tree-action-btn danger',
            title: '删除',
            onClick: () => emit('delete', props.node)
          }, '🗑️')
        ])
      ]),
      hasChildren() && isExpanded() ? h('div', { class: 'tree-children' },
        props.node.children.map(child =>
          h(TreeNode, {
            key: child.id,
            node: child,
            level: props.level + 1,
            selectedId: props.selectedId,
            expandedIds: props.expandedIds,
            searchKeyword: props.searchKeyword,
            onSelect: (id) => emit('select', id),
            onToggle: (id) => emit('toggle', id),
            onAddChild: (id) => emit('add-child', id),
            onEdit: (node) => emit('edit', node),
            onDelete: (node) => emit('delete', node)
          })
        )
      ) : null
    ])
  }
})

export default {
  components: { TreeNode }
}
</script>

<style scoped>
.org-structure {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-light);
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-ghost {
  background: white;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.btn-ghost:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: #f8faff;
}

.btn-danger {
  background: var(--error-color);
  color: white;
}

.btn-danger:hover {
  background: #e04145;
}

.btn-danger-ghost {
  background: white;
  color: var(--error-color);
  border-color: #ffccc7;
}

.btn-danger-ghost:hover {
  background: #fff1f0;
}

.main-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.left-panel, .right-panel {
  padding: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.panel-count {
  font-size: 12px;
  color: var(--text-light);
  background: var(--bg-secondary);
  padding: 3px 10px;
  border-radius: 12px;
}

.search-box {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.tree-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding: 8px 0;
}

.tree-node-wrapper {
  user-select: none;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 8px 8px;
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}

.tree-node:hover {
  background: var(--bg-secondary);
}

.tree-node.is-selected {
  background: #eef2ff;
  border-left-color: var(--primary-color);
}

.tree-expand {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-light);
  flex-shrink: 0;
}

.tree-expand.has-children {
  cursor: pointer;
}

.tree-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tree-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.tree-code {
  font-size: 11px;
  color: var(--text-light);
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.tree-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.tree-node:hover .tree-actions {
  opacity: 1;
}

.tree-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 4px;
  transition: background 0.15s;
}

.tree-action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.tree-action-btn.danger:hover {
  background: rgba(245, 34, 45, 0.1);
}

.tree-children {
  overflow: hidden;
}

.empty-tree, .empty-detail {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-light);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.dept-detail {
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}

.breadcrumb-item {
  font-size: 14px;
  color: var(--primary-color);
  cursor: pointer;
  transition: opacity 0.2s;
}

.breadcrumb-item:hover {
  opacity: 0.7;
}

.breadcrumb-item:last-child {
  color: var(--text-primary);
  font-weight: 600;
  cursor: default;
}

.breadcrumb-sep {
  color: var(--text-light);
  margin: 0 2px;
  font-weight: normal;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dept-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

@media (max-width: 640px) {
  .dept-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-card {
  background: var(--bg-secondary);
  padding: 14px 16px;
  border-radius: 10px;
}

.info-card-full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-value.highlight {
  color: var(--primary-color);
  font-size: 18px;
  font-weight: 600;
}

.level-badge {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.avatar-sm {
  font-size: 18px;
}

.section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.section-count {
  font-size: 12px;
  color: var(--text-light);
  background: var(--bg-secondary);
  padding: 3px 10px;
  border-radius: 12px;
}

.empty-list {
  padding: 24px;
  text-align: center;
  color: var(--text-light);
  background: var(--bg-secondary);
  border-radius: 10px;
  font-size: 13px;
}

.child-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.child-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.child-item:hover {
  background: #eef2ff;
  transform: translateX(4px);
}

.child-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.child-info {
  flex: 1;
  min-width: 0;
}

.child-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.child-meta {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-dot {
  opacity: 0.5;
}

.child-arrow {
  font-size: 18px;
  color: var(--text-light);
  flex-shrink: 0;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.emp-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
}

.emp-card:hover {
  background: #eef2ff;
  transform: translateY(-2px);
}

.emp-avatar {
  font-size: 28px;
  flex-shrink: 0;
}

.emp-info {
  flex: 1;
  min-width: 0;
}

.emp-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.emp-position {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-tag {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #fa8c16, #f5222d);
  color: white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--text-light);
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-notice {
  padding: 10px 14px;
  background: #eef2ff;
  color: var(--primary-color);
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-label.required::after {
  content: ' *';
  color: var(--error-color);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select {
  cursor: pointer;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.warning-text {
  margin-top: 8px;
  color: var(--warning-color);
  font-size: 13px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(20px) scale(0.97);
}
</style>
