<template>
  <div class="makeup-page">
    <div class="page-header">
      <h2 class="page-title">补卡申请</h2>
      <p class="page-subtitle">提交补卡申请，修正考勤记录</p>
    </div>

    <div class="card form-card">
      <h4 class="card-title">填写补卡信息</h4>
      <form @submit.prevent="handleSubmit" class="makeup-form">
        <div class="form-row">
          <label class="form-label">
            <span class="label-text">补卡日期</span>
            <span class="required">*</span>
          </label>
          <input
            v-model="formData.date"
            type="date"
            class="form-input"
            :class="{ error: errors.date }"
            :max="today"
          />
          <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">补卡类型</span>
            <span class="required">*</span>
          </label>
          <div class="radio-group">
            <label class="radio-item" :class="{ active: formData.type === 'checkin' }">
              <input
                v-model="formData.type"
                type="radio"
                value="checkin"
                name="makeupType"
              />
              <span class="radio-label">上班补卡</span>
            </label>
            <label class="radio-item" :class="{ active: formData.type === 'checkout' }">
              <input
                v-model="formData.type"
                type="radio"
                value="checkout"
                name="makeupType"
              />
              <span class="radio-label">下班补卡</span>
            </label>
          </div>
          <span v-if="errors.type" class="error-message">{{ errors.type }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">补卡时间</span>
            <span class="required">*</span>
          </label>
          <input
            v-model="formData.time"
            type="time"
            class="form-input"
            :class="{ error: errors.time }"
          />
          <span v-if="errors.time" class="error-message">{{ errors.time }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">补卡原因</span>
            <span class="required">*</span>
          </label>
          <textarea
            v-model="formData.reason"
            class="form-textarea"
            :class="{ error: errors.reason }"
            placeholder="请详细说明补卡原因..."
            rows="4"
          ></textarea>
          <div class="char-count">{{ formData.reason.length }}/200</div>
          <span v-if="errors.reason" class="error-message">{{ errors.reason }}</span>
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
        <h4 class="card-title">我的补卡申请</h4>
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
            :class="{ active: activeTab === 'pending' }"
            @click="activeTab = 'pending'"
          >
            待审批
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

      <div v-if="filteredRequests.length === 0" class="empty-state">
        <span class="empty-icon">📋</span>
        <p>暂无补卡申请记录</p>
      </div>

      <div v-else class="requests-list">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="request-item"
          :class="{ 'request-highlight': highlightedId && request.id === highlightedId }"
          :ref="el => setRequestRef(el, request.id)"
        >
          <div class="request-header">
            <div class="request-info">
              <span class="request-date">{{ request.date }}</span>
              <span class="request-type" :class="request.type">
                {{ request.type === 'checkin' ? '上班补卡' : '下班补卡' }}
              </span>
              <span class="request-time">{{ request.time }}</span>
              <span v-if="request.employeeName && request.employeeId !== currentUser?.id" class="request-applicant">
                申请人：{{ request.employeeName }}
              </span>
            </div>
            <span class="request-status" :class="request.status">
              {{ getStatusText(request.status) }}
            </span>
          </div>
          <div class="request-reason">
            <span class="reason-label">补卡原因：</span>
            <span class="reason-text">{{ request.reason }}</span>
          </div>
          <div class="request-footer">
            <span class="request-submit-time">提交时间：{{ request.createdAt }}</span>
            <div class="request-actions" v-if="request.status === 'pending' && isAdmin && isOwnDeptRequest(request)">
              <button class="action-btn approve" @click="approveRequest(request.id)">
                通过
              </button>
              <button class="action-btn reject" @click="rejectRequest(request.id)">
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
import { ref, computed, reactive, onMounted, onUpdated, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '@/store/employee'
import { useAttendanceStore } from '@/store/attendance'
import { useOrganizationStore } from '@/store/organization'
import { getToday } from '@/utils/date'

const route = useRoute()
const router = useRouter()

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()
const organizationStore = useOrganizationStore()

const today = getToday()
const activeTab = ref('all')
const highlightedId = ref('')
const isApprovalMode = ref(false)
const requestRefs = new Map()

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

const isAdmin = computed(() => {
  if (!currentUser.value?.roles) return false
  return currentUser.value.roles.includes('manager') ||
         currentUser.value.roles.includes('hr') ||
         currentUser.value.roles.includes('supervisor')
})

const formData = reactive({
  date: '',
  type: 'checkin',
  time: '',
  reason: ''
})

const errors = reactive({
  date: '',
  type: '',
  time: '',
  reason: ''
})

function setRequestRef(el, id) {
  if (el) {
    requestRefs.set(id, el)
  } else {
    requestRefs.delete(id)
  }
}

function scrollToRequest(id) {
  nextTick(() => {
    const el = requestRefs.get(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function handleParamsChange() {
  const dateFromQuery = route.query.date
  const typeFromQuery = route.query.type
  const requestIdFromQuery = route.query.requestId
  const applicantIdFromQuery = route.query.applicantId
  const requestTypeFromQuery = route.query.requestType

  if (dateFromQuery && typeof dateFromQuery === 'string') {
    formData.date = dateFromQuery
  }

  if (typeFromQuery && typeof typeFromQuery === 'string') {
    formData.type = typeFromQuery
  }

  if (applicantIdFromQuery && typeof applicantIdFromQuery === 'string' && isAdmin.value) {
    isApprovalMode.value = true
    activeTab.value = 'pending'
  }

  if (requestIdFromQuery && typeof requestIdFromQuery === 'string') {
    highlightedId.value = requestIdFromQuery
  }
}

function highlightAndScroll() {
  const requestIdFromQuery = route.query.requestId
  if (requestIdFromQuery) {
    highlightedId.value = requestIdFromQuery
    scrollToRequest(requestIdFromQuery)
    setTimeout(() => scrollToRequest(requestIdFromQuery), 200)
    setTimeout(() => {
      highlightedId.value = ''
    }, 3000)
  }
}

onMounted(() => {
  handleParamsChange()
  highlightAndScroll()
})

onUpdated(() => {
  highlightAndScroll()
})

watch(
  () => [route.query.date, route.query.type, route.query.requestId, route.query.applicantId, route.query.requestType],
  () => {
    handleParamsChange()
    highlightAndScroll()
  }
)

const myRequests = computed(() => {
  if (!currentUser.value) return []
  if (isApprovalMode.value && isAdmin.value) {
    const applicantIdFromQuery = route.query.applicantId
    let allRequests = attendanceStore.makeupRequests
    if (applicantIdFromQuery && typeof applicantIdFromQuery === 'string') {
      allRequests = allRequests.filter(r => r.employeeId === applicantIdFromQuery)
    }
    return allRequests.filter(r => isOwnDeptRequest(r))
  }
  return attendanceStore.getEmployeeMakeupRequests(currentUser.value.id)
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return myRequests.value
  return myRequests.value.filter(r => r.status === activeTab.value)
})

function getStatusText(status) {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

function validateForm() {
  let valid = true

  if (!formData.date) {
    errors.date = '请选择补卡日期'
    valid = false
  } else {
    errors.date = ''
  }

  if (!formData.type) {
    errors.type = '请选择补卡类型'
    valid = false
  } else {
    errors.type = ''
  }

  if (!formData.time) {
    errors.time = '请选择补卡时间'
    valid = false
  } else {
    errors.time = ''
  }

  if (!formData.reason.trim()) {
    errors.reason = '请填写补卡原因'
    valid = false
  } else if (formData.reason.length < 10) {
    errors.reason = '补卡原因至少10个字符'
    valid = false
  } else if (formData.reason.length > 200) {
    errors.reason = '补卡原因不能超过200个字符'
    valid = false
  } else {
    errors.reason = ''
  }

  return valid
}

function clearQueryParams() {
  if (route.query.date) {
    router.replace({
      query: {}
    })
  }
}

function handleSubmit() {
  if (!validateForm()) return
  if (!currentUser.value) {
    attendanceStore.showToast('请先登录', 'error')
    return
  }

  attendanceStore.submitMakeupRequest({
    employeeId: currentUser.value.id,
    employeeName: currentUser.value.name,
    department: currentUser.value.department,
    departmentId: currentUser.value.departmentId,
    date: formData.date,
    type: formData.type,
    time: formData.time,
    reason: formData.reason.trim()
  })

  resetForm()
  clearQueryParams()
}

function resetForm() {
  formData.date = ''
  formData.type = 'checkin'
  formData.time = ''
  formData.reason = ''
  errors.date = ''
  errors.type = ''
  errors.time = ''
  errors.reason = ''
  clearQueryParams()
}

function approveRequest(id) {
  attendanceStore.approveMakeupRequest(id)
}

function rejectRequest(id) {
  attendanceStore.rejectMakeupRequest(id)
}
</script>

<style scoped>
.makeup-page {
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

.makeup-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3ccircle cx='12' cy='12' r='10'%3e%3c/circle%3e%3cpolyline points='12 6 12 12 16 14'%3e%3c/polyline%3e%3c/svg%3e");
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

.radio-group {
  display: flex;
  gap: 12px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  flex: 1;
  background: #fafafa;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

.radio-item:active {
  transform: scale(0.98);
}

.radio-item.active {
  border-color: #667eea;
  background: #f0f7ff;
}

.radio-item input[type="radio"] {
  accent-color: #667eea;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.radio-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
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
  gap: 10px;
}

.request-item {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px 16px;
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
  margin-bottom: 10px;
  gap: 10px;
  flex-wrap: wrap;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.request-date {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.request-type {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.request-type.checkin {
  background: #e6f7ff;
  color: #1890ff;
}

.request-type.checkout {
  background: #fff7e6;
  color: #fa8c16;
}

.request-time {
  font-size: 13px;
  color: #666;
  font-variant-numeric: tabular-nums;
}

.request-applicant {
  font-size: 12px;
  color: #999;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

.request-item.request-highlight {
  border-color: #667eea;
  background: #f0f5ff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  animation: highlightPulse 1.5s ease-in-out 2;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.4);
  }
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

.request-status.rejected {
  background: #fff1f0;
  color: #f5222d;
}

.request-reason {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
  word-break: break-word;
}

.reason-label {
  color: #999;
}

.request-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
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

  .radio-item:hover {
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
  .makeup-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .radio-group {
    flex-direction: column;
    gap: 10px;
  }

  .radio-item {
    padding: 14px 16px;
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
  }

  .action-btn {
    flex: 1;
    padding: 10px 16px;
    font-size: 14px;
  }

  .form-input,
  .form-textarea {
    font-size: 16px;
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

  .radio-label {
    font-size: 14px;
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
}
</style>
