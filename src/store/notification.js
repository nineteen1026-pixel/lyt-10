import { defineStore } from 'pinia'
import { getNotifications, setNotifications, getNotificationReadStatus, setNotificationReadStatus } from '@/utils/storage'
import { getNow } from '@/utils/date'
import { OVERTIME_STATUS, isOvertimeFinalApproved, isOvertimeRejected } from '@/utils/attendance'

export const NOTIFICATION_TYPES = {
  LATE: 'late',
  ABSENT: 'absent',
  MAKEUP_PENDING: 'makeup_pending',
  LEAVE_PENDING: 'leave_pending',
  OVERTIME_PENDING: 'overtime_pending',
  MAKEUP_APPROVED: 'makeup_approved',
  MAKEUP_REJECTED: 'makeup_rejected',
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  OVERTIME_APPROVED: 'overtime_approved',
  OVERTIME_REJECTED: 'overtime_rejected',
  APPROVAL_TODO: 'approval_todo'
}

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.LATE]: '迟到提醒',
  [NOTIFICATION_TYPES.ABSENT]: '缺卡提醒',
  [NOTIFICATION_TYPES.MAKEUP_PENDING]: '补卡待审批',
  [NOTIFICATION_TYPES.LEAVE_PENDING]: '请假待审批',
  [NOTIFICATION_TYPES.OVERTIME_PENDING]: '加班待审批',
  [NOTIFICATION_TYPES.MAKEUP_APPROVED]: '补卡已通过',
  [NOTIFICATION_TYPES.MAKEUP_REJECTED]: '补卡已拒绝',
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: '请假已通过',
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: '请假已拒绝',
  [NOTIFICATION_TYPES.OVERTIME_APPROVED]: '加班已通过',
  [NOTIFICATION_TYPES.OVERTIME_REJECTED]: '加班已拒绝',
  [NOTIFICATION_TYPES.APPROVAL_TODO]: '待我审核'
}

export const NOTIFICATION_TYPE_ICONS = {
  [NOTIFICATION_TYPES.LATE]: '⏰',
  [NOTIFICATION_TYPES.ABSENT]: '❌',
  [NOTIFICATION_TYPES.MAKEUP_PENDING]: '⏳',
  [NOTIFICATION_TYPES.LEAVE_PENDING]: '⏳',
  [NOTIFICATION_TYPES.OVERTIME_PENDING]: '⏳',
  [NOTIFICATION_TYPES.MAKEUP_APPROVED]: '✅',
  [NOTIFICATION_TYPES.MAKEUP_REJECTED]: '❌',
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: '✅',
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: '❌',
  [NOTIFICATION_TYPES.OVERTIME_APPROVED]: '✅',
  [NOTIFICATION_TYPES.OVERTIME_REJECTED]: '❌',
  [NOTIFICATION_TYPES.APPROVAL_TODO]: '📝'
}

export const NOTIFICATION_TYPE_COLORS = {
  [NOTIFICATION_TYPES.LATE]: '#fa8c16',
  [NOTIFICATION_TYPES.ABSENT]: '#f5222d',
  [NOTIFICATION_TYPES.MAKEUP_PENDING]: '#faad14',
  [NOTIFICATION_TYPES.LEAVE_PENDING]: '#faad14',
  [NOTIFICATION_TYPES.OVERTIME_PENDING]: '#faad14',
  [NOTIFICATION_TYPES.MAKEUP_APPROVED]: '#52c41a',
  [NOTIFICATION_TYPES.MAKEUP_REJECTED]: '#f5222d',
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: '#52c41a',
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: '#f5222d',
  [NOTIFICATION_TYPES.OVERTIME_APPROVED]: '#52c41a',
  [NOTIFICATION_TYPES.OVERTIME_REJECTED]: '#f5222d',
  [NOTIFICATION_TYPES.APPROVAL_TODO]: '#1890ff'
}

export const NOTIFICATION_CATEGORIES = {
  ABNORMAL: 'abnormal',
  PENDING: 'pending',
  APPROVAL: 'approval',
  RESULT: 'result'
}

export const NOTIFICATION_CATEGORY_LABELS = {
  [NOTIFICATION_CATEGORIES.ABNORMAL]: '异常提醒',
  [NOTIFICATION_CATEGORIES.PENDING]: '我的待办',
  [NOTIFICATION_CATEGORIES.APPROVAL]: '待我审核',
  [NOTIFICATION_CATEGORIES.RESULT]: '审批结果'
}

const TYPE_TO_CATEGORY = {
  [NOTIFICATION_TYPES.LATE]: NOTIFICATION_CATEGORIES.ABNORMAL,
  [NOTIFICATION_TYPES.ABSENT]: NOTIFICATION_CATEGORIES.ABNORMAL,
  [NOTIFICATION_TYPES.MAKEUP_PENDING]: NOTIFICATION_CATEGORIES.PENDING,
  [NOTIFICATION_TYPES.LEAVE_PENDING]: NOTIFICATION_CATEGORIES.PENDING,
  [NOTIFICATION_TYPES.OVERTIME_PENDING]: NOTIFICATION_CATEGORIES.PENDING,
  [NOTIFICATION_TYPES.MAKEUP_APPROVED]: NOTIFICATION_CATEGORIES.RESULT,
  [NOTIFICATION_TYPES.MAKEUP_REJECTED]: NOTIFICATION_CATEGORIES.RESULT,
  [NOTIFICATION_TYPES.LEAVE_APPROVED]: NOTIFICATION_CATEGORIES.RESULT,
  [NOTIFICATION_TYPES.LEAVE_REJECTED]: NOTIFICATION_CATEGORIES.RESULT,
  [NOTIFICATION_TYPES.OVERTIME_APPROVED]: NOTIFICATION_CATEGORIES.RESULT,
  [NOTIFICATION_TYPES.OVERTIME_REJECTED]: NOTIFICATION_CATEGORIES.RESULT,
  [NOTIFICATION_TYPES.APPROVAL_TODO]: NOTIFICATION_CATEGORIES.APPROVAL
}

function generateMockNotifications(employeeId) {
  const notifications = []
  const today = new Date()

  const lateDates = []
  const absentDates = []
  for (let i = 1; i <= 15; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const day = date.getDay()
    if (day === 0 || day === 6) continue

    const random = Math.random()
    if (random < 0.2) {
      lateDates.push(date)
    } else if (random < 0.3) {
      absentDates.push(date)
    }
  }

  lateDates.forEach((date, index) => {
    const dateStr = date.toISOString().split('T')[0]
    notifications.push({
      id: `NOTIF_LATE_${employeeId}_${index}`,
      type: NOTIFICATION_TYPES.LATE,
      category: TYPE_TO_CATEGORY[NOTIFICATION_TYPES.LATE],
      employeeId,
      title: '迟到提醒',
      content: `您于 ${dateStr} 上班迟到，请关注考勤情况，如有特殊情况请及时提交补卡申请。`,
      date: dateStr,
      extra: {
        date: dateStr,
        checkInTime: `09:${20 + Math.floor(Math.random() * 40)}`
      },
      createdAt: new Date(date.getTime() + 9 * 3600 * 1000).toISOString(),
      status: 'unread',
      actionable: true,
      actionType: 'makeup',
      actionLabel: '申请补卡'
    })
  })

  absentDates.forEach((date, index) => {
    const dateStr = date.toISOString().split('T')[0]
    notifications.push({
      id: `NOTIF_ABSENT_${employeeId}_${index}`,
      type: NOTIFICATION_TYPES.ABSENT,
      category: TYPE_TO_CATEGORY[NOTIFICATION_TYPES.ABSENT],
      employeeId,
      title: '缺卡提醒',
      content: `您于 ${dateStr} 未打卡，请及时核实情况，如有特殊情况请提交补卡或请假申请。`,
      date: dateStr,
      extra: {
        date: dateStr
      },
      createdAt: new Date(date.getTime() + 18 * 3600 * 1000).toISOString(),
      status: 'unread',
      actionable: true,
      actionType: 'makeup',
      actionLabel: '申请补卡'
    })
  })

  const makeupPending = [
    { date: new Date(today.getTime() - 2 * 24 * 3600 * 1000), type: 'checkin' },
    { date: new Date(today.getTime() - 5 * 24 * 3600 * 1000), type: 'checkout' }
  ]
  makeupPending.forEach((item, index) => {
    const dateStr = item.date.toISOString().split('T')[0]
    notifications.push({
      id: `NOTIF_MAKEUP_PENDING_${employeeId}_${index}`,
      type: NOTIFICATION_TYPES.MAKEUP_PENDING,
      category: TYPE_TO_CATEGORY[NOTIFICATION_TYPES.MAKEUP_PENDING],
      employeeId,
      title: '补卡待审批',
      content: `您提交的 ${dateStr} ${item.type === 'checkin' ? '上班' : '下班'} 补卡申请正在审批中，请耐心等待。`,
      date: dateStr,
      extra: {
        date: dateStr,
        type: item.type,
        requestId: `MR${index}`
      },
      createdAt: item.date.toISOString(),
      status: 'unread',
      actionable: false
    })
  })

  const leavePending = [
    { date: new Date(today.getTime() - 1 * 24 * 3600 * 1000), type: 'annual', days: 2 }
  ]
  leavePending.forEach((item, index) => {
    const dateStr = item.date.toISOString().split('T')[0]
    notifications.push({
      id: `NOTIF_LEAVE_PENDING_${employeeId}_${index}`,
      type: NOTIFICATION_TYPES.LEAVE_PENDING,
      category: TYPE_TO_CATEGORY[NOTIFICATION_TYPES.LEAVE_PENDING],
      employeeId,
      title: '请假待审批',
      content: `您提交的年假申请（${dateStr} 起，共 ${item.days} 天）正在审批中，请耐心等待。`,
      date: dateStr,
      extra: {
        startDate: dateStr,
        days: item.days,
        leaveType: item.type,
        requestId: `LR${index}`
      },
      createdAt: item.date.toISOString(),
      status: 'unread',
      actionable: false
    })
  })

  const approvalTodos = []
  if (employeeId === 'E002' || employeeId === 'E003' || employeeId === 'E006' || employeeId === 'E008' || employeeId === 'E010') {
    const approvals = [
      { empName: '张明', empId: 'E001', type: 'makeup', date: new Date(today.getTime() - 1 * 24 * 3600 * 1000) },
      { empName: '李华', empId: 'E002', type: 'leave', date: new Date(today.getTime() - 2 * 24 * 3600 * 1000) },
      { empName: '刘伟', empId: 'E004', type: 'overtime', date: new Date(today.getTime() - 3 * 24 * 3600 * 1000) }
    ]
    approvals.forEach((item, index) => {
      const dateStr = item.date.toISOString().split('T')[0]
      let typeLabel = ''
      let content = ''
      if (item.type === 'makeup') {
        typeLabel = '补卡申请'
        content = `${item.empName} 提交了 ${dateStr} 的补卡申请，等待您的审批。`
      } else if (item.type === 'leave') {
        typeLabel = '请假申请'
        content = `${item.empName} 提交了 ${dateStr} 起的请假申请，等待您的审批。`
      } else {
        typeLabel = '加班申请'
        content = `${item.empName} 提交了 ${dateStr} 的加班申请，等待您的审批。`
      }
      approvalTodos.push({
        id: `NOTIF_APPROVAL_${employeeId}_${index}`,
        type: NOTIFICATION_TYPES.APPROVAL_TODO,
        category: TYPE_TO_CATEGORY[NOTIFICATION_TYPES.APPROVAL_TODO],
        employeeId,
        title: `待审核：${typeLabel}`,
        content,
        date: dateStr,
        extra: {
          applicantId: item.empId,
          applicantName: item.empName,
          requestType: item.type,
          date: dateStr,
          requestId: `${item.type.toUpperCase()}${index}`
        },
        createdAt: item.date.toISOString(),
        status: 'unread',
        actionable: true,
        actionType: 'approve',
        actionLabel: '去审批'
      })
    })
  }

  const results = [
    { type: 'makeup', approved: true, date: new Date(today.getTime() - 7 * 24 * 3600 * 1000) },
    { type: 'leave', approved: false, date: new Date(today.getTime() - 10 * 24 * 3600 * 1000) }
  ]
  results.forEach((item, index) => {
    const dateStr = item.date.toISOString().split('T')[0]
    let notifType
    let title
    let content
    if (item.type === 'makeup') {
      notifType = item.approved ? NOTIFICATION_TYPES.MAKEUP_APPROVED : NOTIFICATION_TYPES.MAKEUP_REJECTED
      title = item.approved ? '补卡申请已通过' : '补卡申请已拒绝'
      content = item.approved
        ? `您 ${dateStr} 的补卡申请已通过审批。`
        : `您 ${dateStr} 的补卡申请已被拒绝，请查看详情了解原因。`
    } else {
      notifType = item.approved ? NOTIFICATION_TYPES.LEAVE_APPROVED : NOTIFICATION_TYPES.LEAVE_REJECTED
      title = item.approved ? '请假申请已通过' : '请假申请已拒绝'
      content = item.approved
        ? `您 ${dateStr} 起的请假申请已通过审批。`
        : `您 ${dateStr} 起的请假申请已被拒绝，请查看详情了解原因。`
    }
    notifications.push({
      id: `NOTIF_RESULT_${employeeId}_${index}`,
      type: notifType,
      category: TYPE_TO_CATEGORY[notifType],
      employeeId,
      title,
      content,
      date: dateStr,
      extra: {
        date: dateStr,
        requestType: item.type,
        approved: item.approved
      },
      createdAt: item.date.toISOString(),
      status: 'read',
      actionable: false
    })
  })

  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return notifications
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    readStatus: {}
  }),

  getters: {
    allNotifications: (state) => state.notifications,

    getNotificationsByEmployee: (state) => (employeeId) => {
      return state.notifications.filter(n => n.employeeId === employeeId)
    },

    getUnreadCount: (state) => (employeeId) => {
      return state.notifications.filter(
        n => n.employeeId === employeeId && n.status === 'unread'
      ).length
    },

    getUnreadCountByCategory: (state) => (employeeId, category) => {
      return state.notifications.filter(
        n => n.employeeId === employeeId && n.status === 'unread' && n.category === category
      ).length
    },

    getNotificationsByCategory: (state) => (employeeId, category) => {
      return state.notifications.filter(n => n.employeeId === employeeId && n.category === category)
    },

    getPendingApprovalCount: (state) => (employeeId) => {
      return state.notifications.filter(
        n => n.employeeId === employeeId && n.type === NOTIFICATION_TYPES.APPROVAL_TODO && n.status === 'unread'
      ).length
    },

    getCategoryStats: (state) => (employeeId) => {
      const stats = {}
      Object.values(NOTIFICATION_CATEGORIES).forEach(cat => {
        stats[cat] = {
          total: 0,
          unread: 0
        }
      })
      state.notifications
        .filter(n => n.employeeId === employeeId)
        .forEach(n => {
          if (stats[n.category]) {
            stats[n.category].total++
            if (n.status === 'unread') {
              stats[n.category].unread++
            }
          }
        })
      return stats
    }
  },

  actions: {
    initNotifications() {
      const stored = getNotifications()
      if (stored.length === 0) {
        const allNotifications = []
        const employeeIds = ['E001', 'E002', 'E003', 'E004', 'E005', 'E006', 'E007', 'E008', 'E009', 'E010']
        employeeIds.forEach(empId => {
          const notifs = generateMockNotifications(empId)
          allNotifications.push(...notifs)
        })
        this.notifications = allNotifications
        this.saveNotificationsToStorage()
      } else {
        this.notifications = stored
      }

      this.readStatus = getNotificationReadStatus()
    },

    saveNotificationsToStorage() {
      setNotifications(this.notifications)
    },

    saveReadStatusToStorage() {
      setNotificationReadStatus(this.readStatus)
    },

    markAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification && notification.status === 'unread') {
        notification.status = 'read'
        notification.readAt = getNow()
        this.saveNotificationsToStorage()
      }
    },

    markAsUnread(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification && notification.status === 'read') {
        notification.status = 'unread'
        notification.readAt = null
        this.saveNotificationsToStorage()
      }
    },

    markAllAsRead(employeeId) {
      this.notifications
        .filter(n => n.employeeId === employeeId && n.status === 'unread')
        .forEach(n => {
          n.status = 'read'
          n.readAt = getNow()
        })
      this.saveNotificationsToStorage()
    },

    markCategoryAsRead(employeeId, category) {
      this.notifications
        .filter(n => n.employeeId === employeeId && n.category === category && n.status === 'unread')
        .forEach(n => {
          n.status = 'read'
          n.readAt = getNow()
        })
      this.saveNotificationsToStorage()
    },

    batchMarkAsRead(notificationIds) {
      notificationIds.forEach(id => {
        const notification = this.notifications.find(n => n.id === id)
        if (notification && notification.status === 'unread') {
          notification.status = 'read'
          notification.readAt = getNow()
        }
      })
      this.saveNotificationsToStorage()
    },

    addNotification(notification) {
      const newNotification = {
        id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'unread',
        createdAt: getNow(),
        ...notification
      }
      this.notifications.unshift(newNotification)
      this.saveNotificationsToStorage()
      return newNotification
    },

    removeNotification(notificationId) {
      const index = this.notifications.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        this.notifications.splice(index, 1)
        this.saveNotificationsToStorage()
      }
    },

    batchRemove(notificationIds) {
      this.notifications = this.notifications.filter(n => !notificationIds.includes(n.id))
      this.saveNotificationsToStorage()
    },

    filterNotifications(employeeId, filters = {}) {
      let result = this.notifications.filter(n => n.employeeId === employeeId)

      if (filters.category) {
        result = result.filter(n => n.category === filters.category)
      }

      if (filters.type) {
        result = result.filter(n => n.type === filters.type)
      }

      if (filters.status) {
        result = result.filter(n => n.status === filters.status)
      }

      if (filters.startDate) {
        result = result.filter(n => n.date >= filters.startDate)
      }

      if (filters.endDate) {
        result = result.filter(n => n.date <= filters.endDate)
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        result = result.filter(
          n => n.title.toLowerCase().includes(keyword) || n.content.toLowerCase().includes(keyword)
        )
      }

      return result
    },

    generateLateNotification(employeeId, date, checkInTime) {
      const notification = {
        type: NOTIFICATION_TYPES.LATE,
        category: NOTIFICATION_CATEGORIES.ABNORMAL,
        employeeId,
        title: '迟到提醒',
        content: `您于 ${date} 上班迟到，请关注考勤情况，如有特殊情况请及时提交补卡申请。`,
        date,
        extra: { date, checkInTime },
        actionable: true,
        actionType: 'makeup',
        actionLabel: '申请补卡'
      }
      return this.addNotification(notification)
    },

    generateAbsentNotification(employeeId, date) {
      const notification = {
        type: NOTIFICATION_TYPES.ABSENT,
        category: NOTIFICATION_CATEGORIES.ABNORMAL,
        employeeId,
        title: '缺卡提醒',
        content: `您于 ${date} 未打卡，请及时核实情况，如有特殊情况请提交补卡或请假申请。`,
        date,
        extra: { date },
        actionable: true,
        actionType: 'makeup',
        actionLabel: '申请补卡'
      }
      return this.addNotification(notification)
    },

    generateApprovalNotification(approverId, applicantName, requestType, date, requestId) {
      const typeLabels = {
        makeup: '补卡申请',
        leave: '请假申请',
        overtime: '加班申请'
      }
      const typeLabel = typeLabels[requestType] || requestType
      const notification = {
        type: NOTIFICATION_TYPES.APPROVAL_TODO,
        category: NOTIFICATION_CATEGORIES.APPROVAL,
        employeeId: approverId,
        title: `待审核：${typeLabel}`,
        content: `${applicantName} 提交了 ${date} 的${typeLabel}，等待您的审批。`,
        date,
        extra: {
          applicantName,
          requestType,
          date,
          requestId
        },
        actionable: true,
        actionType: 'approve',
        actionLabel: '去审批'
      }
      return this.addNotification(notification)
    }
  }
})
