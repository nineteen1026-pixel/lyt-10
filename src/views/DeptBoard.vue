<template>
  <div class="dept-dashboard">
    <div class="page-header">
      <h2 class="page-title">部门考勤看板</h2>
      <p class="page-subtitle">按部门查看整体出勤情况与异常明细</p>
    </div>

    <div class="card filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">选择部门</label>
          <select v-model="selectedDeptId" class="filter-select">
            <option :value="0">全部部门</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
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

        <div class="filter-item">
          <label class="filter-label">选择年份</label>
          <select v-model="currentYear" class="filter-select">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card stats-card">
      <h4 class="card-title">
        {{ selectedDeptId === 0 ? '全部部门' : selectedDeptName }} - {{ formatMonthDisplay(currentYear, currentMonth) }} 考勤汇总
      </h4>
      <div class="stats-grid">
        <div class="stat-item stat-total">
          <div class="stat-value" style="color: #333">{{ deptStats.total }}</div>
          <div class="stat-label">应出勤(人次)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #52c41a">{{ deptStats.normal }}</div>
          <div class="stat-label">正常</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #fa8c16">{{ deptStats.late }}</div>
          <div class="stat-label">迟到</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #faad14">{{ deptStats.earlyLeave }}</div>
          <div class="stat-label">早退</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #f5222d">{{ deptStats.absent }}</div>
          <div class="stat-label">缺勤</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color: #1890ff">{{ deptStats.makeup }}</div>
          <div class="stat-label">补卡</div>
        </div>
      </div>
      <div class="attendance-rate-bar">
        <div class="rate-label">
          <span>出勤率</span>
          <span class="rate-value">{{ attendanceRate }}%</span>
        </div>
        <div class="rate-track">
          <div class="rate-fill" :style="{ width: attendanceRate + '%', background: attendanceRate >= 90 ? '#52c41a' : attendanceRate >= 70 ? '#faad14' : '#f5222d' }"></div>
        </div>
      </div>
    </div>

    <div class="card trend-card">
      <h4 class="card-title">{{ currentYear }}年月度异常趋势</h4>
      <div class="chart-container">
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#fa8c16"></span>迟到</span>
          <span class="legend-item"><span class="legend-dot" style="background:#faad14"></span>早退</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f5222d"></span>缺勤</span>
          <span class="legend-item"><span class="legend-dot" style="background:#bfbfbf"></span>无打卡</span>
          <span class="legend-item"><span class="legend-dot" style="background:#1890ff"></span>补卡</span>
        </div>
        <div class="bar-chart">
          <div class="chart-y-axis">
            <span>{{ chartMaxLabel }}</span>
            <span>{{ Math.round(chartMaxLabel / 2) }}</span>
            <span>0</span>
          </div>
          <div class="chart-bars">
            <div v-for="item in trendData" :key="item.month" class="bar-group" :class="{ active: item.month === currentMonth }">
              <div class="bar-stack">
                <div
                  class="bar-segment"
                  :style="{ height: getBarHeight(item.makeup, chartMax) + 'px', background: '#1890ff' }"
                  :title="'补卡: ' + item.makeup"
                ></div>
                <div
                  class="bar-segment"
                  :style="{ height: getBarHeight(item.notChecked, chartMax) + 'px', background: '#bfbfbf' }"
                  :title="'无打卡: ' + item.notChecked"
                ></div>
                <div
                  class="bar-segment"
                  :style="{ height: getBarHeight(item.absent, chartMax) + 'px', background: '#f5222d' }"
                  :title="'缺勤: ' + item.absent"
                ></div>
                <div
                  class="bar-segment"
                  :style="{ height: getBarHeight(item.earlyLeave, chartMax) + 'px', background: '#faad14' }"
                  :title="'早退: ' + item.earlyLeave"
                ></div>
                <div
                  class="bar-segment"
                  :style="{ height: getBarHeight(item.late, chartMax) + 'px', background: '#fa8c16' }"
                  :title="'迟到: ' + item.late"
                ></div>
              </div>
              <div class="bar-label">{{ item.month }}月</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card detail-card">
      <h4 class="card-title">
        异常员工明细
        <span class="card-count">共 {{ abnormalEmployees.length }} 人</span>
      </h4>
      <div v-if="abnormalEmployees.length === 0" class="empty-state">
        <span class="empty-icon">✅</span>
        <p>本月暂无异常记录</p>
      </div>
      <div v-else class="employee-list">
        <div v-for="emp in abnormalEmployees" :key="emp.employeeId" class="employee-item" @click="toggleEmployee(emp.employeeId)">
          <div class="employee-header">
            <div class="employee-info">
              <span class="employee-avatar">{{ getEmployeeAvatar(emp.employeeId) }}</span>
              <span class="employee-name">{{ getEmployeeName(emp.employeeId) }}</span>
              <span class="employee-dept">{{ getEmployeeDept(emp.employeeId) }}</span>
            </div>
            <div class="employee-badges">
              <span v-if="emp.late" class="badge badge-late">迟到 {{ emp.late }}</span>
              <span v-if="emp.earlyLeave" class="badge badge-early">早退 {{ emp.earlyLeave }}</span>
              <span v-if="emp.absent" class="badge badge-absent">缺勤 {{ emp.absent }}</span>
              <span v-if="emp.notChecked" class="badge badge-notchecked">未打卡 {{ emp.notChecked }}</span>
              <span v-if="emp.makeup" class="badge badge-makeup">补卡 {{ emp.makeup }}</span>
            </div>
            <span class="expand-arrow" :class="{ expanded: expandedEmployee === emp.employeeId }">▼</span>
          </div>
          <Transition name="slide">
            <div v-if="expandedEmployee === emp.employeeId" class="employee-detail">
              <div class="detail-table">
                <div class="detail-table-header">
                  <span class="col-date">日期</span>
                  <span class="col-status">状态</span>
                  <span class="col-checkin">上班</span>
                  <span class="col-checkout">下班</span>
                </div>
                <div v-for="d in emp.details" :key="d.date" class="detail-table-row">
                  <span class="col-date">{{ formatDateShort(d.date) }}</span>
                  <span class="col-status">
                    <span class="status-badge" :style="{ background: getStatusBgColor(d.status), color: getStatusColor(d.status) }">
                      {{ getStatusText(d.status) }}
                    </span>
                  </span>
                  <span class="col-checkin">{{ d.record?.checkIn || '-' }}</span>
                  <span class="col-checkout">{{ d.record?.checkOut || '-' }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useAttendanceStore } from '@/store/attendance'
import { formatMonthDisplay } from '@/utils/date'
import { getStatusText, getStatusColor, getStatusBgColor, ATTENDANCE_STATUS } from '@/utils/attendance'

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedDeptId = ref(0)
const expandedEmployee = ref(null)

const yearOptions = computed(() => {
  const current = now.getFullYear()
  return [current - 1, current, current + 1]
})

const departments = computed(() => employeeStore.departments)

const selectedDeptName = computed(() => {
  if (selectedDeptId.value === 0) return '全部部门'
  const dept = departments.value.find(d => d.id === selectedDeptId.value)
  return dept ? dept.name : ''
})

const targetEmployeeIds = computed(() => {
  if (selectedDeptId.value === 0) {
    return employeeStore.employees.map(e => e.id)
  }
  return employeeStore.getEmployeesByDepartment(selectedDeptId.value).map(e => e.id)
})

const deptStats = computed(() => {
  return attendanceStore.getDepartmentMonthStats(targetEmployeeIds.value, currentYear.value, currentMonth.value)
})

const attendanceRate = computed(() => {
  if (deptStats.value.total === 0) return 0
  return Math.round((deptStats.value.normal / deptStats.value.total) * 100)
})

const trendData = computed(() => {
  return attendanceStore.getDepartmentMonthTrend(targetEmployeeIds.value, currentYear.value)
})

const chartMax = computed(() => {
  const maxVal = Math.max(...trendData.value.map(t => t.late + t.earlyLeave + t.absent + t.notChecked + t.makeup), 1)
  return Math.ceil(maxVal / 5) * 5
})

const chartMaxLabel = computed(() => chartMax.value)

const abnormalEmployees = computed(() => {
  return attendanceStore.getDepartmentAbnormalEmployees(targetEmployeeIds.value, currentYear.value, currentMonth.value)
})

function getBarHeight(value, max) {
  if (max === 0) return 0
  return Math.max(0, (value / max) * 160)
}

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

function toggleEmployee(empId) {
  expandedEmployee.value = expandedEmployee.value === empId ? null : empId
}

function getEmployeeName(empId) {
  const emp = employeeStore.getEmployeeById(empId)
  return emp ? emp.name : empId
}

function getEmployeeAvatar(empId) {
  const emp = employeeStore.getEmployeeById(empId)
  return emp ? emp.avatar : '👤'
}

function getEmployeeDept(empId) {
  const emp = employeeStore.getEmployeeById(empId)
  return emp ? emp.department : ''
}

function formatDateShort(dateStr) {
  return dateStr.slice(5)
}

watch(selectedDeptId, () => {
  expandedEmployee.value = null
})

watch(currentMonth, () => {
  expandedEmployee.value = null
})

watch(currentYear, () => {
  expandedEmployee.value = null
})
</script>

<style scoped>
.dept-dashboard {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-count {
  font-size: 12px;
  font-weight: 400;
  color: #999;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 16px;
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

.attendance-rate-bar {
  padding-top: 4px;
}

.rate-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.rate-value {
  font-weight: 600;
  color: #333;
}

.rate-track {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease, background 0.3s ease;
}

.chart-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.chart-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.chart-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bar-chart {
  display: flex;
  gap: 0;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 8px;
  font-size: 11px;
  color: #999;
  text-align: right;
  min-width: 28px;
  height: 160px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  height: 160px;
  border-bottom: 1px solid #e8e8e8;
  border-left: 1px solid #e8e8e8;
  padding-left: 4px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 28px;
  transition: opacity 0.2s;
}

.bar-group.active {
  opacity: 1;
}

.bar-group:not(.active) {
  opacity: 0.55;
}

.bar-stack {
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  max-width: 32px;
  cursor: pointer;
}

.bar-stack:hover .bar-segment {
  filter: brightness(1.1);
}

.bar-segment {
  transition: height 0.4s ease;
  min-height: 0;
  border-radius: 1px;
}

.bar-label {
  font-size: 10px;
  color: #999;
  margin-top: 6px;
  white-space: nowrap;
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.employee-item {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.employee-item:hover {
  border-color: #d9d9d9;
}

.employee-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.employee-avatar {
  font-size: 22px;
  flex-shrink: 0;
}

.employee-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.employee-dept {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
}

.badge-late {
  background: #fff7e6;
  color: #fa8c16;
}

.badge-early {
  background: #fffbe6;
  color: #faad14;
}

.badge-absent {
  background: #fff1f0;
  color: #f5222d;
}

.badge-makeup {
  background: #e6f7ff;
  color: #1890ff;
}

.badge-notchecked {
  background: #f5f5f5;
  color: #8c8c8c;
}

.expand-arrow {
  font-size: 10px;
  color: #999;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.expand-arrow.expanded {
  transform: rotate(180deg);
}

.employee-detail {
  padding: 0 16px 16px;
}

.detail-table {
  width: 100%;
}

.detail-table-header {
  display: grid;
  grid-template-columns: 70px 70px 1fr 1fr;
  gap: 8px;
  padding: 8px 0;
  font-size: 12px;
  color: #999;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
}

.detail-table-row {
  display: grid;
  grid-template-columns: 70px 70px 1fr 1fr;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f5f5f5;
  align-items: center;
}

.detail-table-row:last-child {
  border-bottom: none;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.col-date,
.col-status,
.col-checkin,
.col-checkout {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

@media (min-width: 769px) {
  .month-btn:hover {
    background: #f5f7fa;
    border-color: #667eea;
  }

  .bar-group:not(.active):hover {
    opacity: 0.85;
  }
}

@media (max-width: 768px) {
  .dept-dashboard {
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

  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
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

  .employee-header {
    flex-wrap: wrap;
    padding: 10px 12px;
  }

  .employee-badges {
    width: 100%;
    padding-left: 30px;
  }

  .detail-table-header,
  .detail-table-row {
    grid-template-columns: 60px 60px 1fr 1fr;
    font-size: 12px;
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

  .chart-y-axis {
    min-width: 20px;
    font-size: 10px;
  }

  .bar-group {
    min-width: 22px;
  }

  .bar-label {
    font-size: 9px;
  }
}
</style>
