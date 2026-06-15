import { formatDate } from './date'

export const BUSINESS_TRIP_STATUS = {
  PENDING_SUPERVISOR: 'pending_supervisor',
  APPROVED_SUPERVISOR: 'approved_supervisor',
  REJECTED_SUPERVISOR: 'rejected_supervisor',
  PENDING_MANAGER: 'pending_manager',
  APPROVED_MANAGER: 'approved_manager',
  REJECTED_MANAGER: 'rejected_manager',
  PENDING_HR: 'pending_hr',
  APPROVED: 'approved',
  REJECTED_HR: 'rejected_hr',
  CANCELLED: 'cancelled'
}

export const BUSINESS_TRIP_STATUS_TEXT = {
  [BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR]: '待直属领导审批',
  [BUSINESS_TRIP_STATUS.APPROVED_SUPERVISOR]: '直属领导已通过',
  [BUSINESS_TRIP_STATUS.REJECTED_SUPERVISOR]: '直属领导已拒绝',
  [BUSINESS_TRIP_STATUS.PENDING_MANAGER]: '待部门经理审批',
  [BUSINESS_TRIP_STATUS.APPROVED_MANAGER]: '部门经理已通过',
  [BUSINESS_TRIP_STATUS.REJECTED_MANAGER]: '部门经理已拒绝',
  [BUSINESS_TRIP_STATUS.PENDING_HR]: '待人事审批',
  [BUSINESS_TRIP_STATUS.APPROVED]: '已通过',
  [BUSINESS_TRIP_STATUS.REJECTED_HR]: '人事已拒绝',
  [BUSINESS_TRIP_STATUS.CANCELLED]: '已取消'
}

export const BUSINESS_TRIP_STATUS_COLOR = {
  [BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR]: '#faad14',
  [BUSINESS_TRIP_STATUS.APPROVED_SUPERVISOR]: '#1890ff',
  [BUSINESS_TRIP_STATUS.REJECTED_SUPERVISOR]: '#f5222d',
  [BUSINESS_TRIP_STATUS.PENDING_MANAGER]: '#faad14',
  [BUSINESS_TRIP_STATUS.APPROVED_MANAGER]: '#1890ff',
  [BUSINESS_TRIP_STATUS.REJECTED_MANAGER]: '#f5222d',
  [BUSINESS_TRIP_STATUS.PENDING_HR]: '#faad14',
  [BUSINESS_TRIP_STATUS.APPROVED]: '#52c41a',
  [BUSINESS_TRIP_STATUS.REJECTED_HR]: '#f5222d',
  [BUSINESS_TRIP_STATUS.CANCELLED]: '#8c8c8c'
}

export const BUSINESS_TRIP_TYPES = [
  { value: 'domestic', label: '国内出差', color: '#1890ff' },
  { value: 'overseas', label: '国外出差', color: '#722ed1' },
  { value: 'training', label: '外出培训', color: '#13c2c2' },
  { value: 'meeting', label: '外出参会', color: '#fa8c16' },
  { value: 'other', label: '其他', color: '#8c8c8c' }
]

export const CHECKIN_TYPES = [
  { value: 'morning', label: '上午签到', icon: '🌅' },
  { value: 'afternoon', label: '下午签到', icon: '🌇' }
]

export function generateBusinessTripId() {
  return 'BT' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

export function generateCheckinId() {
  return 'BTC' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

export function getBusinessTripTypeLabel(type) {
  const tripType = BUSINESS_TRIP_TYPES.find(t => t.value === type)
  return tripType ? tripType.label : type
}

export function getBusinessTripTypeColor(type) {
  const tripType = BUSINESS_TRIP_TYPES.find(t => t.value === type)
  return tripType ? tripType.color : '#999'
}

export function getBusinessTripStatusText(status) {
  return BUSINESS_TRIP_STATUS_TEXT[status] || status
}

export function getBusinessTripStatusColor(status) {
  return BUSINESS_TRIP_STATUS_COLOR[status] || '#999'
}

export function isBusinessTripFinalApproved(status) {
  return status === BUSINESS_TRIP_STATUS.APPROVED
}

export function isBusinessTripRejected(status) {
  return [
    BUSINESS_TRIP_STATUS.REJECTED_SUPERVISOR,
    BUSINESS_TRIP_STATUS.REJECTED_MANAGER,
    BUSINESS_TRIP_STATUS.REJECTED_HR
  ].includes(status)
}

export function isBusinessTripPending(status) {
  return [
    BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR,
    BUSINESS_TRIP_STATUS.PENDING_MANAGER,
    BUSINESS_TRIP_STATUS.PENDING_HR
  ].includes(status)
}

export function getBusinessTripApprovalProgress(status) {
  if (isBusinessTripRejected(status) || status === BUSINESS_TRIP_STATUS.CANCELLED) {
    return { current: 0, total: 3, completed: 0 }
  }

  const progressMap = {
    [BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR]: 0,
    [BUSINESS_TRIP_STATUS.APPROVED_SUPERVISOR]: 1,
    [BUSINESS_TRIP_STATUS.PENDING_MANAGER]: 1,
    [BUSINESS_TRIP_STATUS.APPROVED_MANAGER]: 2,
    [BUSINESS_TRIP_STATUS.PENDING_HR]: 2,
    [BUSINESS_TRIP_STATUS.APPROVED]: 3
  }

  const current = progressMap[status] || 0
  return {
    current,
    total: 3,
    completed: current
  }
}

export function getNextApproverRole(currentStatus) {
  const roleMap = {
    [BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR]: 'supervisor',
    [BUSINESS_TRIP_STATUS.APPROVED_SUPERVISOR]: 'manager',
    [BUSINESS_TRIP_STATUS.PENDING_MANAGER]: 'manager',
    [BUSINESS_TRIP_STATUS.APPROVED_MANAGER]: 'hr',
    [BUSINESS_TRIP_STATUS.PENDING_HR]: 'hr'
  }
  return roleMap[currentStatus] || null
}

export function calculateBusinessTripDays(startDate, endDate) {
  if (!startDate || !endDate) return 0

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) return 0

  let count = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    count++
  }

  return count
}

export function getTripDates(startDate, endDate) {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d, 'YYYY-MM-DD'))
  }

  return dates
}

export function isDateInTrip(date, startDate, endDate) {
  const d = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  return d >= start && d <= end
}
