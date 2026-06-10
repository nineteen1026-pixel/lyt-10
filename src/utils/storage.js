const STORAGE_KEYS = {
  EMPLOYEES: 'attendance_employees',
  ATTENDANCE_RECORDS: 'attendance_records',
  MAKEUP_REQUESTS: 'makeup_requests',
  LEAVE_REQUESTS: 'leave_requests',
  CURRENT_USER: 'current_user'
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

export function getCurrentUser() {
  return getStorage(STORAGE_KEYS.CURRENT_USER, null)
}

export function setCurrentUser(user) {
  return setStorage(STORAGE_KEYS.CURRENT_USER, user)
}

export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(key => removeStorage(key))
}

export { STORAGE_KEYS }
