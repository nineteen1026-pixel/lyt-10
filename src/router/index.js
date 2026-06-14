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
