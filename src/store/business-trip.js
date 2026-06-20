import { defineStore } from 'pinia'
import {
  getBusinessTripRequests,
  setBusinessTripRequests,
  getBusinessTripCheckins,
  setBusinessTripCheckins,
  getAttendanceRecords,
  setAttendanceRecords
} from '@/utils/storage'
import { getNow, formatDate, getToday } from '@/utils/date'
import {
  BUSINESS_TRIP_STATUS,
  BUSINESS_TRIP_TYPES,
  CHECKIN_TYPES,
  generateBusinessTripId,
  generateCheckinId,
  getBusinessTripStatusText,
  getBusinessTripStatusColor,
  getBusinessTripTypeLabel,
  getBusinessTripTypeColor,
  isBusinessTripFinalApproved,
  isBusinessTripRejected,
  isBusinessTripPending,
  getBusinessTripApprovalProgress,
  calculateBusinessTripDays,
  getTripDates,
  isDateInTrip
} from '@/utils/business-trip'

export const useBusinessTripStore = defineStore('businessTrip', {
  state: () => ({
    requests: [],
    checkins: [],
    toast: {
      show: false,
      message: '',
      type: 'success'
    }
  }),

  getters: {
    getEmployeeRequests: (state) => (employeeId) => {
      return state.requests.filter(r => r.employeeId === employeeId)
    },

    getApprovedTrips: (state) => (employeeId) => {
      return state.requests.filter(r =>
        r.employeeId === employeeId &&
        isBusinessTripFinalApproved(r.status)
      )
    },

    getPendingRequests: (state) => (approverRole = null) => {
      let pending = state.requests.filter(req => {
        if (isBusinessTripRejected(req.status)) return false
        if (isBusinessTripFinalApproved(req.status)) return false
        if (req.status === BUSINESS_TRIP_STATUS.CANCELLED) return false
        return true
      })

      if (approverRole) {
        const roleStatusMap = {
          supervisor: BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR,
          manager: BUSINESS_TRIP_STATUS.PENDING_MANAGER,
          hr: BUSINESS_TRIP_STATUS.PENDING_HR
        }
        const targetStatus = roleStatusMap[approverRole]
        if (targetStatus) {
          pending = pending.filter(req => req.status === targetStatus)
        }
      }

      return pending
    },

    getTodayTrip: (state) => (employeeId) => {
      const today = getToday()
      const approvedTrips = state.requests.filter(r =>
        r.employeeId === employeeId &&
        isBusinessTripFinalApproved(r.status)
      )
      return approvedTrips.find(trip =>
        isDateInTrip(today, trip.startDate, trip.endDate)
      ) || null
    },

    getTripCheckins: (state) => (tripId) => {
      return state.checkins.filter(c => c.tripId === tripId)
    },

    getEmployeeCheckins: (state) => (employeeId) => {
      return state.checkins.filter(c => c.employeeId === employeeId)
    },

    getTodayCheckins: (state) => (employeeId, tripId) => {
      const today = getToday()
      return state.checkins.filter(c =>
        c.employeeId === employeeId &&
        c.tripId === tripId &&
        c.date === today
      )
    },

    tripTypes: () => BUSINESS_TRIP_TYPES,
    checkinTypes: () => CHECKIN_TYPES
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

    initBusinessTrip() {
      const storedRequests = getBusinessTripRequests()
      const storedCheckins = getBusinessTripCheckins()
      this.requests = storedRequests
      this.checkins = storedCheckins
    },

    saveRequestsToStorage() {
      setBusinessTripRequests(this.requests)
    },

    saveCheckinsToStorage() {
      setBusinessTripCheckins(this.checkins)
    },

    submitTripRequest(data) {
      const days = calculateBusinessTripDays(data.startDate, data.endDate)

      const request = {
        id: generateBusinessTripId(),
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        department: data.department,
        tripType: data.tripType,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        days: days,
        reason: data.reason,
        itinerary: data.itinerary || [],
        status: BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR,
        approvalHistory: [],
        createdAt: getNow()
      }

      this.requests.unshift(request)
      this.saveRequestsToStorage()
      this.showToast('出差申请已提交，等待直属领导审批', 'success')

      return request
    },

    approveTripRequest(requestId, approverRole, approverName) {
      const request = this.requests.find(r => r.id === requestId)
      if (!request) return

      const approvalRecord = {
        role: approverRole,
        name: approverName,
        action: 'approve',
        time: getNow()
      }

      request.approvalHistory.push(approvalRecord)

      const statusFlow = {
        [BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR]: {
          next: BUSINESS_TRIP_STATUS.PENDING_MANAGER,
          message: '直属领导已通过，等待部门经理审批'
        },
        [BUSINESS_TRIP_STATUS.PENDING_MANAGER]: {
          next: BUSINESS_TRIP_STATUS.PENDING_HR,
          message: '部门经理已通过，等待人事审批'
        },
        [BUSINESS_TRIP_STATUS.PENDING_HR]: {
          next: BUSINESS_TRIP_STATUS.APPROVED,
          message: '出差申请已通过，考勤已自动豁免'
        }
      }

      const flow = statusFlow[request.status]
      if (flow) {
        request.status = flow.next
        request.reviewedAt = getNow()

        if (flow.next === BUSINESS_TRIP_STATUS.APPROVED) {
          this.syncTripToAttendance(request)
        }

        this.saveRequestsToStorage()
        this.showToast(flow.message, 'success')
      }
    },

    rejectTripRequest(requestId, approverRole, approverName, rejectReason = '') {
      const request = this.requests.find(r => r.id === requestId)
      if (!request) return

      const approvalRecord = {
        role: approverRole,
        name: approverName,
        action: 'reject',
        reason: rejectReason,
        time: getNow()
      }

      request.approvalHistory.push(approvalRecord)

      const rejectStatusMap = {
        [BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR]: BUSINESS_TRIP_STATUS.REJECTED_SUPERVISOR,
        [BUSINESS_TRIP_STATUS.PENDING_MANAGER]: BUSINESS_TRIP_STATUS.REJECTED_MANAGER,
        [BUSINESS_TRIP_STATUS.PENDING_HR]: BUSINESS_TRIP_STATUS.REJECTED_HR
      }

      const rejectStatus = rejectStatusMap[request.status]
      if (rejectStatus) {
        request.status = rejectStatus
        request.rejectReason = rejectReason
        request.reviewedAt = getNow()
        this.saveRequestsToStorage()
        this.showToast('出差申请已拒绝', 'warning')
      }
    },

    cancelTripRequest(requestId) {
      const request = this.requests.find(r => r.id === requestId)
      if (!request) return

      if (!isBusinessTripPending(request.status)) {
        this.showToast('当前状态不可取消', 'error')
        return
      }

      request.status = BUSINESS_TRIP_STATUS.CANCELLED
      request.cancelledAt = getNow()
      this.saveRequestsToStorage()
      this.showToast('出差申请已取消', 'success')
    },

    syncTripToAttendance(request) {
      if (!isBusinessTripFinalApproved(request.status)) return

      const records = getAttendanceRecords()

      if (!records[request.employeeId]) {
        records[request.employeeId] = {}
      }

      const tripDates = getTripDates(request.startDate, request.endDate)
      tripDates.forEach(dateStr => {
        if (!records[request.employeeId][dateStr]) {
          records[request.employeeId][dateStr] = {}
        }
        records[request.employeeId][dateStr].isBusinessTrip = true
        records[request.employeeId][dateStr].businessTripType = request.tripType
        records[request.employeeId][dateStr].businessTripId = request.id
        records[request.employeeId][dateStr].businessTripDestination = request.destination
      })

      setAttendanceRecords(records)
    },

    submitCheckin(data) {
      const checkin = {
        id: generateCheckinId(),
        tripId: data.tripId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        date: getToday(),
        checkinType: data.checkinType,
        time: data.time,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        remark: data.remark || '',
        photo: data.photo || null,
        createdAt: getNow()
      }

      this.checkins.unshift(checkin)
      this.saveCheckinsToStorage()

      this.syncCheckinToAttendance(checkin)

      this.showToast('签到成功，考勤已同步', 'success')

      return checkin
    },

    syncCheckinToAttendance(checkin) {
      const records = getAttendanceRecords()

      if (!records[checkin.employeeId]) {
        records[checkin.employeeId] = {}
      }

      const today = checkin.date
      if (!records[checkin.employeeId][today]) {
        records[checkin.employeeId][today] = {}
      }

      const dayRecord = records[checkin.employeeId][today]
      dayRecord.isBusinessTrip = true
      dayRecord.businessTripId = checkin.tripId

      if (!dayRecord.businessTripCheckins) {
        dayRecord.businessTripCheckins = []
      }

      const existingIndex = dayRecord.businessTripCheckins.findIndex(
        c => c.checkinType === checkin.checkinType
      )
      if (existingIndex > -1) {
        dayRecord.businessTripCheckins[existingIndex] = {
          checkinType: checkin.checkinType,
          time: checkin.time,
          location: checkin.location
        }
      } else {
        dayRecord.businessTripCheckins.push({
          checkinType: checkin.checkinType,
          time: checkin.time,
          location: checkin.location
        })
      }

      if (checkin.checkinType === 'morning') {
        dayRecord.checkIn = checkin.time
        dayRecord.checkInTime = checkin.createdAt
        dayRecord.businessTripCheckIn = true
      } else if (checkin.checkinType === 'afternoon') {
        dayRecord.checkOut = checkin.time
        dayRecord.checkOutTime = checkin.createdAt
        dayRecord.businessTripCheckOut = true
      }

      setAttendanceRecords(records)
    },

    addItineraryItem(requestId, item) {
      const request = this.requests.find(r => r.id === requestId)
      if (!request) return null

      if (!request.itinerary) {
        request.itinerary = []
      }

      const itineraryItem = {
        id: 'IT' + Date.now(),
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location,
        description: item.description,
        createdAt: getNow()
      }

      request.itinerary.push(itineraryItem)
      request.itinerary.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.startTime.localeCompare(b.startTime)
      })

      this.saveRequestsToStorage()
      return itineraryItem
    },

    removeItineraryItem(requestId, itemId) {
      const request = this.requests.find(r => r.id === requestId)
      if (!request || !request.itinerary) return false

      const index = request.itinerary.findIndex(item => item.id === itemId)
      if (index > -1) {
        request.itinerary.splice(index, 1)
        this.saveRequestsToStorage()
        return true
      }
      return false
    },

    updateItineraryItem(requestId, itemId, updates) {
      const request = this.requests.find(r => r.id === requestId)
      if (!request || !request.itinerary) return null

      const item = request.itinerary.find(i => i.id === itemId)
      if (item) {
        Object.assign(item, updates)
        request.itinerary.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return a.startTime.localeCompare(b.startTime)
        })
        this.saveRequestsToStorage()
        return item
      }
      return null
    },

    getApprovedTripsForDate(employeeId, date) {
      return this.requests.filter(r =>
        r.employeeId === employeeId &&
        isBusinessTripFinalApproved(r.status) &&
        isDateInTrip(date, r.startDate, r.endDate)
      )
    },

    updateRequestsDepartment(employeeId, oldDepartmentId, newDepartmentId, newDepartmentName) {
      const updated = []

      this.requests.forEach(req => {
        if (req.employeeId === employeeId) {
          const allOldIds = Array.isArray(oldDepartmentId) ? oldDepartmentId : [oldDepartmentId]
          if (allOldIds.includes(req.departmentId) || oldDepartmentId === null) {
            req.department = newDepartmentName
            updated.push(req.id)
          }
        }
      })

      this.saveRequestsToStorage()
      return updated
    },

    batchUpdateRequestsDepartment(employeeIds, oldDepartmentId, newDepartmentId, newDepartmentName) {
      const allUpdated = []
      employeeIds.forEach(empId => {
        const updated = this.updateRequestsDepartment(empId, null, newDepartmentId, newDepartmentName)
        allUpdated.push(...updated)
      })
      return allUpdated
    },

    reassignPendingApprovalsForEmployee(employeeId, oldApproverId, newApproverId, newApproverName, reason = '') {
      const reassigned = []

      this.requests.forEach(req => {
        if (req.employeeId !== employeeId) return
        if (isBusinessTripRejected(req.status)) return
        if (isBusinessTripFinalApproved(req.status)) return
        if (req.status === BUSINESS_TRIP_STATUS.CANCELLED) return

        const supervisorApproved = req.approvalHistory?.some(
          h => h.role === 'supervisor' && h.action === 'approve'
        )
        const managerApproved = req.approvalHistory?.some(
          h => h.role === 'manager' && h.action === 'approve'
        )

        let targetRole = null
        if (!supervisorApproved && req.status === BUSINESS_TRIP_STATUS.PENDING_SUPERVISOR) {
          targetRole = 'supervisor'
        } else if (supervisorApproved && !managerApproved &&
          (req.status === BUSINESS_TRIP_STATUS.PENDING_MANAGER ||
           req.status === BUSINESS_TRIP_STATUS.APPROVED_SUPERVISOR)) {
          targetRole = 'manager'
        }

        if (targetRole) {
          if (!req.reassignHistory) req.reassignHistory = []
          req.reassignHistory.push({
            from: oldApproverId,
            to: newApproverId,
            role: targetRole,
            reason,
            time: getNow()
          })
          reassigned.push(req.id)
        }
      })

      this.saveRequestsToStorage()
      return reassigned
    },

    reassignDepartmentPendingApprovals(departmentId, oldApproverId, newApproverId, newApproverName, employeeIds, reason = '') {
      const reassigned = []
      employeeIds.forEach(empId => {
        const result = this.reassignPendingApprovalsForEmployee(
          empId, oldApproverId, newApproverId, newApproverName, reason
        )
        reassigned.push(...result)
      })
      return reassigned
    }
  }
})
