<template>
  <div class="schedule-page">
    <div class="page-header">
      <h2 class="page-title">排班管理</h2>
      <p class="page-subtitle">按部门配置周班次模板、生成月度排班、管理换班申请</p>
    </div>

    <div class="section-tabs">
      <span class="section-tab" :class="{ active: activeSection === 'template' }" @click="activeSection = 'template'">📋 周班次模板</span>
      <span class="section-tab" :class="{ active: activeSection === 'schedule' }" @click="activeSection = 'schedule'">📅 月度排班</span>
      <span class="section-tab" :class="{ active: activeSection === 'swap' }" @click="activeSection = 'swap'">🔄 换班申请</span>
    </div>

    <div v-if="activeSection === 'template'" class="card template-card">
      <div class="card-header-row">
        <h4 class="card-title">周班次模板配置</h4>
        <div class="dept-selector">
          <label class="form-label-sm">选择部门</label>
          <select v-model="selectedDeptId" class="form-select" @change="loadTemplate">
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
        </div>
      </div>

      <div class="shift-legend">
        <span class="legend-title">班次类型：</span>
        <span v-for="st in shiftTypes" :key="st.value" class="legend-item" :style="{ background: st.color + '15', color: st.color, borderColor: st.color + '40' }">
          {{ st.icon }} {{ st.label }}
          <template v-if="st.startTime">（{{ st.startTime }}-{{ st.endTime }}）</template>
        </span>
      </div>

      <div class="week-template-grid">
        <div v-for="day in weekDays" :key="day.value" class="week-day-col">
          <div class="day-header">{{ day.label }}</div>
          <div class="shift-select-wrap">
            <select v-model="weekTemplate[day.value]" class="shift-select" :style="{ borderColor: getShiftColor(weekTemplate[day.value]) + '60' }">
              <option v-for="st in shiftTypes" :key="st.value" :value="st.value">{{ st.icon }} {{ st.label }}</option>
            </select>
            <span class="shift-time-hint" v-if="getShiftTimeRange(weekTemplate[day.value]).startTime">
              {{ getShiftTimeRange(weekTemplate[day.value]).startTime }}-{{ getShiftTimeRange(weekTemplate[day.value]).endTime }}
            </span>
            <span class="shift-time-hint rest-hint" v-else>休息日</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="saveTemplate">💾 保存模板</button>
      </div>

      <div v-if="existingTemplate" class="template-info">
        <span class="info-icon">ℹ️</span>
        <span>上次更新：{{ existingTemplate.updatedAt }}</span>
      </div>
    </div>

    <div v-if="activeSection === 'schedule'" class="card schedule-card">
      <div class="card-header-row">
        <h4 class="card-title">月度排班表</h4>
        <div class="schedule-controls">
          <select v-model="scheduleDeptId" class="form-select-sm">
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
          <div class="month-nav">
            <button class="nav-btn" @click="prevMonth">◀</button>
            <span class="month-display">{{ scheduleYear }}年{{ scheduleMonth }}月</span>
            <button class="nav-btn" @click="nextMonth">▶</button>
          </div>
          <button class="btn btn-primary btn-sm" @click="generateSchedule">⚡ 生成排班</button>
        </div>
      </div>

      <div v-if="currentMonthSchedule" class="schedule-table-wrap">
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="emp-col">员工</th>
              <th v-for="day in monthDays" :key="day" class="day-col" :class="{ 'weekend': isWeekendDay(scheduleYear, scheduleMonth, day) }">
                <div class="day-num">{{ day }}</div>
                <div class="day-week">{{ getWeekDayShort(scheduleYear, scheduleMonth, day) }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in deptEmployees" :key="emp.id">
              <td class="emp-cell">
                <span class="emp-avatar">{{ emp.avatar }}</span>
                <span class="emp-name">{{ emp.name }}</span>
              </td>
              <td
                v-for="day in monthDays"
                :key="day"
                class="shift-cell"
                :class="{ 'clickable': true }"
                @click="openShiftPicker(emp.id, day)"
              >
                <span
                  v-if="getEmployeeShiftForDay(emp.id, day)"
                  class="shift-dot"
                  :style="{ background: getShiftColor(getEmployeeShiftForDay(emp.id, day)) }"
                  :title="getShiftLabel(getEmployeeShiftForDay(emp.id, day))"
                ></span>
                <span class="shift-text" :style="{ color: getShiftColor(getEmployeeShiftForDay(emp.id, day)) }">
                  {{ getShiftShortLabel(getEmployeeShiftForDay(emp.id, day)) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <span class="empty-icon">📅</span>
        <p>尚未生成当月排班表，请先配置周班次模板后点击"生成排班"</p>
      </div>

      <div v-if="currentMonthSchedule" class="schedule-stats">
        <span class="stats-item" v-for="st in shiftTypes" :key="st.value">
          <span class="stats-dot" :style="{ background: st.color }"></span>
          {{ st.label }}：<strong>{{ countShiftInMonth(st.value) }}</strong> 人次
        </span>
      </div>
    </div>

    <div v-if="activeSection === 'swap'" class="card swap-card">
      <div class="card-header-row">
        <h4 class="card-title">换班申请</h4>
        <button class="btn btn-primary btn-sm" @click="showSwapForm = true" v-if="!showSwapForm">＋ 发起换班</button>
        <button class="btn btn-secondary btn-sm" @click="showSwapForm = false" v-else>取消</button>
      </div>

      <div v-if="showSwapForm" class="swap-form">
        <div class="form-row">
          <label class="form-label"><span class="label-text">换班日期</span><span class="required">*</span></label>
          <input v-model="swapForm.date" type="date" class="form-input" @change="loadSwapShifts" />
        </div>

        <div v-if="swapForm.date" class="swap-detail-grid">
          <div class="swap-detail-item">
            <label class="form-label"><span class="label-text">我的班次</span></label>
            <div class="shift-display" :style="{ background: getShiftColor(myShiftOnSwapDate) + '15', color: getShiftColor(myShiftOnSwapDate), borderColor: getShiftColor(myShiftOnSwapDate) + '40' }">
              {{ getShiftLabel(myShiftOnSwapDate) }}
              <template v-if="getShiftTimeRange(myShiftOnSwapDate).startTime">（{{ getShiftTimeRange(myShiftOnSwapDate).startTime }}-{{ getShiftTimeRange(myShiftOnSwapDate).endTime }}）</template>
            </div>
          </div>
          <div class="swap-detail-item">
            <label class="form-label"><span class="label-text">换班对象</span><span class="required">*</span></label>
            <select v-model="swapForm.targetId" class="form-select">
              <option value="">请选择</option>
              <option v-for="emp in swapTargetEmployees" :key="emp.id" :value="emp.id">{{ emp.name }}（{{ getShiftLabel(targetShiftOnSwapDate) }}）</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label"><span class="label-text">换班原因</span><span class="required">*</span></label>
          <textarea v-model="swapForm.reason" class="form-textarea" placeholder="请说明换班原因..." rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" @click="submitSwap" :disabled="!canSubmitSwap">提交换班申请</button>
        </div>
      </div>

      <div v-if="swapRequests.length === 0" class="empty-state">
        <span class="empty-icon">🔄</span>
        <p>暂无换班申请</p>
      </div>

      <div v-else class="swap-list">
        <div v-for="req in swapRequests" :key="req.id" class="swap-item">
          <div class="swap-header">
            <div class="swap-parties">
              <span class="swap-person">{{ req.requesterName }}</span>
              <span class="swap-arrow">⟷</span>
              <span class="swap-person">{{ req.targetName }}</span>
            </div>
            <span class="swap-status" :class="req.status" :style="{ background: getSwapStatusBg(req.status), color: getSwapStatusColor(req.status) }">
              {{ getSwapStatusText(req.status) }}
            </span>
          </div>
          <div class="swap-body">
            <span class="swap-date">{{ req.date }}</span>
            <span class="swap-shifts">
              {{ getShiftLabel(req.requesterShift) }} ⟷ {{ getShiftLabel(req.targetShift) }}
            </span>
          </div>
          <div class="swap-reason" v-if="req.reason">
            <span class="reason-label">原因：</span>{{ req.reason }}
          </div>
          <div class="swap-footer">
            <span class="swap-time">{{ req.createdAt }}</span>
            <div class="swap-actions" v-if="isSwapActionable(req)">
              <button class="action-btn approve" @click="approveSwap(req.id)">同意</button>
              <button class="action-btn reject" @click="rejectSwap(req.id)">拒绝</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showShiftPicker" class="modal-overlay" @click.self="showShiftPicker = false">
      <div class="modal-content">
        <h4 class="modal-title">修改班次</h4>
        <p class="modal-subtitle">{{ shiftPickerEmpName }} - {{ shiftPickerDate }}</p>
        <div class="shift-picker-grid">
          <div
            v-for="st in shiftTypes"
            :key="st.value"
            class="shift-picker-item"
            :class="{ active: shiftPickerValue === st.value }"
            :style="{ borderColor: shiftPickerValue === st.value ? st.color : '#e8e8e8', background: shiftPickerValue === st.value ? st.color + '10' : '#fafafa' }"
            @click="shiftPickerValue = st.value"
          >
            <span class="picker-icon">{{ st.icon }}</span>
            <span class="picker-label">{{ st.label }}</span>
            <span class="picker-time" v-if="st.startTime">{{ st.startTime }}-{{ st.endTime }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary btn-sm" @click="showShiftPicker = false">取消</button>
          <button class="btn btn-primary btn-sm" @click="confirmShiftChange">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useScheduleStore } from '@/store/schedule'
import { SHIFT_TYPES, WEEK_DAYS, SWAP_STATUS, SWAP_STATUS_TEXT, SWAP_STATUS_COLOR, getShiftType, getShiftLabel, getShiftColor, getShiftTimeRange, generateDefaultWeekTemplate } from '@/utils/schedule'
import { getToday, getMonthDays } from '@/utils/date'

const employeeStore = useEmployeeStore()
const scheduleStore = useScheduleStore()

const activeSection = ref('template')
const selectedDeptId = ref(1)
const scheduleDeptId = ref(1)

const now = new Date()
const scheduleYear = ref(now.getFullYear())
const scheduleMonth = ref(now.getMonth() + 1)

const weekTemplate = reactive(generateDefaultWeekTemplate())
const showSwapForm = ref(false)
const showShiftPicker = ref(false)
const shiftPickerEmpId = ref('')
const shiftPickerEmpName = ref('')
const shiftPickerDate = ref('')
const shiftPickerValue = ref('standard')

const swapForm = reactive({
  date: '',
  targetId: '',
  reason: ''
})

const shiftTypes = SHIFT_TYPES
const weekDays = WEEK_DAYS

const departments = computed(() => employeeStore.departments)
const currentUser = computed(() => employeeStore.currentUser)

const deptEmployees = computed(() => {
  return employeeStore.getEmployeesByDepartment(scheduleDeptId.value)
})

const existingTemplate = computed(() => {
  return scheduleStore.getTemplateByDept(selectedDeptId.value)
})

const currentMonthSchedule = computed(() => {
  return scheduleStore.getMonthSchedule(scheduleYear.value, scheduleMonth.value)
})

const monthDays = computed(() => {
  return getMonthDays(scheduleYear.value, scheduleMonth.value)
})

const myShiftOnSwapDate = computed(() => {
  if (!currentUser.value || !swapForm.date) return 'standard'
  return scheduleStore.getEmployeeShift(currentUser.value.id, swapForm.date)
})

const targetShiftOnSwapDate = computed(() => {
  if (!swapForm.targetId || !swapForm.date) return 'standard'
  return scheduleStore.getEmployeeShift(swapForm.targetId, swapForm.date)
})

const swapTargetEmployees = computed(() => {
  if (!currentUser.value) return []
  return employeeStore.employees.filter(e => e.id !== currentUser.value.id && e.departmentId === currentUser.value.departmentId)
})

const canSubmitSwap = computed(() => {
  return swapForm.date && swapForm.targetId && swapForm.reason.trim().length >= 5
})

const swapRequests = computed(() => {
  if (!currentUser.value) return []
  return scheduleStore.getEmployeeSwapRequests(currentUser.value.id)
})

function loadTemplate() {
  const template = scheduleStore.getTemplateByDept(selectedDeptId.value)
  if (template) {
    Object.keys(template.template).forEach(key => {
      weekTemplate[key] = template.template[key]
    })
  } else {
    const defaultTemplate = generateDefaultWeekTemplate()
    Object.keys(defaultTemplate).forEach(key => {
      weekTemplate[key] = defaultTemplate[key]
    })
  }
}

function saveTemplate() {
  const dept = departments.value.find(d => d.id === selectedDeptId.value)
  scheduleStore.saveWeekTemplate(selectedDeptId.value, dept ? dept.name : '', { ...weekTemplate })
}

function generateSchedule() {
  const empIds = deptEmployees.value.map(e => e.id)
  if (empIds.length === 0) {
    scheduleStore.showToast('该部门暂无员工', 'error')
    return
  }
  scheduleStore.generateMonthSchedule(scheduleDeptId.value, scheduleYear.value, scheduleMonth.value, empIds)
}

function prevMonth() {
  if (scheduleMonth.value === 1) {
    scheduleMonth.value = 12
    scheduleYear.value--
  } else {
    scheduleMonth.value--
  }
}

function nextMonth() {
  if (scheduleMonth.value === 12) {
    scheduleMonth.value = 1
    scheduleYear.value++
  } else {
    scheduleMonth.value++
  }
}

function getEmployeeShiftForDay(empId, day) {
  const dateStr = `${scheduleYear.value}-${String(scheduleMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const schedule = currentMonthSchedule.value
  if (!schedule || !schedule[empId] || !schedule[empId][dateStr]) return null
  return schedule[empId][dateStr]
}

function getShiftShortLabel(shiftType) {
  const map = { morning: '早', standard: '全', afternoon: '晚', night: '夜', rest: '休' }
  return map[shiftType] || '全'
}

function isWeekendDay(year, month, day) {
  const d = new Date(year, month - 1, day)
  return d.getDay() === 0 || d.getDay() === 6
}

function getWeekDayShort(year, month, day) {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return days[new Date(year, month - 1, day).getDay()]
}

function countShiftInMonth(shiftType) {
  let count = 0
  const schedule = currentMonthSchedule.value
  if (!schedule) return 0
  Object.keys(schedule).forEach(empId => {
    Object.keys(schedule[empId]).forEach(dateStr => {
      if (schedule[empId][dateStr] === shiftType) count++
    })
  })
  return count
}

function openShiftPicker(empId, day) {
  const emp = employeeStore.getEmployeeById(empId)
  shiftPickerEmpId.value = empId
  shiftPickerEmpName.value = emp ? emp.name : ''
  const dateStr = `${scheduleYear.value}-${String(scheduleMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  shiftPickerDate.value = dateStr
  shiftPickerValue.value = getEmployeeShiftForDay(empId, day) || 'standard'
  showShiftPicker.value = true
}

function confirmShiftChange() {
  scheduleStore.updateSingleShift(shiftPickerEmpId.value, shiftPickerDate.value, shiftPickerValue.value, scheduleYear.value, scheduleMonth.value)
  showShiftPicker.value = false
}

function loadSwapShifts() {}

function submitSwap() {
  if (!canSubmitSwap.value || !currentUser.value) return
  scheduleStore.submitSwapRequest({
    requesterId: currentUser.value.id,
    requesterName: currentUser.value.name,
    requesterShift: myShiftOnSwapDate.value,
    targetId: swapForm.targetId,
    targetName: swapTargetEmployees.value.find(e => e.id === swapForm.targetId)?.name || '',
    targetShift: targetShiftOnSwapDate.value,
    date: swapForm.date,
    reason: swapForm.reason.trim()
  })
  swapForm.date = ''
  swapForm.targetId = ''
  swapForm.reason = ''
  showSwapForm.value = false
}

function isSwapActionable(req) {
  if (!currentUser.value) return false
  if (req.status !== SWAP_STATUS.PENDING) return false
  return req.targetId === currentUser.value.id
}

function approveSwap(id) {
  scheduleStore.approveSwapRequest(id)
}

function rejectSwap(id) {
  scheduleStore.rejectSwapRequest(id)
}

function getSwapStatusText(status) {
  return SWAP_STATUS_TEXT[status] || status
}

function getSwapStatusColor(status) {
  return SWAP_STATUS_COLOR[status] || '#999'
}

function getSwapStatusBg(status) {
  const map = {
    [SWAP_STATUS.PENDING]: '#fffbe6',
    [SWAP_STATUS.APPROVED]: '#f6ffed',
    [SWAP_STATUS.REJECTED]: '#fff1f0'
  }
  return map[status] || '#fafafa'
}

onMounted(() => {
  loadTemplate()
})

watch(selectedDeptId, () => {
  loadTemplate()
})
</script>

<style scoped>
.schedule-page {
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

.section-tabs {
  display: flex;
  gap: 6px;
  background: white;
  padding: 6px;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.section-tabs::-webkit-scrollbar {
  display: none;
}

.section-tab {
  flex: 1;
  text-align: center;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

.section-tab:active {
  background: #f0f0f0;
}

.section-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.dept-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-label-sm {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.form-select,
.form-select-sm {
  padding: 10px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  background: #fafafa;
  color: #333;
  -webkit-appearance: none;
  appearance: none;
  min-height: 42px;
  cursor: pointer;
}

.form-select-sm {
  padding: 8px 12px;
  font-size: 13px;
  min-height: 36px;
}

.shift-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 10px;
}

.legend-title {
  font-size: 12px;
  color: #999;
  font-weight: 500;
  align-self: center;
}

.legend-item {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
}

.week-template-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.week-day-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.day-header {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  padding: 6px 0;
}

.shift-select-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.shift-select {
  width: 100%;
  padding: 10px 6px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 12px;
  text-align: center;
  background: #fafafa;
  color: #333;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.shift-time-hint {
  font-size: 10px;
  color: #999;
}

.shift-time-hint.rest-hint {
  color: #8c8c8c;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.info-icon {
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f7fa;
  color: #666;
  border: 1px solid #e8e8e8;
}

.schedule-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.15s;
}

.nav-btn:active {
  background: #e8e8e8;
}

.month-display {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.schedule-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 800px;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #f0f0f0;
  padding: 6px 4px;
  text-align: center;
}

.schedule-table th {
  background: #f5f7fa;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 1;
}

.emp-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #f5f7fa;
  min-width: 80px;
}

.day-col.weekend {
  background: #fef7f0;
}

.day-num {
  font-weight: 600;
  font-size: 13px;
}

.day-week {
  font-size: 10px;
  color: #999;
}

.emp-cell {
  position: sticky;
  left: 0;
  z-index: 1;
  background: white;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.emp-avatar {
  font-size: 16px;
}

.emp-name {
  font-size: 12px;
  font-weight: 500;
}

.shift-cell {
  cursor: pointer;
  transition: background 0.1s;
  min-width: 30px;
}

.shift-cell:active {
  background: #f0f0f0;
}

.shift-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 2px;
}

.shift-text {
  font-size: 11px;
  font-weight: 600;
}

.schedule-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 10px;
  font-size: 12px;
  color: #666;
}

.stats-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 4px;
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
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.swap-form {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
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
  font-size: 13px;
}

.required {
  color: #f5222d;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  background: white;
  font-family: inherit;
  -webkit-appearance: none;
  appearance: none;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.6;
}

.swap-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.swap-detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shift-display {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 500;
}

.swap-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.swap-item {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px 16px;
}

.swap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.swap-parties {
  display: flex;
  align-items: center;
  gap: 8px;
}

.swap-person {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.swap-arrow {
  color: #667eea;
  font-size: 16px;
}

.swap-status {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.swap-body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
}

.swap-date {
  color: #333;
  font-weight: 500;
}

.swap-shifts {
  color: #667eea;
  font-weight: 500;
}

.swap-reason {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.reason-label {
  color: #999;
}

.swap-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}

.swap-time {
  font-size: 11px;
  color: #999;
}

.swap-actions {
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0 0 16px 0;
}

.shift-picker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.shift-picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fafafa;
}

.shift-picker-item:active {
  transform: scale(0.97);
}

.shift-picker-item.active {
  border-width: 2px;
}

.picker-icon {
  font-size: 22px;
}

.picker-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.picker-time {
  font-size: 10px;
  color: #999;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (min-width: 769px) {
  .section-tab:hover:not(.active) {
    background: #f0f0f0;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }

  .nav-btn:hover {
    background: #e8e8e8;
  }

  .shift-cell:hover {
    background: #f0f7ff;
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
  .schedule-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .section-tabs {
    border-radius: 12px;
  }

  .section-tab {
    padding: 10px 12px;
    font-size: 13px;
  }

  .card-header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .schedule-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .week-template-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .shift-legend {
    gap: 6px;
  }

  .legend-item {
    font-size: 10px;
    padding: 3px 8px;
  }

  .swap-detail-grid {
    grid-template-columns: 1fr;
  }

  .shift-picker-grid {
    grid-template-columns: 1fr 1fr;
  }

  .form-select {
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

  .card {
    padding: 14px;
  }

  .section-tab {
    padding: 9px 10px;
    font-size: 12px;
  }

  .week-template-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .shift-legend {
    flex-direction: column;
  }
}
</style>
