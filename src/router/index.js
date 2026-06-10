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
