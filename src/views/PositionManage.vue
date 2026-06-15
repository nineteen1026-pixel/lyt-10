<template>
  <div class="position-manage">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">岗位职级维护</h2>
        <p class="page-subtitle">设置和管理公司岗位体系与职级薪酬标准</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openAddModal">
          <span class="btn-icon">➕</span>
          <span>新增岗位</span>
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ positionStats.total }}</div>
          <div class="stat-label">岗位总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ positionStats.techCount }}</div>
          <div class="stat-label">技术序列</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">💼</div>
        <div class="stat-content">
          <div class="stat-value">{{ positionStats.mgmtCount }}</div>
          <div class="stat-label">管理序列</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ positionStats.avgSalary }}K</div>
          <div class="stat-label">平均底薪</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="filter-row">
          <div class="filter-item">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索岗位名称/编码..."
            />
          </div>
          <div class="filter-item">
            <select v-model="filterCategory" class="filter-select">
              <option value="">全部序列</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="filter-item">
            <select v-model="filterLevel" class="filter-select">
              <option :value="0">全部职级</option>
              <option v-for="l in 10" :key="l" :value="l">L{{ l }} - {{ LEVEL_LABELS[l] }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="level-legend">
        <div class="legend-title">职级说明：</div>
        <div class="legend-tags">
          <span v-for="(label, level) in LEVEL_LABELS" :key="level" class="legend-tag" :style="{ background: getLevelColor(level) }">
            L{{ level }} {{ label }}
          </span>
        </div>
      </div>

      <div class="position-table">
        <div class="table-head">
          <div class="th th-level">职级</div>
          <div class="th th-name">岗位名称</div>
          <div class="th th-code">岗位编码</div>
          <div class="th th-category">序列</div>
          <div class="th th-salary">底薪参考</div>
          <div class="th th-people">在岗人数</div>
          <div class="th th-desc">岗位描述</div>
          <div class="th th-actions">操作</div>
        </div>
        <div v-if="filteredPositions.length === 0" class="empty-row">
          <span class="empty-icon">📭</span>
          <p>暂无符合条件的岗位</p>
        </div>
        <TransitionGroup name="list" tag="div">
          <div
            v-for="pos in filteredPositions"
            :key="pos.id"
            class="table-row"
          >
            <div class="td td-level">
              <span class="level-badge" :style="{ background: getLevelColor(pos.level) }">
                L{{ pos.level }}
              </span>
            </div>
            <div class="td td-name">
              <span class="pos-name">{{ pos.name }}</span>
            </div>
            <div class="td td-code">
              <code class="pos-code">{{ pos.code }}</code>
            </div>
            <div class="td td-category">
              <span class="category-tag" :class="'cat-' + pos.category">
                {{ pos.category }}
              </span>
            </div>
            <div class="td td-salary">
              <span class="salary-value">¥{{ formatSalary(pos.baseSalary) }}</span>
            </div>
            <div class="td td-people">
              <div class="people-count">
                <span class="count-num">{{ getPositionEmployeeCount(pos.id) }}</span>
                <span class="count-label">人</span>
              </div>
            </div>
            <div class="td td-desc">
              <span class="pos-desc" :title="pos.description">
                {{ pos.description || '-' }}
              </span>
            </div>
            <div class="td td-actions">
              <button class="action-btn action-edit" @click="openEditModal(pos)" title="编辑">
                ✏️
              </button>
              <button
                class="action-btn action-delete"
                @click="confirmDelete(pos)"
                :disabled="getPositionEmployeeCount(pos.id) > 0"
                :title="getPositionEmployeeCount(pos.id) > 0 ? '该岗位仍有员工，不可删除' : '删除'"
              >
                🗑️
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEdit ? '编辑岗位' : '新增岗位' }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">岗位名称</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  placeholder="如：高级工程师"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">岗位编码</label>
                <input
                  v-model="formData.code"
                  type="text"
                  class="form-input"
                  placeholder="如：P4"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">职级 (L1-L10)</label>
                <select v-model.number="formData.level" class="form-select">
                  <option v-for="l in 10" :key="l" :value="l">
                    L{{ l }} - {{ LEVEL_LABELS[l] }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">岗位序列</label>
                <select v-model="formData.category" class="form-select">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">参考底薪 (元/月)</label>
                <input
                  v-model.number="formData.baseSalary"
                  type="number"
                  class="form-input"
                  min="0"
                  step="1000"
                  placeholder="如：18000"
                />
              </div>
              <div class="form-group form-group-full">
                <label class="form-label">岗位描述</label>
                <textarea
                  v-model="formData.description"
                  class="form-textarea"
                  rows="3"
                  placeholder="请输入该岗位的职责与要求描述..."
                ></textarea>
              </div>
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
            <p>确定要删除岗位「<strong>{{ deleteTarget?.name }}</strong>」吗？</p>
            <p class="muted-text">此操作不可恢复。</p>
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
import { ref, computed, reactive } from 'vue'
import { useOrganizationStore } from '@/store/organization'
import { useEmployeeStore } from '@/store/employee'
import { LEVEL_LABELS } from '@/data/employees'

const organizationStore = useOrganizationStore()
const employeeStore = useEmployeeStore()

const searchKeyword = ref('')
const filterCategory = ref('')
const filterLevel = ref(0)
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const isEdit = ref(false)
const deleteTarget = ref(null)

const categories = ['技术', '产品', '设计', '运营', '人事', '财务', '管理']

const formData = reactive({
  name: '',
  code: '',
  level: 3,
  category: '技术',
  baseSalary: 0,
  description: ''
})

const positionStats = computed(() => {
  const positions = organizationStore.positions
  const total = positions.length
  const techCount = positions.filter(p => p.category === '技术').length
  const mgmtCount = positions.filter(p => p.category === '管理').length
  const avgSalary = total > 0
    ? Math.round(positions.reduce((sum, p) => sum + p.baseSalary, 0) / total / 1000)
    : 0
  return { total, techCount, mgmtCount, avgSalary }
})

const filteredPositions = computed(() => {
  let result = [...organizationStore.sortedPositions]
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.code.toLowerCase().includes(kw)
    )
  }
  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value)
  }
  if (filterLevel.value > 0) {
    result = result.filter(p => p.level === filterLevel.value)
  }
  return result
})

function getLevelColor(level) {
  const l = parseInt(level, 10)
  const colors = {
    1: 'linear-gradient(135deg, #d9f99d, #bef264)',
    2: 'linear-gradient(135deg, #bbf7d0, #86efac)',
    3: 'linear-gradient(135deg, #a5f3fc, #67e8f9)',
    4: 'linear-gradient(135deg, #93c5fd, #60a5fa)',
    5: 'linear-gradient(135deg, #c4b5fd, #a78bfa)',
    6: 'linear-gradient(135deg, #f9a8d4, #f472b6)',
    7: 'linear-gradient(135deg, #fdba74, #fb923c)',
    8: 'linear-gradient(135deg, #fca5a5, #f87171)',
    9: 'linear-gradient(135deg, #fcd34d, #fbbf24)',
    10: 'linear-gradient(135deg, #fef08a, #facc15)'
  }
  return colors[l] || colors[1]
}

function formatSalary(salary) {
  if (!salary) return '0'
  return salary.toLocaleString()
}

function getPositionEmployeeCount(positionId) {
  return employeeStore.employeesByPosition(positionId).length
}

function openAddModal() {
  isEdit.value = false
  Object.assign(formData, {
    name: '',
    code: '',
    level: 3,
    category: '技术',
    baseSalary: 0,
    description: ''
  })
  showModal.value = true
}

function openEditModal(pos) {
  isEdit.value = true
  Object.assign(formData, {
    name: pos.name || '',
    code: pos.code || '',
    level: pos.level || 3,
    category: pos.category || '技术',
    baseSalary: pos.baseSalary || 0,
    description: pos.description || ''
  })
  formData._editId = pos.id
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function submitForm() {
  if (!formData.name.trim()) {
    alert('请输入岗位名称')
    return
  }
  if (!formData.code.trim()) {
    alert('请输入岗位编码')
    return
  }
  if (!formData.baseSalary || formData.baseSalary <= 0) {
    alert('请输入有效的底薪')
    return
  }
  if (isEdit.value) {
    organizationStore.updatePosition(formData._editId, {
      name: formData.name.trim(),
      code: formData.code.trim(),
      level: formData.level,
      category: formData.category,
      baseSalary: formData.baseSalary,
      description: formData.description.trim()
    })
  } else {
    organizationStore.addPosition({
      name: formData.name.trim(),
      code: formData.code.trim(),
      level: formData.level,
      category: formData.category,
      baseSalary: formData.baseSalary,
      description: formData.description.trim()
    })
  }
  closeModal()
}

function confirmDelete(pos) {
  if (getPositionEmployeeCount(pos.id) > 0) {
    alert('该岗位下仍有员工，无法删除！请先调整员工岗位。')
    return
  }
  deleteTarget.value = pos
  showDeleteConfirm.value = true
}

function doDelete() {
  if (!deleteTarget.value) return
  organizationStore.removePosition(deleteTarget.value.id)
  showDeleteConfirm.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.position-manage {
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-icon-blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.stat-icon-green { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.stat-icon-purple { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.stat-icon-orange { background: linear-gradient(135deg, #ffedd5, #fed7aa); }

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  font-size: 14px;
  z-index: 1;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.filter-select {
  padding-left: 12px;
  cursor: pointer;
}

.search-input:focus,
.filter-select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.level-legend {
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.legend-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.legend-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.legend-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: #333;
}

.position-table {
  padding: 0;
}

.table-head {
  display: grid;
  grid-template-columns: 70px 1fr 110px 90px 120px 90px 1fr 100px;
  padding: 14px 20px;
  background: var(--bg-secondary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-light);
  gap: 12px;
}

.table-row {
  display: grid;
  grid-template-columns: 70px 1fr 110px 90px 120px 90px 1fr 100px;
  padding: 14px 20px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-light);
  transition: background 0.15s;
}

.table-row:hover {
  background: #fafbff;
}

.table-row:last-child {
  border-bottom: none;
}

.th, .td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #1a1a1a;
}

.pos-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.pos-code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: var(--bg-secondary);
  padding: 3px 8px;
  border-radius: 4px;
  color: var(--text-secondary);
}

.category-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.cat-技术 { background: #dbeafe; color: #1e40af; }
.cat-产品 { background: #ede9fe; color: #6d28d9; }
.cat-设计 { background: #fce7f3; color: #be185d; }
.cat-运营 { background: #dcfce7; color: #15803d; }
.cat-人事 { background: #fef3c7; color: #a16207; }
.cat-财务 { background: #fce7f3; color: #9d174d; }
.cat-管理 { background: #ffedd5; color: #c2410c; }

.salary-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--success-color);
}

.people-count {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.count-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.count-label {
  font-size: 11px;
  color: var(--text-light);
}

.pos-desc {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.th-actions, .td-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-edit:hover {
  background: rgba(102, 126, 234, 0.1);
}

.action-delete:not(:disabled):hover {
  background: rgba(245, 34, 45, 0.1);
}

.empty-row {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-light);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
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
  max-width: 600px;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group-full {
  grid-column: 1 / -1;
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
  outline: none;
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

.muted-text {
  margin-top: 8px;
  color: var(--text-light);
  font-size: 12px;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
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

@media (max-width: 900px) {
  .table-head, .table-row {
    grid-template-columns: 60px 1fr 100px 80px 100px 80px 1fr 80px;
    padding-left: 12px;
    padding-right: 12px;
    font-size: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
