<template>
  <div class="business-trip-approve-page">
    <div class="page-header">
      <h2 class="page-title">出差审批</h2>
      <p class="page-subtitle">审批出差申请，管理员工出差考勤</p>
    </div>

    <div v-if="!isApprover" class="card no-permission-card">
      <div class="no-permission">
        <span class="no-permission-icon">🔒</span>
        <h3 class="no-permission-title">暂无审批权限</h3>
        <p class="no-permission-desc">您没有出差审批权限，请联系管理员</p>
      </div>
    </div>

    <div v-else>
      <div class="card filter-card">
        <div class="filter-row">
          <div class="filter-tabs">
            <span
              class="tab-item"
              :class="{ active: activeTab === 'pending' }"
              @click="activeTab = 'pending'"
            >
              待我审批
              <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
            </span>
            <span
              class="tab-item"
              :class="{ active: activeTab === 'all' }"
              @click="activeTab = 'all'"
            >
              全部申请
            </span>
          </div>
        </div>

        <div v-if="myApprovalRoles.length > 1" class="role-filter">
          <span class="filter-label">审批角色：</span>
          <div class="role-tabs">
            <span
              class="role-tab"
              :class="{ active: selectedRole === '' }"
              @click="selectedRole = ''"
            >
              全部
            </span>
            <span
              v-for="role in myApprovalRoles"
              :key="role"
              class="role-tab"
              :class="{ active: selectedRole === role }"
              @click="selectedRole = role"
            >
              {{ ROLE_LABELS[role] }}
            </span>
          </div>
        </div>
      </div>

      <div class="card records-card">
        <div class="card-header">
          <h4 class="card-title">
            {{ activeTab === 'pending' ? '待我审批' : '全部出差申请' }}
            <span class="count-badge">{{ filteredRequests.length }}</span>
          </h4>
        </div>

        <div v-if="filteredRequests.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <p>暂无出差申请</p>
        </div>

        <div v-else class="requests-list">
          <div
            v-for="request in filteredRequests"
            :key="request.id"
            class="request-item"
            :class="{ 'request-highlight': highlightId === request.id }"
          >
            <div class="request-header">
              <div class="request-info">
                <span
                  class="trip-type-badge"
                  :style="{ background: getTripTypeColor(request.tripType) + '20', color: getTripTypeColor(request.tripType) }"
                >
                  {{ getTripTypeLabel(request.tripType) }}
                </span>
                <span class="request-applicant">
                  {{ request.employeeName }}
                  <span class="applicant-dept">{{ request.department }}</span>
                </span>
              </div>
              <span class="request-status" :class="getStatusClass(request.status)">
                {{ getStatusText(request.status) }}
              </span>
            </div>

            <div class="request-body">
              <div class="request-date">
                <span class="date-icon">📅</span>
                <span class="date-text">{{ request.startDate }} ~ {{ request.endDate }}</span>
                <span class="days-badge">{{ request.days }}天</span>
              </div>
              <div class="request-destination">
                <span class="dest-icon">📍</span>
                <span class="dest-text">{{ request.destination }}</span>
              </div>
            </div>

            <div class="request-reason">
              <span class="reason-label">出差原因：</span>
              <span class="reason-text">{{ request.reason }}</span>
            </div>

            <div v-if="request.itinerary && request.itinerary.length > 0" class="itinerary-preview">
              <div class="itinerary-preview-header" @click="toggleExpand(request.id)">
                <span class="itinerary-label">行程明细（{{ request.itinerary.length }}条）</span>
                <span class="expand-icon">{{ expandedId === request.id ? '▲' : '▼' }}</span>
              </div>
              <div v-if="expandedId === request.id" class="itinerary-preview-list">
                <div
                  v-for="item in request.itinerary"
                  :key="item.id"
                  class="itinerary-preview-item"
                >
                  <div class="itinerary-time">
                    <span class="date">{{ item.date }}</span>
                    <span class="time">{{ item.startTime }} - {{ item.endTime }}</span>
                  </div>
                  <div class="itinerary-location">📍 {{ item.location }}</div>
                  <div class="itinerary-desc">{{ item.description }}</div>
                </div>
              </div>
            </div>

            <div class="approval-progress">
              <div class="progress-steps">
                <div
                  v-for="(step, index) in approvalSteps"
                  :key="step.id"
                  class="progress-step"
                  :class="{
                    completed: getApprovalProgress(request.status).completed > index,
                    current: getApprovalProgress(request.status).current === index && !isBusinessTripRejected(request.status),
                    rejected: isBusinessTripRejected(request.status)
                  }"
                >
                  <div class="step-dot">
                    <span v-if="getApprovalProgress(request.status).completed > index">✓</span>
                    <span v-else-if="isBusinessTripRejected(request.status)">✕</span>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <span class="step-label">{{ step.name }}</span>
                </div>
              </div>
            </div>

            <div class="request-footer">
              <span class="request-submit-time">提交时间：{{ request.createdAt }}</span>
            </div>

            <div v-if="canApprove(request)" class="approve-actions">
              <button class="action-btn approve" @click="handleApprove(request.id)">
                ✓ 通过
              </button>
              <button class="action-btn reject" @click="handleReject(request.id)">
                ✕ 拒绝
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click="showRejectModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4 class="modal-title">拒绝出差申请</h4>
          <button class="modal-close" @click="showRejectModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">
              <span class="label-text">拒绝原因</span>
              <span class="required">*</span>
            </label>
            <textarea
              v-model="rejectReason"
              class="form-textarea"
              :class="{ error: rejectError }"
              placeholder="请输入拒绝原因..."
              rows="4"
            ></textarea>
            <span v-if="rejectError" class="error-message">{{ rejectError }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRejectModal = false">取消</button>
          <button class="btn btn-danger" @click="confirmReject">确认拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useBusinessTripStore } from '@/store/business-trip'
import { useOrganizationStore } from '@/store/organization'
import {
  BUSINESS_TRIP_STATUS,
  getBusinessTripStatusText,
  getBusinessTripStatusColor,
  getBusinessTripTypeLabel,
  getBusinessTripTypeColor,
  isBusinessTripFinalApproved,
  isBusinessTripRejected,
  isBusinessTripPending,
  getBusinessTripApprovalProgress,
  getNextApproverRole
} from '@/utils/business-trip'
import { APPROVAL_STAGES } from '@/utils/attendance'
import { ROLE_LABELS } from '@/data/employees'

const employeeStore = useEmployeeStore()
const businessTripStore = useBusinessTripStore()
const organizationStore = useOrganizationStore()

const activeTab = ref('pending')
const selectedRole = ref('')
const expandedId = ref(null)
const highlightId = ref('')
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectError = ref('')
const currentRejectId = ref('')

const approvalSteps = APPROVAL_STAGES

const currentUser = computed(() => employeeStore.currentUser)

const myManagedDeptIds = computed(() => {
  if (!currentUser.value) return []
  const userId = currentUser.value.id
  const ids = new Set()
  organizationStore.flatDepartments.forEach(dept => {
    if (dept.managerId === userId) {
      ids.add(dept.id)
      organizationStore.getAllDescendantIds(dept.id).forEach(childId => ids.add(childId))
    }
  })
  return Array.from(ids)
})

const isHr = computed(() => currentUser.value?.roles?.includes('hr'))

const isOwnDeptRequest = (req) => {
  if (isHr.value) return true
  if (myManagedDeptIds.value.length === 0) return false
  return myManagedDeptIds.value.includes(req.departmentId) || req.departmentId === undefined
}

const isReassignedToMe = (req) => {
  if (!currentUser.value) return false
  if (req.approverId && req.approverId === currentUser.value.id) return true
  if (!req.reassignHistory || req.reassignHistory.length === 0) return false
  const latest = req.reassignHistory[req.reassignHistory.length - 1]
  return latest.to === currentUser.value.id
}

const getReassignedApproverId = (req) => {
  if (req.approverId) return req.approverId
  if (!req.reassignHistory || req.reassignHistory.length === 0) return null
  const latest = req.reassignHistory[req.reassignHistory.length - 1]
  return latest.to || null
}

const myApprovalRoles = computed(() => {
  if (!currentUser.value?.roles) return []
  return currentUser.value.roles.filter(role =>
    ['supervisor', 'manager', 'hr'].includes(role)
  )
})

const allRequests = computed(() => {
  return businessTripStore.requests
})

const hasReassignedApprovals = computed(() => {
  if (!currentUser.value) return false
  return allRequests.value.some(req => {
    if (isBusinessTripFinalApproved(req.status) || isBusinessTripRejected(req.status)) return false
    if (req.status === 'cancelled') return false
    return getReassignedApproverId(req) === currentUser.value.id
  })
})

const isApprover = computed(() => {
  return myApprovalRoles.value.length > 0 || hasReassignedApprovals.value
})

const pendingRequests = computed(() => {
  let requests = []

  const reassignedRequests = allRequests.value.filter(req => {
    const reassignedApproverId = getReassignedApproverId(req)
    if (!reassignedApproverId) return false
    if (reassignedApproverId !== currentUser.value?.id) return false
    if (isBusinessTripFinalApproved(req.status) || isBusinessTripRejected(req.status)) return false
    if (req.status === 'cancelled') return false
    if (req.employeeId === currentUser.value?.id) return false
    return true
  })
  requests = requests.concat(reassignedRequests)

  const reassignedIds = new Set(reassignedRequests.map(r => r.id))

  const getFilteredByRole = (role) => {
    return businessTripStore.getPendingRequests(role).filter(req => {
      if (reassignedIds.has(req.id)) return false
      if (req.employeeId === currentUser.value?.id) return false
      return isOwnDeptRequest(req)
    })
  }

  if (selectedRole.value) {
    requests = requests.concat(getFilteredByRole(selectedRole.value))
  } else {
    myApprovalRoles.value.forEach(role => {
      requests = requests.concat(getFilteredByRole(role))
    })
  }

  const uniqueRequests = Array.from(new Map(requests.map(r => [r.id, r])).values())
  return uniqueRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const pendingCount = computed(() => {
  return pendingRequests.value.length
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'pending') {
    return pendingRequests.value
  }
  return allRequests.value
})

function getStatusText(status) {
  return getBusinessTripStatusText(status)
}

function getStatusClass(status) {
  if (isBusinessTripPending(status)) return 'pending'
  if (isBusinessTripFinalApproved(status)) return 'approved'
  if (isBusinessTripRejected(status)) return 'rejected'
  if (status === 'cancelled') return 'cancelled'
  return ''
}

function getTripTypeLabel(type) {
  return getBusinessTripTypeLabel(type)
}

function getTripTypeColor(type) {
  return getBusinessTripTypeColor(type)
}

function getApprovalProgress(status) {
  return getBusinessTripApprovalProgress(status)
}

function canApprove(request) {
  if (activeTab.value !== 'pending') return false
  if (!isBusinessTripPending(request.status)) return false

  const nextRole = getNextApproverRole(request.status)
  if (!nextRole) return false

  const reassignedApproverId = getReassignedApproverId(request)
  if (reassignedApproverId) {
    return reassignedApproverId === currentUser.value?.id
  }

  if (!isOwnDeptRequest(request)) return false

  if (selectedRole.value) {
    return selectedRole.value === nextRole
  }

  return myApprovalRoles.value.includes(nextRole)
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function handleApprove(requestId) {
  const request = businessTripStore.requests.find(r => r.id === requestId)
  if (!request) return

  const approverRole = getNextApproverRole(request.status)
  if (!approverRole) return

  businessTripStore.approveTripRequest(
    requestId,
    approverRole,
    currentUser.value?.name || '审批人'
  )
}

function handleReject(requestId) {
  currentRejectId.value = requestId
  rejectReason.value = ''
  rejectError.value = ''
  showRejectModal.value = true
}

function confirmReject() {
  if (!rejectReason.value.trim()) {
    rejectError.value = '请输入拒绝原因'
    return
  }

  const request = businessTripStore.requests.find(r => r.id === currentRejectId.value)
  if (!request) return

  const approverRole = getNextApproverRole(request.status)
  if (!approverRole) return

  businessTripStore.rejectTripRequest(
    currentRejectId.value,
    approverRole,
    currentUser.value?.name || '审批人',
    rejectReason.value.trim()
  )

  showRejectModal.value = false
}

onMounted(() => {
  businessTripStore.initBusinessTrip()
})
</script>

<style scoped>
.business-trip-approve-page {
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

.no-permission-card {
  padding: 60px 20px;
}

.no-permission {
  text-align: center;
}

.no-permission-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.no-permission-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.no-permission-desc {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.filter-card {
  padding: 16px 18px;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #f5f7fa;
  padding: 4px;
  border-radius: 10px;
}

.tab-item {
  padding: 8px 18px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
  -webkit-user-select: none;
  user-select: none;
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

.tab-badge {
  background: #ff4d4f;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.role-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.role-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.role-tab {
  padding: 6px 14px;
  font-size: 12px;
  color: #666;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-user-select: none;
  user-select: none;
}

.role-tab:active {
  background: #e8e8e8;
}

.role-tab.active {
  background: #667eea;
  color: white;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #f0f5ff;
  color: #667eea;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 10px;
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

.request-item.request-highlight {
  border-color: #667eea;
  background: #f0f5ff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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

.trip-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.request-applicant {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.applicant-dept {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.request-status {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.request-status.pending {
  background: #fffbe6;
  color: #faad14;
}

.request-status.approved {
  background: #f6ffed;
  color: #52c41a;
}

.request-status.rejected,
.request-status.cancelled {
  background: #fff1f0;
  color: #f5222d;
}

.request-body {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.request-date,
.request-destination {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.date-text,
.dest-text {
  font-weight: 500;
  color: #333;
}

.days-badge {
  background: #f0f5ff;
  color: #667eea;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.request-reason {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.reason-label {
  color: #999;
}

.reason-text {
  color: #666;
}

.itinerary-preview {
  margin-bottom: 12px;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.itinerary-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
}

.itinerary-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.expand-icon {
  font-size: 10px;
  color: #999;
}

.itinerary-preview-list {
  padding: 0 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.itinerary-preview-item {
  padding: 8px 10px;
  background: white;
  border-radius: 6px;
  border-left: 2px solid #667eea;
}

.itinerary-time {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.itinerary-time .date {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
}

.itinerary-time .time {
  font-size: 11px;
  color: #999;
}

.itinerary-location {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.itinerary-desc {
  font-size: 11px;
  color: #999;
  line-height: 1.5;
}

.approval-progress {
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
  margin-bottom: 12px;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
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
  top: 10px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e8e8e8;
  z-index: 0;
}

.progress-step.completed:not(:last-child)::after {
  background: #52c41a;
}

.step-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

.progress-step.completed .step-dot {
  background: #52c41a;
  color: white;
}

.progress-step.current .step-dot {
  background: #667eea;
  color: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.progress-step.rejected .step-dot {
  background: #f5222d;
  color: white;
}

.step-label {
  font-size: 11px;
  color: #999;
}

.progress-step.completed .step-label,
.progress-step.current .step-label {
  color: #333;
  font-weight: 500;
}

.request-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.request-submit-time {
  font-size: 11px;
  color: #999;
}

.approve-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.action-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 40px;
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

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.form-row {
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

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  transition: border-color 0.15s;
  font-family: inherit;
  background: #fafafa;
  min-height: 100px;
  resize: vertical;
  line-height: 1.6;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea.error {
  border-color: #f5222d;
  background: #fff1f0;
}

.error-message {
  font-size: 12px;
  color: #f5222d;
  padding: 4px 4px 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}

.btn-secondary {
  background: #f5f7fa;
  color: #666;
  border: 1px solid #e8e8e8;
}

.btn-secondary:active {
  background: #e8e8e8;
}

.btn-danger {
  background: #f5222d;
  color: white;
}

.btn-danger:active {
  background: #d4380d;
}

@media (min-width: 769px) {
  .tab-item:hover {
    color: #667eea;
  }

  .role-tab:hover {
    background: #e8edff;
    color: #667eea;
  }

  .role-tab.active:hover {
    background: #667eea;
    color: white;
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

  .btn-danger:hover {
    background: #d4380d;
  }

  .btn-secondary:hover {
    background: #e8e8e8;
  }
}

@media (max-width: 768px) {
  .business-trip-approve-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .filter-card {
    padding: 14px 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tabs {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .tab-item {
    flex-shrink: 0;
  }

  .role-filter {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .request-status {
    align-self: flex-start;
  }

  .request-body {
    flex-direction: column;
    gap: 8px;
  }

  .approve-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .card-title {
    font-size: 14px;
  }

  .no-permission-icon {
    font-size: 48px;
  }

  .no-permission-title {
    font-size: 16px;
  }

  .no-permission-desc {
    font-size: 13px;
  }
}
</style>
