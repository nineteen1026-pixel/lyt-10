<template>
  <div class="vacation-page">
    <div class="page-header">
      <h2 class="page-title">假期账户</h2>
      <p class="page-subtitle">查看假期余额与使用记录</p>
    </div>

    <div v-if="expiringNotifications.length > 0" class="notification-banner">
      <div class="notification-icon">⚠️</div>
      <div class="notification-content">
        <div class="notification-title">假期即将过期提醒</div>
        <div v-for="(notify, index) in expiringNotifications" :key="index" class="notification-item">
          {{ notify.message }}
        </div>
      </div>
    </div>

    <div class="balance-cards">
      <div class="balance-card annual">
        <div class="card-icon">🏖️</div>
        <div class="card-content">
          <div class="card-label">年假余额</div>
          <div class="card-balance">
            <span class="balance-number">{{ annualBalance.available }}</span>
            <span class="balance-unit">天</span>
          </div>
          <div class="card-detail">
            <span>总计 {{ annualBalance.total }} 天</span>
            <span>已用 {{ annualBalance.used }} 天</span>
            <span v-if="annualBalance.pending > 0">待批 {{ annualBalance.pending }} 天</span>
          </div>
        </div>
        <div class="seniority-info">
          <div class="seniority-years">{{ workYears }} 年工龄</div>
          <div class="seniority-days">年标准 {{ annualStandardDays }} 天</div>
        </div>
      </div>

      <div class="balance-card lieu">
        <div class="card-icon">⏰</div>
        <div class="card-content">
          <div class="card-label">调休余额</div>
          <div class="card-balance">
            <span class="balance-number">{{ lieuBalance.available }}</span>
            <span class="balance-unit">天</span>
          </div>
          <div class="card-detail">
            <span>总计 {{ lieuBalance.total }} 天</span>
            <span>已用 {{ lieuBalance.used }} 天</span>
            <span v-if="lieuBalance.pending > 0">待批 {{ lieuBalance.pending }} 天</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">假期额度明细</h4>
        <div class="filter-tabs">
          <span 
            class="tab-item" 
            :class="{ active: activeTab === 'all' }"
            @click="activeTab = 'all'"
          >全部</span>
          <span 
            class="tab-item" 
            :class="{ active: activeTab === 'annual' }"
            @click="activeTab = 'annual'"
          >年假</span>
          <span 
            class="tab-item" 
            :class="{ active: activeTab === 'lieu' }"
            @click="activeTab = 'lieu'"
          >调休</span>
          <span 
            class="tab-item" 
            :class="{ active: activeTab === 'expiring' }"
            @click="activeTab = 'expiring'"
          >即将过期</span>
        </div>
      </div>

      <div v-if="filteredGrants.length === 0" class="empty-state">
        <span class="empty-icon">📋</span>
        <p>暂无假期额度记录</p>
      </div>

      <div v-else class="grants-list">
        <div 
          v-for="grant in filteredGrants" 
          :key="grant.id" 
          class="grant-item"
          :class="{ expired: isExpired(grant.expireDate), warning: getExpirationStatus(grant.expireDate).status === 'warning' }"
        >
          <div class="grant-header">
            <div class="grant-info">
              <span class="grant-type" :style="{ background: getVacationTypeColor(grant.vacationType) + '20', color: getVacationTypeColor(grant.vacationType) }">
                {{ getVacationTypeLabel(grant.vacationType) }}
              </span>
              <span class="grant-desc">{{ grant.description }}</span>
            </div>
            <span class="expire-status" :style="{ color: getExpirationStatus(grant.expireDate).color }">
              {{ getExpirationStatus(grant.expireDate).label }}
            </span>
          </div>
          
          <div class="grant-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ 
                  width: (grant.usedDays / grant.totalDays * 100) + '%',
                  background: getVacationTypeColor(grant.vacationType)
                }"
              ></div>
            </div>
            <div class="progress-labels">
              <span>已用 {{ grant.usedDays }} 天</span>
              <span>剩余 {{ grant.remainingDays }} 天</span>
              <span>共 {{ grant.totalDays }} 天</span>
            </div>
          </div>

          <div class="grant-footer">
            <span class="grant-period">有效期：{{ grant.startDate }} 至 {{ grant.endDate }}</span>
            <span class="grant-expire">到期日：{{ grant.expireDate }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4 class="card-title">账户变动记录</h4>
      </div>

      <div v-if="adjustments.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>暂无变动记录</p>
      </div>

      <div v-else class="adjustments-list">
        <div 
          v-for="adjustment in adjustments.slice(0, 20)" 
          :key="adjustment.id" 
          class="adjustment-item"
        >
          <div class="adjustment-icon" :class="adjustment.changeType">
            {{ adjustment.changeType === 'add' ? '+' : '-' }}
          </div>
          <div class="adjustment-content">
            <div class="adjustment-info">
              <span class="adjustment-type" :style="{ color: getVacationTypeColor(adjustment.vacationType) }">
                {{ getVacationTypeLabel(adjustment.vacationType) }}
              </span>
              <span class="adjustment-days" :class="adjustment.changeType">
                {{ adjustment.changeType === 'add' ? '+' : '-' }}{{ adjustment.days }}天
              </span>
            </div>
            <div class="adjustment-reason">{{ getAdjustmentReasonLabel(adjustment.reason) }}</div>
            <div class="adjustment-desc" v-if="adjustment.description">{{ adjustment.description }}</div>
          </div>
          <div class="adjustment-meta">
            <div class="adjustment-operator" v-if="adjustment.operator">{{ adjustment.operator }}</div>
            <div class="adjustment-time">{{ adjustment.createdAt }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEmployeeStore } from '@/store/employee'
import { useVacationStore } from '@/store/vacation'
import { 
  VACATION_TYPES, 
  VACATION_TYPE_LABELS, 
  VACATION_TYPE_COLORS,
  calculateWorkYears,
  calculateAnnualLeaveDays,
  isExpired,
  getExpirationStatus,
  getAdjustmentReasonLabel
} from '@/utils/vacation'

const employeeStore = useEmployeeStore()
const vacationStore = useVacationStore()

const activeTab = ref('all')

const currentUser = computed(() => employeeStore.currentUser)

const workYears = computed(() => {
  if (!currentUser.value?.hireDate) return 0
  return calculateWorkYears(currentUser.value.hireDate)
})

const annualStandardDays = computed(() => {
  if (!currentUser.value?.hireDate) return 0
  return calculateAnnualLeaveDays(currentUser.value.hireDate)
})

const annualBalance = computed(() => {
  if (!currentUser.value) return { total: 0, used: 0, pending: 0, available: 0 }
  return vacationStore.getEmployeeBalance(currentUser.value.id, VACATION_TYPES.ANNUAL)
})

const lieuBalance = computed(() => {
  if (!currentUser.value) return { total: 0, used: 0, pending: 0, available: 0 }
  return vacationStore.getEmployeeBalance(currentUser.value.id, VACATION_TYPES.LIEU)
})

const allGrants = computed(() => {
  if (!currentUser.value) return []
  return vacationStore.getEmployeeGrants(currentUser.value.id, null, true)
})

const filteredGrants = computed(() => {
  let grants = allGrants.value
  
  if (activeTab.value === 'annual') {
    grants = grants.filter(g => g.vacationType === VACATION_TYPES.ANNUAL)
  } else if (activeTab.value === 'lieu') {
    grants = grants.filter(g => g.vacationType === VACATION_TYPES.LIEU)
  } else if (activeTab.value === 'expiring') {
    grants = grants.filter(g => {
      const status = getExpirationStatus(g.expireDate)
      return status.status === 'warning' || status.status === 'expired'
    })
  }
  
  return grants
})

const adjustments = computed(() => {
  if (!currentUser.value) return []
  return vacationStore.getEmployeeAdjustments(currentUser.value.id)
})

const expiringNotifications = computed(() => {
  if (!currentUser.value) return []
  return vacationStore.checkAndNotifyExpiring(currentUser.value.id, 30)
})

function getVacationTypeLabel(type) {
  return VACATION_TYPE_LABELS[type] || type
}

function getVacationTypeColor(type) {
  return VACATION_TYPE_COLORS[type] || '#999'
}

onMounted(() => {
  if (currentUser.value) {
    vacationStore.expireAllExpiredGrants()
  }
})
</script>

<style scoped>
.vacation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  text-align: center;
  margin-bottom: 4px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.page-subtitle {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.notification-banner {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%);
  border-radius: 12px;
  border-left: 4px solid #faad14;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #d46b08;
  margin-bottom: 4px;
  font-size: 14px;
}

.notification-item {
  font-size: 13px;
  color: #d46b08;
  line-height: 1.6;
}

.balance-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.balance-card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.balance-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.balance-card.annual::before {
  background: linear-gradient(90deg, #722ed1, #9254de);
}

.balance-card.lieu::before {
  background: linear-gradient(90deg, #1890ff, #40a9ff);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.card-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.card-balance {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.balance-number {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.balance-unit {
  font-size: 14px;
  color: #666;
}

.card-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.card-detail span {
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 8px;
}

.seniority-info {
  position: absolute;
  top: 18px;
  right: 18px;
  text-align: right;
}

.seniority-years {
  font-size: 13px;
  font-weight: 600;
  color: #722ed1;
}

.seniority-days {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.card {
  background: white;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header .card-title {
  margin: 0;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: #f5f7fa;
  padding: 4px;
  border-radius: 10px;
  flex-wrap: wrap;
}

.tab-item {
  padding: 6px 12px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab-item.active {
  background: white;
  color: #667eea;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 32px 24px;
  color: #999;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.grants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grant-item {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.15s;
  background: white;
}

.grant-item.warning {
  border-color: #ffd591;
  background: #fffbe6;
}

.grant-item.expired {
  border-color: #ffccc7;
  background: #fff1f0;
  opacity: 0.7;
}

.grant-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 10px;
  flex-wrap: wrap;
}

.grant-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.grant-type {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.grant-desc {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.expire-status {
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.grant-progress {
  margin-bottom: 10px;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.grant-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #999;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}

.adjustments-list {
  display: flex;
  flex-direction: column;
}

.adjustment-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.adjustment-item:last-child {
  border-bottom: none;
}

.adjustment-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.adjustment-icon.add {
  background: #f6ffed;
  color: #52c41a;
}

.adjustment-icon.deduct {
  background: #fff1f0;
  color: #f5222d;
}

.adjustment-content {
  flex: 1;
  min-width: 0;
}

.adjustment-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.adjustment-type {
  font-size: 12px;
  font-weight: 600;
}

.adjustment-days {
  font-size: 16px;
  font-weight: 700;
}

.adjustment-days.add {
  color: #52c41a;
}

.adjustment-days.deduct {
  color: #f5222d;
}

.adjustment-reason {
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
}

.adjustment-desc {
  font-size: 12px;
  color: #999;
}

.adjustment-meta {
  text-align: right;
  flex-shrink: 0;
}

.adjustment-operator {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.adjustment-time {
  font-size: 11px;
  color: #999;
}

@media (min-width: 769px) {
  .tab-item:hover {
    color: #667eea;
  }

  .grant-item:hover {
    border-color: #667eea;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  }
}

@media (max-width: 768px) {
  .vacation-page {
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
  }

  .balance-cards {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 16px;
    border-radius: 12px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .grant-footer {
    flex-direction: column;
    gap: 4px;
  }

  .adjustment-item {
    flex-wrap: wrap;
  }

  .adjustment-meta {
    width: 100%;
    text-align: left;
    padding-top: 8px;
    border-top: 1px dashed #f0f0f0;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 18px;
  }

  .page-subtitle {
    font-size: 12px;
  }

  .card {
    padding: 14px;
  }

  .card-title {
    font-size: 14px;
  }

  .balance-number {
    font-size: 28px;
  }
}
</style>
