import { parseTime } from './date'
import { workTimeConfig } from '@/data/employees'

export const SHIFT_TYPES = [
  { value: 'morning', label: '早班', color: '#1890ff', startTime: '08:00', endTime: '16:00', icon: '🌅' },
  { value: 'standard', label: '全天班', color: '#52c41a', startTime: '09:00', endTime: '18:00', icon: '☀️' },
  { value: 'afternoon', label: '晚班', color: '#722ed1', startTime: '13:00', endTime: '21:00', icon: '🌙' },
  { value: 'night', label: '夜班', color: '#eb2f96', startTime: '22:00', endTime: '06:00', icon: '🌃' },
  { value: 'rest', label: '休息', color: '#8c8c8c', startTime: '', endTime: '', icon: '🛌' }
]

export const WEEK_DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' }
]

export const SWAP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export const SWAP_STATUS_TEXT = {
  [SWAP_STATUS.PENDING]: '待审批',
  [SWAP_STATUS.APPROVED]: '已通过',
  [SWAP_STATUS.REJECTED]: '已拒绝'
}

export const SWAP_STATUS_COLOR = {
  [SWAP_STATUS.PENDING]: '#faad14',
  [SWAP_STATUS.APPROVED]: '#52c41a',
  [SWAP_STATUS.REJECTED]: '#f5222d'
}

export function getShiftType(value) {
  return SHIFT_TYPES.find(t => t.value === value) || SHIFT_TYPES[1]
}

export function getShiftLabel(value) {
  const shift = getShiftType(value)
  return shift.label
}

export function getShiftColor(value) {
  const shift = getShiftType(value)
  return shift.color
}

export function getShiftTimeRange(value) {
  const shift = getShiftType(value)
  return { startTime: shift.startTime, endTime: shift.endTime }
}

export function getShiftWorkConfig(shiftType) {
  if (shiftType === 'rest') {
    return null
  }
  const shift = getShiftType(shiftType)
  if (!shift.startTime || !shift.endTime) {
    return null
  }
  return {
    morningStart: shift.startTime,
    afternoonEnd: shift.endTime,
    lateThreshold: workTimeConfig.lateThreshold,
    earlyLeaveThreshold: workTimeConfig.earlyLeaveThreshold
  }
}

export function generateDefaultWeekTemplate() {
  const template = {}
  WEEK_DAYS.forEach(day => {
    if (day.value === 0 || day.value === 6) {
      template[day.value] = 'rest'
    } else {
      template[day.value] = 'standard'
    }
  })
  return template
}

export function generateMonthScheduleFromTemplate(weekTemplate, year, month, employeeIds) {
  const schedule = {}
  const daysInMonth = new Date(year, month, 0).getDate()

  employeeIds.forEach(empId => {
    schedule[empId] = {}
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dayOfWeek = date.getDay()
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      schedule[empId][dateStr] = weekTemplate[dayOfWeek] || 'rest'
    }
  })

  return schedule
}

export function getEmployeeShiftForDate(schedule, employeeId, dateStr) {
  if (!schedule || !schedule[employeeId] || !schedule[employeeId][dateStr]) {
    return 'standard'
  }
  return schedule[employeeId][dateStr]
}

export function getWorkTimeForShift(shiftType) {
  const config = getShiftWorkConfig(shiftType)
  if (!config) {
    return null
  }
  return {
    startTime: config.morningStart,
    endTime: config.afternoonEnd,
    lateThreshold: config.lateThreshold,
    earlyLeaveThreshold: config.earlyLeaveThreshold
  }
}

export function checkInStatusWithShift(checkInTime, shiftType) {
  const workTime = getWorkTimeForShift(shiftType)
  if (!workTime) return null

  const shiftStart = parseTime(workTime.startTime)
  const checkIn = parseTime(checkInTime)

  if (checkIn > shiftStart + workTime.lateThreshold) {
    return 'late'
  }
  return 'normal'
}

export function checkOutStatusWithShift(checkOutTime, shiftType) {
  const workTime = getWorkTimeForShift(shiftType)
  if (!workTime) return null

  const shiftEnd = parseTime(workTime.endTime)
  const checkOut = parseTime(checkOutTime)

  if (workTime.startTime > workTime.endTime) {
    const nextDayEnd = shiftEnd + 24 * 60
    if (checkOut < shiftEnd && checkOut + 24 * 60 < nextDayEnd - workTime.earlyLeaveThreshold) {
      return 'early_leave'
    }
  } else {
    if (checkOut < shiftEnd - workTime.earlyLeaveThreshold) {
      return 'early_leave'
    }
  }
  return 'normal'
}
