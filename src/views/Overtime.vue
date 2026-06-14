<template>
  <div class="overtime-page">
    <div class="page-header">
      <h2 class="page-title">加班申请</h2>
      <p class="page-subtitle">提交加班申请，多级审批通过后自动计入考勤工时</p>
    </div>

    <div class="card form-card">
      <h4 class="card-title">填写加班信息</h4>
      <form @submit.prevent="handleSubmit" class="overtime-form">
        <div class="form-row">
          <label class="form-label">
            <span class="label-text">加班类型</span>
            <span class="required">*</span>
          </label>
          <div class="overtime-type-grid">
            <label
              v-for="type in overtimeTypes"
              :key="type.value"
              class="overtime-type-item"
              :class="{ active: formData.overtimeType === type.value }"
            >
              <input
                v-model="formData.overtimeType"
                type="radio"
                :value="type.value"
                name="overtimeType"
              />
              <span class="type-dot" :style="{ background: type.color }"></span>
              <span class="type-label">{{ type.label }}</span>
              <span class="type-rate">{{ type.rate }}倍</span>
            </label>
          </div>
          <span v-if="errors.overtimeType" class="error-message">{{ errors.overtimeType }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">加班日期</span>
            <span class="required">*</span>
          </label>
          <input
            v-model="formData.date"
            type="date"
            class="form-input"
            :class="{ error: errors.date }"
          />
          <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
        </div>

        <div class="form-row time-row">
          <div class="time-group">
            <label class="form-label">
              <span class="label-text">开始时间</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="formData.startTime"
              type="time"
              class="form-input"
              :class="{ error: errors.startTime }"
              @change="calculateHours"
            />
            <span v-if="errors.startTime" class="error-message">{{ errors.startTime }}</span>
          </div>
          <div class="time-group">
            <label class="form-label">
              <span class="label-text">结束时间</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="formData.endTime"
              type="time"
              class="form-input"
              :class="{ error: errors.endTime }"
              @change="calculateHours"
            />
            <span v-if="errors.endTime" class="error-message">{{ errors.endTime }}</span>
          </div>
        </div>

        <div class="form-row" v-if="formData.startTime && formData.endTime">
          <label class="form-label">
            <span class="label-text">加班工时</span>
          </label>
          <div class="hours-display">
            <div class="hours-item">
              <span class="hours-label">实际时长</span>
              <span class="hours-value">{{ formData.workHours }} 小时</span>
            </div>
            <div class="hours-divider"></div>
            <div class="hours-item highlight">
              <span class="hours-label">计薪工时</span>
              <span class="hours-value">{{ formData.overtimeHours }} 小时</span>
            </div>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">加班原因</span>
            <span class="required">*</span>
          </label>
          <textarea
            v-model="formData.reason"
            class="form-textarea"
            :class="{ error: errors.reason }"
            placeholder="请详细说明加班原因..."
            rows="4"
          ></textarea>
          <div class="char-count">{{ formData.reason.length }}/500</div>
          <span v-if="errors.reason" class="error-message">{{ errors.reason }}</span>
        </div>

        <div class="approval-flow-preview">
          <div class="flow-title">审批流程</div>
          <div class="flow-steps">
            <div class="flow-step" v-for="(stage, index) in approvalStages" :key="stage.id">
              <div class="step-icon">
                <span class="step-order">{{ index + 1 }}</span>
              </div>
              <span class="step-name">{{ stage.name }}</span>
            </div>
            <div class="flow-connector" v-for="i in 2" :key="'connector-' + i"></div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="resetForm">
            重置
          </button>
          <button type="submit" class="btn btn-primary">
            提交申请
          </button>
        </div>
      </form>
    </div>

    <div class="card records-card">
      <div class="card-header">
        <h4 class="card-title">加班申请记录</h4>
        <div class="filter-tabs">
          <span
            class="tab-item"
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            全部
          </span>
          <span
            class="tab-item"
            :class="{ active: activeTab === 'my' }"
            @click="activeTab = 'my'"
          >
            我的申请
          </span>
          <span
            v-if="hasApprovalRole"
            class="tab-item approval-tab"
            :class="{ active: activeTab === 'pendingApproval' }"
            @click="activeTab = 'pendingApproval'"
          >
            待我审批
            <span v-if="pendingMyApprovalCount > 0" class="tab-badge">{{ pendingMyApprovalCount }}</span>
          </span>
          <span
            class="tab-item"
            :class="{ active: activeTab === 'approved' }"
            @click="activeTab = 'approved'"
          >
            已通过
          </span>
          <span
            class="tab-item"
            :class="{ active: activeTab === 'rejected' }"
            @click="activeTab = 'rejected'"
          >
            已拒绝
          </span>
        </div>
      </div>

      <div v-if="hasApprovalRole && activeTab === 'pendingApproval'" class="role-banner">
        <span class="role-icon">🔐</span>
        <span class="role-text">您的审批身份：
          <span v-for="(role, idx) in currentUserRoles" :key="role" class="role-tag">
            {{ getApproverRoleName(role) }}<span v-if="idx < currentUserRoles.length - 1">，</span>
          </span>
        </span>
      </div>

      <div v-if="filteredRequests.length === 0" class="empty-state">
        <span class="empty-icon">⏱️</span>
        <p>{{ activeTab === 'pendingApproval' ? '暂无待您审批的申请' : '暂无加班申请记录' }}</p>
      </div>

      <div v-else class="requests-list">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="request-item"
          :class="{ 'is-mine': request.employeeId === currentUser?.id }"
        >
          <div class="request-header">
            <div class="request-info">
              <span
                class="overtime-type-badge"
                :style="{ background: getOvertimeTypeColor(request.overtimeType) + '20', color: getOvertimeTypeColor(request.overtimeType) }"
              >
                {{ getOvertimeTypeLabel(request.overtimeType) }}
              </span>
              <span class="request-date">{{ request.date }}</span>
              <span v-if="request.employeeId !== currentUser?.id" class="request-applicant">
                申请人：{{ request.employeeName }}（{{ request.department }}）
              </span>
            </div>
            <span class="request-status" :style="{ background: getOvertimeStatusColor(request.status) + '20', color: getOvertimeStatusColor(request.status) }">
              {{ getOvertimeStatusText(request.status) }}
            </span>
          </div>

          <div class="approval-progress">
            <div class="progress-steps">
              <div
                v-for="(stage, index) in approvalStages"
                :key="stage.id"
                class="progress-step"
                :class="{ 
                  completed: getApprovalProgress(request.status).completed > index,
                  current: getApprovalProgress(request.status).current === index && !isOvertimeFinalApproved(request.status) && !isOvertimeRejected(request.status),
                  rejected: isOvertimeRejected(request.status),
                  'can-approve-this': canApproveStage(request, stage.id)
                }"
              >
                <div class="step-circle">
                  <span v-if="getApprovalProgress(request.status).completed > index">✓</span>
                  <span v-else-if="isOvertimeRejected(request.status)">✕</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="step-label">{{ stage.name }}</span>
                <span v-if="canApproveStage(request, stage.id)" class="step-badge">待我审批</span>
              </div>
            </div>
          </div>

          <div class="request-time">
            <div class="time-info">
              <span class="time-label">加班时间</span>
              <span class="time-value">{{ request.startTime }} - {{ request.endTime }}</span>
            </div>
            <div class="hours-info">
              <span class="hours-label">计薪工时</span>
              <span class="hours-value">{{ request.overtimeHours }} 小时</span>
            </div>
          </div>

          <div class="request-reason">
            <span class="reason-label">加班原因：</span>
            <span class="reason-text">{{ request.reason }}</span>
          </div>

          <div v-if="request.approvalHistory && request.approvalHistory.length > 0" class="approval-history">
            <div class="history-title">审批记录</div>
            <div class="history-list">
              <div v-for="(record, idx) in request.approvalHistory" :key="idx" class="history-item">
                <span class="history-dot" :class="record.action"></span>
                <span class="history-name">{{ record.name }}</span>
                <span class="history-role">({{ getApproverRoleName(record.role) }})</span>
                <span class="history-action" :class="record.action">
                  {{ record.action === 'approve' ? '已通过' : '已拒绝' }}
                </span>
                <span class="history-time">{{ record.time }}</span>
              </div>
            </div>
          </div>

          <div class="request-footer">
            <span class="request-submit-time">提交时间：{{ request.createdAt }}</span>
            <div class="approval-block-info" v-if="isApplicantSelf(request) && !isOvertimeFinalApproved(request.status) && !isOvertimeRejected(request.status)">
              <span class="lock-icon">🔒</span>
              <span class="lock-text">申请人不可自行审批</span>
            </div>
            <div class="request-actions" v-else-if="canApprove(request)">
              <span class="current-stage-tag">{{ getApproverRoleName(getApproverRole(request.status)) }}审批</span>
              <button class="action-btn approve" @click="approveRequest(request)">
                通过
              </button>
              <button class="action-btn reject" @click="rejectRequest(request)">
                拒绝
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useAttendanceStore } from '@/store/attendance'
import { 
  OVERTIME_TYPES, 
  APPROVAL_STAGES, 
  getOvertimeTypeLabel, 
  getOvertimeTypeColor,
  getOvertimeTypeRate,
  getOvertimeStatusText,
  getOvertimeStatusColor,
  getOvertimeApprovalProgress,
  isOvertimeFinalApproved,
  isOvertimeRejected,
  OVERTIME_STATUS,
  calculateOvertimeHours
} from '@/utils/attendance'
import { parseTime } from '@/utils/date'

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()

const activeTab = ref('all')
const overtimeTypes = OVERTIME_TYPES
const approvalStages = APPROVAL_STAGES

const formData = reactive({
  overtimeType: 'weekday',
  date: '',
  startTime: '',
  endTime: '',
  workHours: 0,
  overtimeHours: 0,
  reason: ''
})

const errors = reactive({
  overtimeType: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: ''
})

const currentUser = computed(() => employeeStore.currentUser)

const currentUserRoles = computed(() => {
  if (!currentUser.value) return []
  return currentUser.value.roles || []
})

const hasApprovalRole = computed(() => currentUserRoles.value.length > 0)

const myRequests = computed(() => {
  if (!currentUser.value) return []
  return attendanceStore.getEmployeeOvertimeRequests(currentUser.value.id)
})

const allRequests = computed(() => attendanceStore.overtimeRequests)

const pendingMyApproval = computed(() => {
  if (!hasApprovalRole.value) return []
  const roles = currentUserRoles.value
  return allRequests.value.filter(req => {
    if (isOvertimeFinalApproved(req.status) || isOvertimeRejected(req.status)) return false
    if (req.employeeId === currentUser.value?.id) return false
    const requiredRole = getApproverRole(req.status)
    return requiredRole && roles.includes(requiredRole)
  })
})

const pendingMyApprovalCount = computed(() => pendingMyApproval.value.length)

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') {
    if (hasApprovalRole.value) {
      const seen = new Set()
      const combined = []
      ;[...myRequests.value, ...pendingMyApproval.value].forEach(r => {
        if (!seen.has(r.id)) {
          seen.add(r.id)
          combined.push(r)
        }
      })
      return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    return myRequests.value
  }
  if (activeTab.value === 'my') return myRequests.value
  if (activeTab.value === 'pendingApproval') return pendingMyApproval.value
  if (activeTab.value === 'approved') {
    const base = hasApprovalRole.value ? allRequests.value : myRequests.value
    return base.filter(r => isOvertimeFinalApproved(r.status))
  }
  if (activeTab.value === 'rejected') {
    const base = hasApprovalRole.value ? allRequests.value : myRequests.value
    return base.filter(r => isOvertimeRejected(r.status))
  }
  return myRequests.value
})

function getApprovalProgress(status) {
  return getOvertimeApprovalProgress(status)
}

function calculateHours() {
  if (!formData.startTime || !formData.endTime) {
    formData.workHours = 0
    formData.overtimeHours = 0
    return
  }

  const start = parseTime(formData.startTime)
  const end = parseTime(formData.endTime)
  
  if (end <= start) {
    formData.workHours = 0
    formData.overtimeHours = 0
    return
  }

  formData.workHours = ((end - start) / 60).toFixed(2)
  formData.overtimeHours = calculateOvertimeHours(formData.startTime, formData.endTime, formData.overtimeType)
}

function validateForm() {
  let valid = true

  if (!formData.overtimeType) {
    errors.overtimeType = '请选择加班类型'
    valid = false
  } else {
    errors.overtimeType = ''
  }

  if (!formData.date) {
    errors.date = '请选择加班日期'
    valid = false
  } else {
    errors.date = ''
  }

  if (!formData.startTime) {
    errors.startTime = '请选择开始时间'
    valid = false
  } else {
    errors.startTime = ''
  }

  if (!formData.endTime) {
    errors.endTime = '请选择结束时间'
    valid = false
  } else if (formData.startTime && parseTime(formData.endTime) <= parseTime(formData.startTime)) {
    errors.endTime = '结束时间必须晚于开始时间'
    valid = false
  } else {
    errors.endTime = ''
  }

  if (!formData.reason.trim()) {
    errors.reason = '请填写加班原因'
    valid = false
  } else if (formData.reason.length < 10) {
    errors.reason = '加班原因至少10个字符'
    valid = false
  } else if (formData.reason.length > 500) {
    errors.reason = '加班原因不能超过500个字符'
    valid = false
  } else {
    errors.reason = ''
  }

  return valid
}

function handleSubmit() {
  if (!validateForm()) return
  if (!currentUser.value) {
    attendanceStore.showToast('请先登录', 'error')
    return
  }

  calculateHours()

  if (formData.overtimeHours <= 0) {
    attendanceStore.showToast('加班时长无效，请检查时间设置', 'error')
    return
  }

  attendanceStore.submitOvertimeRequest({
    employeeId: currentUser.value.id,
    employeeName: currentUser.value.name,
    department: currentUser.value.department,
    overtimeType: formData.overtimeType,
    date: formData.date,
    startTime: formData.startTime,
    endTime: formData.endTime,
    reason: formData.reason.trim()
  })

  resetForm()
}

function resetForm() {
  formData.overtimeType = 'weekday'
  formData.date = ''
  formData.startTime = ''
  formData.endTime = ''
  formData.workHours = 0
  formData.overtimeHours = 0
  formData.reason = ''
  errors.overtimeType = ''
  errors.date = ''
  errors.startTime = ''
  errors.endTime = ''
  errors.reason = ''
}

function isApplicantSelf(request) {
  if (!currentUser.value) return false
  return request.employeeId === currentUser.value.id
}

function canApproveStage(request, stageId) {
  if (!hasApprovalRole.value) return false
  if (isApplicantSelf(request)) return false
  
  const requiredRole = getApproverRole(request.status)
  if (!requiredRole) return false
  if (stageId !== requiredRole) return false
  
  return currentUserRoles.value.includes(requiredRole)
}

function canApprove(request) {
  if (isOvertimeFinalApproved(request.status) || isOvertimeRejected(request.status)) {
    return false
  }

  if (isApplicantSelf(request)) {
    return false
  }

  if (!hasApprovalRole.value) {
    return false
  }
  
  const approvableStatuses = [
    OVERTIME_STATUS.PENDING_SUPERVISOR,
    OVERTIME_STATUS.PENDING_MANAGER,
    OVERTIME_STATUS.PENDING_HR
  ]
  
  if (!approvableStatuses.includes(request.status)) {
    return false
  }

  const requiredRole = getApproverRole(request.status)
  if (!requiredRole) return false

  return currentUserRoles.value.includes(requiredRole)
}

function getApproverRole(status) {
  const roleMap = {
    [OVERTIME_STATUS.PENDING_SUPERVISOR]: 'supervisor',
    [OVERTIME_STATUS.PENDING_MANAGER]: 'manager',
    [OVERTIME_STATUS.PENDING_HR]: 'hr'
  }
  return roleMap[status] || null
}

function getApproverRoleName(role) {
  const nameMap = {
    supervisor: '直属领导',
    manager: '部门经理',
    hr: '人事'
  }
  return nameMap[role] || role
}

function approveRequest(request) {
  const role = getApproverRole(request.status)
  if (!role) return
  
  const approverName = currentUser.value ? currentUser.value.name : getApproverRoleName(role)
  attendanceStore.approveOvertimeRequest(request.id, role, approverName)
}

function rejectRequest(request) {
  const role = getApproverRole(request.status)
  if (!role) return
  
  const approverName = currentUser.value ? currentUser.value.name : getApproverRoleName(role)
  attendanceStore.rejectOvertimeRequest(request.id, role, approverName)
}
</script>

<style scoped>
.overtime-page {
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

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header .card-title {
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #f5f7fa;
  padding: 4px;
  border-radius: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  padding: 8px 14px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

.tab-item:active {
  background: #e8e8e8;
}

.tab-item.active {
  background: white;
  color: #667eea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.tab-item.approval-tab {
  position: relative;
  color: #f5222d;
}

.tab-item.approval-tab.active {
  color: #667eea;
}

.tab-badge {
  display: inline-block;
  background: #f5222d;
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 4px;
  font-weight: 600;
  line-height: 1.4;
}

.role-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f9f0ff 100%);
  border-radius: 10px;
  border: 1px solid #91d5ff;
  margin-bottom: 14px;
}

.role-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.role-text {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.role-tag {
  color: #667eea;
  font-weight: 600;
}

.request-applicant {
  font-size: 12px;
  color: #666;
  padding: 3px 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.request-item.is-mine {
  border-left: 3px solid #667eea;
}

.can-approve-this .step-circle {
  border-color: #f5222d !important;
  color: #f5222d !important;
  background: #fff1f0 !important;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(245, 34, 45, 0);
  }
}

.can-approve-this .step-label {
  color: #f5222d !important;
  font-weight: 600;
}

.step-badge {
  display: inline-block;
  background: #f5222d;
  color: white;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 2px;
}

.approval-block-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff7e6;
  border: 1px dashed #ffd591;
  border-radius: 8px;
  color: #d46b08;
  font-size: 12px;
  font-weight: 500;
}

.lock-icon {
  font-size: 14px;
}

.lock-text {
  font-size: 12px;
}

.current-stage-tag {
  padding: 6px 12px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.history-role {
  font-size: 11px;
  color: #999;
  font-weight: 400;
}

.history-name {
  color: #333;
  font-weight: 600;
}

.overtime-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-row {
  flex-direction: row;
  gap: 16px;
}

.time-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #f5222d;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fafafa;
  min-height: 48px;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error,
.form-textarea.error {
  border-color: #f5222d;
  background: #fff1f0;
}

.form-input[type="date"],
.form-input[type="time"] {
  position: relative;
  padding-right: 40px;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3e%3c/rect%3e%3cpath d='M16 2v4M8 2v4M3 10h18'%3e%3c/path%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  color: #333;
}

.form-input[type="time"] {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e%3cpolyline points='12,6 12,12 16,14'%3e%3c/polyline%3e%3c/svg%3e");
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.char-count {
  text-align: right;
  font-size: 11px;
  color: #999;
  margin-top: -4px;
}

.overtime-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.overtime-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fafafa;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
  position: relative;
}

.overtime-type-item input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.overtime-type-item:active {
  transform: scale(0.98);
}

.overtime-type-item.active {
  border-color: #667eea;
  background: #f0f7ff;
}

.type-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-label {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

.type-rate {
  font-size: 10px;
  color: #667eea;
  background: #e8f0ff;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.hours-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f0f7ff;
  border-radius: 10px;
}

.hours-item {
  flex: 1;
  text-align: center;
}

.hours-item.highlight .hours-value {
  color: #667eea;
}

.hours-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.hours-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.hours-divider {
  width: 1px;
  height: 40px;
  background: #d9e4ff;
}

.approval-flow-preview {
  padding: 16px;
  background: #f9f0ff;
  border-radius: 10px;
  border: 1px dashed #d3adf7;
}

.flow-title {
  font-size: 13px;
  font-weight: 600;
  color: #722ed1;
  margin-bottom: 12px;
  text-align: center;
}

.flow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #722ed1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.step-order {
  font-size: 14px;
}

.step-name {
  font-size: 12px;
  color: #722ed1;
  font-weight: 500;
}

.flow-connector {
  width: 40px;
  height: 2px;
  background: #d3adf7;
  margin-bottom: 20px;
}

.error-message {
  font-size: 12px;
  color: #f5222d;
  padding: 4px 4px 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
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
  padding: 48px 24px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-item {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.15s;
  background: white;
}

.request-item:active {
  background: #fafafa;
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 10px;
  flex-wrap: wrap;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.overtime-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.request-date {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.request-status {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.approval-progress {
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}

.progress-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 16px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e8e8e8;
  z-index: 0;
}

.progress-step.completed:not(:last-child)::after {
  background: #52c41a;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #999;
  z-index: 1;
  transition: all 0.3s;
}

.progress-step.completed .step-circle {
  background: #52c41a;
  border-color: #52c41a;
  color: white;
}

.progress-step.current .step-circle {
  border-color: #667eea;
  color: #667eea;
  animation: pulse 2s infinite;
}

.progress-step.rejected .step-circle {
  background: #f5222d;
  border-color: #f5222d;
  color: white;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
  }
}

.step-label {
  font-size: 11px;
  color: #999;
  text-align: center;
}

.progress-step.completed .step-label,
.progress-step.current .step-label {
  color: #333;
  font-weight: 500;
}

.request-time {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: #f6ffed;
  border-radius: 8px;
}

.time-info,
.hours-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-label,
.hours-label {
  font-size: 11px;
  color: #999;
}

.time-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.hours-value {
  font-size: 16px;
  font-weight: 700;
  color: #52c41a;
}

.request-reason {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
  word-break: break-word;
}

.reason-label {
  color: #999;
}

.approval-history {
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.history-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.history-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.history-dot.approve {
  background: #52c41a;
}

.history-dot.reject {
  background: #f5222d;
}

.history-name {
  color: #333;
  font-weight: 500;
}

.history-action {
  font-weight: 600;
}

.history-action.approve {
  color: #52c41a;
}

.history-action.reject {
  color: #f5222d;
}

.history-time {
  margin-left: auto;
  color: #999;
  font-size: 11px;
}

.request-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  gap: 12px;
  flex-wrap: wrap;
}

.request-submit-time {
  font-size: 11px;
  color: #999;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.action-btn.approve {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.action-btn.approve:active {
  background: #52c41a;
  color: white;
}

.action-btn.reject {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.action-btn.reject:active {
  background: #f5222d;
  color: white;
}

@media (min-width: 769px) {
  .tab-item:hover {
    color: #667eea;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }

  .btn-secondary:hover {
    background: #e8e8e8;
  }

  .overtime-type-item:hover {
    border-color: #667eea;
  }

  .request-item:hover {
    border-color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  }

  .action-btn.approve:hover {
    background: #52c41a;
    color: white;
  }

  .action-btn.reject:hover {
    background: #f5222d;
    color: white;
  }
}

@media (max-width: 768px) {
  .overtime-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .overtime-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .time-row {
    flex-direction: column;
    gap: 18px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tabs {
    width: 100%;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 10px;
  }

  .btn {
    width: 100%;
    padding: 14px 20px;
  }

  .request-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .request-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .current-stage-tag {
    width: 100%;
    text-align: center;
    order: -1;
  }

  .action-btn {
    flex: 1;
    padding: 10px 16px;
    font-size: 14px;
  }

  .approval-block-info {
    justify-content: center;
  }

  .role-banner {
    flex-wrap: wrap;
  }

  .request-info {
    gap: 6px;
  }

  .form-input,
  .form-textarea {
    font-size: 16px;
  }

  .hours-display {
    flex-direction: column;
    gap: 12px;
  }

  .hours-divider {
    width: 60%;
    height: 1px;
  }

  .flow-steps {
    flex-wrap: wrap;
  }

  .flow-connector {
    width: 20px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .card {
    padding: 14px;
  }

  .card-title {
    font-size: 14px;
  }

  .tab-item {
    padding: 8px 12px;
    font-size: 12px;
  }

  .request-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-status {
    align-self: flex-start;
  }

  .form-label {
    font-size: 13px;
  }

  .btn {
    font-size: 14px;
  }

  .hours-value {
    font-size: 18px;
  }

  .progress-steps {
    gap: 4px;
  }

  .step-circle {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .step-label {
    font-size: 10px;
  }

  .progress-step:not(:last-child)::after {
    top: 14px;
  }
}

@media (max-width: 360px) {
  .tab-item {
    padding: 7px 10px;
    font-size: 11px;
  }

  .request-info {
    gap: 6px;
  }

  .request-date {
    font-size: 13px;
  }

  .overtime-type-grid {
    gap: 8px;
  }

  .type-label {
    font-size: 11px;
  }
}
</style>
