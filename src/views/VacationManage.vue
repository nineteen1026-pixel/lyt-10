<template>
  <div class="vacation-manage-page">
    <div class="page-header">
      <h2 class="page-title">假期额度管理</h2>
      <p class="page-subtitle">调整员工假期额度与批量发放</p>
    </div>

    <div class="card filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">部门</label>
          <select v-model="filters.departmentId" class="filter-select" @change="loadGrants">
            <option :value="null">全部部门</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">假期类型</label>
          <select v-model="filters.vacationType" class="filter-select" @change="loadGrants">
            <option value="">全部类型</option>
            <option :value="VACATION_TYPES.ANNUAL">年假</option>
            <option :value="VACATION_TYPES.LIEU">调休</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">状态</label>
          <select v-model="filters.status" class="filter-select" @change="loadGrants">
            <option value="">全部状态</option>
            <option value="valid">有效</option>
            <option value="expiring">即将过期</option>
            <option value="expired">已过期</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">员工</label>
          <select v-model="filters.employeeId" class="filter-select" @change="loadGrants">
            <option :value="null">全部员工</option>
            <option v-for="emp in filteredEmployees" :key="emp.id" :value="emp.id">
              {{ emp.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="showGrantModal = true">
          + 发放额度
        </button>
        <button class="btn btn-secondary" @click="handleBatchGrantAnnual">
          批量发放年假
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">额度列表</h4>
        <div class="stats-summary">
          <span>共 {{ filteredGrants.length }} 条记录</span>
        </div>
      </div>

      <div v-if="filteredGrants.length === 0" class="empty-state">
        <span class="empty-icon">📋</span>
        <p>暂无额度记录</p>
      </div>

      <div v-else class="grants-table-wrapper">
        <table class="grants-table">
          <thead>
            <tr>
              <th>员工</th>
              <th>部门</th>
              <th>假期类型</th>
              <th>描述</th>
              <th>总额度</th>
              <th>已使用</th>
              <th>剩余</th>
              <th>有效期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="grant in filteredGrants" 
              :key="grant.id"
              :class="{ 
                'row-warning': getExpirationStatus(grant.expireDate).status === 'warning',
                'row-expired': getExpirationStatus(grant.expireDate).status === 'expired'
              }"
            >
              <td>
                <div class="employee-cell">
                  <span class="employee-avatar">{{ grant.employeeName?.charAt(0) || '?' }}</span>
                  <span class="employee-name">{{ grant.employeeName }}</span>
                </div>
              </td>
              <td>{{ grant.departmentName || '-' }}</td>
              <td>
                <span class="type-badge" :style="{ background: getVacationTypeColor(grant.vacationType) + '20', color: getVacationTypeColor(grant.vacationType) }">
                  {{ getVacationTypeLabel(grant.vacationType) }}
                </span>
              </td>
              <td class="desc-cell">{{ grant.description }}</td>
              <td class="days-cell">{{ grant.totalDays }}天</td>
              <td class="days-cell used">{{ grant.usedDays }}天</td>
              <td class="days-cell remaining">{{ grant.remainingDays }}天</td>
              <td class="date-cell">
                <div>{{ grant.startDate }}</div>
                <div class="date-sub">至 {{ grant.endDate }}</div>
              </td>
              <td>
                <span class="status-badge" :style="{ color: getExpirationStatus(grant.expireDate).color }">
                  {{ getExpirationStatus(grant.expireDate).label }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="action-btn edit" 
                    @click="openAdjustModal(grant)"
                    :disabled="grant.remainingDays <= 0 && grant.usedDays >= grant.totalDays"
                  >
                    调整
                  </button>
                  <button 
                    class="action-btn view" 
                    @click="viewAdjustments(grant.employeeId, grant.vacationType)"
                  >
                    记录
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showGrantModal" class="modal-overlay" @click.self="showGrantModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">发放假期额度</h3>
          <button class="modal-close" @click="showGrantModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">选择员工 <span class="required">*</span></label>
            <select v-model="grantForm.employeeId" class="form-input">
              <option value="">请选择员工</option>
              <option v-for="emp in allEmployees" :key="emp.id" :value="emp.id">
                {{ emp.name }} - {{ emp.department }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">假期类型 <span class="required">*</span></label>
            <select v-model="grantForm.vacationType" class="form-input">
              <option value="">请选择类型</option>
              <option :value="VACATION_TYPES.ANNUAL">年假</option>
              <option :value="VACATION_TYPES.LIEU">调休</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">天数 <span class="required">*</span></label>
            <input 
              v-model.number="grantForm.days" 
              type="number" 
              min="0.5" 
              step="0.5"
              class="form-input"
              placeholder="请输入天数"
            />
          </div>
          <div class="form-row">
            <div class="form-group half">
              <label class="form-label">开始日期 <span class="required">*</span></label>
              <input v-model="grantForm.startDate" type="date" class="form-input" />
            </div>
            <div class="form-group half">
              <label class="form-label">结束日期 <span class="required">*</span></label>
              <input v-model="grantForm.endDate" type="date" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">到期日期 <span class="required">*</span></label>
            <input v-model="grantForm.expireDate" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">发放原因 <span class="required">*</span></label>
            <select v-model="grantForm.reason" class="form-input">
              <option value="">请选择原因</option>
              <option v-for="reason in ADJUSTMENT_REASONS.filter(r => ['grant', 'manual_add', 'overtime_convert', 'other'].includes(r.value))" :key="reason.value" :value="reason.value">
                {{ reason.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注说明</label>
            <textarea v-model="grantForm.description" class="form-input" rows="3" placeholder="请输入备注说明"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showGrantModal = false">取消</button>
          <button class="btn btn-primary" @click="handleGrantSubmit">确认发放</button>
        </div>
      </div>
    </div>

    <div v-if="showAdjustModal" class="modal-overlay" @click.self="showAdjustModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">调整假期额度</h3>
          <button class="modal-close" @click="showAdjustModal = false">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedGrant">
          <div class="grant-info-box">
            <div class="info-row">
              <span class="info-label">员工：</span>
              <span class="info-value">{{ selectedGrant.employeeName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">假期类型：</span>
              <span class="info-value">{{ getVacationTypeLabel(selectedGrant.vacationType) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前剩余：</span>
              <span class="info-value highlight">{{ selectedGrant.remainingDays }}天</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">调整类型 <span class="required">*</span></label>
            <div class="adjust-type-group">
              <label class="adjust-type-item" :class="{ active: adjustForm.changeType === 'add' }">
                <input type="radio" v-model="adjustForm.changeType" value="add" />
                <span class="adjust-type-label add">增加额度</span>
              </label>
              <label class="adjust-type-item" :class="{ active: adjustForm.changeType === 'deduct' }">
                <input type="radio" v-model="adjustForm.changeType" value="deduct" />
                <span class="adjust-type-label deduct">扣减额度</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">调整天数 <span class="required">*</span></label>
            <input 
              v-model.number="adjustForm.days" 
              type="number" 
              min="0.5" 
              step="0.5"
              :max="adjustForm.changeType === 'deduct' ? selectedGrant.remainingDays : undefined"
              class="form-input"
              placeholder="请输入天数"
            />
            <div v-if="adjustForm.changeType === 'deduct' && adjustForm.days > selectedGrant.remainingDays" class="error-text">
              扣减天数不能超过剩余额度
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">调整原因 <span class="required">*</span></label>
            <select v-model="adjustForm.reason" class="form-input">
              <option value="">请选择原因</option>
              <option v-for="reason in ADJUSTMENT_REASONS.filter(r => ['manual_add', 'manual_deduct', 'other'].includes(r.value))" :key="reason.value" :value="reason.value">
                {{ reason.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注说明</label>
            <textarea v-model="adjustForm.description" class="form-input" rows="3" placeholder="请输入备注说明"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAdjustModal = false">取消</button>
          <button class="btn btn-primary" @click="handleAdjustSubmit">确认调整</button>
        </div>
      </div>
    </div>

    <div v-if="showRecordsModal" class="modal-overlay" @click.self="showRecordsModal = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3 class="modal-title">账户变动记录</h3>
          <button class="modal-close" @click="showRecordsModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="viewingAdjustments.length === 0" class="empty-state">
            <span class="empty-icon">📝</span>
            <p>暂无变动记录</p>
          </div>
          <div v-else class="adjustments-list-modal">
            <div 
              v-for="adjustment in viewingAdjustments" 
              :key="adjustment.id" 
              class="adjustment-item-modal"
            >
              <div class="adjustment-icon-modal" :class="adjustment.changeType">
                {{ adjustment.changeType === 'add' ? '+' : '-' }}
              </div>
              <div class="adjustment-content-modal">
                <div class="adjustment-info-modal">
                  <span class="adjustment-type-modal" :style="{ color: getVacationTypeColor(adjustment.vacationType) }">
                    {{ getVacationTypeLabel(adjustment.vacationType) }}
                  </span>
                  <span class="adjustment-days-modal" :class="adjustment.changeType">
                    {{ adjustment.changeType === 'add' ? '+' : '-' }}{{ adjustment.days }}天
                  </span>
                </div>
                <div class="adjustment-reason-modal">{{ getAdjustmentReasonLabel(adjustment.reason) }}</div>
                <div class="adjustment-desc-modal" v-if="adjustment.description">{{ adjustment.description }}</div>
              </div>
              <div class="adjustment-meta-modal">
                <div class="adjustment-operator-modal" v-if="adjustment.operator">{{ adjustment.operator }}</div>
                <div class="adjustment-time-modal">{{ adjustment.createdAt }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRecordsModal = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useVacationStore } from '@/store/vacation'
import { 
  VACATION_TYPES, 
  VACATION_TYPE_LABELS, 
  VACATION_TYPE_COLORS,
  ADJUSTMENT_REASONS,
  getExpirationStatus,
  getAdjustmentReasonLabel,
  calculateAnnualLeaveDays
} from '@/utils/vacation'

const employeeStore = useEmployeeStore()
const vacationStore = useVacationStore()

const filters = reactive({
  departmentId: null,
  vacationType: '',
  status: '',
  employeeId: null
})

const showGrantModal = ref(false)
const showAdjustModal = ref(false)
const showRecordsModal = ref(false)
const selectedGrant = ref(null)
const viewingAdjustments = ref([])

const grantForm = reactive({
  employeeId: '',
  vacationType: '',
  days: null,
  startDate: '',
  endDate: '',
  expireDate: '',
  reason: '',
  description: ''
})

const adjustForm = reactive({
  changeType: 'add',
  days: null,
  reason: '',
  description: ''
})

const allEmployees = computed(() => employeeStore.employees)

const departments = computed(() => employeeStore.departments)

const filteredEmployees = computed(() => {
  let emps = allEmployees.value
  if (filters.departmentId) {
    emps = emps.filter(e => e.departmentId === filters.departmentId)
  }
  return emps
})

const allGrants = computed(() => {
  return vacationStore.getAllGrants({
    departmentId: filters.departmentId || undefined,
    vacationType: filters.vacationType || undefined,
    employeeId: filters.employeeId || undefined
  })
})

const filteredGrants = computed(() => {
  let grants = allGrants.value
  
  if (filters.status === 'valid') {
    grants = grants.filter(g => getExpirationStatus(g.expireDate).status === 'valid')
  } else if (filters.status === 'expiring') {
    grants = grants.filter(g => getExpirationStatus(g.expireDate).status === 'warning')
  } else if (filters.status === 'expired') {
    grants = grants.filter(g => getExpirationStatus(g.expireDate).status === 'expired')
  }
  
  return grants
})

function getVacationTypeLabel(type) {
  return VACATION_TYPE_LABELS[type] || type
}

function getVacationTypeColor(type) {
  return VACATION_TYPE_COLORS[type] || '#999'
}

function loadGrants() {}

function openAdjustModal(grant) {
  selectedGrant.value = grant
  adjustForm.changeType = 'add'
  adjustForm.days = null
  adjustForm.reason = ''
  adjustForm.description = ''
  showAdjustModal.value = true
}

function viewAdjustments(employeeId, vacationType) {
  viewingAdjustments.value = vacationStore.getEmployeeAdjustments(employeeId, vacationType)
  showRecordsModal.value = true
}

function resetGrantForm() {
  grantForm.employeeId = ''
  grantForm.vacationType = ''
  grantForm.days = null
  grantForm.startDate = ''
  grantForm.endDate = ''
  grantForm.expireDate = ''
  grantForm.reason = ''
  grantForm.description = ''
}

function handleGrantSubmit() {
  if (!grantForm.employeeId || !grantForm.vacationType || !grantForm.days || 
      !grantForm.startDate || !grantForm.endDate || !grantForm.expireDate || !grantForm.reason) {
    vacationStore.showToast('请填写完整信息', 'error')
    return
  }
  
  const employee = employeeStore.getEmployeeById(grantForm.employeeId)
  if (!employee) return
  
  const operator = employeeStore.currentUser?.name || '管理员'
  
  vacationStore.grantVacation({
    employeeId: grantForm.employeeId,
    employeeName: employee.name,
    departmentId: employee.departmentId,
    departmentName: employee.department,
    vacationType: grantForm.vacationType,
    days: grantForm.days,
    startDate: grantForm.startDate,
    endDate: grantForm.endDate,
    expireDate: grantForm.expireDate,
    reason: grantForm.reason,
    description: grantForm.description || (grantForm.reason === 'grant' ? '年度额度发放' : '手动发放'),
    grantedBy: operator
  })
  
  vacationStore.showToast('额度发放成功', 'success')
  showGrantModal.value = false
  resetGrantForm()
}

function handleAdjustSubmit() {
  if (!selectedGrant.value) return
  if (!adjustForm.days || !adjustForm.reason) {
    vacationStore.showToast('请填写完整信息', 'error')
    return
  }
  
  if (adjustForm.changeType === 'deduct' && adjustForm.days > selectedGrant.value.remainingDays) {
    vacationStore.showToast('扣减天数不能超过剩余额度', 'error')
    return
  }
  
  const operator = employeeStore.currentUser?.name || '管理员'
  
  const result = vacationStore.manualAdjust({
    grantId: selectedGrant.value.id,
    changeType: adjustForm.changeType,
    days: adjustForm.days,
    reason: adjustForm.reason,
    description: adjustForm.description,
    operator
  })
  
  if (result.success) {
    vacationStore.showToast('额度调整成功', 'success')
    showAdjustModal.value = false
  } else {
    vacationStore.showToast(result.message || '调整失败', 'error')
  }
}

function handleBatchGrantAnnual() {
  if (!confirm('确定要为所有员工按工龄发放本年度年假吗？')) return
  
  const currentYear = new Date().getFullYear()
  const operator = employeeStore.currentUser?.name || '管理员'
  let count = 0
  
  allEmployees.value.forEach(emp => {
    if (emp.hireDate) {
      const result = vacationStore.grantAnnualLeaveBySeniority(emp, currentYear, operator)
      if (result && result.reason === 'grant') {
        count++
      }
    }
  })
  
  vacationStore.showToast(`已为 ${count} 名员工发放${currentYear}年度年假`, 'success')
}

onMounted(() => {
  vacationStore.expireAllExpiredGrants()
})
</script>

<style scoped>
.vacation-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 4px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-card {
  padding-bottom: 0;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  background: #fafafa;
  min-height: 44px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 0;
  border-top: 1px solid #f5f5f5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.stats-summary {
  font-size: 13px;
  color: #999;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 40px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-secondary {
  background: #f5f7fa;
  color: #666;
  border: 1px solid #e8e8e8;
}

.btn-secondary:active {
  background: #e8e8e8;
}

.empty-state {
  text-align: center;
  padding: 40px 24px;
  color: #999;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.grants-table-wrapper {
  overflow-x: auto;
}

.grants-table {
  width: 100%;
  border-collapse: collapse;
}

.grants-table th,
.grants-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f5f5f5;
}

.grants-table th {
  background: #fafafa;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.grants-table tr:hover {
  background: #fafafa;
}

.row-warning {
  background: #fffbe6;
}

.row-expired {
  background: #fff1f0;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.employee-name {
  font-weight: 500;
  color: #333;
}

.type-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.days-cell {
  font-weight: 500;
  color: #333;
}

.days-cell.used {
  color: #fa8c16;
}

.days-cell.remaining {
  color: #52c41a;
  font-weight: 600;
}

.date-cell {
  font-size: 13px;
  color: #333;
}

.date-sub {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.edit {
  background: #e6f7ff;
  color: #1890ff;
}

.action-btn.edit:hover:not(:disabled) {
  background: #1890ff;
  color: white;
}

.action-btn.edit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.view {
  background: #f6ffed;
  color: #52c41a;
}

.action-btn.view:hover {
  background: #52c41a;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  overflow: hidden;
}

.modal-large {
  max-width: 640px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.required {
  color: #f5222d;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  background: #fafafa;
  min-height: 44px;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.error-text {
  color: #f5222d;
  font-size: 12px;
  margin-top: 4px;
}

.grant-info-box {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #999;
  font-size: 13px;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-value.highlight {
  color: #52c41a;
  font-size: 16px;
  font-weight: 600;
}

.adjust-type-group {
  display: flex;
  gap: 12px;
}

.adjust-type-item {
  flex: 1;
  position: relative;
  cursor: pointer;
}

.adjust-type-item input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.adjust-type-label {
  display: block;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
  transition: all 0.15s;
}

.adjust-type-label.add {
  color: #52c41a;
}

.adjust-type-label.deduct {
  color: #f5222d;
}

.adjust-type-item.active .adjust-type-label {
  border-color: #667eea;
  background: #f0f7ff;
}

.adjustments-list-modal {
  display: flex;
  flex-direction: column;
}

.adjustment-item-modal {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.adjustment-item-modal:last-child {
  border-bottom: none;
}

.adjustment-icon-modal {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.adjustment-icon-modal.add {
  background: #f6ffed;
  color: #52c41a;
}

.adjustment-icon-modal.deduct {
  background: #fff1f0;
  color: #f5222d;
}

.adjustment-content-modal {
  flex: 1;
  min-width: 0;
}

.adjustment-info-modal {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.adjustment-type-modal {
  font-size: 12px;
  font-weight: 600;
}

.adjustment-days-modal {
  font-size: 16px;
  font-weight: 700;
}

.adjustment-days-modal.add {
  color: #52c41a;
}

.adjustment-days-modal.deduct {
  color: #f5222d;
}

.adjustment-reason-modal {
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
}

.adjustment-desc-modal {
  font-size: 12px;
  color: #999;
}

.adjustment-meta-modal {
  text-align: right;
  flex-shrink: 0;
}

.adjustment-operator-modal {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.adjustment-time-modal {
  font-size: 11px;
  color: #999;
}

@media (min-width: 769px) {
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .btn-secondary:hover {
    background: #e8e8e8;
  }
}

@media (max-width: 768px) {
  .vacation-manage-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .filter-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .filter-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .grants-table {
    font-size: 12px;
  }

  .grants-table th,
  .grants-table td {
    padding: 10px 12px;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .modal {
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .grants-table th:nth-child(4),
  .grants-table td:nth-child(4),
  .grants-table th:nth-child(8),
  .grants-table td:nth-child(8) {
    display: none;
  }
}
</style>
