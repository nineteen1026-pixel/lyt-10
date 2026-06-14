import { workTimeConfig } from '@/data/employees'
import { parseTime, formatTime, getToday } from './date'

export const ATTENDANCE_STATUS = {
  NORMAL: 'normal',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  ABSENT: 'absent',
  NOT_CHECKED: 'not_checked',
  MAKEUP: 'makeup',
  LEAVE: 'leave',
  OVERTIME: 'overtime'
}

export const STATUS_TEXT = {
  [ATTENDANCE_STATUS.NORMAL]: '正常',
  [ATTENDANCE_STATUS.LATE]: '迟到',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '早退',
  [ATTENDANCE_STATUS.ABSENT]: '缺勤',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '未打卡',
  [ATTENDANCE_STATUS.MAKEUP]: '补卡',
  [ATTENDANCE_STATUS.LEAVE]: '请假',
  [ATTENDANCE_STATUS.OVERTIME]: '加班'
}

export const STATUS_COLOR = {
  [ATTENDANCE_STATUS.NORMAL]: '#52c41a',
  [ATTENDANCE_STATUS.LATE]: '#fa8c16',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '#faad14',
  [ATTENDANCE_STATUS.ABSENT]: '#f5222d',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '#bfbfbf',
  [ATTENDANCE_STATUS.MAKEUP]: '#1890ff',
  [ATTENDANCE_STATUS.LEAVE]: '#722ed1',
  [ATTENDANCE_STATUS.OVERTIME]: '#eb2f96'
}

export const STATUS_BG_COLOR = {
  [ATTENDANCE_STATUS.NORMAL]: '#f6ffed',
  [ATTENDANCE_STATUS.LATE]: '#fff7e6',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '#fffbe6',
  [ATTENDANCE_STATUS.ABSENT]: '#fff1f0',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '#fafafa',
  [ATTENDANCE_STATUS.MAKEUP]: '#e6f7ff',
  [ATTENDANCE_STATUS.LEAVE]: '#f9f0ff',
  [ATTENDANCE_STATUS.OVERTIME]: '#fff0f6'
}

export const LEAVE_TYPES = [
  { value: 'annual', label: '年假', color: '#722ed1' },
  { value: 'sick', label: '病假', color: '#eb2f96' },
  { value: 'personal', label: '事假', color: '#fa8c16' },
  { value: 'marriage', label: '婚假', color: '#f5222d' },
  { value: 'maternity', label: '产假', color: '#52c41a' },
  { value: 'paternity', label: '陪产假', color: '#1890ff' },
  { value: 'funeral', label: '丧假', color: '#595959' },
  { value: 'other', label: '其他', color: '#8c8c8c' }
]

export const OVERTIME_TYPES = [
  { value: 'weekday', label: '工作日加班', color: '#fa8c16', rate: 1.5 },
  { value: 'weekend', label: '周末加班', color: '#722ed1', rate: 2.0 },
  { value: 'holiday', label: '法定节假日加班', color: '#f5222d', rate: 3.0 }
]

export const APPROVAL_STAGES = [
  { id: 'supervisor', name: '直属领导', order: 1 },
  { id: 'manager', name: '部门经理', order: 2 },
  { id: 'hr', name: '人事审批', order: 3 }
]

export const OVERTIME_STATUS = {
  PENDING_SUPERVISOR: 'pending_supervisor',
  APPROVED_SUPERVISOR: 'approved_supervisor',
  REJECTED_SUPERVISOR: 'rejected_supervisor',
  PENDING_MANAGER: 'pending_manager',
  APPROVED_MANAGER: 'approved_manager',
  REJECTED_MANAGER: 'rejected_manager',
  PENDING_HR: 'pending_hr',
  APPROVED: 'approved',
  REJECTED_HR: 'rejected_hr'
}

export const OVERTIME_STATUS_TEXT = {
  [OVERTIME_STATUS.PENDING_SUPERVISOR]: '待直属领导审批',
  [OVERTIME_STATUS.APPROVED_SUPERVISOR]: '直属领导已通过',
  [OVERTIME_STATUS.REJECTED_SUPERVISOR]: '直属领导已拒绝',
  [OVERTIME_STATUS.PENDING_MANAGER]: '待部门经理审批',
  [OVERTIME_STATUS.APPROVED_MANAGER]: '部门经理已通过',
  [OVERTIME_STATUS.REJECTED_MANAGER]: '部门经理已拒绝',
  [OVERTIME_STATUS.PENDING_HR]: '待人事审批',
  [OVERTIME_STATUS.APPROVED]: '已通过',
  [OVERTIME_STATUS.REJECTED_HR]: '人事已拒绝'
}

export const OVERTIME_STATUS_COLOR = {
  [OVERTIME_STATUS.PENDING_SUPERVISOR]: '#faad14',
  [OVERTIME_STATUS.APPROVED_SUPERVISOR]: '#1890ff',
  [OVERTIME_STATUS.REJECTED_SUPERVISOR]: '#f5222d',
  [OVERTIME_STATUS.PENDING_MANAGER]: '#faad14',
  [OVERTIME_STATUS.APPROVED_MANAGER]: '#1890ff',
  [OVERTIME_STATUS.REJECTED_MANAGER]: '#f5222d',
  [OVERTIME_STATUS.PENDING_HR]: '#faad14',
  [OVERTIME_STATUS.APPROVED]: '#52c41a',
  [OVERTIME_STATUS.REJECTED_HR]: '#f5222d'
}

export function getOvertimeTypeLabel(type) {
  const overtimeType = OVERTIME_TYPES.find(t => t.value === type)
  return overtimeType ? overtimeType.label : type
}

export function getOvertimeTypeColor(type) {
  const overtimeType = OVERTIME_TYPES.find(t => t.value === type)
  return overtimeType ? overtimeType.color : '#999'
}

export function getOvertimeTypeRate(type) {
  const overtimeType = OVERTIME_TYPES.find(t => t.value === type)
  return overtimeType ? overtimeType.rate : 1
}

export function getOvertimeStatusText(status) {
  return OVERTIME_STATUS_TEXT[status] || status
}

export function getOvertimeStatusColor(status) {
  return OVERTIME_STATUS_COLOR[status] || '#999'
}

export function getNextApprovalStage(currentStatus) {
  const stageMap = {
    [OVERTIME_STATUS.PENDING_SUPERVISOR]: APPROVAL_STAGES[0],
    [OVERTIME_STATUS.APPROVED_SUPERVISOR]: APPROVAL_STAGES[1],
    [OVERTIME_STATUS.PENDING_MANAGER]: APPROVAL_STAGES[1],
    [OVERTIME_STATUS.APPROVED_MANAGER]: APPROVAL_STAGES[2],
    [OVERTIME_STATUS.PENDING_HR]: APPROVAL_STAGES[2]
  }
  return stageMap[currentStatus] || null
}

export function isOvertimeFinalApproved(status) {
  return status === OVERTIME_STATUS.APPROVED
}

export function isOvertimeRejected(status) {
  return [
    OVERTIME_STATUS.REJECTED_SUPERVISOR,
    OVERTIME_STATUS.REJECTED_MANAGER,
    OVERTIME_STATUS.REJECTED_HR
  ].includes(status)
}

export function getOvertimeApprovalProgress(status) {
  if (isOvertimeRejected(status)) {
    return { current: 0, total: 3, completed: 0 }
  }
  
  const progressMap = {
    [OVERTIME_STATUS.PENDING_SUPERVISOR]: 0,
    [OVERTIME_STATUS.APPROVED_SUPERVISOR]: 1,
    [OVERTIME_STATUS.PENDING_MANAGER]: 1,
    [OVERTIME_STATUS.APPROVED_MANAGER]: 2,
    [OVERTIME_STATUS.PENDING_HR]: 2,
    [OVERTIME_STATUS.APPROVED]: 3
  }
  
  const current = progressMap[status] || 0
  return {
    current,
    total: 3,
    completed: current
  }
}

export function calculateOvertimeHours(startTime, endTime, type) {
  if (!startTime || !endTime) return 0
  
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  
  if (end <= start) return 0
  
  const rate = getOvertimeTypeRate(type)
  const hours = (end - start) / 60
  
  return Math.round(hours * rate * 100) / 100
}

export function getCheckInStatus(checkInTime) {
  if (!checkInTime) return ATTENDANCE_STATUS.NOT_CHECKED

  const morningStart = parseTime(workTimeConfig.morningStart)
  const checkIn = parseTime(checkInTime)
  const lateThreshold = workTimeConfig.lateThreshold

  if (checkIn > morningStart + lateThreshold) {
    return ATTENDANCE_STATUS.LATE
  }
  return ATTENDANCE_STATUS.NORMAL
}

export function getCheckOutStatus(checkOutTime) {
  if (!checkOutTime) return ATTENDANCE_STATUS.NOT_CHECKED

  const afternoonEnd = parseTime(workTimeConfig.afternoonEnd)
  const checkOut = parseTime(checkOutTime)
  const earlyThreshold = workTimeConfig.earlyLeaveThreshold

  if (checkOut < afternoonEnd - earlyThreshold) {
    return ATTENDANCE_STATUS.EARLY_LEAVE
  }
  return ATTENDANCE_STATUS.NORMAL
}

export function getDayStatus(record) {
  if (!record) return ATTENDANCE_STATUS.NOT_CHECKED

  if (record.isLeave) {
    return ATTENDANCE_STATUS.LEAVE
  }

  if (record.makeupApproved) {
    return ATTENDANCE_STATUS.MAKEUP
  }

  if (record.isOvertime) {
    return ATTENDANCE_STATUS.OVERTIME
  }

  const checkInStatus = record.checkIn ? getCheckInStatus(record.checkIn) : ATTENDANCE_STATUS.NOT_CHECKED
  const checkOutStatus = record.checkOut ? getCheckOutStatus(record.checkOut) : ATTENDANCE_STATUS.NOT_CHECKED

  if (checkInStatus === ATTENDANCE_STATUS.LATE || checkOutStatus === ATTENDANCE_STATUS.EARLY_LEAVE) {
    if (checkInStatus === ATTENDANCE_STATUS.LATE) return ATTENDANCE_STATUS.LATE
    return ATTENDANCE_STATUS.EARLY_LEAVE
  }

  if (checkInStatus === ATTENDANCE_STATUS.NORMAL && checkOutStatus === ATTENDANCE_STATUS.NORMAL) {
    return ATTENDANCE_STATUS.NORMAL
  }

  if (checkInStatus === ATTENDANCE_STATUS.NOT_CHECKED && checkOutStatus === ATTENDANCE_STATUS.NOT_CHECKED) {
    return ATTENDANCE_STATUS.ABSENT
  }

  return ATTENDANCE_STATUS.NOT_CHECKED
}

export function getLeaveTypeLabel(type) {
  const leaveType = LEAVE_TYPES.find(t => t.value === type)
  return leaveType ? leaveType.label : type
}

export function getStatusText(status) {
  return STATUS_TEXT[status] || '未知'
}

export function getStatusColor(status) {
  return STATUS_COLOR[status] || '#999'
}

export function getStatusBgColor(status) {
  return STATUS_BG_COLOR[status] || '#fff'
}

export function generateMonthCalendarData(records, year, month) {
  const result = {}
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const record = records[date]
    result[date] = {
      date,
      record,
      status: getDayStatus(record)
    }
  }

  return result
}

export function calculateAttendanceStats(records, year, month) {
  const stats = {
    total: 0,
    normal: 0,
    late: 0,
    earlyLeave: 0,
    absent: 0,
    makeup: 0,
    leave: 0,
    overtime: 0,
    overtimeHours: 0,
    weekdayOvertimeHours: 0,
    weekendOvertimeHours: 0,
    holidayOvertimeHours: 0
  }

  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    if (!isWeekend) {
      stats.total++
    }
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const record = records[dateStr]
    const status = getDayStatus(record)

    if (record && record.isOvertime && record.overtimeHours) {
      stats.overtime++
      const otHours = parseFloat(record.overtimeHours) || 0
      stats.overtimeHours += otHours
      
      if (record.overtimeType === 'weekday') {
        stats.weekdayOvertimeHours += otHours
      } else if (record.overtimeType === 'weekend') {
        stats.weekendOvertimeHours += otHours
      } else if (record.overtimeType === 'holiday') {
        stats.holidayOvertimeHours += otHours
      }
    }

    if (isWeekend) continue

    switch (status) {
      case ATTENDANCE_STATUS.NORMAL:
        stats.normal++
        break
      case ATTENDANCE_STATUS.LATE:
        stats.late++
        break
      case ATTENDANCE_STATUS.EARLY_LEAVE:
        stats.earlyLeave++
        break
      case ATTENDANCE_STATUS.ABSENT:
      case ATTENDANCE_STATUS.NOT_CHECKED:
        stats.absent++
        break
      case ATTENDANCE_STATUS.MAKEUP:
        stats.makeup++
        break
      case ATTENDANCE_STATUS.LEAVE:
        stats.leave++
        break
      case ATTENDANCE_STATUS.OVERTIME:
        stats.normal++
        break
    }
  }

  stats.overtimeHours = Math.round(stats.overtimeHours * 100) / 100
  stats.weekdayOvertimeHours = Math.round(stats.weekdayOvertimeHours * 100) / 100
  stats.weekendOvertimeHours = Math.round(stats.weekendOvertimeHours * 100) / 100
  stats.holidayOvertimeHours = Math.round(stats.holidayOvertimeHours * 100) / 100

  return stats
}
