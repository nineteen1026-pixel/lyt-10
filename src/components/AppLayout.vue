<template>
  <div class="app-layout" :class="{ 'is-mobile': isMobile }">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">⏰</span>
          <h1 class="logo-text">考勤管理系统</h1>
        </div>
        <div class="header-actions">
          <router-link to="/notifications" class="notification-btn">
            <span class="notification-icon">🔔</span>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </router-link>
          <div class="user-info" @click="toggleUserSelect">
            <span class="user-avatar">{{ currentUser?.avatar || '👤' }}</span>
            <div class="user-detail">
              <span class="user-name">{{ currentUser?.name || '未登录' }}</span>
              <span class="user-dept">{{ currentUser?.department || '' }}</span>
            </div>
            <span class="user-arrow" :class="{ 'is-open': showUserSelect }">▼</span>
          </div>
        </div>
        <Transition name="dropdown">
          <div v-if="showUserSelect" class="user-select-dropdown" @click.stop>
            <div class="dropdown-title">切换用户</div>
            <div class="dropdown-list">
              <div
                v-for="emp in employees"
                :key="emp.id"
                class="dropdown-item"
                :class="{ active: emp.id === currentUser?.id }"
                @click="switchUser(emp)"
              >
                <span class="item-avatar">{{ emp.avatar }}</span>
                <div class="item-info">
                  <span class="item-name">{{ emp.name }}</span>
                  <span class="item-dept">{{ emp.department }}</span>
                </div>
                <span v-if="emp.id === currentUser?.id" class="item-check">✓</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </header>

    <nav class="app-nav desktop-nav">
      <router-link
        v-for="route in navRoutes"
        :key="route.path"
        :to="route.path"
        class="nav-item"
        :class="{ active: route.path === $route.path }"
      >
        <span class="nav-icon">{{ route.meta.icon }}</span>
        <span class="nav-text">{{ route.meta.title }}</span>
      </router-link>
    </nav>

    <main class="app-main">
      <slot></slot>
    </main>

    <nav class="mobile-nav">
      <router-link
        v-for="route in navRoutes"
        :key="route.path"
        :to="route.path"
        class="mobile-nav-item"
        :class="{ active: route.path === $route.path }"
      >
        <span class="mobile-nav-icon">{{ route.meta.icon }}</span>
        <span class="mobile-nav-text">{{ route.meta.title }}</span>
      </router-link>
    </nav>

    <div v-if="showUserSelect" class="dropdown-overlay" @click="showUserSelect = false"></div>

    <AppToast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/store/employee'
import { useNotificationStore } from '@/store/notification'
import AppToast from './AppToast.vue'

const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()
const notificationStore = useNotificationStore()

const showUserSelect = ref(false)
const isMobile = ref(false)

const currentUser = computed(() => employeeStore.currentUser)
const employees = computed(() => employeeStore.employees)

const unreadCount = computed(() => {
  if (!currentUser.value) return 0
  return notificationStore.getUnreadCount(currentUser.value.id)
})

const isAdmin = computed(() => {
  if (!currentUser.value?.roles) return false
  return currentUser.value.roles.includes('manager') || 
         currentUser.value.roles.includes('hr') ||
         currentUser.value.roles.includes('supervisor')
})

const isApprover = computed(() => {
  if (!currentUser.value?.roles) return false
  return currentUser.value.roles.includes('supervisor') ||
         currentUser.value.roles.includes('manager') ||
         currentUser.value.roles.includes('hr')
})

const navRoutes = computed(() => {
  return router.options.routes.filter(r => {
    if (!r.meta || !r.meta.title) return false
    if (r.meta.requiresAdmin && !isAdmin.value) return false
    if (r.meta.requiresApprover && !isApprover.value) return false
    return true
  })
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function toggleUserSelect(e) {
  e.stopPropagation()
  showUserSelect.value = !showUserSelect.value
}

function switchUser(emp) {
  employeeStore.setCurrentUser(emp)
  showUserSelect.value = false
}

function handleClickOutside(e) {
  if (showUserSelect.value && !e.target.closest('.user-info') && !e.target.closest('.user-select-dropdown')) {
    showUserSelect.value = false
  }
}

function handleResize() {
  checkMobile()
}

onMounted(() => {
  checkMobile()
  notificationStore.initNotifications()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  -webkit-tap-highlight-color: transparent;
}

.app-layout.is-mobile {
  padding-bottom: 60px;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.logo-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
  color: white;
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.notification-btn:active {
  background: rgba(255, 255, 255, 0.25);
}

.notification-icon {
  font-size: 20px;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ff4d4f;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid #667eea;
  box-sizing: content-box;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

.user-info:active {
  background: rgba(255, 255, 255, 0.25);
}

.user-avatar {
  font-size: 24px;
  flex-shrink: 0;
}

.user-detail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
}

.user-dept {
  font-size: 11px;
  opacity: 0.85;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-arrow {
  font-size: 9px;
  opacity: 0.7;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.user-arrow.is-open {
  transform: rotate(180deg);
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.3);
}

.user-select-dropdown {
  position: fixed;
  top: 60px;
  right: 16px;
  left: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-height: 70vh;
  overflow-y: auto;
  z-index: 101;
  color: #333;
  -webkit-overflow-scrolling: touch;
}

.dropdown-title {
  padding: 16px 20px;
  font-size: 14px;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  position: sticky;
  top: 0;
  background: white;
}

.dropdown-list {
  max-height: calc(70vh - 60px);
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
  -webkit-user-select: none;
  user-select: none;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:active,
.dropdown-item.active {
  background: #f0f7ff;
}

.item-avatar {
  font-size: 28px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.item-name {
  font-weight: 500;
  font-size: 15px;
  color: #333;
}

.item-dept {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.item-check {
  color: #52c41a;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.desktop-nav {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 64px;
  z-index: 50;
  flex-shrink: 0;
}

.desktop-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.nav-item {
  max-width: 1200px;
  margin: 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: all 0.3s;
}

.nav-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px 2px 0 0;
  transition: width 0.3s;
}

.nav-item:active {
  background: #f5f7fa;
}

.nav-item.active {
  color: #667eea;
}

.nav-item.active::before {
  width: 60%;
}

.nav-icon {
  font-size: 18px;
}

.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  z-index: 99;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  color: #999;
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  transition: color 0.2s;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

.mobile-nav-item:active {
  background: #f5f7fa;
}

.mobile-nav-item.active {
  color: #667eea;
}

.mobile-nav-icon {
  font-size: 22px;
  line-height: 1;
}

.mobile-nav-text {
  font-size: 10px;
  white-space: nowrap;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (min-width: 769px) {
  .user-info:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .user-select-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    left: auto;
    margin-top: 8px;
    min-width: 280px;
    max-height: 400px;
  }

  .dropdown-item:hover {
    background: #f0f7ff;
  }

  .nav-item:hover {
    color: #667eea;
  }

  .nav-item:hover::before {
    width: 60%;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 10px 16px;
  }

  .logo-text {
    font-size: 16px;
  }

  .user-detail {
    display: none;
  }

  .user-info {
    padding: 4px 8px;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-nav {
    display: flex;
  }

  .app-main {
    padding: 16px 14px;
  }

  .app-layout.is-mobile .app-main {
    padding-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .logo-text {
    font-size: 15px;
  }

  .user-select-dropdown {
    top: 56px;
    right: 12px;
    left: 12px;
  }

  .dropdown-title {
    padding: 14px 16px;
  }

  .dropdown-item {
    padding: 12px 16px;
  }

  .mobile-nav-item {
    padding: 6px 2px;
  }

  .mobile-nav-icon {
    font-size: 20px;
  }
}

@media (max-width: 360px) {
  .logo-text {
    font-size: 14px;
  }

  .logo-icon {
    font-size: 20px;
  }

  .user-avatar {
    font-size: 22px;
  }
}
</style>
