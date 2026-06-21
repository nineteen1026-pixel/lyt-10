import { defineStore } from 'pinia'
import { getAttendanceRecords, setAttendanceRecords, getMakeupRequests, setMakeupRequests, getLeaveRequests, setLeaveRequests, getOvertimeRequests, setOvertimeRequests, getBusinessTripCheckins, getBusinessTripRequests } from '@/utils/storage'
import { getToday, getCurrentTime, getNow, formatDate, parseTime } from '@/utils/date'
import { getCheckInStatus, getCheckOutStatus, getDayStatus, generateMonthCalendarData, calculateAttendanceStats, ATTENDANCE_STATUS, LEAVE_TYPES, getLeaveTypeLabel, OVERTIME_STATUS, OVERTIME_TYPES, getOvertimeStatusText, getOvertimeTypeLabel, isOvertimeFinalApproved, isOvertimeRejected, calculateOvertimeHours, getOvertimeTypeLieuRate, calculateLieuDays, getCheckInStatusWithShift, getCheckOutStatusWithShift, getDayStatusWithShift, calculateAttendanceStatsWithShift } from '@/utils/attendance'
import { VACATION_TYPES } from '@/utils/vacation'
import { useVacationStore } from '@/store/vacation'
import { useScheduleStore } from '@/store/schedule'
import { useEmployeeStore } from '@/store/employee'
import { isBusinessTripFinalApproved, isDateInTrip } from '@/utils/business-trip'
import { useNotificationStore, NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES } from '@/store/notification'

function generateMockRecords() {
  const records = {}
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

  const employees = ['E001', 'E002', 'E003', 'E004', 'E005', 'E006', 'E007', 'E008', 'E009', 'E010']

  employees.forEach(empId => {
    records[empId] = {}

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day)
      if (date.getDay() === 0 || date.getDay() === 6) continue
      if (date > today) continue

      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const random = Math.random()

      if (random < 0.7) {
        records[empId][dateStr] = {
          checkIn: '08:5' + String(Math.floor(Math.random() * 10)),
          checkOut: '18:' + String(Math.floor(Math.random() * 30)).padStart(2, '0'),
          checkInTime: dateStr + ' 08:5' + String(Math.floor(Math.random() * 10)) + ':00',
          checkOutTime: dateStr + ' 18:' + String(Math.floor(Math.random() * 30)).padStart(2, '0') + ':00'
        }
      } else if (random < 0.85) {
        records[empId][dateStr] = {
          checkIn: '09:' + String(20 + Math.floor(Math.random() * 40)).padStart(2, '0'),
          checkOut: '18:' + String(Math.floor(Math.random() * 30)).padStart(2, '0'),
          checkInTime: dateStr + ' 09:' + String(20 + Math.floor(Math.random() * 40)).padStart(2, '0') + ':00',
          checkOutTime: dateStr + ' 18:' + String(Math.floor(Math.random() * 30)).padStart(2, '0') + ':00'
        }
      } else if (random < 0.9) {
        records[empId][dateStr] = {
          checkIn: '08:5' + String(Math.floor(Math.random() * 10)),
          checkOut: '17:' + String(Math.floor(Math.random() * 30)).padStart(2, '0'),
          checkInTime: dateStr + ' 08:5' + String(Math.floor(Math.random() * 10)) + ':00',
          checkOutTime: dateStr + ' 17:' + String(Math.floor(Math.random() * 30)).padStart(2, '0') + ':00'
        }
      } else {
        records[empId][dateStr] = null
      }
    }
  })

  return records
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    records: {},
    makeupRequests: [],
    leaveRequests: [],
    overtimeRequests: [],
    toast: {
      show: false,
      message: '',
      type: 'success'
    }
  }),

  getters: {
    getEmployeeRecords: (state) => (employeeId) => {
      return state.records[employeeId] || {}
    },

    getTodayRecord: (state) => (employeeId) => {
      const today = getToday()
      const employeeRecords = state.records[employeeId] || {}
      return employeeRecords[today] || null
    },

    getTodayCheckInStatus: () => (record) => {
      if (!record) return ATTENDANCE_STATUS.NOT_CHECKED
      return getCheckInStatus(record.checkIn)
    },

    getTodayCheckOutStatus: () => (record) => {
      if (!record || !record.checkOut) return ATTENDANCE_STATUS.NOT_CHECKED
      return getCheckOutStatus(record.checkOut)
    },

    getTodayStatus: () => (record) => {
      return getDayStatus(record)
    },

    getMonthCalendar: (state) => (employeeId, year, month) => {
      const employeeRecords = state.records[employeeId] || {}
      return generateMonthCalendarData(employeeRecords, year, month)
    },

    getMonthStats: (state) => (employeeId, year, month) => {
      const employeeRecords = state.records[employeeId] || {}
      return calculateAttendanceStats(employeeRecords, year, month)
    },

    getDepartmentMonthStats: (state) => (employeeIds, year, month, shiftMaps = null) => {
      const combined = { total: 0, normal: 0, late: 0, earlyLeave: 0, absent: 0, makeup: 0, leave: 0, businessTrip: 0, overtime: 0, overtimeHours: 0, weekdayOvertimeHours: 0, weekendOvertimeHours: 0, holidayOvertimeHours: 0 }
      employeeIds.forEach(empId => {
        const employeeRecords = state.records[empId] || {}
        const empShiftMap = shiftMaps && shiftMaps[empId] ? shiftMaps[empId] : null
        const stats = empShiftMap
          ? calculateAttendanceStatsWithShift(employeeRecords, year, month, empShiftMap)
          : calculateAttendanceStats(employeeRecords, year, month)
        Object.keys(combined).forEach(key => {
          combined[key] += stats[key]
        })
      })
      return combined
    },

    getDepartmentMonthTrend: (state) => (employeeIds, year, shiftMapsByMonth = null) => {
      const trend = []
      for (let m = 1; m <= 12; m++) {
        const combined = { total: 0, normal: 0, late: 0, earlyLeave: 0, absent: 0, makeup: 0, leave: 0, businessTrip: 0, overtime: 0, overtimeHours: 0, weekdayOvertimeHours: 0, weekendOvertimeHours: 0, holidayOvertimeHours: 0 }
        employeeIds.forEach(empId => {
          const employeeRecords = state.records[empId] || {}
          const empShiftMap = shiftMapsByMonth && shiftMapsByMonth[empId] && shiftMapsByMonth[empId][m]
            ? shiftMapsByMonth[empId][m]
            : null
          const stats = empShiftMap
            ? calculateAttendanceStatsWithShift(employeeRecords, year, m, empShiftMap)
            : calculateAttendanceStats(employeeRecords, year, m)
          Object.keys(combined).forEach(key => {
            combined[key] += stats[key]
          })
        })
        trend.push({ month: m, ...combined })
      }
      return trend
    },

    getDepartmentAbnormalEmployees: (state) => (employeeIds, year, month, shiftMaps = null) => {
      const result = []
      const daysInMonth = new Date(year, month, 0).getDate()
      employeeIds.forEach(empId => {
        const employeeRecords = state.records[empId] || {}
        const empShiftMap = shiftMaps && shiftMaps[empId] ? shiftMaps[empId] : null
        const stats = empShiftMap
          ? calculateAttendanceStatsWithShift(employeeRecords, year, month, empShiftMap)
          : calculateAttendanceStats(employeeRecords, year, month)
        const abnormalCount = stats.late + stats.earlyLeave + stats.absent + stats.makeup
        if (abnormalCount > 0) {
          const details = []
          for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const record = employeeRecords[dateStr]
            const shiftType = empShiftMap ? empShiftMap[dateStr] : null
            if (shiftType === 'rest' && !record) continue
            const date = new Date(year, month - 1, day)
            if (!shiftType && (date.getDay() === 0 || date.getDay() === 6)) continue
            const status = shiftType
              ? getDayStatusWithShift(record, shiftType)
              : getDayStatus(record)
            if (status !== ATTENDANCE_STATUS.NORMAL && status !== ATTENDANCE_STATUS.LEAVE) {
              details.push({ date: dateStr, status, record, shiftType: shiftType || null })
            }
          }
          result.push({ employeeId: empId, ...stats, abnormalCount, details })
        }
      })
      result.sort((a, b) => b.abnormalCount - a.abnormalCount)
      return result
    },

    getEmployeeMakeupRequests: (state) => (employeeId) => {
      return state.makeupRequests.filter(req => req.employeeId === employeeId)
    },

    getEmployeeLeaveRequests: (state) => (employeeId) => {
      return state.leaveRequests.filter(req => req.employeeId === employeeId)
    },

    getApprovedLeaveRequests: (state) => (employeeId) => {
      return state.leaveRequests.filter(req => req.employeeId === employeeId && req.status === 'approved')
    },

    getEmployeeOvertimeRequests: (state) => (employeeId) => {
      return state.overtimeRequests.filter(req => req.employeeId === employeeId)
    },

    getPendingOvertimeRequests: (state) => (approverRole = null) => {
      let pending = state.overtimeRequests.filter(req => {
        if (isOvertimeRejected(req.status)) return false
        if (isOvertimeFinalApproved(req.status)) return false
        return true
      })
      
      if (approverRole) {
        const roleStatusMap = {
          supervisor: OVERTIME_STATUS.PENDING_SUPERVISOR,
          manager: OVERTIME_STATUS.PENDING_MANAGER,
          hr: OVERTIME_STATUS.PENDING_HR
        }
        const targetStatus = roleStatusMap[approverRole]
        if (targetStatus) {
          pending = pending.filter(req => req.status === targetStatus)
        }
      }
      
      return pending
    },

    getApprovedOvertimeRequests: (state) => (employeeId) => {
      return state.overtimeRequests.filter(req => 
        req.employeeId === employeeId && isOvertimeFinalApproved(req.status)
      )
    },

    overtimeTypes: () => OVERTIME_TYPES,

    leaveTypes: () => LEAVE_TYPES
  },

  actions: {
    initRecords() {
      const stored = getAttendanceRecords()
      if (Object.keys(stored).length === 0) {
        this.records = generateMockRecords()
        this.saveRecordsToStorage()
      } else {
        this.records = stored
      }

      const storedRequests = getMakeupRequests()
      this.makeupRequests = storedRequests

      const storedLeaveRequests = getLeaveRequests()
      this.leaveRequests = storedLeaveRequests

      const storedOvertimeRequests = getOvertimeRequests()
      this.overtimeRequests = storedOvertimeRequests

      this.syncBusinessTripsToAttendance()
    },

    syncBusinessTripsToAttendance() {
      const tripRequests = getBusinessTripRequests()
      const tripCheckins = getBusinessTripCheckins()

      let needsSave = false

      tripRequests.forEach(trip => {
        if (!isBusinessTripFinalApproved(trip.status)) return

        const startDate = new Date(trip.startDate)
        const endDate = new Date(trip.endDate)

        if (!this.records[trip.employeeId]) {
          this.records[trip.employeeId] = {}
        }

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = formatDate(d, 'YYYY-MM-DD')
          if (!this.records[trip.employeeId][dateStr]) {
            this.records[trip.employeeId][dateStr] = {}
            needsSave = true
          }
          const dayRecord = this.records[trip.employeeId][dateStr]
          if (!dayRecord.isBusinessTrip) {
            dayRecord.isBusinessTrip = true
            needsSave = true
          }
          if (!dayRecord.businessTripType) {
            dayRecord.businessTripType = trip.tripType
            needsSave = true
          }
          if (!dayRecord.businessTripId) {
            dayRecord.businessTripId = trip.id
            needsSave = true
          }
          if (!dayRecord.businessTripDestination) {
            dayRecord.businessTripDestination = trip.destination
            needsSave = true
          }
        }
      })

      tripCheckins.forEach(checkin => {
        if (!this.records[checkin.employeeId]) {
          this.records[checkin.employeeId] = {}
        }
        if (!this.records[checkin.employeeId][checkin.date]) {
          this.records[checkin.employeeId][checkin.date] = {}
        }

        const dayRecord = this.records[checkin.employeeId][checkin.date]
        if (!dayRecord.isBusinessTrip) {
          dayRecord.isBusinessTrip = true
          needsSave = true
        }
        if (!dayRecord.businessTripId) {
          dayRecord.businessTripId = checkin.tripId
          needsSave = true
        }

        if (!dayRecord.businessTripCheckins) {
          dayRecord.businessTripCheckins = []
        }

        const existingIndex = dayRecord.businessTripCheckins.findIndex(
          c => c.checkinType === checkin.checkinType
        )
        if (existingIndex > -1) {
          if (dayRecord.businessTripCheckins[existingIndex].time !== checkin.time) {
            dayRecord.businessTripCheckins[existingIndex] = {
              checkinType: checkin.checkinType,
              time: checkin.time,
              location: checkin.location
            }
            needsSave = true
          }
        } else {
          dayRecord.businessTripCheckins.push({
            checkinType: checkin.checkinType,
            time: checkin.time,
            location: checkin.location
          })
          needsSave = true
        }

        if (checkin.checkinType === 'morning') {
          if (!dayRecord.checkIn || dayRecord.checkIn !== checkin.time) {
            dayRecord.checkIn = checkin.time
            dayRecord.checkInTime = checkin.createdAt
            dayRecord.businessTripCheckIn = true
            needsSave = true
          }
        } else if (checkin.checkinType === 'afternoon') {
          if (!dayRecord.checkOut || dayRecord.checkOut !== checkin.time) {
            dayRecord.checkOut = checkin.time
            dayRecord.checkOutTime = checkin.createdAt
            dayRecord.businessTripCheckOut = true
            needsSave = true
          }
        }
      })

      if (needsSave) {
        this.saveRecordsToStorage()
      }
    },

    saveRecordsToStorage() {
      setAttendanceRecords(this.records)
    },

    saveMakeupRequestsToStorage() {
      setMakeupRequests(this.makeupRequests)
    },

    saveLeaveRequestsToStorage() {
      setLeaveRequests(this.leaveRequests)
    },

    saveOvertimeRequestsToStorage() {
      setOvertimeRequests(this.overtimeRequests)
    },

    showToast(message, type = 'success') {
      this.toast = { show: true, message, type }
      setTimeout(() => {
        this.toast.show = false
      }, 3000)
    },

    hideToast() {
      this.toast.show = false
    },

    checkIn(employeeId, shiftType = null) {
      const employeeStore = useEmployeeStore()
      const employee = employeeStore.getEmployeeById(employeeId)
      if (employee && (employee.status === '已离职' || employee.status === '离职中')) {
        this.showToast('该员工已离职，打卡权限已冻结', 'error')
        return false
      }

      const today = getToday()
      const now = getNow()
      const currentTime = getCurrentTime()

      if (!this.records[employeeId]) {
        this.records[employeeId] = {}
      }

      if (this.records[employeeId][today]?.checkIn) {
        this.showToast('今日已打卡，请勿重复操作', 'error')
        return false
      }

      if (shiftType === 'rest') {
        this.showToast('今日为休息日，无需打卡', 'warning')
        return false
      }

      this.records[employeeId][today] = {
        ...this.records[employeeId][today],
        checkIn: currentTime,
        checkInTime: now
      }

      if (shiftType) {
        this.records[employeeId][today].shiftType = shiftType
      }

      this.saveRecordsToStorage()

      const status = shiftType ? getCheckInStatusWithShift(currentTime, shiftType) : getCheckInStatus(currentTime)
      if (status === ATTENDANCE_STATUS.LATE) {
        this.showToast('上班打卡成功（迟到）', 'warning')
      } else {
        this.showToast('上班打卡成功', 'success')
      }

      return true
    },

    checkOut(employeeId, shiftType = null) {
      const employeeStore = useEmployeeStore()
      const employee = employeeStore.getEmployeeById(employeeId)
      if (employee && (employee.status === '已离职' || employee.status === '离职中')) {
        this.showToast('该员工已离职，打卡权限已冻结', 'error')
        return false
      }

      const today = getToday()
      const now = getNow()
      const currentTime = getCurrentTime()

      if (!this.records[employeeId]?.[today]?.checkIn) {
        this.showToast('请先进行上班打卡', 'error')
        return false
      }

      if (this.records[employeeId][today].checkOut) {
        this.showToast('今日已打下班卡，请勿重复操作', 'error')
        return false
      }

      this.records[employeeId][today] = {
        ...this.records[employeeId][today],
        checkOut: currentTime,
        checkOutTime: now
      }

      const effectiveShiftType = shiftType || this.records[employeeId][today].shiftType

      this.saveRecordsToStorage()

      const status = effectiveShiftType ? getCheckOutStatusWithShift(currentTime, effectiveShiftType) : getCheckOutStatus(currentTime)
      if (status === ATTENDANCE_STATUS.EARLY_LEAVE) {
        this.showToast('下班打卡成功（早退）', 'warning')
      } else {
        this.showToast('下班打卡成功', 'success')
      }

      return true
    },

    submitMakeupRequest(data) {
      const request = {
        id: 'MR' + Date.now(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        departmentId: data.departmentId,
        date: data.date,
        time: data.time,
        type: data.type,
        reason: data.reason,
        status: 'pending',
        approverId: null,
        createdAt: getNow()
      }

      this.makeupRequests.unshift(request)
      this.saveMakeupRequestsToStorage()
      this.showToast('补卡申请已提交，等待审批', 'success')

      return request
    },

    approveMakeupRequest(requestId) {
      const request = this.makeupRequests.find(r => r.id === requestId)
      if (request) {
        request.status = 'approved'
        request.reviewedAt = getNow()

        if (!this.records[request.employeeId]) {
          this.records[request.employeeId] = {}
        }
        if (!this.records[request.employeeId][request.date]) {
          this.records[request.employeeId][request.date] = {}
        }

        if (request.type === 'checkin') {
          this.records[request.employeeId][request.date].checkIn = request.time
          this.records[request.employeeId][request.date].makeupApproved = true
        } else {
          this.records[request.employeeId][request.date].checkOut = request.time
          this.records[request.employeeId][request.date].makeupApproved = true
        }

        this.saveRecordsToStorage()
        this.saveMakeupRequestsToStorage()
        this.showToast('补卡申请已通过', 'success')
      }
    },

    rejectMakeupRequest(requestId) {
      const request = this.makeupRequests.find(r => r.id === requestId)
      if (request) {
        request.status = 'rejected'
        request.reviewedAt = getNow()
        this.saveMakeupRequestsToStorage()
        this.showToast('补卡申请已拒绝', 'warning')
      }
    },

    submitLeaveRequest(data) {
      const request = {
        id: 'LR' + Date.now(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        departmentId: data.departmentId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        reason: data.reason,
        status: 'pending',
        approverId: null,
        createdAt: getNow()
      }

      this.leaveRequests.unshift(request)
      this.saveLeaveRequestsToStorage()
      this.showToast('请假申请已提交，等待审批', 'success')

      return request
    },

    approveLeaveRequest(requestId) {
      const request = this.leaveRequests.find(r => r.id === requestId)
      if (!request) return

      if (request.status !== 'pending') {
        this.showToast('该请假申请已处理，请勿重复操作', 'warning')
        return
      }

      if (['annual', 'lieu'].includes(request.leaveType)) {
        const vacationStore = useVacationStore()
        const vacationType = request.leaveType === 'annual' ? VACATION_TYPES.ANNUAL : VACATION_TYPES.LIEU
        const result = vacationStore.consumeDays(
          request.employeeId,
          vacationType,
          request.days,
          request.id
        )
        
        if (!result.success) {
          this.showToast(result.message, 'error')
          return
        }

        request.vacationConsumed = result.consumedGrants
      }

      request.status = 'approved'
      request.reviewedAt = getNow()

      if (!this.records[request.employeeId]) {
        this.records[request.employeeId] = {}
      }

      const startDate = new Date(request.startDate)
      const endDate = new Date(request.endDate)

      let scheduleStore
      try {
        scheduleStore = useScheduleStore()
      } catch (e) {
        scheduleStore = null
      }

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d, 'YYYY-MM-DD')
        const dayOfWeek = d.getDay()

        let skip = false
        let hasSchedule = false

        if (scheduleStore) {
          const year = d.getFullYear()
          const month = d.getMonth() + 1
          const empSchedule = scheduleStore.getEmployeeMonthSchedule(request.employeeId, year, month)
          if (empSchedule && empSchedule[dateStr]) {
            hasSchedule = true
            if (empSchedule[dateStr] === 'rest') {
              skip = true
            }
          }
        }

        if (!hasSchedule && (dayOfWeek === 0 || dayOfWeek === 6)) {
          skip = true
        }

        if (skip) continue

        if (!this.records[request.employeeId][dateStr]) {
          this.records[request.employeeId][dateStr] = {}
        }
        this.records[request.employeeId][dateStr].isLeave = true
        this.records[request.employeeId][dateStr].leaveType = request.leaveType
        this.records[request.employeeId][dateStr].leaveRequestId = request.id
      }

      this.saveRecordsToStorage()
      this.saveLeaveRequestsToStorage()
      this.showToast('请假申请已通过', 'success')
    },

    rejectLeaveRequest(requestId) {
      const request = this.leaveRequests.find(r => r.id === requestId)
      if (!request) return

      if (request.status === 'rejected') {
        this.showToast('该请假申请已拒绝，请勿重复操作', 'warning')
        return
      }

      if (request.status === 'approved') {
        if (['annual', 'lieu'].includes(request.leaveType) && request.vacationConsumed && request.vacationConsumed.length > 0) {
          const vacationStore = useVacationStore()
          const vacationType = request.leaveType === 'annual' ? VACATION_TYPES.ANNUAL : VACATION_TYPES.LIEU
          vacationStore.returnDays(
            request.employeeId,
            vacationType,
            request.days,
            request.id,
            'system',
            request.vacationConsumed
          )
          request.vacationConsumed = []
        }

        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = formatDate(d, 'YYYY-MM-DD')

          if (this.records[request.employeeId] && this.records[request.employeeId][dateStr]) {
            if (this.records[request.employeeId][dateStr].leaveRequestId === request.id) {
              delete this.records[request.employeeId][dateStr].isLeave
              delete this.records[request.employeeId][dateStr].leaveType
              delete this.records[request.employeeId][dateStr].leaveRequestId
            }
          }
        }

        request.status = 'rejected'
        request.reviewedAt = getNow()

        this.saveRecordsToStorage()
        this.saveLeaveRequestsToStorage()
        this.showToast('请假申请已撤销，已返还假期余额', 'warning')
        return
      }

      if (request.status !== 'pending') {
        this.showToast('该请假申请状态不支持拒绝操作', 'warning')
        return
      }

      if (['annual', 'lieu'].includes(request.leaveType) && request.vacationConsumed && request.vacationConsumed.length > 0) {
        const vacationStore = useVacationStore()
        const vacationType = request.leaveType === 'annual' ? VACATION_TYPES.ANNUAL : VACATION_TYPES.LIEU
        vacationStore.returnDays(
          request.employeeId,
          vacationType,
          request.days,
          request.id,
          'system',
          request.vacationConsumed
        )
        request.vacationConsumed = []
      }

      request.status = 'rejected'
      request.reviewedAt = getNow()

      this.saveLeaveRequestsToStorage()
      this.showToast('请假申请已拒绝', 'warning')
    },

    submitOvertimeRequest(data) {
      const calculatedHours = calculateOvertimeHours(data.startTime, data.endTime, data.overtimeType)
      
      const request = {
        id: 'OT' + Date.now(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        departmentId: data.departmentId,
        overtimeType: data.overtimeType,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        workHours: ((parseTime(data.endTime) - parseTime(data.startTime)) / 60).toFixed(2),
        overtimeHours: calculatedHours,
        reason: data.reason,
        status: OVERTIME_STATUS.PENDING_SUPERVISOR,
        approverId: null,
        approvalHistory: [],
        createdAt: getNow()
      }

      this.overtimeRequests.unshift(request)
      this.saveOvertimeRequestsToStorage()
      this.showToast('加班申请已提交，等待直属领导审批', 'success')

      return request
    },

    approveOvertimeRequest(requestId, approverRole, approverName) {
      const request = this.overtimeRequests.find(r => r.id === requestId)
      if (!request) return

      const approvalRecord = {
        role: approverRole,
        name: approverName,
        action: 'approve',
        time: getNow()
      }

      request.approvalHistory.push(approvalRecord)

      const statusFlow = {
        [OVERTIME_STATUS.PENDING_SUPERVISOR]: {
          next: OVERTIME_STATUS.PENDING_MANAGER,
          message: '直属领导已通过，等待部门经理审批'
        },
        [OVERTIME_STATUS.PENDING_MANAGER]: {
          next: OVERTIME_STATUS.PENDING_HR,
          message: '部门经理已通过，等待人事审批'
        },
        [OVERTIME_STATUS.PENDING_HR]: {
          next: OVERTIME_STATUS.APPROVED,
          message: '加班申请已通过'
        }
      }

      const flow = statusFlow[request.status]
      if (flow) {
        request.status = flow.next
        request.reviewedAt = getNow()

        let toastMessage = flow.message
        let toastType = 'success'

        if (flow.next === OVERTIME_STATUS.APPROVED) {
          this.syncOvertimeToAttendance(request)
          const lieuResult = this.convertOvertimeToLieu(request)

          if (lieuResult.success) {
            toastMessage = `加班申请已通过，调休 ${lieuResult.lieuDays} 天已入账`
          } else if (lieuResult.reason === 'zero_days') {
            toastMessage = `加班申请已通过，但工时不足未生成调休额度`
            toastType = 'warning'
          } else {
            toastMessage = `加班申请已通过，但调休额度生成失败：${lieuResult.message || '未知原因'}`
            toastType = 'warning'
          }
        }

        this.saveOvertimeRequestsToStorage()
        this.showToast(toastMessage, toastType)
      }
    },

    rejectOvertimeRequest(requestId, approverRole, approverName) {
      const request = this.overtimeRequests.find(r => r.id === requestId)
      if (!request) return

      const approvalRecord = {
        role: approverRole,
        name: approverName,
        action: 'reject',
        time: getNow()
      }

      request.approvalHistory.push(approvalRecord)

      const rejectStatusMap = {
        [OVERTIME_STATUS.PENDING_SUPERVISOR]: OVERTIME_STATUS.REJECTED_SUPERVISOR,
        [OVERTIME_STATUS.PENDING_MANAGER]: OVERTIME_STATUS.REJECTED_MANAGER,
        [OVERTIME_STATUS.PENDING_HR]: OVERTIME_STATUS.REJECTED_HR
      }

      const rejectStatus = rejectStatusMap[request.status]
      if (rejectStatus) {
        request.status = rejectStatus
        request.reviewedAt = getNow()
        this.saveOvertimeRequestsToStorage()
        this.showToast('加班申请已拒绝', 'warning')
      }
    },

    syncOvertimeToAttendance(request) {
      if (!isOvertimeFinalApproved(request.status)) return

      if (!this.records[request.employeeId]) {
        this.records[request.employeeId] = {}
      }

      if (!this.records[request.employeeId][request.date]) {
        this.records[request.employeeId][request.date] = {}
      }

      const dateRecord = this.records[request.employeeId][request.date]
      dateRecord.isOvertime = true
      dateRecord.overtimeType = request.overtimeType
      dateRecord.overtimeHours = request.overtimeHours
      dateRecord.overtimeRequestId = request.id
      dateRecord.overtimeStartTime = request.startTime
      dateRecord.overtimeEndTime = request.endTime

      this.saveRecordsToStorage()
    },

    convertOvertimeToLieu(request) {
      if (!isOvertimeFinalApproved(request.status)) {
        return { success: false, reason: 'not_approved', message: '加班申请未通过' }
      }

      const lieuDays = calculateLieuDays(request.startTime, request.endTime, request.overtimeType)
      if (lieuDays <= 0) {
        request.lieuConvertStatus = 'zero_days'
        request.lieuConvertMessage = '工时不足，未生成调休额度'
        request.lieuDays = 0
        return { success: false, reason: 'zero_days', message: '工时不足，未生成调休额度', lieuDays: 0 }
      }

      const vacationStore = useVacationStore()
      const result = vacationStore.grantLieuFromOvertime({
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        departmentId: request.departmentId,
        departmentName: request.department,
        overtimeType: request.overtimeType,
        overtimeTypeLabel: getOvertimeTypeLabel(request.overtimeType),
        workHours: request.workHours,
        lieuDays,
        overtimeRequestId: request.id
      })

      if (result.success && result.grant) {
        request.lieuGrantId = result.grant.id
        request.lieuDays = lieuDays
        request.lieuConvertStatus = 'success'
        request.lieuConvertMessage = `调休 ${lieuDays} 天已入账`
        return { success: true, lieuDays, grantId: result.grant.id }
      }

      const isAlreadyGranted = result.message && result.message.includes('重复')
      if (isAlreadyGranted) {
        const existingGrant = vacationStore.grants.find(g =>
          g.sourceOvertimeRequestId === request.id
        )
        if (existingGrant) {
          request.lieuGrantId = existingGrant.id
          request.lieuDays = existingGrant.totalDays
          request.lieuConvertStatus = 'success'
          request.lieuConvertMessage = `调休 ${existingGrant.totalDays} 天已入账`
          return { success: true, lieuDays: existingGrant.totalDays, grantId: existingGrant.id, alreadyGranted: true }
        }
        const existingAdj = vacationStore.adjustments.find(a =>
          a.relatedOvertimeRequestId === request.id &&
          a.reason === 'overtime_convert' &&
          a.changeType === 'add'
        )
        if (existingAdj) {
          request.lieuDays = existingAdj.days
          request.lieuConvertStatus = 'success'
          request.lieuConvertMessage = `调休 ${existingAdj.days} 天已入账`
          return { success: true, lieuDays: existingAdj.days, alreadyGranted: true }
        }
        request.lieuConvertStatus = 'failed'
        request.lieuConvertMessage = '假期账户无对应入账记录，请联系人事核实'
        request.lieuDays = 0
        return {
          success: false,
          reason: 'missing_record',
          message: '假期账户无对应入账记录，请联系人事核实',
          lieuDays: 0
        }
      }

      request.lieuConvertStatus = 'failed'
      request.lieuConvertMessage = result.message || '调休额度生成失败'
      request.lieuDays = 0
      return {
        success: false,
        reason: 'failed',
        message: result.message || '调休额度生成失败',
        lieuDays: 0
      }
    },

    backfillLieuStatus(request) {
      if (!request || !isOvertimeFinalApproved(request.status)) return null

      if (
        request.lieuConvertStatus === 'success' ||
        request.lieuConvertStatus === 'zero_days'
      ) {
        return null
      }

      const expectedDays = calculateLieuDays(request.startTime, request.endTime, request.overtimeType)
      if (expectedDays <= 0) {
        if (request.lieuConvertStatus !== 'zero_days') {
          request.lieuDays = 0
          request.lieuConvertStatus = 'zero_days'
          request.lieuConvertMessage = '工时不足，未生成调休额度'
          this.saveOvertimeRequestsToStorage()
        }
        return { status: 'zero_days', lieuDays: 0 }
      }

      const vacationStore = useVacationStore()

      const matchedGrant = vacationStore.grants.find(g =>
        g.sourceOvertimeRequestId === request.id
      )
      if (matchedGrant) {
        request.lieuGrantId = matchedGrant.id
        request.lieuDays = matchedGrant.totalDays
        request.lieuConvertStatus = 'success'
        request.lieuConvertMessage = `调休 ${matchedGrant.totalDays} 天已入账`
        this.saveOvertimeRequestsToStorage()
        return { status: 'success', lieuDays: matchedGrant.totalDays }
      }

      const matchedAdj = vacationStore.adjustments.find(a =>
        a.relatedOvertimeRequestId === request.id &&
        a.reason === 'overtime_convert' &&
        a.changeType === 'add'
      )
      if (matchedAdj) {
        request.lieuDays = matchedAdj.days
        request.lieuConvertStatus = 'success'
        request.lieuConvertMessage = `调休 ${matchedAdj.days} 天已入账`
        this.saveOvertimeRequestsToStorage()
        return { status: 'success', lieuDays: matchedAdj.days }
      }

      return { status: 'pending', lieuDays: 0 }
    },

    reassignPendingApprovalsForEmployee(employeeId, oldApproverId, newApproverId, newApproverName, reason = '', employeeName = '') {
      const reassigned = {
        makeup: [],
        leave: [],
        overtime: []
      }
      let notificationStore
      try {
        notificationStore = useNotificationStore()
      } catch (e) {
        notificationStore = null
      }

      this.makeupRequests.forEach(req => {
        if (req.employeeId === employeeId && req.status === 'pending') {
          const oldName = req.approverName || '原审批人'
          req.approverId = newApproverId
          req.approverName = newApproverName
          if (!req.reassignHistory) req.reassignHistory = []
          req.reassignHistory.push({
            from: oldApproverId,
            to: newApproverId,
            reason,
            time: getNow()
          })
          reassigned.makeup.push(req.id)

          if (notificationStore && newApproverId) {
            notificationStore.addNotification({
              type: NOTIFICATION_TYPES.APPROVAL_TODO,
              category: NOTIFICATION_CATEGORIES.APPROVAL,
              employeeId: newApproverId,
              title: '待审核：补卡申请',
              content: `${req.employeeName} 提交的 ${req.date} 补卡申请，审批人已变更为您，请及时审批。`,
              date: new Date().toISOString().split('T')[0],
              extra: {
                applicantId: req.employeeId,
                applicantName: req.employeeName,
                requestType: 'makeup',
                date: req.date,
                requestId: req.id,
                reassigned: true
              },
              actionable: true,
              actionType: 'approve',
              actionLabel: '去审批'
            })
          }
          if (notificationStore && employeeId && oldApproverId !== newApproverId) {
            notificationStore.generateApproverChangedNotification(
              employeeId,
              oldName,
              newApproverName || '新审批人',
              reason
            )
          }
        }
      })

      this.leaveRequests.forEach(req => {
        if (req.employeeId === employeeId && req.status === 'pending') {
          const oldName = req.approverName || '原审批人'
          req.approverId = newApproverId
          req.approverName = newApproverName
          if (!req.reassignHistory) req.reassignHistory = []
          req.reassignHistory.push({
            from: oldApproverId,
            to: newApproverId,
            reason,
            time: getNow()
          })
          reassigned.leave.push(req.id)

          if (notificationStore && newApproverId) {
            notificationStore.addNotification({
              type: NOTIFICATION_TYPES.APPROVAL_TODO,
              category: NOTIFICATION_CATEGORIES.APPROVAL,
              employeeId: newApproverId,
              title: '待审核：请假申请',
              content: `${req.employeeName} 提交的 ${req.startDate} 起请假申请，审批人已变更为您，请及时审批。`,
              date: new Date().toISOString().split('T')[0],
              extra: {
                applicantId: req.employeeId,
                applicantName: req.employeeName,
                requestType: 'leave',
                date: req.startDate,
                requestId: req.id,
                reassigned: true
              },
              actionable: true,
              actionType: 'approve',
              actionLabel: '去审批'
            })
          }
          if (notificationStore && employeeId && oldApproverId !== newApproverId) {
            notificationStore.generateApproverChangedNotification(
              employeeId,
              oldName,
              newApproverName || '新审批人',
              reason
            )
          }
        }
      })

      this.overtimeRequests.forEach(req => {
        if (req.employeeId === employeeId && !isOvertimeFinalApproved(req.status) && !isOvertimeRejected(req.status)) {
          const supervisorApproved = req.approvalHistory?.some(h => h.role === 'supervisor' && h.action === 'approve')
          const managerApproved = req.approvalHistory?.some(h => h.role === 'manager' && h.action === 'approve')

          let targetRole = null
          if (!supervisorApproved && req.status === OVERTIME_STATUS.PENDING_SUPERVISOR) {
            targetRole = 'supervisor'
          } else if (supervisorApproved && !managerApproved &&
            (req.status === OVERTIME_STATUS.PENDING_MANAGER)) {
            targetRole = 'manager'
          }

          if (targetRole) {
            req.approverId = newApproverId
            if (!req.reassignHistory) req.reassignHistory = []
            req.reassignHistory.push({
              from: oldApproverId,
              to: newApproverId,
              role: targetRole,
              reason,
              time: getNow()
            })

            const oldApprover = oldApproverId ? `原${targetRole === 'supervisor' ? '直属领导' : '部门经理'}` : '原审批人'
            const newApprover = newApproverName || '新审批人'
            req.approvalHistory.push({
              role: targetRole,
              name: `${oldApprover}→${newApprover}`,
              action: 'reassign',
              reason,
              time: getNow()
            })

            reassigned.overtime.push(req.id)

            if (notificationStore && newApproverId) {
              const roleLabel = targetRole === 'supervisor' ? '直属领导' : '部门经理'
              notificationStore.addNotification({
                type: NOTIFICATION_TYPES.APPROVAL_TODO,
                category: NOTIFICATION_CATEGORIES.APPROVAL,
                employeeId: newApproverId,
                title: '待审核：加班申请',
                content: `${req.employeeName} 提交的 ${req.date} 加班申请，${roleLabel}已变更为您，请及时审批。`,
                date: new Date().toISOString().split('T')[0],
                extra: {
                  applicantId: req.employeeId,
                  applicantName: req.employeeName,
                  requestType: 'overtime',
                  date: req.date,
                  requestId: req.id,
                  reassigned: true,
                  role: targetRole
                },
                actionable: true,
                actionType: 'approve',
                actionLabel: '去审批'
              })
            }
            if (notificationStore && employeeId && oldApproverId !== newApproverId) {
              notificationStore.generateApproverChangedNotification(
                employeeId,
                oldApprover,
                newApprover,
                reason
              )
            }
          }
        }
      })

      this.saveMakeupRequestsToStorage()
      this.saveLeaveRequestsToStorage()
      this.saveOvertimeRequestsToStorage()

      return reassigned
    },

    reassignDepartmentPendingApprovals(departmentId, oldApproverId, newApproverId, newApproverName, employeeIds, reason = '') {
      const reassigned = {
        makeup: [],
        leave: [],
        overtime: []
      }

      employeeIds.forEach(empId => {
        const result = this.reassignPendingApprovalsForEmployee(
          empId, oldApproverId, newApproverId, newApproverName, reason
        )
        reassigned.makeup.push(...result.makeup)
        reassigned.leave.push(...result.leave)
        reassigned.overtime.push(...result.overtime)
      })

      return reassigned
    },

    updateRequestsDepartment(employeeId, oldDepartmentId, newDepartmentId, newDepartmentName) {
      const updated = []

      this.overtimeRequests.forEach(req => {
        if (req.employeeId === employeeId) {
          const allOldIds = Array.isArray(oldDepartmentId) ? oldDepartmentId : [oldDepartmentId]
          if (allOldIds.includes(req.departmentId) || oldDepartmentId === null || req.departmentId === undefined) {
            req.departmentId = newDepartmentId
            req.department = newDepartmentName
            updated.push(req.id)
          }
        }
      })

      this.makeupRequests.forEach(req => {
        if (req.employeeId === employeeId) {
          const allOldIds = Array.isArray(oldDepartmentId) ? oldDepartmentId : [oldDepartmentId]
          if (allOldIds.includes(req.departmentId) || oldDepartmentId === null || req.departmentId === undefined) {
            req.departmentId = newDepartmentId
            req.department = newDepartmentName
            if (!updated.includes(req.id)) updated.push(req.id)
          }
        }
      })

      this.leaveRequests.forEach(req => {
        if (req.employeeId === employeeId) {
          const allOldIds = Array.isArray(oldDepartmentId) ? oldDepartmentId : [oldDepartmentId]
          if (allOldIds.includes(req.departmentId) || oldDepartmentId === null || req.departmentId === undefined) {
            req.departmentId = newDepartmentId
            req.department = newDepartmentName
            if (!updated.includes(req.id)) updated.push(req.id)
          }
        }
      })

      this.saveOvertimeRequestsToStorage()
      this.saveMakeupRequestsToStorage()
      this.saveLeaveRequestsToStorage()
      return updated
    },

    batchUpdateRequestsDepartment(employeeIds, oldDepartmentId, newDepartmentId, newDepartmentName) {
      const allUpdated = []
      employeeIds.forEach(empId => {
        const updated = this.updateRequestsDepartment(empId, null, newDepartmentId, newDepartmentName)
        allUpdated.push(...updated)
      })
      return allUpdated
    }
  }
})
