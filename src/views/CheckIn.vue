<template>
  <div class="checkin-page">
    <div class="page-header">
      <h2 class="page-title">今日打卡</h2>
      <p class="page-subtitle">{{ todayDisplay }}</p>
    </div>

    <div class="card user-card">
      <div class="user-avatar-large">{{ currentUser?.avatar || '👤' }}</div>
      <div class="user-info-card">
        <h3 class="user-name">{{ currentUser?.name || '未登录' }}</h3>
        <p class="user-dept">{{ currentUser?.department }} · {{ currentUser?.position }}</p>
      </div>
    </div>

    <div class="card clock-card">
      <div class="current-time">
        <div class="time-display">{{ currentTime }}</div>
        <div class="date-display">{{ todayFull }}</div>
      </div>

      <div class="checkin-buttons">
        <button
          class="checkin-btn checkin-btn-primary"
          :class="{ disabled: hasCheckedIn }"
          @click="handleCheckIn"
        >
          <span class="btn-icon">☀️</span>
          <div class="btn-content">
            <span class="btn-text">{{ hasCheckedIn ? '已打卡' : '上班打卡' }}</span>
          </div>
          <span v-if="todayRecord?.checkIn" class="btn-time">{{ todayRecord.checkIn }}</span>
        </button>

        <button
          class="checkin-btn checkin-btn-secondary"
          :class="{ disabled: !canCheckOut || hasCheckedOut }"
          @click="handleCheckOut"
        >
          <span class="btn-icon">🌙</span>
          <div class="btn-content">
            <span class="btn-text">{{ !canCheckOut ? '请先上班打卡' : hasCheckedOut ? '已打卡' : '下班打卡' }}</span>
          </div>
          <span v-if="todayRecord?.checkOut" class="btn-time">{{ todayRecord.checkOut }}</span>
        </button>
      </div>
    </div>

    <div class="card status-card">
      <h4 class="card-title">今日考勤状态</h4>
      <div class="status-grid">
        <div class="status-item" :class="checkInStatus">
          <div class="status-label">上班打卡</div>
          <div class="status-value" :style="{ color: getStatusColor(checkInStatus) }">
            {{ getStatusText(checkInStatus) }}
          </div>
          <div v-if="todayRecord?.checkIn" class="status-time">{{ todayRecord.checkInTime }}</div>
          <div v-else class="status-time">-</div>
        </div>

        <div class="status-item" :class="checkOutStatus">
          <div class="status-label">下班打卡</div>
          <div class="status-value" :style="{ color: getStatusColor(checkOutStatus) }">
            {{ getStatusText(checkOutStatus) }}
          </div>
          <div v-if="todayRecord?.checkOut" class="status-time">{{ todayRecord.checkOutTime }}</div>
          <div v-else class="status-time">-</div>
        </div>

        <div class="status-item day-status" :class="dayStatus">
          <div class="status-label">今日状态</div>
          <div class="status-value" :style="{ color: getStatusColor(dayStatus) }">
            {{ getStatusText(dayStatus) }}
          </div>
          <div class="status-time" :style="{ background: getStatusBgColor(dayStatus) }">
            {{ workTimeDisplay }}
          </div>
        </div>
      </div>
    </div>

    <div class="card worktime-card">
      <h4 class="card-title">工作时间 <span v-if="todayShift" class="shift-badge" :style="{ background: todayShift.color + '20', color: todayShift.color }">{{ todayShift.label }}</span></h4>
      <div class="worktime-grid">
        <div class="worktime-item">
          <span class="worktime-icon">🌅</span>
          <div>
            <div class="worktime-label">上班时间</div>
            <div class="worktime-value">{{ todayShift && todayShift.startTime ? todayShift.startTime : workTimeConfig.morningStart }}</div>
          </div>
        </div>
        <div class="worktime-item" v-if="!todayShift || todayShift.value !== 'rest'">
          <span class="worktime-icon">☀️</span>
          <div>
            <div class="worktime-label">午休时间</div>
            <div class="worktime-value">{{ workTimeConfig.morningEnd }} - {{ workTimeConfig.afternoonStart }}</div>
          </div>
        </div>
        <div class="worktime-item">
          <span class="worktime-icon">🌇</span>
          <div>
            <div class="worktime-label">下班时间</div>
            <div class="worktime-value">{{ todayShift && todayShift.endTime ? todayShift.endTime : workTimeConfig.afternoonEnd }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useAttendanceStore } from '@/store/attendance'
import { useScheduleStore } from '@/store/schedule'
import { workTimeConfig } from '@/data/employees'
import { getStatusText, getStatusColor, getStatusBgColor, ATTENDANCE_STATUS, getCheckInStatusWithShift, getCheckOutStatusWithShift, getDayStatusWithShift } from '@/utils/attendance'
import { getShiftTimeRange, getShiftLabel, getShiftType } from '@/utils/schedule'
import { formatDate, getToday } from '@/utils/date'

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()
const scheduleStore = useScheduleStore()

const currentTime = ref('')
let timer = null

const currentUser = computed(() => employeeStore.currentUser)

const todayShiftType = computed(() => {
  if (!currentUser.value) return null
  return scheduleStore.getEmployeeShift(currentUser.value.id, today)
})

const todayShift = computed(() => {
  if (!todayShiftType.value) return null
  return getShiftType(todayShiftType.value)
})

const todayRecord = computed(() => {
  if (!currentUser.value) return null
  return attendanceStore.getTodayRecord(currentUser.value.id)
})

const hasCheckedIn = computed(() => !!todayRecord.value?.checkIn)
const hasCheckedOut = computed(() => !!todayRecord.value?.checkOut)
const canCheckOut = computed(() => hasCheckedIn.value)

const checkInStatus = computed(() => {
  if (todayShiftType.value) {
    if (!todayRecord.value) return ATTENDANCE_STATUS.NOT_CHECKED
    return getCheckInStatusWithShift(todayRecord.value.checkIn, todayShiftType.value)
  }
  return attendanceStore.getTodayCheckInStatus(todayRecord.value)
})

const checkOutStatus = computed(() => {
  if (todayShiftType.value) {
    if (!todayRecord.value || !todayRecord.value.checkOut) return ATTENDANCE_STATUS.NOT_CHECKED
    return getCheckOutStatusWithShift(todayRecord.value.checkOut, todayShiftType.value)
  }
  return attendanceStore.getTodayCheckOutStatus(todayRecord.value)
})

const dayStatus = computed(() => {
  if (todayShiftType.value) {
    return getDayStatusWithShift(todayRecord.value, todayShiftType.value)
  }
  return attendanceStore.getTodayStatus(todayRecord.value)
})

const today = getToday()
const todayDisplay = computed(() => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date()
  return `${today} ${weekDays[d.getDay()]}`
})

const todayFull = computed(() => {
  return formatDate(new Date(), 'YYYY年MM月DD日')
})

const workTimeDisplay = computed(() => {
  if (todayRecord.value?.checkIn && todayRecord.value?.checkOut) {
    return `${todayRecord.value.checkIn} - ${todayRecord.value.checkOut}`
  }
  if (todayShift.value && todayShift.value.startTime && todayShift.value.endTime) {
    return `${todayShift.value.startTime} - ${todayShift.value.endTime}`
  }
  return `${workTimeConfig.morningStart} - ${workTimeConfig.afternoonEnd}`
})

function updateTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

function handleCheckIn() {
  if (hasCheckedIn.value) return
  if (currentUser.value) {
    attendanceStore.checkIn(currentUser.value.id, todayShiftType.value)
  }
}

function handleCheckOut() {
  if (!canCheckOut.value || hasCheckedOut.value) return
  if (currentUser.value) {
    attendanceStore.checkOut(currentUser.value.id, todayShiftType.value)
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.checkin-page {
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

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.user-avatar-large {
  font-size: 40px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.user-info-card {
  min-width: 0;
  flex: 1;
}

.user-info-card .user-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.user-info-card .user-dept {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clock-card {
  text-align: center;
}

.current-time {
  margin-bottom: 20px;
}

.time-display {
  font-size: 42px;
  font-weight: 200;
  color: #333;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  line-height: 1.1;
}

.date-display {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.checkin-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.checkin-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  min-height: 120px;
}

.checkin-btn:active:not(.disabled) {
  transform: scale(0.98);
}

.checkin-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.6s;
}

.checkin-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.checkin-btn-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.checkin-btn.disabled {
  background: linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%);
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-icon {
  font-size: 32px;
  line-height: 1;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
}

.btn-time {
  font-size: 12px;
  opacity: 0.95;
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shift-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.status-item {
  text-align: center;
  padding: 14px 8px;
  border-radius: 12px;
  background: #fafafa;
  min-width: 0;
}

.status-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 6px;
}

.status-value {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  line-height: 1.3;
}

.status-time {
  font-size: 10px;
  color: #666;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  line-height: 1.4;
}

.status-item.day-status {
  background: #f6ffed;
  grid-column: span 3;
}

.status-item.day-status .status-value {
  font-size: 16px;
}

.status-item.day-status .status-time {
  font-size: 12px;
}

.worktime-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.worktime-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 12px;
  min-width: 0;
}

.worktime-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.worktime-label {
  font-size: 11px;
  color: #999;
}

.worktime-value {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

@media (min-width: 769px) {
  .checkin-btn:hover:not(.disabled) {
    transition: all 0.3s;
  }

  .checkin-btn:hover:not(.disabled) {
    transform: translateY(-2px);
  }

  .checkin-btn-primary:hover:not(.disabled) {
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .checkin-btn-secondary:hover:not(.disabled) {
    box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
  }

  .checkin-btn:hover::before {
    left: 100%;
  }
}

@media (max-width: 768px) {
  .checkin-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .user-avatar-large {
    font-size: 36px;
    width: 52px;
    height: 52px;
  }

  .user-info-card .user-name {
    font-size: 17px;
  }

  .user-info-card .user-dept {
    font-size: 12px;
  }

  .checkin-buttons {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .checkin-btn {
    flex-direction: row;
    justify-content: space-between;
    padding: 18px 20px;
    min-height: 80px;
    text-align: left;
  }

  .btn-icon {
    order: 1;
    font-size: 36px;
  }

  .btn-content {
    order: 2;
    flex: 1;
    padding: 0 16px;
    text-align: left;
  }

  .btn-text {
    font-size: 16px;
  }

  .btn-time {
    order: 3;
  }

  .status-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    padding: 14px 16px;
    gap: 16px;
  }

  .status-item > div:first-child {
    flex: 1;
  }

  .status-label {
    margin-bottom: 4px;
    font-size: 12px;
  }

  .status-value {
    margin-bottom: 0;
    font-size: 15px;
  }

  .status-time {
    order: 3;
    font-size: 11px;
  }

  .status-item.day-status {
    grid-column: span 1;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .status-item.day-status .status-value {
    font-size: 18px;
  }

  .worktime-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .worktime-item {
    padding: 14px 16px;
  }

  .time-display {
    font-size: 42px;
  }

  .date-display {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .checkin-btn {
    padding: 16px;
    min-height: 72px;
  }

  .btn-icon {
    font-size: 32px;
  }

  .btn-text {
    font-size: 15px;
  }

  .time-display {
    font-size: 38px;
    letter-spacing: 0.5px;
  }

  .user-avatar-large {
    font-size: 32px;
    width: 48px;
    height: 48px;
  }

  .user-info-card .user-name {
    font-size: 16px;
  }

  .status-item {
    padding: 12px 14px;
  }
}

@media (max-width: 360px) {
  .time-display {
    font-size: 34px;
  }

  .btn-content {
    padding: 0 12px;
  }

  .btn-icon {
    font-size: 28px;
  }

  .worktime-item {
    padding: 12px;
  }
}
</style>
