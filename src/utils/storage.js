const STORAGE_KEYS = {
  EMPLOYEES: 'attendance_employees',
  ATTENDANCE_RECORDS: 'attendance_records',
  MAKEUP_REQUESTS: 'makeup_requests',
  LEAVE_REQUESTS: 'leave_requests',
  OVERTIME_REQUESTS: 'overtime_requests',
  BUSINESS_TRIP_REQUESTS: 'business_trip_requests',
  BUSINESS_TRIP_CHECKINS: 'business_trip_checkins',
  CURRENT_USER: 'current_user',
  SHIFT_TEMPLATES: 'shift_templates',
  MONTH_SCHEDULES: 'month_schedules',
  SHIFT_SWAP_REQUESTS: 'shift_swap_requests',
  VACATION_GRANTS: 'vacation_grants',
  VACATION_ADJUSTMENTS: 'vacation_adjustments',
  NOTIFICATIONS: 'attendance_notifications',
  NOTIFICATION_READ_STATUS: 'notification_read_status'
}

export function getStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  } catch (e) {
    console.error(`Error getting ${key} from localStorage:`, e)
    return defaultValue
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`Error setting ${key} to localStorage:`, e)
    return false
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (e) {
    console.error(`Error removing ${key} from localStorage:`, e)
    return false
  }
}

export function getEmployees() {
  return getStorage(STORAGE_KEYS.EMPLOYEES, [])
}

export function setEmployees(employees) {
  return setStorage(STORAGE_KEYS.EMPLOYEES, employees)
}

export function getAttendanceRecords() {
  return getStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, {})
}

export function setAttendanceRecords(records) {
  return setStorage(STORAGE_KEYS.ATTENDANCE_RECORDS, records)
}

export function getMakeupRequests() {
  return getStorage(STORAGE_KEYS.MAKEUP_REQUESTS, [])
}

export function setMakeupRequests(requests) {
  return setStorage(STORAGE_KEYS.MAKEUP_REQUESTS, requests)
}

export function getLeaveRequests() {
  return getStorage(STORAGE_KEYS.LEAVE_REQUESTS, [])
}

export function setLeaveRequests(requests) {
  return setStorage(STORAGE_KEYS.LEAVE_REQUESTS, requests)
}

export function getOvertimeRequests() {
  return getStorage(STORAGE_KEYS.OVERTIME_REQUESTS, [])
}

export function setOvertimeRequests(requests) {
  return setStorage(STORAGE_KEYS.OVERTIME_REQUESTS, requests)
}

export function getCurrentUser() {
  return getStorage(STORAGE_KEYS.CURRENT_USER, null)
}

export function setCurrentUser(user) {
  return setStorage(STORAGE_KEYS.CURRENT_USER, user)
}

export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(key => removeStorage(key))
}

export function getShiftTemplates() {
  return getStorage(STORAGE_KEYS.SHIFT_TEMPLATES, {})
}

export function setShiftTemplates(templates) {
  return setStorage(STORAGE_KEYS.SHIFT_TEMPLATES, templates)
}

export function getMonthSchedules() {
  return getStorage(STORAGE_KEYS.MONTH_SCHEDULES, {})
}

export function setMonthSchedules(schedules) {
  return setStorage(STORAGE_KEYS.MONTH_SCHEDULES, schedules)
}

export function getShiftSwapRequests() {
  return getStorage(STORAGE_KEYS.SHIFT_SWAP_REQUESTS, [])
}

export function setShiftSwapRequests(requests) {
  return setStorage(STORAGE_KEYS.SHIFT_SWAP_REQUESTS, requests)
}

export function getVacationGrants() {
  return getStorage(STORAGE_KEYS.VACATION_GRANTS, [])
}

export function setVacationGrants(grants) {
  return setStorage(STORAGE_KEYS.VACATION_GRANTS, grants)
}

export function getVacationAdjustments() {
  return getStorage(STORAGE_KEYS.VACATION_ADJUSTMENTS, [])
}

export function setVacationAdjustments(adjustments) {
  return setStorage(STORAGE_KEYS.VACATION_ADJUSTMENTS, adjustments)
}

export function getNotifications() {
  return getStorage(STORAGE_KEYS.NOTIFICATIONS, [])
}

export function setNotifications(notifications) {
  return setStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
}

export function getNotificationReadStatus() {
  return getStorage(STORAGE_KEYS.NOTIFICATION_READ_STATUS, {})
}

export function setNotificationReadStatus(status) {
  return setStorage(STORAGE_KEYS.NOTIFICATION_READ_STATUS, status)
}

export function getBusinessTripRequests() {
  return getStorage(STORAGE_KEYS.BUSINESS_TRIP_REQUESTS, [])
}

export function setBusinessTripRequests(requests) {
  return setStorage(STORAGE_KEYS.BUSINESS_TRIP_REQUESTS, requests)
}

export function getBusinessTripCheckins() {
  return getStorage(STORAGE_KEYS.BUSINESS_TRIP_CHECKINS, [])
}

export function setBusinessTripCheckins(checkins) {
  return setStorage(STORAGE_KEYS.BUSINESS_TRIP_CHECKINS, checkins)
}

export { STORAGE_KEYS }
