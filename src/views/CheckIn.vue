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
          <span class="btn-text">{{ hasCheckedIn ? '已打卡' : '上班打卡' }}</span>
          <span v-if="todayRecord?.checkIn" class="btn-time">{{ todayRecord.checkIn }}</span>
        </button>

        <button
          class="checkin-btn checkin-btn-secondary"
          :class="{ disabled: !canCheckOut || hasCheckedOut }"
          @click="handleCheckOut"
        >
          <span class="btn-icon">🌙</span>
          <span class="btn-text">{{ !canCheckOut ? '请先上班打卡' : hasCheckedOut ? '已打卡' : '下班打卡' }}</span>
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
      <h4 class="card-title">工作时间</h4>
      <div class="worktime-grid">
        <div class="worktime-item">
          <span class="worktime-icon">🌅</span>
          <div>
            <div class="worktime-label">上班时间</div>
            <div class="worktime-value">{{ workTimeConfig.morningStart }}</div>
          </div>
        </div>
        <div class="worktime-item">
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
            <div class="worktime-value">{{ workTimeConfig.afternoonEnd }}</div>
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
import { workTimeConfig } from '@/data/employees'
import { getStatusText, getStatusColor, getStatusBgColor, ATTENDANCE_STATUS } from '@/utils/attendance'
import { formatDate, getToday } from '@/utils/date'

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()

const currentTime = ref('')
let timer = null

const currentUser = computed(() => employeeStore.currentUser)

const todayRecord = computed(() => {
  if (!currentUser.value) return null
  return attendanceStore.getTodayRecord(currentUser.value.id)
})

const hasCheckedIn = computed(() => !!todayRecord.value?.checkIn)
const hasCheckedOut = computed(() => !!todayRecord.value?.checkOut)
const canCheckOut = computed(() => hasCheckedIn.value)

const checkInStatus = computed(() => {
  return attendanceStore.getTodayCheckInStatus(todayRecord.value)
})

const checkOutStatus = computed(() => {
  return attendanceStore.getTodayCheckOutStatus(todayRecord.value)
})

const dayStatus = computed(() => {
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
    attendanceStore.checkIn(currentUser.value.id)
  }
}

function handleCheckOut() {
  if (!canCheckOut.value || hasCheckedOut.value) return
  if (currentUser.value) {
    attendanceStore.checkOut(currentUser.value.id)
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
  gap: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 10px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-avatar-large {
  font-size: 48px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.user-info-card .user-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.user-info-card .user-dept {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.clock-card {
  text-align: center;
}

.current-time {
  margin-bottom: 24px;
}

.time-display {
  font-size: 48px;
  font-weight: 300;
  color: #333;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
}

.date-display {
  font-size: 16px;
  color: #999;
  margin-top: 8px;
}

.checkin-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.checkin-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.checkin-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.checkin-btn:hover::before {
  left: 100%;
}

.checkin-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.checkin-btn-primary:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.checkin-btn-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.checkin-btn-secondary:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
}

.checkin-btn.disabled {
  background: #d9d9d9;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-icon {
  font-size: 28px;
}

.btn-text {
  font-size: 16px;
  font-weight: 500;
}

.btn-time {
  font-size: 12px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.status-item {
  text-align: center;
  padding: 16px 8px;
  border-radius: 12px;
  background: #fafafa;
}

.status-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-time {
  font-size: 11px;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.status-item.day-status {
  background: #f6ffed;
  grid-column: span 3;
}

.status-item.day-status .status-value {
  font-size: 18px;
}

.status-item.day-status .status-time {
  font-size: 13px;
}

.worktime-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.worktime-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 12px;
}

.worktime-icon {
  font-size: 24px;
}

.worktime-label {
  font-size: 12px;
  color: #999;
}

.worktime-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

@media (max-width: 768px) {
  .checkin-buttons {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .status-item.day-status {
    grid-column: span 1;
  }

  .worktime-grid {
    grid-template-columns: 1fr;
  }

  .time-display {
    font-size: 36px;
  }
}
</style>
