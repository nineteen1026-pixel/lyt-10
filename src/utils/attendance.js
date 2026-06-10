import { workTimeConfig } from '@/data/employees'
import { parseTime, formatTime, getToday } from './date'

export const ATTENDANCE_STATUS = {
  NORMAL: 'normal',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  ABSENT: 'absent',
  NOT_CHECKED: 'not_checked',
  MAKEUP: 'makeup'
}

export const STATUS_TEXT = {
  [ATTENDANCE_STATUS.NORMAL]: '正常',
  [ATTENDANCE_STATUS.LATE]: '迟到',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '早退',
  [ATTENDANCE_STATUS.ABSENT]: '缺勤',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '未打卡',
  [ATTENDANCE_STATUS.MAKEUP]: '补卡'
}

export const STATUS_COLOR = {
  [ATTENDANCE_STATUS.NORMAL]: '#52c41a',
  [ATTENDANCE_STATUS.LATE]: '#fa8c16',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '#faad14',
  [ATTENDANCE_STATUS.ABSENT]: '#f5222d',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '#bfbfbf',
  [ATTENDANCE_STATUS.MAKEUP]: '#1890ff'
}

export const STATUS_BG_COLOR = {
  [ATTENDANCE_STATUS.NORMAL]: '#f6ffed',
  [ATTENDANCE_STATUS.LATE]: '#fff7e6',
  [ATTENDANCE_STATUS.EARLY_LEAVE]: '#fffbe6',
  [ATTENDANCE_STATUS.ABSENT]: '#fff1f0',
  [ATTENDANCE_STATUS.NOT_CHECKED]: '#fafafa',
  [ATTENDANCE_STATUS.MAKEUP]: '#e6f7ff'
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
    makeup: 0
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
    }
  }

  return stats
}
