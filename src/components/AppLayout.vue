<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">⏰</span>
          <h1 class="logo-text">考勤管理系统</h1>
        </div>
        <div class="user-info" @click="showUserSelect = !showUserSelect">
          <span class="user-avatar">{{ currentUser?.avatar || '👤' }}</span>
          <div class="user-detail">
            <span class="user-name">{{ currentUser?.name || '未登录' }}</span>
            <span class="user-dept">{{ currentUser?.department || '' }}</span>
          </div>
          <span class="user-arrow">▼</span>
        </div>
        <div v-if="showUserSelect" class="user-select-dropdown">
          <div class="dropdown-title">切换用户</div>
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
    </header>

    <nav class="app-nav">
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

    <AppToast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEmployeeStore } from '@/store/employee'
import AppToast from './AppToast.vue'

const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()

const showUserSelect = ref(false)

const currentUser = computed(() => employeeStore.currentUser)
const employees = computed(() => employeeStore.employees)

const navRoutes = computed(() => {
  return router.options.routes.filter(r => r.meta && r.meta.title)
})

function switchUser(emp) {
  employeeStore.setCurrentUser(emp)
  showUserSelect.value = false
}

function handleClickOutside(e) {
  if (showUserSelect.value && !e.target.closest('.user-info') && !e.target.closest('.user-select-dropdown')) {
    showUserSelect.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
}

.user-avatar {
  font-size: 28px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
}

.user-dept {
  font-size: 12px;
  opacity: 0.85;
}

.user-arrow {
  font-size: 10px;
  opacity: 0.7;
}

.user-select-dropdown {
  position: absolute;
  top: 100%;
  right: 20px;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 101;
  color: #333;
}

.dropdown-title {
  padding: 12px 16px;
  font-size: 13px;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: #f0f7ff;
}

.item-avatar {
  font-size: 24px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.item-dept {
  font-size: 12px;
  color: #999;
}

.item-check {
  color: #52c41a;
  font-weight: bold;
}

.app-nav {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 64px;
  z-index: 50;
}

.app-nav::before {
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

.nav-item:hover {
  color: #667eea;
}

.nav-item:hover::before {
  width: 60%;
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

.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px;
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

  .app-nav {
    display: flex;
    justify-content: space-around;
  }

  .nav-item {
    flex: 1;
    justify-content: center;
    padding: 12px 8px;
    font-size: 13px;
  }

  .nav-text {
    display: block;
  }

  .app-main {
    padding: 16px;
  }

  .user-select-dropdown {
    right: 10px;
    min-width: 260px;
  }
}

@media (max-width: 480px) {
  .nav-text {
    display: none;
  }

  .nav-icon {
    font-size: 20px;
  }
}
</style>
