import { defineStore } from 'pinia'
import { getShiftTemplates, setShiftTemplates, getMonthSchedules, setMonthSchedules, getShiftSwapRequests, setShiftSwapRequests } from '@/utils/storage'
import { getNow } from '@/utils/date'
import { SHIFT_TYPES, WEEK_DAYS, generateDefaultWeekTemplate, generateMonthScheduleFromTemplate, SWAP_STATUS, getShiftLabel, getShiftColor } from '@/utils/schedule'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    shiftTemplates: {},
    monthSchedules: {},
    swapRequests: [],
    toast: {
      show: false,
      message: '',
      type: 'success'
    }
  }),

  getters: {
    shiftTypes: () => SHIFT_TYPES,

    weekDays: () => WEEK_DAYS,

    getTemplateByDept: (state) => (departmentId) => {
      return state.shiftTemplates[departmentId] || null
    },

    getMonthSchedule: (state) => (year, month) => {
      const key = `${year}-${String(month).padStart(2, '0')}`
      return state.monthSchedules[key] || null
    },

    getEmployeeShift: (state) => (employeeId, dateStr) => {
      for (const key of Object.keys(state.monthSchedules)) {
        const schedule = state.monthSchedules[key]
        if (schedule && schedule[employeeId] && schedule[employeeId][dateStr]) {
          return schedule[employeeId][dateStr]
        }
      }
      return 'standard'
    },

    getEmployeeMonthSchedule: (state) => (employeeId, year, month) => {
      const key = `${year}-${String(month).padStart(2, '0')}`
      const schedule = state.monthSchedules[key]
      if (!schedule || !schedule[employeeId]) return {}
      return schedule[employeeId]
    },

    getEmployeeSwapRequests: (state) => (employeeId) => {
      return state.swapRequests.filter(r => r.requesterId === employeeId || r.targetId === employeeId)
    },

    getPendingSwapRequests: (state) => () => {
      return state.swapRequests.filter(r => r.status === SWAP_STATUS.PENDING)
    }
  },

  actions: {
    initSchedule() {
      this.shiftTemplates = getShiftTemplates()
      this.monthSchedules = getMonthSchedules()
      this.swapRequests = getShiftSwapRequests()
    },

    saveTemplatesToStorage() {
      setShiftTemplates(this.shiftTemplates)
    },

    saveSchedulesToStorage() {
      setMonthSchedules(this.monthSchedules)
    },

    saveSwapRequestsToStorage() {
      setShiftSwapRequests(this.swapRequests)
    },

    showToast(message, type = 'success') {
      this.toast = { show: true, message, type }
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    },

    saveWeekTemplate(departmentId, departmentName, template) {
      this.shiftTemplates[departmentId] = {
        departmentId,
        departmentName,
        template: { ...template },
        updatedAt: getNow()
      }
      this.saveTemplatesToStorage()
      this.showToast(`${departmentName} 周班次模板已保存`, 'success')
    },

    generateMonthSchedule(departmentId, year, month, employeeIds) {
      const templateData = this.shiftTemplates[departmentId]
      if (!templateData) {
        this.showToast('请先配置该部门的周班次模板', 'error')
        return false
      }

      const key = `${year}-${String(month).padStart(2, '0')}`
      if (!this.monthSchedules[key]) {
        this.monthSchedules[key] = {}
      }

      const newSchedule = generateMonthScheduleFromTemplate(
        templateData.template,
        year,
        month,
        employeeIds
      )

      Object.keys(newSchedule).forEach(empId => {
        this.monthSchedules[key][empId] = newSchedule[empId]
      })

      this.saveSchedulesToStorage()
      this.showToast(`${year}年${month}月排班表已生成`, 'success')
      return true
    },

    updateSingleShift(employeeId, dateStr, shiftType, year, month) {
      const key = `${year}-${String(month).padStart(2, '0')}`
      if (!this.monthSchedules[key]) {
        this.monthSchedules[key] = {}
      }
      if (!this.monthSchedules[key][employeeId]) {
        this.monthSchedules[key][employeeId] = {}
      }
      this.monthSchedules[key][employeeId][dateStr] = shiftType
      this.saveSchedulesToStorage()
    },

    submitSwapRequest(data) {
      const request = {
        id: 'SW' + Date.now(),
        requesterId: data.requesterId,
        requesterName: data.requesterName,
        requesterShift: data.requesterShift,
        targetId: data.targetId,
        targetName: data.targetName,
        targetShift: data.targetShift,
        date: data.date,
        reason: data.reason,
        status: SWAP_STATUS.PENDING,
        createdAt: getNow()
      }

      this.swapRequests.unshift(request)
      this.saveSwapRequestsToStorage()
      this.showToast('换班申请已提交，等待对方确认', 'success')
      return request
    },

    approveSwapRequest(requestId) {
      const request = this.swapRequests.find(r => r.id === requestId)
      if (!request) return

      request.status = SWAP_STATUS.APPROVED
      request.reviewedAt = getNow()

      const dateStr = request.date
      const year = parseInt(dateStr.split('-')[0])
      const month = parseInt(dateStr.split('-')[1])
      const key = `${year}-${String(month).padStart(2, '0')}`

      if (this.monthSchedules[key]) {
        if (this.monthSchedules[key][request.requesterId]) {
          this.monthSchedules[key][request.requesterId][dateStr] = request.targetShift
        }
        if (this.monthSchedules[key][request.targetId]) {
          this.monthSchedules[key][request.targetId][dateStr] = request.requesterShift
        }
      }

      this.saveSchedulesToStorage()
      this.saveSwapRequestsToStorage()
      this.showToast('换班申请已通过，排班已同步更新', 'success')
    },

    rejectSwapRequest(requestId) {
      const request = this.swapRequests.find(r => r.id === requestId)
      if (!request) return

      request.status = SWAP_STATUS.REJECTED
      request.reviewedAt = getNow()
      this.saveSwapRequestsToStorage()
      this.showToast('换班申请已拒绝', 'warning')
    },

    migrateEmployeeSchedule(employeeId, oldDepartmentId, newDepartmentId, newDepartmentName, year = null, month = null) {
      const newTemplateData = this.shiftTemplates[newDepartmentId]
      const migratedMonths = []

      const targetYear = year || new Date().getFullYear()
      const targetMonth = month || new Date().getMonth() + 1

      const monthsToMigrate = []
      if (year && month) {
        monthsToMigrate.push({ year, month })
      } else {
        const currentMonth = new Date().getMonth() + 1
        for (let m = currentMonth; m <= 12; m++) {
          monthsToMigrate.push({ year: targetYear, month: m })
        }
      }

      if (newTemplateData) {
        monthsToMigrate.forEach(({ year: y, month: m }) => {
          const key = `${y}-${String(m).padStart(2, '0')}`
          if (!this.monthSchedules[key]) {
            this.monthSchedules[key] = {}
          }

          const newSchedule = generateMonthScheduleFromTemplate(
            newTemplateData.template,
            y,
            m,
            [employeeId]
          )

          if (newSchedule[employeeId]) {
            if (!this.monthSchedules[key][employeeId]) {
              this.monthSchedules[key][employeeId] = {}
            }
            Object.assign(this.monthSchedules[key][employeeId], newSchedule[employeeId])
            migratedMonths.push(`${y}年${m}月`)
          }
        })
      }

      this.saveSchedulesToStorage()
      return {
        employeeId,
        oldDepartmentId,
        newDepartmentId,
        migratedMonths
      }
    },

    batchMigrateSchedules(employeeIds, oldDepartmentId, newDepartmentId, newDepartmentName) {
      const results = []
      employeeIds.forEach(empId => {
        const result = this.migrateEmployeeSchedule(
          empId,
          oldDepartmentId,
          newDepartmentId,
          newDepartmentName
        )
        results.push(result)
      })
      return results
    },

    clearDepartmentTemplates(departmentIds) {
      departmentIds.forEach(deptId => {
        if (this.shiftTemplates[deptId]) {
          delete this.shiftTemplates[deptId]
        }
      })
      this.saveTemplatesToStorage()
    },

    mergeDepartmentTemplates(sourceDeptId, targetDeptId, targetDeptName) {
      const sourceTemplate = this.shiftTemplates[sourceDeptId]
      const targetTemplate = this.shiftTemplates[targetDeptId]

      if (sourceTemplate && !targetTemplate) {
        this.shiftTemplates[targetDeptId] = {
          ...sourceTemplate,
          departmentId: targetDeptId,
          departmentName: targetDeptName,
          updatedAt: getNow()
        }
        this.saveTemplatesToStorage()
      }
      return this.shiftTemplates[targetDeptId] || null
    }
  }
})
