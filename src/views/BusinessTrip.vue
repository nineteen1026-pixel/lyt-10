<template>
  <div class="business-trip-page">
    <div class="page-header">
      <h2 class="page-title">出差申请</h2>
      <p class="page-subtitle">提交出差申请，审批通过后自动豁免考勤异常</p>
    </div>

    <div class="card form-card">
      <h4 class="card-title">填写出差信息</h4>
      <form @submit.prevent="handleSubmit" class="trip-form">
        <div class="form-row">
          <label class="form-label">
            <span class="label-text">出差类型</span>
            <span class="required">*</span>
          </label>
          <div class="trip-type-grid">
            <label
              v-for="type in tripTypes"
              :key="type.value"
              class="trip-type-item"
              :class="{ active: formData.tripType === type.value }"
            >
              <input
                v-model="formData.tripType"
                type="radio"
                :value="type.value"
                name="tripType"
              />
              <span class="type-dot" :style="{ background: type.color }"></span>
              <span class="type-label">{{ type.label }}</span>
            </label>
          </div>
          <span v-if="errors.tripType" class="error-message">{{ errors.tripType }}</span>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">出差目的地</span>
            <span class="required">*</span>
          </label>
          <input
            v-model="formData.destination"
            type="text"
            class="form-input"
            :class="{ error: errors.destination }"
            placeholder="请输入出差目的地"
          />
          <span v-if="errors.destination" class="error-message">{{ errors.destination }}</span>
        </div>

        <div class="form-row form-row-inline">
          <div class="form-col">
            <label class="form-label">
              <span class="label-text">开始日期</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="formData.startDate"
              type="date"
              class="form-input"
              :class="{ error: errors.startDate }"
              @change="calculateDays"
            />
            <span v-if="errors.startDate" class="error-message">{{ errors.startDate }}</span>
          </div>
          <div class="form-col">
            <label class="form-label">
              <span class="label-text">结束日期</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="formData.endDate"
              type="date"
              class="form-input"
              :class="{ error: errors.endDate }"
              @change="calculateDays"
            />
            <span v-if="errors.endDate" class="error-message">{{ errors.endDate }}</span>
          </div>
        </div>

        <div v-if="formData.startDate && formData.endDate" class="form-row">
          <label class="form-label">
            <span class="label-text">出差天数</span>
          </label>
          <div class="days-display">
            <span class="days-count">{{ formData.days }}</span>
            <span class="days-unit">天</span>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">
            <span class="label-text">出差原因</span>
            <span class="required">*</span>
          </label>
          <textarea
            v-model="formData.reason"
            class="form-textarea"
            :class="{ error: errors.reason }"
            placeholder="请详细说明出差原因..."
            rows="3"
          ></textarea>
          <div class="char-count">{{ formData.reason.length }}/500</div>
          <span v-if="errors.reason" class="error-message">{{ errors.reason }}</span>
        </div>

        <div class="form-row">
          <div class="form-label-row">
            <label class="form-label">
              <span class="label-text">行程明细</span>
            </label>
            <button type="button" class="btn-add-itinerary" @click="showAddItinerary = true">
              <span class="add-icon">+</span> 添加行程
            </button>
          </div>

          <div v-if="itineraryList.length === 0" class="empty-itinerary">
            <span class="empty-icon">📋</span>
            <p>暂无行程明细，可点击上方按钮添加</p>
          </div>

          <div v-else class="itinerary-list">
            <div
              v-for="(item, index) in itineraryList"
              :key="item.id || index"
              class="itinerary-item"
            >
              <div class="itinerary-header">
                <span class="itinerary-date">{{ item.date }}</span>
                <span class="itinerary-time">{{ item.startTime }} - {{ item.endTime }}</span>
                <button
                  type="button"
                  class="itinerary-delete"
                  @click="removeItinerary(item.id || index)"
                >
                  删除
                </button>
              </div>
              <div class="itinerary-location">📍 {{ item.location }}</div>
              <div class="itinerary-desc">{{ item.description }}</div>
            </div>
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
        <h4 class="card-title">我的出差申请</h4>
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
        <span class="empty-icon">✈️</span>
        <p>暂无出差申请记录</p>
      </div>

      <div v-else class="requests-list">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="request-item"
          @click="toggleExpand(request.id)"
        >
          <div class="request-header">
            <div class="request-info">
              <span
                class="trip-type-badge"
                :style="{ background: getTripTypeColor(request.tripType) + '20', color: getTripTypeColor(request.tripType) }"
              >
                {{ getTripTypeLabel(request.tripType) }}
              </span>
              <span class="request-date">{{ request.startDate }} ~ {{ request.endDate }}</span>
            </div>
            <span class="request-status" :class="getStatusClass(request.status)">
              {{ getStatusText(request.status) }}
            </span>
          </div>

          <div class="request-body">
            <div class="request-destination">
              <span class="label">目的地：</span>
              <span class="value">{{ request.destination }}</span>
            </div>
            <div class="request-days">
              <span class="days-number">{{ request.days }}</span>
              <span class="days-text">天</span>
            </div>
          </div>

          <div class="request-reason">
            <span class="reason-label">出差原因：</span>
            <span class="reason-text">{{ request.reason }}</span>
          </div>

          <div class="approval-progress">
            <div class="progress-steps">
              <div
                v-for="(step, index) in approvalSteps"
                :key="step.id"
                class="progress-step"
                :class="{
                  completed: getApprovalProgress(request.status).completed > index,
                  current: getApprovalProgress(request.status).current === index && !isBusinessTripRejected(request.status) && request.status !== 'cancelled',
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

          <div v-if="expandedId === request.id" class="request-detail">
            <div v-if="request.itinerary && request.itinerary.length > 0" class="detail-section">
              <div class="detail-section-header">
                <h5 class="detail-title">行程明细</h5>
                <div v-if="isBusinessTripPending(request.status)" class="detail-section-actions">
                  <button type="button" class="btn-link-add" @click.stop="openDetailItineraryModal(request.id)">
                    <span class="add-icon">+</span> 添加行程
                  </button>
                </div>
              </div>
              <div class="detail-itinerary">
                <div
                  v-for="item in request.itinerary"
                  :key="item.id"
                  class="detail-itinerary-item"
                >
                  <div class="itinerary-time">
                    <span class="date">{{ item.date }}</span>
                    <span class="time">{{ item.startTime }} - {{ item.endTime }}</span>
                  </div>
                  <div class="itinerary-info">
                    <div class="location">📍 {{ item.location }}</div>
                    <div class="description">{{ item.description }}</div>
                  </div>
                  <div v-if="isBusinessTripPending(request.status)" class="itinerary-item-actions">
                    <button type="button" class="item-action-btn edit" @click.stop="openDetailEditItineraryModal(request.id, item)">
                      编辑
                    </button>
                    <button type="button" class="item-action-btn delete" @click.stop="deleteDetailItinerary(request.id, item.id)">
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="isBusinessTripPending(request.status)" class="detail-section">
              <div class="detail-section-header">
                <h5 class="detail-title">行程明细</h5>
                <div class="detail-section-actions">
                  <button type="button" class="btn-link-add" @click.stop="openDetailItineraryModal(request.id)">
                    <span class="add-icon">+</span> 添加行程
                  </button>
                </div>
              </div>
              <div class="empty-itinerary detail-empty">
                <span class="empty-icon">📋</span>
                <p>暂无行程明细，点击右上角添加</p>
              </div>
            </div>

            <div v-if="request.approvalHistory && request.approvalHistory.length > 0" class="detail-section">
              <h5 class="detail-title">审批记录</h5>
              <div class="approval-history">
                <div
                  v-for="(record, index) in request.approvalHistory"
                  :key="index"
                  class="history-item"
                >
                  <div class="history-dot" :class="record.action"></div>
                  <div class="history-content">
                    <div class="history-header">
                      <span class="history-role">{{ getRoleLabel(record.role) }}</span>
                      <span class="history-name">{{ record.name }}</span>
                      <span class="history-action" :class="record.action">
                        {{ record.action === 'approve' ? '通过' : '拒绝' }}
                      </span>
                    </div>
                    <div class="history-time">{{ record.time }}</div>
                    <div v-if="record.reason" class="history-reason">原因：{{ record.reason }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="request-footer">
              <span class="request-submit-time">提交时间：{{ request.createdAt }}</span>
              <div v-if="isBusinessTripPending(request.status)" class="request-actions">
                <button class="action-btn cancel" @click.stop="cancelRequest(request.id)">
                  取消申请
                </button>
              </div>
            </div>
          </div>

          <div class="expand-indicator">
            <span v-if="expandedId === request.id">▲</span>
            <span v-else>▼</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddItinerary" class="modal-overlay" @click="showAddItinerary = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4 class="modal-title">添加行程</h4>
          <button class="modal-close" @click="showAddItinerary = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">
              <span class="label-text">行程日期</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="itineraryForm.date"
              type="date"
              class="form-input"
              :class="{ error: itineraryErrors.date }"
              :min="formData.startDate"
              :max="formData.endDate"
            />
            <span v-if="itineraryErrors.date" class="error-message">{{ itineraryErrors.date }}</span>
            <p v-if="formData.startDate && formData.endDate" class="date-hint">
              可选择范围：{{ formData.startDate }} ~ {{ formData.endDate }}
            </p>
          </div>

          <div class="form-row form-row-inline">
            <div class="form-col">
              <label class="form-label">
                <span class="label-text">开始时间</span>
                <span class="required">*</span>
              </label>
              <input
                v-model="itineraryForm.startTime"
                type="time"
                class="form-input"
                :class="{ error: itineraryErrors.startTime }"
              />
              <span v-if="itineraryErrors.startTime" class="error-message">{{ itineraryErrors.startTime }}</span>
            </div>
            <div class="form-col">
              <label class="form-label">
                <span class="label-text">结束时间</span>
                <span class="required">*</span>
              </label>
              <input
                v-model="itineraryForm.endTime"
                type="time"
                class="form-input"
                :class="{ error: itineraryErrors.endTime }"
              />
              <span v-if="itineraryErrors.endTime" class="error-message">{{ itineraryErrors.endTime }}</span>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">
              <span class="label-text">地点</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="itineraryForm.location"
              type="text"
              class="form-input"
              :class="{ error: itineraryErrors.location }"
              placeholder="请输入行程地点"
            />
            <span v-if="itineraryErrors.location" class="error-message">{{ itineraryErrors.location }}</span>
          </div>

          <div class="form-row">
            <label class="form-label">
              <span class="label-text">行程描述</span>
              <span class="required">*</span>
            </label>
            <textarea
              v-model="itineraryForm.description"
              class="form-textarea"
              :class="{ error: itineraryErrors.description }"
              placeholder="请输入行程详情"
              rows="3"
            ></textarea>
            <span v-if="itineraryErrors.description" class="error-message">{{ itineraryErrors.description }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddItinerary = false">取消</button>
          <button class="btn btn-primary" @click="addItinerary">确认添加</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailItineraryModal" class="modal-overlay" @click="closeDetailItineraryModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4 class="modal-title">{{ detailItineraryEditingId ? '编辑行程' : '添加行程' }}</h4>
          <button class="modal-close" @click="closeDetailItineraryModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">
              <span class="label-text">行程日期</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="detailItineraryForm.date"
              type="date"
              class="form-input"
              :class="{ error: detailItineraryErrors.date }"
              :min="detailEditingRequest?.startDate"
              :max="detailEditingRequest?.endDate"
            />
            <span v-if="detailItineraryErrors.date" class="error-message">{{ detailItineraryErrors.date }}</span>
            <p v-if="detailEditingRequest" class="date-hint">
              可选择范围：{{ detailEditingRequest.startDate }} ~ {{ detailEditingRequest.endDate }}
            </p>
          </div>

          <div class="form-row form-row-inline">
            <div class="form-col">
              <label class="form-label">
                <span class="label-text">开始时间</span>
                <span class="required">*</span>
              </label>
              <input
                v-model="detailItineraryForm.startTime"
                type="time"
                class="form-input"
                :class="{ error: detailItineraryErrors.startTime }"
              />
              <span v-if="detailItineraryErrors.startTime" class="error-message">{{ detailItineraryErrors.startTime }}</span>
            </div>
            <div class="form-col">
              <label class="form-label">
                <span class="label-text">结束时间</span>
                <span class="required">*</span>
              </label>
              <input
                v-model="detailItineraryForm.endTime"
                type="time"
                class="form-input"
                :class="{ error: detailItineraryErrors.endTime }"
              />
              <span v-if="detailItineraryErrors.endTime" class="error-message">{{ detailItineraryErrors.endTime }}</span>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label">
              <span class="label-text">地点</span>
              <span class="required">*</span>
            </label>
            <input
              v-model="detailItineraryForm.location"
              type="text"
              class="form-input"
              :class="{ error: detailItineraryErrors.location }"
              placeholder="请输入行程地点"
            />
            <span v-if="detailItineraryErrors.location" class="error-message">{{ detailItineraryErrors.location }}</span>
          </div>

          <div class="form-row">
            <label class="form-label">
              <span class="label-text">行程描述</span>
              <span class="required">*</span>
            </label>
            <textarea
              v-model="detailItineraryForm.description"
              class="form-textarea"
              :class="{ error: detailItineraryErrors.description }"
              placeholder="请输入行程详情"
              rows="3"
            ></textarea>
            <span v-if="detailItineraryErrors.description" class="error-message">{{ detailItineraryErrors.description }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDetailItineraryModal">取消</button>
          <button class="btn btn-primary" @click="submitDetailItinerary">
            {{ detailItineraryEditingId ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useBusinessTripStore } from '@/store/business-trip'
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
  calculateBusinessTripDays,
  BUSINESS_TRIP_TYPES
} from '@/utils/business-trip'
import { APPROVAL_STAGES } from '@/utils/attendance'
import { ROLE_LABELS } from '@/data/employees'

const employeeStore = useEmployeeStore()
const businessTripStore = useBusinessTripStore()

const activeTab = ref('all')
const expandedId = ref(null)
const showAddItinerary = ref(false)
const showDetailItineraryModal = ref(false)
const detailEditingRequestId = ref(null)
const detailItineraryEditingId = ref(null)

const approvalSteps = APPROVAL_STAGES

const currentUser = computed(() => employeeStore.currentUser)
const tripTypes = BUSINESS_TRIP_TYPES

const formData = reactive({
  tripType: 'domestic',
  destination: '',
  startDate: '',
  endDate: '',
  days: 0,
  reason: ''
})

const errors = reactive({
  tripType: '',
  destination: '',
  startDate: '',
  endDate: '',
  reason: ''
})

const itineraryList = ref([])

const itineraryForm = reactive({
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  description: ''
})

const itineraryErrors = reactive({
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  description: ''
})

const detailItineraryForm = reactive({
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  description: ''
})

const detailItineraryErrors = reactive({
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  description: ''
})

const detailEditingRequest = computed(() => {
  if (!detailEditingRequestId.value) return null
  return myRequests.value.find(r => r.id === detailEditingRequestId.value)
})

const myRequests = computed(() => {
  if (!currentUser.value) return []
  return businessTripStore.getEmployeeRequests(currentUser.value.id)
})

const filteredRequests = computed(() => {
  if (activeTab.value === 'all') return myRequests.value
  if (activeTab.value === 'pending') {
    return myRequests.value.filter(r => isBusinessTripPending(r.status))
  }
  if (activeTab.value === 'approved') {
    return myRequests.value.filter(r => isBusinessTripFinalApproved(r.status))
  }
  if (activeTab.value === 'rejected') {
    return myRequests.value.filter(r => isBusinessTripRejected(r.status) || r.status === 'cancelled')
  }
  return myRequests.value
})

function getStatusText(status) {
  return getBusinessTripStatusText(status)
}

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role
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

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function calculateDays() {
  formData.days = calculateBusinessTripDays(formData.startDate, formData.endDate)
}

function validateForm() {
  let valid = true

  if (!formData.tripType) {
    errors.tripType = '请选择出差类型'
    valid = false
  } else {
    errors.tripType = ''
  }

  if (!formData.destination.trim()) {
    errors.destination = '请输入出差目的地'
    valid = false
  } else {
    errors.destination = ''
  }

  if (!formData.startDate) {
    errors.startDate = '请选择开始日期'
    valid = false
  } else {
    errors.startDate = ''
  }

  if (!formData.endDate) {
    errors.endDate = '请选择结束日期'
    valid = false
  } else if (formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
    errors.endDate = '结束日期不能早于开始日期'
    valid = false
  } else {
    errors.endDate = ''
  }

  if (!formData.reason.trim()) {
    errors.reason = '请填写出差原因'
    valid = false
  } else if (formData.reason.length < 10) {
    errors.reason = '出差原因至少10个字符'
    valid = false
  } else if (formData.reason.length > 500) {
    errors.reason = '出差原因不能超过500个字符'
    valid = false
  } else {
    errors.reason = ''
  }

  return valid
}

function handleSubmit() {
  if (!validateForm()) return
  if (!currentUser.value) {
    businessTripStore.showToast('请先登录', 'error')
    return
  }

  calculateDays()

  businessTripStore.submitTripRequest({
    employeeId: currentUser.value.id,
    employeeName: currentUser.value.name,
    department: currentUser.value.department,
    tripType: formData.tripType,
    destination: formData.destination,
    startDate: formData.startDate,
    endDate: formData.endDate,
    days: formData.days,
    reason: formData.reason.trim(),
    itinerary: [...itineraryList.value]
  })

  resetForm()
}

function resetForm() {
  formData.tripType = 'domestic'
  formData.destination = ''
  formData.startDate = ''
  formData.endDate = ''
  formData.days = 0
  formData.reason = ''
  itineraryList.value = []
  errors.tripType = ''
  errors.destination = ''
  errors.startDate = ''
  errors.endDate = ''
  errors.reason = ''
}

function validateItineraryForm() {
  let valid = true

  if (!itineraryForm.date) {
    itineraryErrors.date = '请选择行程日期'
    valid = false
  } else if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const current = new Date(itineraryForm.date)
    if (current < start || current > end) {
      itineraryErrors.date = `行程日期需在 ${formData.startDate} ~ ${formData.endDate} 之间`
      valid = false
    } else {
      itineraryErrors.date = ''
    }
  } else {
    itineraryErrors.date = ''
  }

  if (!itineraryForm.startTime) {
    itineraryErrors.startTime = '请选择开始时间'
    valid = false
  } else {
    itineraryErrors.startTime = ''
  }

  if (!itineraryForm.endTime) {
    itineraryErrors.endTime = '请选择结束时间'
    valid = false
  } else if (itineraryForm.startTime && itineraryForm.endTime <= itineraryForm.startTime) {
    itineraryErrors.endTime = '结束时间必须晚于开始时间'
    valid = false
  } else {
    itineraryErrors.endTime = ''
  }

  if (!itineraryForm.location.trim()) {
    itineraryErrors.location = '请输入行程地点'
    valid = false
  } else {
    itineraryErrors.location = ''
  }

  if (!itineraryForm.description.trim()) {
    itineraryErrors.description = '请输入行程描述'
    valid = false
  } else {
    itineraryErrors.description = ''
  }

  return valid
}

function addItinerary() {
  if (!validateItineraryForm()) return

  itineraryList.value.push({
    id: 'temp_' + Date.now(),
    date: itineraryForm.date,
    startTime: itineraryForm.startTime,
    endTime: itineraryForm.endTime,
    location: itineraryForm.location,
    description: itineraryForm.description
  })

  itineraryList.value.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startTime.localeCompare(b.startTime)
  })

  resetItineraryForm()
  showAddItinerary.value = false
}

function removeItinerary(id) {
  const index = itineraryList.value.findIndex(item => item.id === id)
  if (index > -1) {
    itineraryList.value.splice(index, 1)
  }
}

function resetItineraryForm() {
  itineraryForm.date = ''
  itineraryForm.startTime = ''
  itineraryForm.endTime = ''
  itineraryForm.location = ''
  itineraryForm.description = ''
  itineraryErrors.date = ''
  itineraryErrors.startTime = ''
  itineraryErrors.endTime = ''
  itineraryErrors.location = ''
  itineraryErrors.description = ''
}

function cancelRequest(requestId) {
  if (confirm('确定要取消此出差申请吗？')) {
    businessTripStore.cancelTripRequest(requestId)
  }
}

function openDetailItineraryModal(requestId) {
  detailEditingRequestId.value = requestId
  detailItineraryEditingId.value = null
  resetDetailItineraryForm()
  showDetailItineraryModal.value = true
}

function openDetailEditItineraryModal(requestId, item) {
  detailEditingRequestId.value = requestId
  detailItineraryEditingId.value = item.id
  detailItineraryForm.date = item.date
  detailItineraryForm.startTime = item.startTime
  detailItineraryForm.endTime = item.endTime
  detailItineraryForm.location = item.location
  detailItineraryForm.description = item.description
  showDetailItineraryModal.value = true
}

function closeDetailItineraryModal() {
  showDetailItineraryModal.value = false
  detailEditingRequestId.value = null
  detailItineraryEditingId.value = null
  resetDetailItineraryForm()
}

function resetDetailItineraryForm() {
  detailItineraryForm.date = ''
  detailItineraryForm.startTime = ''
  detailItineraryForm.endTime = ''
  detailItineraryForm.location = ''
  detailItineraryForm.description = ''
  detailItineraryErrors.date = ''
  detailItineraryErrors.startTime = ''
  detailItineraryErrors.endTime = ''
  detailItineraryErrors.location = ''
  detailItineraryErrors.description = ''
}

function validateDetailItineraryForm() {
  let valid = true

  if (!detailItineraryForm.date) {
    detailItineraryErrors.date = '请选择行程日期'
    valid = false
  } else if (detailEditingRequest.value) {
    const start = new Date(detailEditingRequest.value.startDate)
    const end = new Date(detailEditingRequest.value.endDate)
    const current = new Date(detailItineraryForm.date)
    if (current < start || current > end) {
      detailItineraryErrors.date = `行程日期需在 ${detailEditingRequest.value.startDate} ~ ${detailEditingRequest.value.endDate} 之间`
      valid = false
    } else {
      detailItineraryErrors.date = ''
    }
  } else {
    detailItineraryErrors.date = ''
  }

  if (!detailItineraryForm.startTime) {
    detailItineraryErrors.startTime = '请选择开始时间'
    valid = false
  } else {
    detailItineraryErrors.startTime = ''
  }

  if (!detailItineraryForm.endTime) {
    detailItineraryErrors.endTime = '请选择结束时间'
    valid = false
  } else if (detailItineraryForm.startTime && detailItineraryForm.endTime <= detailItineraryForm.startTime) {
    detailItineraryErrors.endTime = '结束时间必须晚于开始时间'
    valid = false
  } else {
    detailItineraryErrors.endTime = ''
  }

  if (!detailItineraryForm.location.trim()) {
    detailItineraryErrors.location = '请输入行程地点'
    valid = false
  } else {
    detailItineraryErrors.location = ''
  }

  if (!detailItineraryForm.description.trim()) {
    detailItineraryErrors.description = '请输入行程描述'
    valid = false
  } else {
    detailItineraryErrors.description = ''
  }

  return valid
}

function submitDetailItinerary() {
  if (!validateDetailItineraryForm() || !detailEditingRequestId.value) return

  if (detailItineraryEditingId.value) {
    businessTripStore.updateItineraryItem(
      detailEditingRequestId.value,
      detailItineraryEditingId.value,
      { ...detailItineraryForm }
    )
    businessTripStore.showToast('行程已更新', 'success')
  } else {
    businessTripStore.addItineraryItem(
      detailEditingRequestId.value,
      { ...detailItineraryForm }
    )
    businessTripStore.showToast('行程已添加', 'success')
  }

  closeDetailItineraryModal()
}

function deleteDetailItinerary(requestId, itemId) {
  if (confirm('确定要删除这条行程吗？')) {
    const result = businessTripStore.removeItineraryItem(requestId, itemId)
    if (result) {
      businessTripStore.showToast('行程已删除', 'success')
    }
  }
}

onMounted(() => {
  businessTripStore.initBusinessTrip()
})
</script>

<style scoped>
.business-trip-page {
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

.trip-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row-inline {
  flex-direction: row;
  gap: 12px;
}

.form-col {
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

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.label-text {
  font-weight: 500;
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
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3e%3c/rect%3e%3cpath d='M16 2v4M8 2v4M3 10h18'%3e%3c/path%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  color: #333;
  padding-right: 40px;
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

.error-message {
  font-size: 12px;
  color: #f5222d;
  padding: 4px 4px 0;
}

.trip-type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.trip-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

.trip-type-item input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.trip-type-item:active {
  transform: scale(0.98);
}

.trip-type-item.active {
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

.days-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 12px 14px;
  background: #f0f7ff;
  border-radius: 10px;
}

.days-count {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
}

.days-unit {
  font-size: 13px;
  color: #666;
}

.btn-add-itinerary {
  padding: 6px 12px;
  font-size: 13px;
  color: #667eea;
  background: #f0f5ff;
  border: 1px dashed #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-add-itinerary:active {
  background: #e6edff;
}

.add-icon {
  font-weight: bold;
  margin-right: 4px;
}

.empty-itinerary {
  text-align: center;
  padding: 24px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px dashed #e8e8e8;
}

.empty-itinerary .empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-itinerary p {
  margin: 0;
  font-size: 13px;
  color: #999;
}

.itinerary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.itinerary-item {
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 10px;
  border-left: 3px solid #667eea;
}

.itinerary-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.itinerary-date {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.itinerary-time {
  font-size: 12px;
  color: #666;
  background: #e8e8e8;
  padding: 2px 8px;
  border-radius: 4px;
}

.itinerary-delete {
  margin-left: auto;
  padding: 4px 10px;
  font-size: 12px;
  color: #f5222d;
  background: #fff1f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.itinerary-location {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.itinerary-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
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
  cursor: pointer;
  position: relative;
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
  gap: 10px;
  flex-wrap: wrap;
}

.trip-type-badge {
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

.request-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.request-destination .label {
  color: #999;
  font-size: 13px;
}

.request-destination .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.request-days {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.days-number {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
}

.days-text {
  font-size: 12px;
  color: #666;
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

.approval-progress {
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
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

.request-detail {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.detail-itinerary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-itinerary-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 8px;
}

.itinerary-time {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 100px;
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

.itinerary-info {
  flex: 1;
}

.itinerary-info .location {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  margin-bottom: 2px;
}

.itinerary-info .description {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.approval-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.history-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e8e8e8;
  margin-top: 5px;
  flex-shrink: 0;
}

.history-dot.approve {
  background: #52c41a;
}

.history-dot.reject {
  background: #f5222d;
}

.history-content {
  flex: 1;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.history-role {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.history-name {
  font-size: 12px;
  color: #666;
}

.history-action {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.history-action.approve {
  background: #f6ffed;
  color: #52c41a;
}

.history-action.reject {
  background: #fff1f0;
  color: #f5222d;
}

.history-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.history-reason {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  padding: 6px 10px;
  background: #fafafa;
  border-radius: 6px;
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
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.action-btn.cancel:active {
  background: #e8e8e8;
}

.expand-indicator {
  text-align: center;
  font-size: 10px;
  color: #ccc;
  margin-top: 8px;
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
  max-width: 500px;
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

.date-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #999;
}

.detail-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.detail-section-header .detail-title {
  margin: 0;
}

.detail-section-actions {
  display: flex;
  gap: 8px;
}

.btn-link-add {
  padding: 4px 10px;
  font-size: 12px;
  color: #667eea;
  background: #f0f5ff;
  border: 1px dashed #667eea;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-link-add:active {
  background: #e6edff;
}

.detail-empty {
  padding: 16px;
}

.detail-itinerary-item {
  position: relative;
}

.itinerary-item-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

.item-action-btn {
  padding: 4px 10px;
  font-size: 11px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.item-action-btn.edit {
  background: #e6f7ff;
  color: #1890ff;
}

.item-action-btn.edit:active {
  background: #bae7ff;
}

.item-action-btn.delete {
  background: #fff1f0;
  color: #f5222d;
}

.item-action-btn.delete:active {
  background: #ffa39e;
}

@media (min-width: 769px) {
  .btn-link-add:hover {
    background: #e6edff;
  }
  .item-action-btn.edit:hover {
    background: #bae7ff;
  }
  .item-action-btn.delete:hover {
    background: #ffa39e;
  }
  .itinerary-item-actions {
    flex-direction: row;
    gap: 6px;
  }
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

  .trip-type-item:hover {
    border-color: #667eea;
  }

  .request-item:hover {
    border-color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  }
}

@media (max-width: 768px) {
  .business-trip-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .trip-type-grid {
    grid-template-columns: repeat(3, 1fr);
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

  .form-row-inline {
    flex-direction: column;
    gap: 8px;
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

  .trip-type-grid {
    grid-template-columns: repeat(2, 1fr);
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

  .days-count {
    font-size: 20px;
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
