<template>
  <div class="calendar-page">
    <div class="page-header">
      <h2 class="page-title">月历统计</h2>
      <p class="page-subtitle">查看员工月度考勤详情</p>
    </div>

    <div class="card filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">选择员工</label>
          <select v-model="selectedEmployeeId" class="filter-select">
            <option v-for="emp in employees" :key="emp.id" :value="emp.id">
              {{ emp.avatar }} {{ emp.name }} - {{ emp.department }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">选择月份</label>
          <div class="month-selector">
            <button class="month-btn" @click="prevMonth">
              <span>◀</span>
            </button>
            <span class="month-display">{{ formatMonthDisplay(currentYear, currentMonth) }}</span>
            <button class="month-btn" @click="nextMonth">
              <span>▶</span>
            </button>
          </div>
        </div>
        <div class="filter-item filter-actions">
          <label class="filter-label">&nbsp;</label>
          <button class="export-btn" @click="exportCSV">导出 CSV</button>
        </div>
      </div>
    </div>

    <div class="card stats-card">
      <h4 class="card-title">{{ selectedEmployee?.name }} - 本月考勤统计</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value" style="color: #52c41a">{{ monthStats.normal }}</div>
          <div class="stat-label">正常</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #fa8c16">{{ monthStats.late }}</div>
          <div class="stat-label">迟到</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #faad14">{{ monthStats.earlyLeave }}</div>
          <div class="stat-label">早退</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #f5222d">{{ monthStats.absent }}</div>
          <div class="stat-label">缺勤</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #1890ff">{{ monthStats.makeup }}</div>
          <div class="stat-label">补卡</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #722ed1">{{ monthStats.leave }}</div>
          <div class="stat-label">请假</div>
        </div>
      </div>
    </div>

    <div class="card overtime-stats-card">
      <h4 class="card-title">本月加班统计</h4>
      <div class="overtime-stats-grid">
        <div class="overtime-stat-item main">
          <div class="ot-value" style="color: #eb2f96">{{ monthStats.overtime }}</div>
          <div class="ot-label">加班天数</div>
        </div>
        <div class="overtime-stat-item main highlight">
          <div class="ot-value" style="color: #f5222d">{{ monthStats.overtimeHours }} h</div>
          <div class="ot-label">总计薪工时</div>
        </div>
        <div class="overtime-stat-item">
          <div class="ot-value" style="color: #fa8c16">{{ monthStats.weekdayOvertimeHours }} h</div>
          <div class="ot-label">工作日加班 (1.5倍)</div>
        </div>
        <div class="overtime-stat-item">
          <div class="ot-value" style="color: #722ed1">{{ monthStats.weekendOvertimeHours }} h</div>
          <div class="ot-label">周末加班 (2倍)</div>
        </div>
        <div class="overtime-stat-item">
          <div class="ot-value" style="color: #f5222d">{{ monthStats.holidayOvertimeHours }} h</div>
          <div class="ot-label">节假日加班 (3倍)</div>
        </div>
      </div>
    </div>

    <div class="card legend-card">
      <div class="legend-title">图例说明</div>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-dot" style="background: #52c41a"></span>
          <span>正常</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #fa8c16"></span>
          <span>迟到</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #faad14"></span>
          <span>早退</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f5222d"></span>
          <span>缺勤</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #1890ff"></span>
          <span>补卡</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #722ed1"></span>
          <span>请假</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #eb2f96"></span>
          <span>加班</span>
        </div>
      </div>
    </div>

    <div class="card calendar-card">
      <div class="calendar-weekdays">
        <div v-for="day in weekDays" :key="day" class="weekday-header">
          {{ day }}
        </div>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            empty: !day,
            weekend: day && isWeekend(day.date),
            today: day && day.date === today,
            absent: day && calendarData[day.date]?.status === 'absent'
          }"
          @click="day && showDayDetail(day)"
        >
          <template v-if="day">
            <div class="day-number">{{ day.day }}</div>
            <div
              v-if="calendarData[day.date]"
              class="day-status"
              :style="{ background: getStatusBgColor(calendarData[day.date].status) }"
            >
              <span
                class="status-indicator"
                :style="{ background: getStatusColor(calendarData[day.date].status) }"
              ></span>
              <span class="status-text" :style="{ color: getStatusColor(calendarData[day.date].status) }">
                {{ getStatusText(calendarData[day.date].status) }}
              </span>
            </div>
            <div v-else class="day-status no-record">
              <span class="status-text">-</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="showDetail" class="detail-modal" @click.self="showDetail = false">
      <div class="detail-content">
        <div class="detail-header">
          <h3>{{ selectedDay?.date }} 考勤详情</h3>
          <button class="close-btn" @click="showDetail = false">✕</button>
        </div>
        <div class="detail-body" v-if="selectedDayRecord">
          <div v-if="selectedDayRecord.isLeave" class="leave-detail">
            <div class="leave-icon">🏖️</div>
            <div class="leave-title">{{ getLeaveTypeLabel(selectedDayRecord.leaveType) }}</div>
            <div class="leave-desc">当日请假，已通过审批</div>
          </div>
          <template v-else>
            <div class="detail-row" v-if="selectedDayShiftType">
              <span class="detail-label">当日班次</span>
              <span class="detail-value">
                <span class="shift-badge-cal" :style="{ background: getShiftColor(selectedDayShiftType) + '20', color: getShiftColor(selectedDayShiftType) }">
                  {{ getShiftLabel(selectedDayShiftType) }}
                  <template v-if="getShiftTimeRange(selectedDayShiftType).startTime">（{{ getShiftTimeRange(selectedDayShiftType).startTime }}-{{ getShiftTimeRange(selectedDayShiftType).endTime }}）</template>
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">上班打卡</span>
              <span class="detail-value">
                {{ selectedDayRecord.checkIn || '-' }}
                <span v-if="selectedDayCheckInStatus" class="detail-status" :style="{ color: getStatusColor(selectedDayCheckInStatus) }">
                  ({{ getStatusText(selectedDayCheckInStatus) }})
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">下班打卡</span>
              <span class="detail-value">
                {{ selectedDayRecord.checkOut || '-' }}
                <span v-if="selectedDayCheckOutStatus" class="detail-status" :style="{ color: getStatusColor(selectedDayCheckOutStatus) }">
                  ({{ getStatusText(selectedDayCheckOutStatus) }})
                </span>
              </span>
            </div>
            <div class="detail-row" v-if="selectedDayRecord.checkInTime">
              <span class="detail-label">上班时间</span>
              <span class="detail-value">{{ selectedDayRecord.checkInTime }}</span>
            </div>
            <div class="detail-row" v-if="selectedDayRecord.checkOutTime">
              <span class="detail-label">下班时间</span>
              <span class="detail-value">{{ selectedDayRecord.checkOutTime }}</span>
            </div>
          </template>
          <div v-if="selectedDayRecord.isOvertime" class="overtime-detail">
            <div class="overtime-detail-header">
              <span class="overtime-icon">⏱️</span>
              <span class="overtime-type-badge" :style="{ background: getOvertimeTypeColor(selectedDayRecord.overtimeType) + '20', color: getOvertimeTypeColor(selectedDayRecord.overtimeType) }">
                {{ getOvertimeTypeLabel(selectedDayRecord.overtimeType) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">加班时段</span>
              <span class="detail-value">{{ selectedDayRecord.overtimeStartTime }} - {{ selectedDayRecord.overtimeEndTime }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">计薪工时</span>
              <span class="detail-value overtime-hours">
                {{ selectedDayRecord.overtimeHours }} 小时
                <span class="ot-rate-note">
                  ({{ getOvertimeTypeLabel(selectedDayRecord.overtimeType) }} ×{{ getOvertimeTypeRate(selectedDayRecord.overtimeType) }})
                </span>
              </span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">当日状态</span>
            <span class="detail-status-badge" :style="{ background: getStatusBgColor(selectedDayStatus), color: getStatusColor(selectedDayStatus) }">
              {{ getStatusText(selectedDayStatus) }}
            </span>
          </div>
          <div class="detail-row" v-if="selectedDayRecord.makeupApproved">
            <span class="detail-label">补卡说明</span>
            <span class="detail-value makeup">✓ 已通过补卡申请</span>
          </div>
          <div class="detail-row" v-if="!selectedDayRecord.isLeave && !selectedDayRecord.makeupApproved && selectedDayStatus !== 'normal' && selectedDayStatus !== 'overtime'">
            <span class="detail-label">操作</span>
            <div class="detail-actions">
              <button class="makeup-btn" @click="goToMakeup(selectedDay.date)">
                申请补卡
              </button>
              <button class="leave-btn" @click="goToLeave()">
                申请请假
              </button>
            </div>
          </div>
        </div>
        <div class="detail-body" v-else>
          <div class="no-record">
            <span class="no-record-icon">📭</span>
            <p>当日无考勤记录</p>
            <div class="no-record-actions">
              <button class="makeup-btn" @click="goToMakeup(selectedDay.date)">
                申请补卡
              </button>
              <button class="leave-btn" @click="goToLeave()">
                申请请假
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/store/employee'
import { useAttendanceStore } from '@/store/attendance'
import { useScheduleStore } from '@/store/schedule'
import { getWeekDays, getCalendarDays, formatMonthDisplay, isWeekend, getToday } from '@/utils/date'
import { getStatusText, getStatusColor, getStatusBgColor, getCheckInStatus, getCheckOutStatus, getDayStatus, getLeaveTypeLabel, ATTENDANCE_STATUS, getOvertimeTypeLabel, getOvertimeTypeColor, getOvertimeTypeRate, getCheckInStatusWithShift, getCheckOutStatusWithShift, getDayStatusWithShift, generateMonthCalendarDataWithShift, calculateAttendanceStatsWithShift } from '@/utils/attendance'
import { getShiftLabel, getShiftColor, getShiftTimeRange } from '@/utils/schedule'

const router = useRouter()

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()
const scheduleStore = useScheduleStore()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedEmployeeId = ref(employeeStore.currentUser?.id || 'E001')
const showDetail = ref(false)
const selectedDay = ref(null)

const today = getToday()
const weekDays = getWeekDays()

const employees = computed(() => employeeStore.employees)

const selectedEmployee = computed(() => {
  return employeeStore.getEmployeeById(selectedEmployeeId.value)
})

const shiftMap = computed(() => {
  return scheduleStore.getEmployeeMonthSchedule(selectedEmployeeId.value, currentYear.value, currentMonth.value)
})

const employeeRecords = computed(() => {
  return attendanceStore.getEmployeeRecords(selectedEmployeeId.value)
})

const calendarData = computed(() => {
  const records = employeeRecords.value
  if (shiftMap.value && Object.keys(shiftMap.value).length > 0) {
    return generateMonthCalendarDataWithShift(records, currentYear.value, currentMonth.value, shiftMap.value)
  }
  return attendanceStore.getMonthCalendar(selectedEmployeeId.value, currentYear.value, currentMonth.value)
})

const monthStats = computed(() => {
  const records = employeeRecords.value
  if (shiftMap.value && Object.keys(shiftMap.value).length > 0) {
    return calculateAttendanceStatsWithShift(records, currentYear.value, currentMonth.value, shiftMap.value)
  }
  return attendanceStore.getMonthStats(selectedEmployeeId.value, currentYear.value, currentMonth.value)
})

const calendarDays = computed(() => {
  return getCalendarDays(currentYear.value, currentMonth.value)
})

const selectedDayRecord = computed(() => {
  if (!selectedDay.value) return null
  return calendarData.value[selectedDay.value.date]?.record || null
})

const selectedDayShiftType = computed(() => {
  if (!selectedDay.value) return null
  return shiftMap.value && shiftMap.value[selectedDay.value.date] ? shiftMap.value[selectedDay.value.date] : null
})

const selectedDayStatus = computed(() => {
  if (selectedDayShiftType.value) {
    return getDayStatusWithShift(selectedDayRecord.value, selectedDayShiftType.value)
  }
  return getDayStatus(selectedDayRecord.value)
})

const selectedDayCheckInStatus = computed(() => {
  if (!selectedDayRecord.value?.checkIn) return null
  if (selectedDayShiftType.value) {
    return getCheckInStatusWithShift(selectedDayRecord.value.checkIn, selectedDayShiftType.value)
  }
  return getCheckInStatus(selectedDayRecord.value.checkIn)
})

const selectedDayCheckOutStatus = computed(() => {
  if (!selectedDayRecord.value?.checkOut) return null
  if (selectedDayShiftType.value) {
    return getCheckOutStatusWithShift(selectedDayRecord.value.checkOut, selectedDayShiftType.value)
  }
  return getCheckOutStatus(selectedDayRecord.value.checkOut)
})

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function showDayDetail(day) {
  selectedDay.value = day
  const calendarItem = calendarData.value[day.date]
  const shiftType = calendarItem?.shiftType || (shiftMap.value && shiftMap.value[day.date])
  const record = calendarItem?.record
  const dayStatus = shiftType ? getDayStatusWithShift(record, shiftType) : getDayStatus(record)
  if (dayStatus === ATTENDANCE_STATUS.ABSENT) {
    router.push({
      name: 'Makeup',
      query: { date: day.date }
    })
  } else {
    showDetail.value = true
  }
}

function goToMakeup(date) {
  showDetail.value = false
  router.push({
    name: 'Makeup',
    query: { date }
  })
}

function goToLeave() {
  showDetail.value = false
  router.push({
    name: 'Leave'
  })
}

function exportCSV() {
  const emp = selectedEmployee.value
  if (!emp) return

  const year = currentYear.value
  const month = currentMonth.value
  const data = attendanceStore.getMonthCalendar(selectedEmployeeId.value, year, month)

  const BOM = '\uFEFF'
  const header = ['日期', '上班打卡', '下班打卡', '上班时间', '下班时间', '状态'].join(',')
  const rows = Object.keys(data)
    .sort()
    .map(date => {
      const item = data[date]
      const record = item.record || {}
      return [
        date,
        record.checkIn || '',
        record.checkOut || '',
        record.checkInTime || '',
        record.checkOutTime || '',
        getStatusText(item.status)
      ].join(',')
    })

  const csv = BOM + header + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${emp.name}_${year}年${String(month).padStart(2, '0')}月_考勤记录.csv`
  link.click()
  URL.revokeObjectURL(url)
}

watch(selectedEmployeeId, () => {
  showDetail.value = false
})
</script>

<style scoped>
.calendar-page {
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

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  flex: 1;
  min-width: 0;
}

.filter-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
}

.export-btn {
  height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.export-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.filter-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.filter-select {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  color: #333;
  min-height: 44px;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.month-btn {
  width: 44px;
  height: 44px;
  border: 1px solid #e8e8e8;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
  flex-shrink: 0;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

.month-btn:active {
  background: #f0f7ff;
  border-color: #667eea;
  transform: scale(0.96);
}

.month-display {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  text-align: center;
  white-space: nowrap;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 14px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
  padding: 12px 4px;
  background: #fafafa;
  border-radius: 10px;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 2px;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.legend-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-direction: column;
}

.legend-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

.legend-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
  width: 100%;
}

.overtime-stats-card {
  background: linear-gradient(135deg, #fff0f6 0%, #fff7e6 100%);
}

.overtime-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.overtime-stat-item {
  text-align: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  min-width: 0;
}

.overtime-stat-item.main {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.overtime-stat-item.main .ot-value {
  font-size: 26px;
}

.overtime-stat-item.main.highlight .ot-value {
  font-weight: 700;
}

.ot-value {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.2;
}

.ot-label {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.overtime-detail {
  margin: 16px 0;
  padding: 16px;
  background: #fff0f6;
  border-radius: 12px;
  border: 1px solid #ffadd2;
}

.overtime-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.overtime-icon {
  font-size: 24px;
}

.overtime-type-badge {
  padding: 5px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
}

.overtime-hours {
  color: #eb2f96 !important;
  font-weight: 700;
  font-size: 16px !important;
}

.ot-rate-note {
  font-size: 11px;
  color: #999;
  font-weight: 400;
  margin-left: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  margin-bottom: 6px;
}

.weekday-header {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  padding: 6px 0;
}

.weekday-header:nth-child(1),
.weekday-header:nth-child(7) {
  color: #f5222d;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.calendar-day {
  aspect-ratio: 1;
  border-radius: 8px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  border: 1px solid transparent;
  min-height: 0;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.calendar-day:active:not(.empty) {
  transform: scale(0.95);
  background: #f0f7ff;
}

.calendar-day.empty {
  background: transparent;
  cursor: default;
}

.calendar-day.today {
  border-color: #667eea;
  background: #f0f7ff;
}

.calendar-day.weekend:not(.empty) {
  background: #fff7f7;
}

.calendar-day.weekend.today {
  background: #fff0f0;
}

.calendar-day.absent {
  cursor: pointer;
  animation: pulse 2s infinite;
}

.calendar-day.absent::after {
  content: '点击补卡';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #f5222d;
  font-weight: 600;
  white-space: nowrap;
  background: rgba(255, 77, 79, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

.calendar-day {
  position: relative;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.4);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(245, 34, 45, 0.1);
  }
}

.day-number {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  line-height: 1;
}

.weekend .day-number {
  color: #f5222d;
}

.today .day-number {
  color: #667eea;
}

.day-status {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 2px;
  min-height: 0;
  overflow: hidden;
}

.day-status.no-record {
  background: #fafafa;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  display: none;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.detail-content {
  background: white;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.detail-header::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
}

.detail-header h3 {
  margin: 8px 0 0 0;
  font-size: 17px;
  color: #333;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f7fa;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.close-btn:active {
  background: #e8e8e8;
  transform: scale(0.95);
}

.detail-body {
  padding: 16px 20px 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
  gap: 12px;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
  line-height: 1.5;
}

.detail-status {
  font-size: 12px;
  margin-left: 6px;
  display: inline-block;
  margin-top: 2px;
}

.detail-status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

.shift-badge-cal {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  display: inline-block;
}

.detail-value.makeup {
  color: #52c41a;
}

.makeup-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.makeup-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.leave-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
  color: white;
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
}

.leave-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.no-record-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 16px;
}

.leave-detail {
  text-align: center;
  padding: 20px;
  background: #f9f0ff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.leave-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.leave-title {
  font-size: 18px;
  font-weight: 600;
  color: #722ed1;
  margin-bottom: 4px;
}

.leave-desc {
  font-size: 13px;
  color: #999;
}

.no-record {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-record-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.no-record p {
  margin: 0;
  font-size: 14px;
}

@media (min-width: 769px) {
  .month-btn:hover {
    background: #f5f7fa;
    border-color: #667eea;
  }

  .export-btn:hover {
    opacity: 0.9;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .calendar-day:hover:not(.empty) {
    background: #f5f7fa;
    border-color: #667eea;
  }

  .detail-modal {
    align-items: center;
    padding: 20px;
  }

  .detail-content {
    max-width: 420px;
    border-radius: 16px;
  }

  .detail-header::before {
    display: none;
  }

  .status-text {
    display: block;
    font-size: 10px;
    font-weight: 500;
  }

  .day-status {
    flex-direction: column;
    gap: 2px;
  }
}

@media (max-width: 768px) {
  .calendar-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .filter-row {
    flex-direction: column;
    gap: 14px;
  }

  .filter-item {
    width: 100%;
  }

  .filter-select {
    padding: 10px 36px 10px 14px;
    font-size: 14px;
  }

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .overtime-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .overtime-stat-item.main {
    grid-column: span 1;
  }

  .overtime-stat-item.main.highlight {
    grid-column: span 1;
  }

  .stat-item {
    padding: 14px 6px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 11px;
  }

  .legend-card {
    gap: 12px;
  }

  .legend-items {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 12px;
  }

  .legend-item {
    font-size: 12px;
  }

  .calendar-day {
    padding: 3px 2px;
  }

  .day-number {
    font-size: 11px;
  }

  .status-indicator {
    width: 7px;
    height: 7px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .stat-item {
    padding: 12px 6px;
  }

  .stat-value {
    font-size: 20px;
  }

  .legend-items {
    grid-template-columns: repeat(2, 1fr);
  }

  .month-display {
    font-size: 14px;
    min-width: 100px;
  }

  .month-btn {
    width: 40px;
    height: 40px;
  }

  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }
}

@media (max-width: 360px) {
  .day-number {
    font-size: 10px;
  }

  .legend-items {
    grid-template-columns: 1fr;
  }
}
</style>
