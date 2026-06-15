import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/checkin'
  },
  {
    path: '/checkin',
    name: 'CheckIn',
    component: () => import('@/views/CheckIn.vue'),
    meta: {
      title: '打卡',
      icon: '📍'
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('@/views/Calendar.vue'),
    meta: {
      title: '月历统计',
      icon: '📅'
    }
  },
  {
    path: '/dept-board',
    name: 'DeptBoard',
    component: () => import('@/views/DeptBoard.vue'),
    meta: {
      title: '部门看板',
      icon: '📊'
    }
  },
  {
    path: '/makeup',
    name: 'Makeup',
    component: () => import('@/views/Makeup.vue'),
    meta: {
      title: '补卡申请',
      icon: '📝'
    }
  },
  {
    path: '/leave',
    name: 'Leave',
    component: () => import('@/views/Leave.vue'),
    meta: {
      title: '请假申请',
      icon: '🏖️'
    }
  },
  {
    path: '/overtime',
    name: 'Overtime',
    component: () => import('@/views/Overtime.vue'),
    meta: {
      title: '加班申请',
      icon: '⏱️'
    }
  },
  {
    path: '/business-trip',
    name: 'BusinessTrip',
    component: () => import('@/views/BusinessTrip.vue'),
    meta: {
      title: '出差申请',
      icon: '✈️'
    }
  },
  {
    path: '/business-trip-approve',
    name: 'BusinessTripApprove',
    component: () => import('@/views/BusinessTripApprove.vue'),
    meta: {
      title: '出差审批',
      icon: '📝',
      requiresApprover: true
    }
  },
  {
    path: '/business-trip-checkin',
    name: 'BusinessTripCheckin',
    component: () => import('@/views/BusinessTripCheckin.vue'),
    meta: {
      title: '出差签到',
      icon: '📍'
    }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/Schedule.vue'),
    meta: {
      title: '排班管理',
      icon: '📋'
    }
  },
  {
    path: '/vacation',
    name: 'Vacation',
    component: () => import('@/views/VacationAccount.vue'),
    meta: {
      title: '我的假期',
      icon: '🎫'
    }
  },
  {
    path: '/vacation-manage',
    name: 'VacationManage',
    component: () => import('@/views/VacationManage.vue'),
    meta: {
      title: '假期管理',
      icon: '⚙️',
      requiresAdmin: true
    }
  },
  {
    path: '/notifications',
    name: 'NotificationCenter',
    component: () => import('@/views/NotificationCenter.vue'),
    meta: {
      title: '消息中心',
      icon: '🔔'
    }
  },
  {
    path: '/org-structure',
    name: 'OrgStructure',
    component: () => import('@/views/OrgStructure.vue'),
    meta: {
      title: '组织架构',
      icon: '🏢',
      requiresAdmin: true
    }
  },
  {
    path: '/position-manage',
    name: 'PositionManage',
    component: () => import('@/views/PositionManage.vue'),
    meta: {
      title: '岗位职级',
      icon: '💼',
      requiresAdmin: true
    }
  },
  {
    path: '/employee-admin',
    name: 'EmployeeAdmin',
    component: () => import('@/views/EmployeeAdmin.vue'),
    meta: {
      title: '员工档案',
      icon: '👥',
      requiresAdmin: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '考勤管理系统'} - 考勤管理系统`
  next()
})

export default router
