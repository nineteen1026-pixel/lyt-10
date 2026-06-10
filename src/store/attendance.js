import { defineStore } from 'pinia'
import { getAttendanceRecords, setAttendanceRecords, getMakeupRequests, setMakeupRequests } from '@/utils/storage'
import { getToday, getCurrentTime, getNow, formatDate } from '@/utils/date'
import { getCheckInStatus, getCheckOutStatus, getDayStatus, generateMonthCalendarData, calculateAttendanceStats, ATTENDANCE_STATUS } from '@/utils/attendance'

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

    getDepartmentMonthStats: (state) => (employeeIds, year, month) => {
      const combined = { total: 0, normal: 0, late: 0, earlyLeave: 0, absent: 0, notChecked: 0, makeup: 0 }
      employeeIds.forEach(empId => {
        const employeeRecords = state.records[empId] || {}
        const stats = calculateAttendanceStats(employeeRecords, year, month)
        Object.keys(combined).forEach(key => {
          combined[key] += stats[key]
        })
      })
      return combined
    },

    getDepartmentMonthTrend: (state) => (employeeIds, year) => {
      const trend = []
      for (let m = 1; m <= 12; m++) {
        const combined = { total: 0, normal: 0, late: 0, earlyLeave: 0, absent: 0, notChecked: 0, makeup: 0 }
        employeeIds.forEach(empId => {
          const employeeRecords = state.records[empId] || {}
          const stats = calculateAttendanceStats(employeeRecords, year, m)
          Object.keys(combined).forEach(key => {
            combined[key] += stats[key]
          })
        })
        trend.push({ month: m, ...combined })
      }
      return trend
    },

    getDepartmentAbnormalEmployees: (state) => (employeeIds, year, month) => {
      const result = []
      const daysInMonth = new Date(year, month, 0).getDate()
      employeeIds.forEach(empId => {
        const employeeRecords = state.records[empId] || {}
        const stats = calculateAttendanceStats(employeeRecords, year, month)
        const abnormalCount = stats.late + stats.earlyLeave + stats.absent + stats.notChecked + stats.makeup
        if (abnormalCount > 0) {
          const details = []
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day)
            if (date.getDay() === 0 || date.getDay() === 6) continue
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const record = employeeRecords[dateStr]
            const status = getDayStatus(record)
            if (status !== ATTENDANCE_STATUS.NORMAL) {
              details.push({ date: dateStr, status, record })
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
    }
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
    },

    saveRecordsToStorage() {
      setAttendanceRecords(this.records)
    },

    saveMakeupRequestsToStorage() {
      setMakeupRequests(this.makeupRequests)
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

    checkIn(employeeId) {
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

      this.records[employeeId][today] = {
        ...this.records[employeeId][today],
        checkIn: currentTime,
        checkInTime: now
      }

      this.saveRecordsToStorage()

      const status = getCheckInStatus(currentTime)
      if (status === ATTENDANCE_STATUS.LATE) {
        this.showToast('上班打卡成功（迟到）', 'warning')
      } else {
        this.showToast('上班打卡成功', 'success')
      }

      return true
    },

    checkOut(employeeId) {
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

      this.saveRecordsToStorage()

      const status = getCheckOutStatus(currentTime)
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
        date: data.date,
        time: data.time,
        type: data.type,
        reason: data.reason,
        status: 'pending',
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
    }
  }
})
