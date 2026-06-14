import { formatDate } from './date'

export const VACATION_TYPES = {
  ANNUAL: 'annual',
  LIEU: 'lieu'
}

export const VACATION_TYPE_LABELS = {
  [VACATION_TYPES.ANNUAL]: '年假',
  [VACATION_TYPES.LIEU]: '调休'
}

export const VACATION_TYPE_COLORS = {
  [VACATION_TYPES.ANNUAL]: '#722ed1',
  [VACATION_TYPES.LIEU]: '#1890ff'
}

export const ANNUAL_LEAVE_RULES = [
  { minYears: 0, maxYears: 1, days: 5 },
  { minYears: 1, maxYears: 10, days: 10 },
  { minYears: 10, maxYears: 20, days: 15 },
  { minYears: 20, maxYears: Infinity, days: 20 }
]

export const ADJUSTMENT_REASONS = [
  { value: 'grant', label: '额度发放' },
  { value: 'manual_add', label: '手动增加' },
  { value: 'manual_deduct', label: '手动扣减' },
  { value: 'leave_approved', label: '请假扣减' },
  { value: 'leave_cancel', label: '请假撤销返还' },
  { value: 'overtime_convert', label: '加班转换' },
  { value: 'expired', label: '过期清零' },
  { value: 'other', label: '其他' }
]

export function calculateWorkYears(hireDate, referenceDate = new Date()) {
  if (!hireDate) return 0
  
  const hire = new Date(hireDate)
  const ref = new Date(referenceDate)
  
  let years = ref.getFullYear() - hire.getFullYear()
  const monthDiff = ref.getMonth() - hire.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < hire.getDate())) {
    years--
  }
  
  return Math.max(0, years)
}

export function calculateWorkMonths(hireDate, referenceDate = new Date()) {
  if (!hireDate) return 0
  
  const hire = new Date(hireDate)
  const ref = new Date(referenceDate)
  
  let months = (ref.getFullYear() - hire.getFullYear()) * 12
  months += ref.getMonth() - hire.getMonth()
  
  if (ref.getDate() < hire.getDate()) {
    months--
  }
  
  return Math.max(0, months)
}

export function calculateAnnualLeaveDays(hireDate, referenceDate = new Date()) {
  const years = calculateWorkYears(hireDate, referenceDate)
  
  for (const rule of ANNUAL_LEAVE_RULES) {
    if (years >= rule.minYears && years < rule.maxYears) {
      return rule.days
    }
  }
  
  return ANNUAL_LEAVE_RULES[ANNUAL_LEAVE_RULES.length - 1].days
}

export function getAnnualLeavePeriod(year = new Date().getFullYear()) {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    expireDate: `${year}-12-31`
  }
}

export function getLieuExpireDate(grantDate, monthsValid = 12) {
  const date = new Date(grantDate)
  date.setMonth(date.getMonth() + monthsValid)
  return formatDate(date, 'YYYY-MM-DD')
}

export function isExpired(expireDate, referenceDate = new Date()) {
  if (!expireDate) return false
  const expire = new Date(expireDate)
  const ref = new Date(referenceDate)
  ref.setHours(0, 0, 0, 0)
  return expire < ref
}

export function getDaysUntilExpire(expireDate, referenceDate = new Date()) {
  if (!expireDate) return Infinity
  const expire = new Date(expireDate)
  const ref = new Date(referenceDate)
  ref.setHours(0, 0, 0, 0)
  expire.setHours(0, 0, 0, 0)
  const diffTime = expire - ref
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getExpirationStatus(expireDate, thresholdDays = 30) {
  const daysUntil = getDaysUntilExpire(expireDate)
  
  if (daysUntil < 0) {
    return { status: 'expired', daysUntil, label: '已过期', color: '#f5222d' }
  } else if (daysUntil <= thresholdDays) {
    return { status: 'warning', daysUntil, label: `即将过期(${daysUntil}天)`, color: '#faad14' }
  } else {
    return { status: 'valid', daysUntil, label: '有效', color: '#52c41a' }
  }
}

export function calculateAvailableDays(grants, records, vacationType, referenceDate = new Date()) {
  const validGrants = grants.filter(g => 
    g.vacationType === vacationType && 
    !isExpired(g.expireDate, referenceDate) &&
    g.remainingDays > 0
  )
  
  let totalGranted = validGrants.reduce((sum, g) => sum + g.remainingDays, 0)
  
  const approvedRecords = records.filter(r => 
    r.vacationType === vacationType && 
    r.status === 'approved' &&
    new Date(r.startDate) >= new Date(referenceDate)
  )
  
  const pendingRecords = records.filter(r => 
    r.vacationType === vacationType && 
    r.status === 'pending'
  )
  
  const approvedDays = approvedRecords.reduce((sum, r) => sum + r.days, 0)
  const pendingDays = pendingRecords.reduce((sum, r) => sum + r.days, 0)
  
  return {
    total: totalGranted,
    used: approvedDays,
    pending: pendingDays,
    available: totalGranted - approvedDays - pendingDays
  }
}

export function generateVacationGrantId() {
  return 'VG' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

export function generateAdjustmentRecordId() {
  return 'VA' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()
}

export function getAdjustmentReasonLabel(reason) {
  const item = ADJUSTMENT_REASONS.find(r => r.value === reason)
  return item ? item.label : reason
}
