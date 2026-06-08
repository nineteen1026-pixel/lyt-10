<template>
  <Transition name="toast">
    <div v-if="toast.show" class="toast-container" :class="toast.type">
      <span class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useAttendanceStore } from '@/store/attendance'

const attendanceStore = useAttendanceStore()

const toast = computed(() => attendanceStore.toast)

const icon = computed(() => {
  switch (toast.value.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '!'
    default:
      return 'ℹ'
  }
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  max-width: 90vw;
}

.toast-container.success {
  border-left: 4px solid #52c41a;
}

.toast-container.error {
  border-left: 4px solid #f5222d;
}

.toast-container.warning {
  border-left: 4px solid #fa8c16;
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.success .toast-icon {
  background: #52c41a;
}

.error .toast-icon {
  background: #f5222d;
}

.warning .toast-icon {
  background: #fa8c16;
}

.toast-message {
  font-size: 14px;
  color: #333;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
