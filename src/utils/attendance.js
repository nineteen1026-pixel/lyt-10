import { workTimeConfig } from '@/data/employees'
import { parseTime, formatTime, getToday } from './date'

export const ATTENDANCE_STATUS = {
  NORMAL: 'normal',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  ABSENT: 'absent',
  NOT_CHECKED: 'not_checked',
  MAKEUP: 'makeup',
  LEAVE: 'leave'
}

export const STATUS_TEXT = {
  [ATTENDANCE_STATUS.NORMAL]: '正常',
  [ATTENDANCE_STATUS.LATE]: '迟到',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '早退',
  [ATTENDANCE_STATUS.ABSENT]: '缺勤',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '未打卡',
  [ATTENDANCE_STATUS.MAKEUP]: '补卡',
  [ATTENDANCE_STATUS.LEAVE]: '请假'
}

export const STATUS_COLOR = {
  [ATTENDANCE_STATUS.NORMAL]: '#52c41a',
  [ATTENDANCE_STATUS.LATE]: '#fa8c16',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '#faad14',
  [ATTENDANCE_STATUS.ABSENT]: '#f5222d',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '#bfbfbf',
  [ATTENDANCE_STATUS.MAKEUP]: '#1890ff',
  [ATTENDANCE_STATUS.LEAVE]: '#722ed1'
}

export const STATUS_BG_COLOR = {
  [ATTENDANCE_STATUS.NORMAL]: '#f6ffed',
  [ATTENDANCE_STATUS.LATE]: '#fff7e6',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '#fffbe6',
  [ATTENDANCE_STATUS.ABSENT]: '#fff1f0',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '#fafafa',
  [ATTENDANCE_STATUS.MAKEUP]: '#e6f7ff',
  [ATTENDANCE_STATUS.LEAVE]: '#f9f0ff'
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
    leave: 0
  }

  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    stats.total++
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const record = records[dateStr]
    const status = getDayStatus(record)

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
    }
  }

  return stats
}
