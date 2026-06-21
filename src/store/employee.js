import { defineStore } from 'pinia'
import { employees as mockEmployees } from '@/data/employees'
import { getEmployees, setEmployees, getCurrentUser, setCurrentUser, getResignationRecords, setResignationRecords } from '@/utils/storage'
import { useScheduleStore } from '@/store/schedule'
import { useAttendanceStore } from '@/store/attendance'
import { useBusinessTripStore } from '@/store/business-trip'
import { useNotificationStore } from '@/store/notification'
import { useOrganizationStore } from '@/store/organization'
import { useVacationStore } from '@/store/vacation'

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [],
    currentUser: null,
    resignationRecords: []
  }),

  getters: {
    getEmployeeById: (state) => (id) => {
      return state.employees.find(emp => emp.id === id)
    },

    getEmployeesByDepartment: (state) => (departmentId) => {
      return state.employees.filter(emp => emp.departmentId === departmentId)
    },

    employeesByPosition: (state) => (positionId) => {
      return state.employees.filter(emp => emp.positionId === positionId)
    },

    searchEmployees: (state) => (keyword) => {
      if (!keyword) return state.employees
      const kw = keyword.toLowerCase()
      return state.employees.filter(emp =>
        emp.name.toLowerCase().includes(kw) ||
        emp.id.toLowerCase().includes(kw) ||
        emp.position.toLowerCase().includes(kw) ||
        emp.department.toLowerCase().includes(kw) ||
        (emp.phone && emp.phone.includes(kw)) ||
        (emp.email && emp.email.toLowerCase().includes(kw))
      )
    },

    filteredEmployees: (state) => ({ departmentId, positionId, status, keyword }) => {
      let result = [...state.employees]
      if (departmentId) {
        result = result.filter(e => e.departmentId === departmentId)
      }
      if (positionId) {
        result = result.filter(e => e.positionId === positionId)
      }
      if (status) {
        result = result.filter(e => e.status === status)
      }
      if (keyword) {
        const kw = keyword.toLowerCase()
        result = result.filter(emp =>
          emp.name.toLowerCase().includes(kw) ||
          emp.id.toLowerCase().includes(kw) ||
          (emp.phone && emp.phone.includes(kw)) ||
          (emp.email && emp.email.toLowerCase().includes(kw))
        )
      }
      return result
    },

    activeEmployees: (state) => {
      return state.employees.filter(e => e.status === '在职' || e.status === '试用期')
    },

    pendingResignationEmployees: (state) => {
      return state.employees.filter(e => e.status === '离职中')
    },

    resignedEmployees: (state) => {
      return state.employees.filter(e => e.status === '已离职')
    },

    getResignationRecordByEmployee: (state) => (employeeId) => {
      return state.resignationRecords.filter(r => r.employeeId === employeeId)
    },

    activeResignationByEmployee: (state) => (employeeId) => {
      return state.resignationRecords.find(r => r.employeeId === employeeId && r.status === 'pending')
    },

    employeeStats: (state) => {
      const stats = {
        total: state.employees.length,
        active: 0,
        resigning: 0,
        resigned: 0,
        byDept: {},
        byPosition: {}
      }
      state.employees.forEach(e => {
        if (e.status === '在职' || e.status === '试用期') stats.active++
        else if (e.status === '离职中') stats.resigning++
        else if (e.status === '已离职') stats.resigned++
        stats.byDept[e.departmentId] = (stats.byDept[e.departmentId] || 0) + 1
        stats.byPosition[e.positionId] = (stats.byPosition[e.positionId] || 0) + 1
      })
      return stats
    },

    nextEmployeeId: (state) => {
      const maxNum = state.employees.reduce((max, e) => {
        const num = parseInt(e.id.replace('E', ''), 10)
        return num > max ? num : max
      }, 0)
      return `E${String(maxNum + 1).padStart(3, '0')}`
    }
  },

  actions: {
    initEmployees() {
      const stored = getEmployees()
      if (stored.length === 0) {
        this.employees = JSON.parse(JSON.stringify(mockEmployees))
        this.saveToStorage()
      } else {
        this.employees = stored
      }

      this.resignationRecords = getResignationRecords()

      const storedUser = getCurrentUser()
      if (storedUser) {
        const freshUser = this.employees.find(e => e.id === storedUser.id)
        this.currentUser = freshUser || this.employees[0]
      } else {
        this.setCurrentUser(this.employees[0])
      }
    },

    saveToStorage() {
      setEmployees(this.employees)
    },

    setCurrentUser(employee) {
      this.currentUser = employee
      setCurrentUser(employee)
    },

    addEmployee(employee) {
      this.employees.push(employee)
      this.saveToStorage()
      if (this.currentUser && this.currentUser.id === employee.id) {
        this.currentUser = employee
      }
    },

    updateEmployee(id, updates) {
      const index = this.employees.findIndex(emp => emp.id === id)
      if (index !== -1) {
        this.employees[index] = { ...this.employees[index], ...updates }
        this.saveToStorage()
        if (this.currentUser && this.currentUser.id === id) {
          this.currentUser = this.employees[index]
          setCurrentUser(this.currentUser)
        }
      }
    },

    removeEmployee(id) {
      this.employees = this.employees.filter(emp => emp.id !== id)
      this.saveToStorage()
    },

    transferEmployee(employeeId, transferData, organizationStore) {
      const employee = this.getEmployeeById(employeeId)
      if (!employee) return null

      const scheduleStore = useScheduleStore()
      const attendanceStore = useAttendanceStore()
      const businessTripStore = useBusinessTripStore()
      const notificationStore = useNotificationStore()

      const toDept = organizationStore.getDepartmentById(transferData.toDepartmentId)
      const toPos = organizationStore.getPositionById(transferData.toPositionId)

      const oldDeptId = employee.departmentId
      const oldDeptName = employee.department
      const oldPosition = employee.position
      const newDeptId = transferData.toDepartmentId
      const newDeptName = toDept ? toDept.name : transferData.toDepartment
      const newPosition = toPos ? toPos.name : transferData.toPosition

      const record = {
        employeeId,
        employeeName: employee.name,
        fromDepartmentId: oldDeptId,
        fromDepartment: oldDeptName,
        fromPositionId: employee.positionId,
        fromPosition: oldPosition,
        toDepartmentId: newDeptId,
        toDepartment: newDeptName,
        toPositionId: transferData.toPositionId,
        toPosition: newPosition,
        transferType: transferData.transferType,
        transferDate: transferData.transferDate,
        reason: transferData.reason,
        operatorId: this.currentUser?.id,
        operatorName: this.currentUser?.name,
        remark: transferData.remark
      }

      organizationStore.addTransferRecord(record)

      this.updateEmployee(employeeId, {
        departmentId: newDeptId,
        department: newDeptName,
        positionId: transferData.toPositionId,
        position: newPosition
      })

      if (oldDeptId !== newDeptId) {
        const migrateResult = scheduleStore.migrateEmployeeSchedule(
          employeeId,
          oldDeptId,
          newDeptId,
          newDeptName
        )

        attendanceStore.updateRequestsDepartment(
          employeeId,
          oldDeptId,
          newDeptId,
          newDeptName
        )

        businessTripStore.updateRequestsDepartment(
          employeeId,
          oldDeptId,
          newDeptId,
          newDeptName
        )

        const oldDept = organizationStore.getDepartmentById(oldDeptId)
        const oldManagerId = oldDept?.managerId
        const oldManager = oldManagerId ? this.getEmployeeById(oldManagerId) : null

        const newManagerId = toDept?.managerId
        const newManager = newManagerId ? this.getEmployeeById(newManagerId) : null

        if (newManagerId && oldManagerId !== newManagerId) {
          attendanceStore.reassignPendingApprovalsForEmployee(
            employeeId,
            oldManagerId,
            newManagerId,
            newManager?.name || '新审批人',
            transferData.transferType
          )

          businessTripStore.reassignPendingApprovalsForEmployee(
            employeeId,
            oldManagerId,
            newManagerId,
            newManager?.name || '新审批人',
            transferData.transferType
          )
        }

        notificationStore.generateEmployeeTransferNotification(
          employeeId,
          transferData.transferType,
          oldDeptName,
          newDeptName,
          oldPosition,
          newPosition,
          transferData.transferDate
        )

        if (migrateResult.migratedMonths && migrateResult.migratedMonths.length > 0) {
          notificationStore.generateScheduleMigratedNotification(
            employeeId,
            oldDeptName,
            newDeptName,
            migrateResult.migratedMonths
          )
        }

        if (newManager && oldManagerId !== newManagerId) {
          notificationStore.generateApproverChangedNotification(
            employeeId,
            oldManager?.name || '原审批人',
            newManager.name,
            transferData.transferType
          )
        }
      }

      return record
    },

    updateDepartmentForAll(oldDeptId, newDeptId, newDeptName) {
      this.employees.forEach(emp => {
        if (emp.departmentId === oldDeptId) {
          emp.departmentId = newDeptId
          emp.department = newDeptName
        }
      })
      this.saveToStorage()
      if (this.currentUser && this.currentUser.departmentId === oldDeptId) {
        this.currentUser.departmentId = newDeptId
        this.currentUser.department = newDeptName
        setCurrentUser(this.currentUser)
      }
    },

    saveResignationRecordsToStorage() {
      setResignationRecords(this.resignationRecords)
    },

    processResignation(employeeId, resignationData) {
      const employee = this.getEmployeeById(employeeId)
      if (!employee) return null

      const existing = this.activeResignationByEmployee(employeeId)
      if (existing) return null

      const vacationStore = useVacationStore()
      const annualBalance = vacationStore.getEmployeeBalance(employeeId, 'annual')

      const annualLeaveCompensation = {
        totalDays: annualBalance.total,
        usedDays: annualBalance.used,
        remainingDays: annualBalance.remaining,
        pendingDays: annualBalance.pending,
        compensableDays: annualBalance.available,
        dailySalary: resignationData.dailySalary || 0,
        totalCompensation: Math.round(annualBalance.available * (resignationData.dailySalary || 0) * 100) / 100
      }

      const record = {
        id: 'RS' + Date.now(),
        employeeId,
        employeeName: employee.name,
        department: employee.department,
        departmentId: employee.departmentId,
        position: employee.position,
        positionId: employee.positionId,
        resignationType: resignationData.resignationType,
        resignationReason: resignationData.resignationReason,
        resignationReasonDetail: resignationData.resignationReasonDetail || '',
        applyDate: resignationData.applyDate,
        expectedLastDay: resignationData.expectedLastDay,
        actualLastDay: null,
        status: 'pending',
        annualLeaveCompensation,
        handoverNotes: resignationData.handoverNotes || '',
        remark: resignationData.remark || '',
        operatorId: this.currentUser?.id,
        operatorName: this.currentUser?.name,
        createdAt: new Date().toISOString(),
        effectiveAt: null,
        frozenAt: null,
        settledAt: null
      }

      this.resignationRecords.unshift(record)
      this.saveResignationRecordsToStorage()

      this.updateEmployee(employeeId, { status: '离职中' })

      return record
    },

    confirmResignation(recordId, confirmData = {}) {
      const record = this.resignationRecords.find(r => r.id === recordId)
      if (!record || record.status !== 'pending') return null

      const employee = this.getEmployeeById(record.employeeId)
      if (!employee) return null

      const vacationStore = useVacationStore()
      const notificationStore = useNotificationStore()

      record.status = 'effective'
      record.actualLastDay = confirmData.actualLastDay || record.expectedLastDay
      record.effectiveAt = new Date().toISOString()
      record.remark = confirmData.remark || record.remark

      this.updateEmployee(record.employeeId, { status: '已离职' })

      const annualBalance = vacationStore.getEmployeeBalance(record.employeeId, 'annual')
      const compensableDays = annualBalance.available
      const dailySalary = record.annualLeaveCompensation.dailySalary
      record.annualLeaveCompensation = {
        ...record.annualLeaveCompensation,
        remainingDays: annualBalance.available,
        compensableDays,
        totalCompensation: Math.round(compensableDays * dailySalary * 100) / 100
      }

      if (compensableDays > 0) {
        vacationStore.manualAdjust({
          grantId: vacationStore.getEmployeeGrants(record.employeeId, 'annual', false)
            .sort((a, b) => new Date(a.expireDate) - new Date(b.expireDate))[0]?.id,
          changeType: 'deduct',
          days: compensableDays,
          reason: 'resignation_settle',
          description: `离职结算：未休年假${compensableDays}天折算补偿`,
          operator: this.currentUser?.id || 'system'
        })
      }

      record.frozenAt = new Date().toISOString()
      record.settledAt = new Date().toISOString()

      this.saveResignationRecordsToStorage()

      notificationStore.addNotification({
        type: 'resignation_effective',
        category: 'hr',
        employeeId: record.employeeId,
        title: '离职生效通知',
        content: `${record.employeeName} 离职已生效，打卡权限已冻结，未休年假${compensableDays}天已折算补偿 ¥${record.annualLeaveCompensation.totalCompensation}`,
        date: new Date().toISOString().split('T')[0],
        extra: {
          resignationId: record.id,
          employeeId: record.employeeId,
          compensableDays,
          totalCompensation: record.annualLeaveCompensation.totalCompensation
        },
        actionable: false
      })

      return record
    },

    cancelResignation(recordId) {
      const record = this.resignationRecords.find(r => r.id === recordId)
      if (!record || record.status !== 'pending') return null

      record.status = 'cancelled'
      record.remark = '离职流程已撤回'
      this.saveResignationRecordsToStorage()

      this.updateEmployee(record.employeeId, { status: '在职' })

      return record
    }
  }
})
