import { defineStore } from 'pinia'
import { getVacationGrants, setVacationGrants, getVacationAdjustments, setVacationAdjustments } from '@/utils/storage'
import { getNow, formatDate } from '@/utils/date'
import { 
  VACATION_TYPES, 
  calculateWorkYears, 
  calculateAnnualLeaveDays, 
  getAnnualLeavePeriod, 
  getLieuExpireDate,
  isExpired,
  getExpirationStatus,
  getDaysUntilExpire,
  generateVacationGrantId,
  generateAdjustmentRecordId
} from '@/utils/vacation'
import { useAttendanceStore } from '@/store/attendance'

function generateMockVacationGrants(employees) {
  const grants = []
  const currentYear = new Date().getFullYear()
  
  employees.forEach(emp => {
    const workYears = calculateWorkYears(emp.hireDate)
    const annualDays = calculateAnnualLeaveDays(emp.hireDate)
    const period = getAnnualLeavePeriod(currentYear)
    
    grants.push({
      id: generateVacationGrantId(),
      employeeId: emp.id,
      employeeName: emp.name,
      vacationType: VACATION_TYPES.ANNUAL,
      totalDays: annualDays,
      usedDays: 0,
      remainingDays: annualDays,
      grantDate: period.startDate,
      startDate: period.startDate,
      endDate: period.endDate,
      expireDate: period.expireDate,
      reason: 'grant',
      description: `${currentYear}年度年假（${workYears}年工龄）`,
      createdAt: getNow(),
      isActive: true
    })
    
    const lieuDays = Math.floor(Math.random() * 5) + 1
    if (lieuDays > 0) {
      grants.push({
        id: generateVacationGrantId(),
        employeeId: emp.id,
        employeeName: emp.name,
        vacationType: VACATION_TYPES.LIEU,
        totalDays: lieuDays,
        usedDays: 0,
        remainingDays: lieuDays,
        grantDate: formatDate(new Date(currentYear - 1, 11, 1), 'YYYY-MM-DD'),
        startDate: formatDate(new Date(currentYear - 1, 11, 1), 'YYYY-MM-DD'),
        endDate: getLieuExpireDate(formatDate(new Date(currentYear - 1, 11, 1), 'YYYY-MM-DD')),
        expireDate: getLieuExpireDate(formatDate(new Date(currentYear - 1, 11, 1), 'YYYY-MM-DD')),
        reason: 'overtime_convert',
        description: '加班调休',
        createdAt: getNow(),
        isActive: true
      })
    }
  })
  
  return grants
}

export const useVacationStore = defineStore('vacation', {
  state: () => ({
    grants: [],
    adjustments: [],
    toast: {
      show: false,
      message: '',
      type: 'success'
    }
  }),

  getters: {
    getEmployeeGrants: (state) => (employeeId, vacationType = null, includeExpired = false) => {
      let result = state.grants.filter(g => g.employeeId === employeeId)
      
      if (vacationType) {
        result = result.filter(g => g.vacationType === vacationType)
      }
      
      if (!includeExpired) {
        result = result.filter(g => !isExpired(g.expireDate) && g.remainingDays > 0)
      }
      
      return result.sort((a, b) => new Date(a.expireDate) - new Date(b.expireDate))
    },

    getEmployeeBalance: (state) => (employeeId, vacationType) => {
      const grants = state.grants.filter(g => 
        g.employeeId === employeeId && 
        g.vacationType === vacationType && 
        !isExpired(g.expireDate)
      )
      
      const total = grants.reduce((sum, g) => sum + g.totalDays, 0)
      const used = grants.reduce((sum, g) => sum + g.usedDays, 0)
      const remaining = grants.reduce((sum, g) => sum + g.remainingDays, 0)
      
      let attendanceStore
      try {
        attendanceStore = useAttendanceStore()
      } catch (e) {
        attendanceStore = null
      }
      
      const leaveRequests = attendanceStore ? attendanceStore.leaveRequests : []
      
      const pendingLeaves = leaveRequests.filter(r => 
        r.employeeId === employeeId && 
        r.leaveType === vacationType && 
        r.status === 'pending'
      )
      const pendingDays = pendingLeaves.reduce((sum, r) => sum + r.days, 0)
      
      return {
        total,
        used,
        pending: pendingDays,
        available: Math.max(0, remaining - pendingDays)
      }
    },

    getExpiringGrants: (state) => (employeeId = null, daysThreshold = 30) => {
      let grants = state.grants.filter(g => {
        if (g.remainingDays <= 0) return false
        const daysUntil = getDaysUntilExpire(g.expireDate)
        return daysUntil >= 0 && daysUntil <= daysThreshold
      })
      
      if (employeeId) {
        grants = grants.filter(g => g.employeeId === employeeId)
      }
      
      return grants.sort((a, b) => new Date(a.expireDate) - new Date(b.expireDate))
    },

    getEmployeeAdjustments: (state) => (employeeId, vacationType = null) => {
      let result = state.adjustments.filter(a => a.employeeId === employeeId)
      if (vacationType) {
        result = result.filter(a => a.vacationType === vacationType)
      }
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    getAllGrants: (state) => (filters = {}) => {
      let result = [...state.grants]
      
      if (filters.employeeId) {
        result = result.filter(g => g.employeeId === filters.employeeId)
      }
      if (filters.departmentId) {
        result = result.filter(g => g.departmentId === filters.departmentId)
      }
      if (filters.vacationType) {
        result = result.filter(g => g.vacationType === filters.vacationType)
      }
      if (filters.isExpired !== undefined) {
        result = result.filter(g => isExpired(g.expireDate) === filters.isExpired)
      }
      
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  },

  actions: {
    showToast(message, type = 'success') {
      this.toast = { show: true, message, type }
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    },

    hideToast() {
      this.toast.show = false
    },

    initVacation(employees) {
      const storedGrants = getVacationGrants()
      const storedAdjustments = getVacationAdjustments()
      
      if (storedGrants.length === 0) {
        this.grants = generateMockVacationGrants(employees)
        this.saveGrantsToStorage()
      } else {
        this.grants = storedGrants
      }
      
      this.adjustments = storedAdjustments
    },

    saveGrantsToStorage() {
      setVacationGrants(this.grants)
    },

    saveAdjustmentsToStorage() {
      setVacationAdjustments(this.adjustments)
    },

    grantVacation(data) {
      const grant = {
        id: generateVacationGrantId(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        vacationType: data.vacationType,
        totalDays: data.days,
        usedDays: 0,
        remainingDays: data.days,
        grantDate: formatDate(new Date(), 'YYYY-MM-DD'),
        startDate: data.startDate,
        endDate: data.endDate,
        expireDate: data.expireDate,
        reason: data.reason,
        description: data.description,
        grantedBy: data.grantedBy,
        createdAt: getNow(),
        isActive: true
      }

      this.grants.unshift(grant)
      this.saveGrantsToStorage()

      this.recordAdjustment({
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        vacationType: data.vacationType,
        changeType: 'add',
        days: data.days,
        reason: data.reason,
        description: data.description,
        operator: data.grantedBy,
        relatedGrantId: grant.id
      })

      return grant
    },

    grantAnnualLeaveBySeniority(employee, year = new Date().getFullYear(), grantedBy = 'system') {
      const workYears = calculateWorkYears(employee.hireDate, new Date(year, 0, 1))
      const days = calculateAnnualLeaveDays(employee.hireDate, new Date(year, 0, 1))
      const period = getAnnualLeavePeriod(year)
      
      const existingGrant = this.grants.find(g => 
        g.employeeId === employee.id && 
        g.vacationType === VACATION_TYPES.ANNUAL && 
        g.startDate === period.startDate &&
        g.isActive
      )
      
      if (existingGrant) {
        return existingGrant
      }

      return this.grantVacation({
        employeeId: employee.id,
        employeeName: employee.name,
        departmentId: employee.departmentId,
        departmentName: employee.department,
        vacationType: VACATION_TYPES.ANNUAL,
        days,
        startDate: period.startDate,
        endDate: period.endDate,
        expireDate: period.expireDate,
        reason: 'grant',
        description: `${year}年度年假（${workYears}年工龄）`,
        grantedBy
      })
    },

    consumeDays(employeeId, vacationType, days, leaveRequestId) {
      const validGrants = this.getEmployeeGrants(employeeId, vacationType, false)
      const balance = this.getEmployeeBalance(employeeId, vacationType)
      
      if (balance.available < days) {
        return { success: false, message: '假期余额不足' }
      }

      let remainingToConsume = days
      const consumedGrants = []

      for (const grant of validGrants) {
        if (remainingToConsume <= 0) break
        
        const consumeAmount = Math.min(grant.remainingDays, remainingToConsume)
        
        grant.usedDays += consumeAmount
        grant.remainingDays -= consumeAmount
        remainingToConsume -= consumeAmount
        
        consumedGrants.push({
          grantId: grant.id,
          consumedDays: consumeAmount
        })
      }

      this.saveGrantsToStorage()

      consumedGrants.forEach(cg => {
        this.recordAdjustment({
          employeeId,
          vacationType,
          changeType: 'deduct',
          days: cg.consumedDays,
          reason: 'leave_approved',
          description: `请假扣减`,
          relatedGrantId: cg.grantId,
          relatedLeaveRequestId: leaveRequestId
        })
      })

      return { success: true, consumedGrants }
    },

    returnDays(employeeId, vacationType, days, leaveRequestId, operator = 'system', consumedGrants = null) {
      let refundList = []

      if (consumedGrants && consumedGrants.length > 0) {
        refundList = consumedGrants.map(cg => ({
          grantId: cg.grantId,
          days: cg.consumedDays
        }))
      } else {
        const relatedAdjustments = this.adjustments.filter(a => 
          a.employeeId === employeeId && 
          a.vacationType === vacationType && 
          a.relatedLeaveRequestId === leaveRequestId &&
          a.reason === 'leave_approved'
        )
        refundList = relatedAdjustments.map(adj => ({
          grantId: adj.relatedGrantId,
          days: adj.days
        }))
      }

      const alreadyReturned = this.adjustments.filter(a =>
        a.employeeId === employeeId &&
        a.vacationType === vacationType &&
        a.relatedLeaveRequestId === leaveRequestId &&
        a.reason === 'leave_cancel'
      ).map(a => a.relatedGrantId)

      refundList.forEach(item => {
        if (alreadyReturned.includes(item.grantId)) return

        const grant = this.grants.find(g => g.id === item.grantId)
        if (grant) {
          const returnDays = Math.min(item.days, grant.usedDays)
          if (returnDays <= 0) return

          grant.usedDays -= returnDays
          grant.remainingDays += returnDays
          
          this.recordAdjustment({
            employeeId,
            employeeName: grant.employeeName,
            vacationType,
            changeType: 'add',
            days: returnDays,
            reason: 'leave_cancel',
            description: `请假撤销返还`,
            operator,
            relatedGrantId: grant.id,
            relatedLeaveRequestId: leaveRequestId
          })
        }
      })

      this.saveGrantsToStorage()
      return { success: true }
    },

    manualAdjust(data) {
      const grant = this.grants.find(g => g.id === data.grantId)
      if (!grant) {
        return { success: false, message: '额度记录不存在' }
      }

      if (data.changeType === 'deduct' && grant.remainingDays < data.days) {
        return { success: false, message: '剩余额度不足' }
      }

      if (data.changeType === 'add') {
        grant.totalDays += data.days
        grant.remainingDays += data.days
      } else {
        grant.totalDays -= data.days
        grant.remainingDays -= data.days
      }

      this.saveGrantsToStorage()

      this.recordAdjustment({
        employeeId: grant.employeeId,
        employeeName: grant.employeeName,
        vacationType: grant.vacationType,
        changeType: data.changeType,
        days: data.days,
        reason: data.reason,
        description: data.description,
        operator: data.operator,
        relatedGrantId: grant.id
      })

      return { success: true, grant }
    },

    recordAdjustment(data) {
      const adjustment = {
        id: generateAdjustmentRecordId(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        vacationType: data.vacationType,
        changeType: data.changeType,
        days: data.days,
        reason: data.reason,
        description: data.description,
        operator: data.operator,
        relatedGrantId: data.relatedGrantId,
        relatedLeaveRequestId: data.relatedLeaveRequestId,
        createdAt: getNow()
      }

      this.adjustments.unshift(adjustment)
      this.saveAdjustmentsToStorage()

      return adjustment
    },

    expireGrant(grantId, operator = 'system') {
      const grant = this.grants.find(g => g.id === grantId)
      if (!grant) return null

      if (grant.remainingDays > 0) {
        this.recordAdjustment({
          employeeId: grant.employeeId,
          employeeName: grant.employeeName,
          vacationType: grant.vacationType,
          changeType: 'deduct',
          days: grant.remainingDays,
          reason: 'expired',
          description: '过期清零',
          operator,
          relatedGrantId: grant.id
        })

        grant.usedDays += grant.remainingDays
        grant.remainingDays = 0
        grant.isActive = false
        this.saveGrantsToStorage()
      }

      return grant
    },

    expireAllExpiredGrants(operator = 'system') {
      const expiredGrants = this.grants.filter(g => 
        isExpired(g.expireDate) && g.remainingDays > 0 && g.isActive
      )

      expiredGrants.forEach(grant => {
        this.expireGrant(grant.id, operator)
      })

      return expiredGrants.length
    },

    checkAndNotifyExpiring(employeeId, daysThreshold = 30) {
      const expiring = this.getExpiringGrants(employeeId, daysThreshold)
      const notifications = []

      expiring.forEach(grant => {
        const status = getExpirationStatus(grant.expireDate, daysThreshold)
        notifications.push({
          grantId: grant.id,
          vacationType: grant.vacationType,
          days: grant.remainingDays,
          expireDate: grant.expireDate,
          status: status.status,
          message: `您有${grant.remainingDays}天${grant.vacationType === VACATION_TYPES.ANNUAL ? '年假' : '调休'}将于${grant.expireDate}过期`
        })
      })

      return notifications
    }
  }
})
