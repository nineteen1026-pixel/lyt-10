<template>
  <div class="notification-center">
    <div class="page-header">
      <h2 class="page-title">消息通知中心</h2>
      <p class="page-subtitle">集中查看考勤异常、待办事项、审批消息与组织调整通知</p>
    </div>

    <div class="stats-row">
      <div
        v-for="cat in categoryList"
        :key="cat.key"
        class="stat-card"
        :class="{ active: activeCategory === cat.key }"
        @click="switchCategory(cat.key)"
      >
        <div class="stat-icon" :style="{ background: cat.bgColor }">
          <span>{{ cat.icon }}</span>
        </div>
        <div class="stat-info">
          <div class="stat-label">{{ cat.label }}</div>
          <div class="stat-value">
            {{ categoryStats[cat.key]?.total || 0 }}
            <span v-if="categoryStats[cat.key]?.unread > 0" class="stat-badge">
              {{ categoryStats[cat.key]?.unread }} 条未读
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="filter-item">
            <label class="filter-label">通知类型</label>
            <select v-model="filters.notifyType" class="filter-select">
              <option value="">全部</option>
              <option value="late">迟到</option>
              <option value="absent">缺卡</option>
              <option value="makeup">补卡</option>
              <option value="leave">请假</option>
              <option value="overtime">加班</option>
              <option value="approval">待审核</option>
              <option value="org">组织调整</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">状态</label>
            <select v-model="filters.status" class="filter-select">
              <option value="">全部</option>
              <option value="unread">未读</option>
              <option value="read">已读</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">开始日期</label>
            <input v-model="filters.startDate" type="date" class="filter-input" />
          </div>
          <div class="filter-item">
            <label class="filter-label">结束日期</label>
            <input v-model="filters.endDate" type="date" class="filter-input" />
          </div>
        </div>
        <div class="filter-right">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="filters.keyword"
              type="text"
              class="search-input"
              placeholder="搜索消息..."
            />
          </div>
        </div>
      </div>

      <div class="batch-bar" v-if="filteredNotifications.length > 0">
        <div class="batch-left">
          <label class="checkbox-wrapper">
            <input
              type="checkbox"
              :checked="selectAll"
              @change="handleSelectAll"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">全选</span>
          </label>
          <span class="selected-count">已选 {{ selectedIds.length }} 条</span>
        </div>
        <div class="batch-right">
          <button
            class="btn btn-outline"
            :disabled="selectedIds.length === 0"
            @click="handleBatchMarkRead"
          >
            标记已读
          </button>
          <button
            class="btn btn-outline btn-danger"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            删除
          </button>
          <button class="btn btn-link" @click="handleMarkAllRead">
            全部标为已读
          </button>
        </div>
      </div>

      <div class="notification-list" v-if="filteredNotifications.length > 0">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="notification-item"
          :class="{
            unread: notification.status === 'unread',
            selected: selectedIds.includes(notification.id)
          }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notif-checkbox" @click.stop="toggleSelect(notification.id)">
            <label class="checkbox-wrapper">
              <input
                type="checkbox"
                :checked="selectedIds.includes(notification.id)"
                @change="toggleSelect(notification.id)"
              />
              <span class="checkbox-custom"></span>
            </label>
          </div>

          <div class="notif-icon" :style="{ background: getTypeBgColor(notification.type) }">
            <span>{{ getTypeIcon(notification.type) }}</span>
          </div>

          <div class="notif-content">
            <div class="notif-header">
              <span class="notif-title">{{ notification.title }}</span>
              <span class="notif-date">{{ formatDate(notification.createdAt) }}</span>
            </div>
            <p class="notif-text">{{ notification.content }}</p>
            <div class="notif-footer">
              <span class="notif-type-tag" :style="{ color: getTypeColor(notification.type), background: getTypeLightBg(notification.type) }">
                {{ getTypeLabel(notification.type) }}
              </span>
              <span v-if="notification.status === 'unread'" class="unread-dot"></span>
            </div>
          </div>

          <div class="notif-actions" @click.stop>
            <button
              v-if="notification.actionable"
              class="btn btn-primary btn-sm"
              @click="handleAction(notification)"
            >
              {{ notification.actionLabel }}
            </button>
            <button class="btn-icon" :title="notification.status === 'unread' ? '标记已读' : '标记未读'" @click="toggleReadStatus(notification)">
              {{ notification.status === 'unread' ? '✓' : '↩' }}
            </button>
            <button class="btn-icon btn-danger" title="删除" @click="handleDelete(notification.id)">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无消息</p>
        <p class="empty-desc">当前筛选条件下没有找到相关消息</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_COLORS, NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_LABELS } from '@/store/notification'
import { useEmployeeStore } from '@/store/employee'

const router = useRouter()
const notificationStore = useNotificationStore()
const employeeStore = useEmployeeStore()

const activeCategory = ref('')
const selectedIds = ref([])

const filters = ref({
  notifyType: '',
  status: '',
  startDate: '',
  endDate: '',
  keyword: ''
})

const NOTIFY_TYPE_TO_TYPES = {
  late: [NOTIFICATION_TYPES.LATE],
  absent: [NOTIFICATION_TYPES.ABSENT],
  makeup: [NOTIFICATION_TYPES.MAKEUP_PENDING, NOTIFICATION_TYPES.MAKEUP_APPROVED, NOTIFICATION_TYPES.MAKEUP_REJECTED],
  leave: [NOTIFICATION_TYPES.LEAVE_PENDING, NOTIFICATION_TYPES.LEAVE_APPROVED, NOTIFICATION_TYPES.LEAVE_REJECTED],
  overtime: [NOTIFICATION_TYPES.OVERTIME_PENDING, NOTIFICATION_TYPES.OVERTIME_APPROVED, NOTIFICATION_TYPES.OVERTIME_REJECTED],
  approval: [NOTIFICATION_TYPES.APPROVAL_TODO],
  org: [NOTIFICATION_TYPES.DEPT_TRANSFER, NOTIFICATION_TYPES.EMPLOYEE_TRANSFER, NOTIFICATION_TYPES.APPROVER_CHANGED, NOTIFICATION_TYPES.SCHEDULE_MIGRATED]
}

const categoryList = [
  { key: '', label: '全部', icon: '📬', bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { key: NOTIFICATION_CATEGORIES.ABNORMAL, label: '异常提醒', icon: '⚠️', bgColor: 'linear-gradient(135deg, #fa8c16, #f5222d)' },
  { key: NOTIFICATION_CATEGORIES.PENDING, label: '我的待办', icon: '⏳', bgColor: 'linear-gradient(135deg, #faad14, #fa8c16)' },
  { key: NOTIFICATION_CATEGORIES.APPROVAL, label: '待我审核', icon: '📝', bgColor: 'linear-gradient(135deg, #52c41a, #389e0d)' },
  { key: NOTIFICATION_CATEGORIES.ORG, label: '组织调整', icon: '🏢', bgColor: 'linear-gradient(135deg, #722ed1, #eb2f96)' }
]

const currentUser = computed(() => employeeStore.currentUser)

const categoryStats = computed(() => {
  if (!currentUser.value) return {}
  const stats = notificationStore.getCategoryStats(currentUser.value.id)
  const allStats = { total: 0, unread: 0 }
  Object.values(stats).forEach(s => {
    allStats.total += s.total
    allStats.unread += s.unread
  })
  return {
    '': allStats,
    ...stats
  }
})

const filteredNotifications = computed(() => {
  if (!currentUser.value) return []

  const filterParams = { ...filters.value }
  if (activeCategory.value) {
    filterParams.category = activeCategory.value
  }

  let result = notificationStore.filterNotifications(currentUser.value.id, filterParams)

  if (filters.value.notifyType) {
    const targetTypes = NOTIFY_TYPE_TO_TYPES[filters.value.notifyType] || []
    if (targetTypes.length > 0) {
      result = result.filter(n => targetTypes.includes(n.type))
    }
  }

  return result
})

const selectAll = computed({
  get: () => {
    if (filteredNotifications.value.length === 0) return false
    return filteredNotifications.value.every(n => selectedIds.value.includes(n.id))
  },
  set: () => {}
})

function switchCategory(category) {
  activeCategory.value = category
  selectedIds.value = []
}

function getTypeLabel(type) {
  return NOTIFICATION_TYPE_LABELS[type] || type
}

function getTypeIcon(type) {
  return NOTIFICATION_TYPE_ICONS[type] || '📩'
}

function getTypeColor(type) {
  return NOTIFICATION_TYPE_COLORS[type] || '#999'
}

function getTypeBgColor(type) {
  const color = NOTIFICATION_TYPE_COLORS[type] || '#999'
  return color + '20'
}

function getTypeLightBg(type) {
  const color = NOTIFICATION_TYPE_COLORS[type] || '#999'
  return color + '15'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return dateStr.split('T')[0]
  }
}

function toggleSelect(id) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function handleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredNotifications.value.map(n => n.id)
  }
}

function handleNotificationClick(notification) {
  if (notification.status === 'unread') {
    notificationStore.markAsRead(notification.id)
  }
}

function toggleReadStatus(notification) {
  if (notification.status === 'unread') {
    notificationStore.markAsRead(notification.id)
  } else {
    notificationStore.markAsUnread(notification.id)
  }
}

function handleAction(notification) {
  if (notification.status === 'unread') {
    notificationStore.markAsRead(notification.id)
  }

  if (notification.actionType === 'makeup') {
    const query = {}
    if (notification.extra?.date) query.date = notification.extra.date
    if (notification.extra?.type) query.type = notification.extra.type
    if (notification.extra?.requestId) query.requestId = notification.extra.requestId
    router.push({
      path: '/makeup',
      query
    })
  } else if (notification.actionType === 'approve') {
    const query = {}
    if (notification.extra?.requestId) query.requestId = notification.extra.requestId
    if (notification.extra?.requestType) query.requestType = notification.extra.requestType
    if (notification.extra?.applicantId) query.applicantId = notification.extra.applicantId

    if (notification.extra?.requestType === 'makeup') {
      router.push({ path: '/makeup', query })
    } else if (notification.extra?.requestType === 'leave') {
      router.push({ path: '/leave', query })
    } else if (notification.extra?.requestType === 'overtime') {
      router.push({ path: '/overtime', query })
    }
  } else if (notification.actionType === 'view_schedule') {
    router.push({ path: '/schedule' })
  }
}

function handleDelete(id) {
  if (confirm('确定要删除这条消息吗？')) {
    notificationStore.removeNotification(id)
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    }
  }
}

function handleBatchMarkRead() {
  if (selectedIds.value.length === 0) return
  notificationStore.batchMarkAsRead(selectedIds.value)
  selectedIds.value = []
}

function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 条消息吗？`)) {
    notificationStore.batchRemove(selectedIds.value)
    selectedIds.value = []
  }
}

function handleMarkAllRead() {
  if (!currentUser.value) return
  notificationStore.markAllAsRead(currentUser.value.id)
}

onMounted(() => {
  notificationStore.initNotifications()
})
</script>

<style scoped>
.notification-center {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  margin-bottom: 4px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.active {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-badge {
  font-size: 11px;
  font-weight: 500;
  color: #f5222d;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-left {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #595959;
  white-space: nowrap;
}

.filter-select,
.filter-input {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.3s;
  background: white;
}

.filter-select:focus,
.filter-input:focus {
  border-color: #667eea;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 14px;
  opacity: 0.5;
}

.search-input {
  padding: 6px 12px 6px 32px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  width: 200px;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #667eea;
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9f9fc;
  border-radius: 8px;
  margin-bottom: 16px;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.checkbox-wrapper input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  font-size: 13px;
  color: #595959;
}

.selected-count {
  font-size: 13px;
  color: #8c8c8c;
}

.batch-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-outline {
  background: white;
  border: 1px solid #d9d9d9;
  color: #595959;
}

.btn-outline:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.btn-outline.btn-danger:hover:not(:disabled) {
  border-color: #f5222d;
  color: #f5222d;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  padding: 6px 8px;
}

.btn-link:hover {
  color: #764ba2;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
  color: #8c8c8c;
}

.btn-icon:hover {
  background: #e8e8e8;
  color: #595959;
}

.btn-icon.btn-danger:hover {
  background: #fff1f0;
  color: #f5222d;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.notification-item:hover {
  background: #f5f5f5;
}

.notification-item.unread {
  background: #f0f7ff;
  border-color: #d6e4ff;
}

.notification-item.unread:hover {
  background: #e6f0ff;
}

.notification-item.selected {
  border-color: #667eea;
  background: #f0f5ff;
}

.notif-checkbox {
  padding-top: 4px;
}

.notif-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  gap: 12px;
}

.notif-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  flex: 1;
}

.notif-date {
  font-size: 12px;
  color: #bfbfbf;
  white-space: nowrap;
  flex-shrink: 0;
}

.notif-text {
  font-size: 13px;
  color: #595959;
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.notif-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f5222d;
}

.notif-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: #595959;
  margin: 0 0 8px 0;
}

.empty-desc {
  font-size: 13px;
  color: #bfbfbf;
  margin: 0;
}

@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-left {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .batch-bar {
    flex-direction: column;
    gap: 12px;
  }

  .batch-right {
    width: 100%;
    justify-content: space-between;
  }

  .notification-item {
    padding: 12px;
  }

  .notif-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .filter-item {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .notif-actions {
    flex-direction: column;
  }
}
</style>
