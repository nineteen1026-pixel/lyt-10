<template>
  <div class="business-trip-checkin-page">
    <div class="page-header">
      <h2 class="page-title">出差签到</h2>
      <p class="page-subtitle">出差期间在此页面进行签到</p>
    </div>

    <div v-if="!todayTrip" class="card no-trip-card">
      <div class="no-trip">
        <span class="no-trip-icon">🏢</span>
        <h3 class="no-trip-title">今日无出差安排</h3>
        <p class="no-trip-desc">您今日没有待签到的出差行程</p>
      </div>
    </div>

    <div v-else>
      <div class="card trip-info-card">
        <div class="trip-header">
          <span
            class="trip-type-badge"
            :style="{ background: getTripTypeColor(todayTrip.tripType) + '20', color: getTripTypeColor(todayTrip.tripType) }"
          >
            {{ getTripTypeLabel(todayTrip.tripType) }}
          </span>
          <span class="trip-status approved">已批准</span>
        </div>

        <h3 class="trip-destination">
          <span class="dest-icon">📍</span>
          {{ todayTrip.destination }}
        </h3>

        <div class="trip-meta">
          <div class="meta-item">
            <span class="meta-label">出差日期</span>
            <span class="meta-value">{{ todayTrip.startDate }} ~ {{ todayTrip.endDate }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">今日进度</span>
            <span class="meta-value">{{ currentDayIndex }} / {{ todayTrip.days }} 天</span>
          </div>
        </div>

        <div class="trip-reason">
          <span class="reason-label">出差事由：</span>
          <span class="reason-text">{{ todayTrip.reason }}</span>
        </div>
      </div>

      <div class="card checkin-card">
        <h4 class="card-title">今日签到</h4>

        <div class="checkin-type-tabs">
          <div
            v-for="type in checkinTypes"
            :key="type.value"
            class="checkin-type-tab"
            :class="{ active: activeCheckinType === type.value }"
            @click="activeCheckinType = type.value"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <span class="type-label">{{ type.label }}</span>
            <span
              v-if="hasCheckedIn(type.value)"
              class="checked-indicator"
            >✓</span>
          </div>
        </div>

        <div v-if="hasCheckedIn(activeCheckinType)" class="already-checked">
          <div class="checked-icon">✅</div>
          <div class="checked-info">
            <p class="checked-text">您已完成{{ getCheckinTypeLabel(activeCheckinType) }}</p>
            <p class="checked-time">签到时间：{{ getTodayCheckinTime(activeCheckinType) }}</p>
            <p class="checked-location">签到地点：{{ getTodayCheckinLocation(activeCheckinType) }}</p>
          </div>
        </div>

        <div v-else class="checkin-form">
          <div class="form-row">
            <label class="form-label">
              <span class="label-text">签到地点</span>
              <span class="required">*</span>
            </label>
            <div class="location-input-wrapper">
              <input
                v-model="checkinForm.location"
                type="text"
                class="form-input"
                :class="{ error: errors.location }"
                placeholder="请输入签到地点"
              />
              <button
                type="button"
                class="locate-btn"
                @click="getCurrentLocation"
                :disabled="locating"
              >
                <span v-if="locating">定位中...</span>
                <span v-else>📍 定位</span>
              </button>
            </div>
            <span v-if="errors.location" class="error-message">{{ errors.location }}</span>
          </div>

          <div v-if="checkinForm.address" class="location-detail">
            <span class="detail-label">详细地址：</span>
            <span class="detail-text">{{ checkinForm.address }}</span>
          </div>

          <div class="form-row">
            <label class="form-label">
              <span class="label-text">签到备注</span>
            </label>
            <textarea
              v-model="checkinForm.remark"
              class="form-textarea"
              placeholder="可填写工作内容或其他说明..."
              rows="3"
            ></textarea>
            <div class="char-count">{{ checkinForm.remark.length }}/200</div>
          </div>

          <div class="form-row">
            <label class="form-label">
              <span class="label-text">签到照片</span>
              <span class="optional">（可选）</span>
            </label>
            <div class="photo-upload">
              <div v-if="checkinForm.photo" class="photo-preview">
                <img :src="checkinForm.photo" alt="签到照片" />
                <button
                  type="button"
                  class="photo-delete"
                  @click="removePhoto"
                >
                  ✕
                </button>
              </div>
              <label v-else class="photo-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  @change="handlePhotoUpload"
                  style="display: none"
                />
                <span class="upload-icon">📷</span>
                <span class="upload-text">拍照/上传照片</span>
              </label>
            </div>
          </div>

          <div class="checkin-time-info">
            <span class="time-label">签到时间</span>
            <span class="time-value">{{ currentTime }}</span>
          </div>

          <button
            type="button"
            class="btn btn-primary btn-checkin"
            @click="handleCheckin"
            :disabled="submitting"
          >
            {{ submitting ? '提交中...' : '确认签到' }}
          </button>
        </div>
      </div>

      <div class="card history-card">
        <div class="card-header">
          <h4 class="card-title">本次出差签到记录</h4>
        </div>

        <div v-if="tripCheckins.length === 0" class="empty-state">
          <span class="empty-icon">📝</span>
          <p>暂无签到记录</p>
        </div>

        <div v-else class="checkin-history">
          <div
            v-for="grouped in groupedCheckins"
            :key="grouped.date"
            class="history-day"
          >
            <div class="history-date">
              <span class="date-text">{{ grouped.date }}</span>
              <span class="date-weekday">{{ getWeekday(grouped.date) }}</span>
            </div>
            <div class="history-items">
              <div
                v-for="checkin in grouped.items"
                :key="checkin.id"
                class="history-item"
              >
                <div class="item-left">
                  <div class="item-type">
                    <span class="type-icon">{{ getCheckinTypeIcon(checkin.checkinType) }}</span>
                    <span class="type-name">{{ getCheckinTypeLabel(checkin.checkinType) }}</span>
                  </div>
                  <div class="item-time">{{ checkin.time }}</div>
                </div>
                <div class="item-right">
                  <div class="item-location">📍 {{ checkin.location }}</div>
                  <div v-if="checkin.remark" class="item-remark">{{ checkin.remark }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="todayTrip.itinerary && todayTrip.itinerary.length > 0" class="card itinerary-card">
        <div class="card-header">
          <h4 class="card-title">今日行程</h4>
        </div>

        <div v-if="todayItinerary.length === 0" class="empty-state">
          <span class="empty-icon">📋</span>
          <p>今日无行程安排</p>
        </div>

        <div v-else class="itinerary-list">
          <div
            v-for="item in todayItinerary"
            :key="item.id"
            class="itinerary-item"
          >
            <div class="itinerary-time">
              <span class="start-time">{{ item.startTime }}</span>
              <span class="time-line"></span>
              <span class="end-time">{{ item.endTime }}</span>
            </div>
            <div class="itinerary-content">
              <div class="itinerary-location">📍 {{ item.location }}</div>
              <div class="itinerary-description">{{ item.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useBusinessTripStore } from '@/store/business-trip'
import {
  getBusinessTripTypeLabel,
  getBusinessTripTypeColor,
  CHECKIN_TYPES,
  isBusinessTripFinalApproved
} from '@/utils/business-trip'
import { getToday, getCurrentTime, formatDate } from '@/utils/date'

const employeeStore = useEmployeeStore()
const businessTripStore = useBusinessTripStore()

const activeCheckinType = ref('morning')
const locating = ref(false)
const submitting = ref(false)
const currentTime = ref(getCurrentTime())

const checkinTypes = CHECKIN_TYPES

const currentUser = computed(() => employeeStore.currentUser)

const todayTrip = computed(() => {
  if (!currentUser.value) return null
  return businessTripStore.getTodayTrip(currentUser.value.id)
})

const currentDayIndex = computed(() => {
  if (!todayTrip.value) return 0
  const start = new Date(todayTrip.value.startDate)
  const today = new Date(getToday())
  const diffTime = today - start
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
})

const tripCheckins = computed(() => {
  if (!todayTrip.value) return []
  return businessTripStore.getTripCheckins(todayTrip.value.id)
})

const todayCheckins = computed(() => {
  if (!todayTrip.value || !currentUser.value) return []
  return businessTripStore.getTodayCheckins(currentUser.value.id, todayTrip.value.id)
})

const groupedCheckins = computed(() => {
  const groups = {}
  tripCheckins.value.forEach(checkin => {
    if (!groups[checkin.date]) {
      groups[checkin.date] = {
        date: checkin.date,
        items: []
      }
    }
    groups[checkin.date].items.push(checkin)
  })

  const result = Object.values(groups).sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  result.forEach(group => {
    group.items.sort((a, b) => a.time.localeCompare(b.time))
  })

  return result
})

const todayItinerary = computed(() => {
  if (!todayTrip.value?.itinerary) return []
  const today = getToday()
  return todayTrip.value.itinerary.filter(item => item.date === today)
})

const checkinForm = reactive({
  location: '',
  address: '',
  latitude: null,
  longitude: null,
  remark: '',
  photo: null
})

const errors = reactive({
  location: ''
})

function getTripTypeLabel(type) {
  return getBusinessTripTypeLabel(type)
}

function getTripTypeColor(type) {
  return getBusinessTripTypeColor(type)
}

function getCheckinTypeLabel(type) {
  const checkinType = CHECKIN_TYPES.find(t => t.value === type)
  return checkinType ? checkinType.label : type
}

function getCheckinTypeIcon(type) {
  const checkinType = CHECKIN_TYPES.find(t => t.value === type)
  return checkinType ? checkinType.icon : '📍'
}

function hasCheckedIn(type) {
  return todayCheckins.value.some(c => c.checkinType === type)
}

function getTodayCheckinTime(type) {
  const checkin = todayCheckins.value.find(c => c.checkinType === type)
  return checkin ? checkin.time : ''
}

function getTodayCheckinLocation(type) {
  const checkin = todayCheckins.value.find(c => c.checkinType === type)
  return checkin ? checkin.location : ''
}

function getWeekday(dateStr) {
  const date = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

function getCurrentLocation() {
  if (locating.value) return

  locating.value = true

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        checkinForm.latitude = position.coords.latitude
        checkinForm.longitude = position.coords.longitude
        checkinForm.location = `当前位置 (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
        checkinForm.address = 'GPS定位成功'
        locating.value = false
        errors.location = ''
      },
      (error) => {
        locating.value = false
        businessTripStore.showToast('定位失败，请手动输入地点', 'warning')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  } else {
    locating.value = false
    businessTripStore.showToast('您的浏览器不支持定位功能', 'warning')
  }
}

function handlePhotoUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    businessTripStore.showToast('图片大小不能超过5MB', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    checkinForm.photo = e.target.result
  }
  reader.readAsDataURL(file)
}

function removePhoto() {
  checkinForm.photo = null
}

function validateForm() {
  let valid = true

  if (!checkinForm.location.trim()) {
    errors.location = '请输入签到地点'
    valid = false
  } else {
    errors.location = ''
  }

  return valid
}

function handleCheckin() {
  if (!validateForm()) return
  if (!todayTrip.value || !currentUser.value) return

  submitting.value = true

  setTimeout(() => {
    businessTripStore.submitCheckin({
      tripId: todayTrip.value.id,
      employeeId: currentUser.value.id,
      employeeName: currentUser.value.name,
      checkinType: activeCheckinType.value,
      time: getCurrentTime(),
      location: checkinForm.location,
      latitude: checkinForm.latitude,
      longitude: checkinForm.longitude,
      address: checkinForm.address,
      remark: checkinForm.remark,
      photo: checkinForm.photo
    })

    resetForm()
    submitting.value = false
  }, 500)
}

function resetForm() {
  checkinForm.location = ''
  checkinForm.address = ''
  checkinForm.latitude = null
  checkinForm.longitude = null
  checkinForm.remark = ''
  checkinForm.photo = null
  errors.location = ''
}

let timeTimer = null

function updateTime() {
  currentTime.value = getCurrentTime()
}

onMounted(() => {
  businessTripStore.initBusinessTrip()
  timeTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeTimer) {
    clearInterval(timeTimer)
  }
})
</script>

<style scoped>
.business-trip-checkin-page {
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

.card-header {
  margin-bottom: 14px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.no-trip-card {
  padding: 60px 20px;
  text-align: center;
}

.no-trip-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.no-trip-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.no-trip-desc {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.trip-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trip-type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.trip-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.trip-status.approved {
  background: rgba(82, 196, 26, 0.3);
  color: #52c41a;
}

.trip-destination {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dest-icon {
  font-size: 20px;
}

.trip-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  opacity: 0.8;
}

.meta-value {
  font-size: 14px;
  font-weight: 500;
}

.trip-reason {
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.6;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.reason-label {
  opacity: 0.8;
}

.checkin-card {
  padding-bottom: 20px;
}

.checkin-type-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.checkin-type-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.checkin-type-tab:active {
  transform: scale(0.98);
}

.checkin-type-tab.active {
  background: #f0f5ff;
  border-color: #667eea;
}

.type-icon {
  font-size: 28px;
}

.type-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.checked-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #52c41a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.already-checked {
  text-align: center;
  padding: 30px 20px;
  background: #f6ffed;
  border-radius: 12px;
}

.checked-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.checked-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #666;
}

.checked-text {
  font-size: 16px !important;
  font-weight: 600;
  color: #52c41a !important;
  margin-bottom: 12px !important;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.label-text {
  font-weight: 500;
}

.required {
  color: #f5222d;
}

.optional {
  color: #999;
  font-size: 12px;
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

.form-textarea {
  resize: vertical;
  min-height: 80px;
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

.location-input-wrapper {
  display: flex;
  gap: 10px;
}

.location-input-wrapper .form-input {
  flex: 1;
}

.locate-btn {
  padding: 12px 16px;
  background: #f0f5ff;
  color: #667eea;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.locate-btn:active:not(:disabled) {
  background: #d6e4ff;
}

.locate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.location-detail {
  font-size: 13px;
  color: #666;
  padding: 8px 12px;
  background: #f6ffed;
  border-radius: 8px;
}

.detail-label {
  color: #999;
}

.photo-upload {
  display: flex;
  gap: 12px;
}

.photo-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #e8e8e8;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-upload-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fafafa;
}

.photo-upload-btn:active {
  border-color: #667eea;
  background: #f0f5ff;
}

.upload-icon {
  font-size: 32px;
}

.upload-text {
  font-size: 12px;
  color: #999;
}

.checkin-time-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 10px;
  margin-bottom: 20px;
}

.time-label {
  font-size: 14px;
  color: #666;
}

.time-value {
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
  font-family: 'Courier New', monospace;
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

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-checkin {
  width: 100%;
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 32px 24px;
  color: #999;
}

.empty-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.checkin-history {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-day {
  display: flex;
  gap: 16px;
}

.history-date {
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
}

.date-text {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.date-weekday {
  font-size: 12px;
  color: #999;
}

.history-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 12px;
  border-left: 2px solid #f0f0f0;
}

.history-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  display: flex;
  gap: 12px;
}

.item-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 80px;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-type .type-icon {
  font-size: 14px;
}

.item-type .type-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.item-time {
  font-size: 11px;
  color: #999;
}

.item-right {
  flex: 1;
}

.item-location {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-remark {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.itinerary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.itinerary-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
}

.itinerary-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  position: relative;
}

.start-time,
.end-time {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
}

.time-line {
  flex: 1;
  width: 2px;
  background: #d6e4ff;
  margin: 4px 0;
  min-height: 20px;
}

.itinerary-content {
  flex: 1;
}

.itinerary-location {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.itinerary-description {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
}

@media (min-width: 769px) {
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }

  .checkin-type-tab:hover {
    border-color: #d6e4ff;
  }

  .locate-btn:hover:not(:disabled) {
    background: #d6e4ff;
  }

  .photo-upload-btn:hover {
    border-color: #667eea;
    background: #f0f5ff;
  }
}

@media (max-width: 768px) {
  .business-trip-checkin-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .trip-meta {
    gap: 16px;
  }

  .checkin-type-tabs {
    gap: 10px;
  }

  .history-day {
    gap: 12px;
  }

  .history-date {
    min-width: 60px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .trip-destination {
    font-size: 18px;
  }

  .card-title {
    font-size: 14px;
  }

  .photo-preview,
  .photo-upload-btn {
    width: 100px;
    height: 100px;
  }
}
</style>
