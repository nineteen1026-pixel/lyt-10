<template>
  <div class="employee-admin">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">员工档案管理</h2>
        <p class="page-subtitle">管理员工信息档案、岗位调动与人事记录</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openAddModal">
          <span class="btn-icon">➕</span>
          <span>新增员工</span>
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ employeeStats.total }}</div>
          <div class="stat-label">员工总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ employeeStats.active }}</div>
          <div class="stat-label">在职人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-purple">🏢</div>
        <div class="stat-content">
          <div class="stat-value">{{ orgDeptCount }}</div>
          <div class="stat-label">覆盖部门</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">🔄</div>
        <div class="stat-content">
          <div class="stat-value">{{ transferCount }}</div>
          <div class="stat-label">调岗记录</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">🚪</div>
        <div class="stat-content">
          <div class="stat-value">{{ employeeStats.resigning }}</div>
          <div class="stat-label">离职办理中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-red">👋</div>
        <div class="stat-content">
          <div class="stat-value">{{ employeeStats.resigned }}</div>
          <div class="stat-label">已离职</div>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <div class="left-panel card">
        <div class="panel-header">
          <h4 class="panel-title">员工列表</h4>
          <span class="panel-count">共 {{ filteredEmployees.length }} 人</span>
        </div>
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="姓名/工号/手机号/邮箱"
            />
          </div>
          <select v-model="filterDeptId" class="filter-select">
            <option :value="0">全部部门</option>
            <option v-for="dept in flatDepartments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select v-model="filterPositionId" class="filter-select">
            <option :value="0">全部岗位</option>
            <option v-for="pos in sortedPositions" :key="pos.id" :value="pos.id">
              {{ pos.name }}
            </option>
          </select>
          <select v-model="filterStatus" class="filter-select">
            <option value="">全部状态</option>
            <option v-for="s in EMPLOYEE_STATUS" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>
        <div class="employee-list">
          <div v-if="filteredEmployees.length === 0" class="empty-list">
            <span class="empty-icon">👤</span>
            <p>暂无匹配的员工</p>
          </div>
          <div
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="emp-item"
            :class="{ active: selectedEmpId === emp.id }"
            @click="selectEmployee(emp.id)"
          >
            <div class="emp-avatar-wrap">
              <span class="emp-avatar">{{ emp.avatar }}</span>
              <span v-if="emp.status === '试用期'" class="status-dot status-probation"></span>
              <span v-else-if="emp.status === '休假'" class="status-dot status-vacation"></span>
              <span v-else-if="emp.status === '离职中'" class="status-dot status-resigning"></span>
              <span v-else-if="emp.status === '离职' || emp.status === '已离职'" class="status-dot status-left"></span>
              <span v-else class="status-dot status-active"></span>
            </div>
            <div class="emp-info">
              <div class="emp-name-row">
                <span class="emp-name">{{ emp.name }}</span>
                <span class="emp-id">{{ emp.id }}</span>
              </div>
              <div class="emp-meta">
                <span class="meta-item">{{ emp.position }}</span>
                <span class="meta-sep">·</span>
                <span class="meta-item text-light">{{ emp.department }}</span>
              </div>
            </div>
            <div class="emp-role-tags">
              <span
                v-for="role in emp.roles"
                :key="role"
                class="role-mini-tag"
                :title="ROLE_LABELS[role]"
              >
                {{ role === 'hr' ? 'HR' : role === 'manager' ? 'M' : 'S' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-panel card">
        <div v-if="!selectedEmployee" class="empty-detail">
          <span class="empty-icon">📋</span>
          <h3>请选择一位员工</h3>
          <p>从左侧列表中点击查看员工档案</p>
        </div>

        <div v-else class="emp-detail">
          <div class="detail-header">
            <div class="emp-profile">
              <div class="profile-avatar">{{ selectedEmployee.avatar }}</div>
              <div class="profile-info">
                <div class="profile-name-row">
                  <h3 class="profile-name">{{ selectedEmployee.name }}</h3>
                  <span class="status-tag" :class="'status-' + getStatusClass(selectedEmployee.status)">
                    {{ selectedEmployee.status }}
                  </span>
                </div>
                <div class="profile-dept">{{ selectedEmployee.department }} / {{ selectedEmployee.position }}</div>
                <div class="profile-ids">
                  <span class="id-item">工号：{{ selectedEmployee.id }}</span>
                  <span v-if="selectedEmployee.positionId" class="id-item">
                    职级：{{ getLevelLabel(selectedEmployee.positionId) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="detail-actions">
              <button class="btn btn-ghost" @click="openTransferModal">
                <span>🔄 调岗</span>
              </button>
              <button
                v-if="selectedEmployee.status === '在职' || selectedEmployee.status === '试用期'"
                class="btn btn-danger-ghost"
                @click="openResignModal"
              >
                <span>🚪 离职</span>
              </button>
              <button class="btn btn-ghost" @click="openEditModal(selectedEmployee)">
                <span>✏️ 编辑</span>
              </button>
              <button class="btn btn-danger-ghost" @click="confirmDelete(selectedEmployee)">
                <span>🗑️ 删除</span>
              </button>
            </div>
          </div>

          <div class="tab-bar">
            <div
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-item"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </div>
          </div>

          <div v-if="activeTab === 'basic'" class="tab-content">
            <div class="section-title">基本信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ selectedEmployee.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">性别</span>
                <span class="info-value">{{ selectedEmployee.gender || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">出生日期</span>
                <span class="info-value">{{ selectedEmployee.birthday || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">学历</span>
                <span class="info-value">{{ selectedEmployee.education || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">手机号码</span>
                <span class="info-value">{{ selectedEmployee.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">电子邮箱</span>
                <span class="info-value">{{ selectedEmployee.email || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">居住地址</span>
                <span class="info-value">{{ selectedEmployee.address || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">紧急联系人</span>
                <span class="info-value">{{ selectedEmployee.emergencyContact || '-' }}</span>
              </div>
            </div>

            <div class="section-title">工作信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">所属部门</span>
                <span class="info-value highlight">{{ getDeptPath(selectedEmployee.departmentId) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前岗位</span>
                <span class="info-value highlight">{{ selectedEmployee.position }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">入职日期</span>
                <span class="info-value">{{ selectedEmployee.hireDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">司龄</span>
                <span class="info-value">{{ calculateSeniority(selectedEmployee.hireDate) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">员工状态</span>
                <span class="info-value">
                  <span class="status-tag-sm" :class="'status-' + getStatusClass(selectedEmployee.status)">
                    {{ selectedEmployee.status }}
                  </span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">系统角色</span>
                <span class="info-value">
                  <template v-if="selectedEmployee.roles && selectedEmployee.roles.length">
                    <span
                      v-for="role in selectedEmployee.roles"
                      :key="role"
                      class="role-badge"
                    >
                      {{ ROLE_LABELS[role] }}
                    </span>
                  </template>
                  <template v-else>-</template>
                </span>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'transfer'" class="tab-content">
            <div class="section-header-row">
              <div class="section-title">调岗记录</div>
              <button class="btn btn-ghost btn-sm" @click="openTransferModal">
                <span>➕ 新增调岗</span>
              </button>
            </div>
            <div v-if="empTransferRecords.length === 0" class="empty-records">
              <span class="empty-icon">📭</span>
              <p>暂无调岗记录</p>
            </div>
            <div v-else class="timeline">
              <div
                v-for="(record, idx) in empTransferRecords"
                :key="record.id"
                class="timeline-item"
              >
                <div class="timeline-dot" :class="getTransferTypeClass(record.transferType)"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="transfer-type-tag" :class="'type-' + getTransferTypeClass(record.transferType)">
                      {{ record.transferType }}
                    </span>
                    <span class="timeline-date">{{ record.transferDate }}</span>
                  </div>
                  <div class="transfer-path">
                    <div class="path-block from">
                      <div class="path-dept">{{ record.fromDepartment }}</div>
                      <div class="path-pos">{{ record.fromPosition }}</div>
                    </div>
                    <div class="path-arrow">→</div>
                    <div class="path-block to">
                      <div class="path-dept">{{ record.toDepartment }}</div>
                      <div class="path-pos">{{ record.toPosition }}</div>
                    </div>
                  </div>
                  <div v-if="record.reason" class="transfer-reason">
                    <span class="reason-label">调动原因：</span>
                    <span class="reason-text">{{ record.reason }}</span>
                  </div>
                  <div v-if="record.remark" class="transfer-remark">
                    <span class="remark-label">备注：</span>
                    <span class="remark-text">{{ record.remark }}</span>
                  </div>
                  <div class="transfer-operator">
                    操作人：{{ record.operatorName || '系统' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'resignation'" class="tab-content">
            <div class="section-header-row">
              <div class="section-title">离职记录</div>
              <button
                v-if="selectedEmployee.status === '在职' || selectedEmployee.status === '试用期'"
                class="btn btn-ghost btn-sm"
                @click="openResignModal"
              >
                <span>➕ 发起离职</span>
              </button>
            </div>
            <div v-if="empResignationRecords.length === 0" class="empty-records">
              <span class="empty-icon">📭</span>
              <p>暂无离职记录</p>
            </div>
            <div v-else class="timeline">
              <div
                v-for="record in empResignationRecords"
                :key="record.id"
                class="timeline-item"
              >
                <div class="timeline-dot" :class="getResignStatusClass(record.status)"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="resign-status-tag" :class="'status-' + getResignStatusClass(record.status)">
                      {{ record.status === 'pending' ? '待确认' : record.status === 'effective' ? '已生效' : '已撤回' }}
                    </span>
                    <span class="timeline-date">{{ record.applyDate }}</span>
                  </div>
                  <div class="resign-info-row">
                    <span class="resign-label">离职类型：</span>
                    <span class="resign-value">{{ getResignTypeLabel(record.resignationType) }}</span>
                  </div>
                  <div class="resign-info-row">
                    <span class="resign-label">离职原因：</span>
                    <span class="resign-value">{{ getResignReasonLabel(record.resignationReason) }}</span>
                  </div>
                  <div v-if="record.resignationReasonDetail" class="resign-info-row">
                    <span class="resign-label">原因详情：</span>
                    <span class="resign-value">{{ record.resignationReasonDetail }}</span>
                  </div>
                  <div class="resign-info-row">
                    <span class="resign-label">申请日期：</span>
                    <span class="resign-value">{{ record.applyDate }}</span>
                  </div>
                  <div class="resign-info-row">
                    <span class="resign-label">预计最后工作日：</span>
                    <span class="resign-value">{{ record.expectedLastDay }}</span>
                  </div>
                  <div v-if="record.actualLastDay" class="resign-info-row">
                    <span class="resign-label">实际最后工作日：</span>
                    <span class="resign-value">{{ record.actualLastDay }}</span>
                  </div>
                  <div v-if="record.annualLeaveCompensation" class="resign-summary-box">
                    <div class="resign-comp-title">年假补偿结算</div>
                    <div class="resign-compensation-grid">
                      <div class="resign-comp-item">
                        <span class="comp-label">剩余天数</span>
                        <span class="comp-value">{{ record.annualLeaveCompensation.remainingDays }}天</span>
                      </div>
                      <div class="resign-comp-item">
                        <span class="comp-label">日薪标准</span>
                        <span class="comp-value">¥{{ record.annualLeaveCompensation.dailySalary }}</span>
                      </div>
                      <div class="resign-comp-item">
                        <span class="comp-label">可补偿天数</span>
                        <span class="comp-value">{{ record.annualLeaveCompensation.compensableDays }}天</span>
                      </div>
                      <div class="resign-comp-item">
                        <span class="comp-label">补偿总额</span>
                        <span class="comp-value comp-total">¥{{ record.annualLeaveCompensation.totalCompensation }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="record.handoverNotes" class="resign-info-row">
                    <span class="resign-label">工作交接：</span>
                    <span class="resign-value">{{ record.handoverNotes }}</span>
                  </div>
                  <div v-if="record.remark" class="resign-info-row">
                    <span class="resign-label">备注：</span>
                    <span class="resign-value">{{ record.remark }}</span>
                  </div>
                  <div v-if="record.status === 'effective' && record.frozenAt" class="resign-info-row">
                    <span class="resign-label">考勤冻结：</span>
                    <span class="resign-value">{{ new Date(record.frozenAt).toLocaleString() }}</span>
                  </div>
                  <div v-if="record.status === 'effective' && record.settledAt" class="resign-info-row">
                    <span class="resign-label">结算时间：</span>
                    <span class="resign-value">{{ new Date(record.settledAt).toLocaleString() }}</span>
                  </div>
                  <div v-if="record.status === 'pending'" class="resign-action-bar">
                    <button class="btn btn-danger btn-sm" @click="openResignConfirmModal(record.id)">
                      确认生效
                    </button>
                    <button class="btn btn-ghost btn-sm" @click="cancelResignation(record.id)">
                      撤回
                    </button>
                  </div>
                  <div class="transfer-operator">
                    操作人：{{ record.operatorName || '系统' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showEmpModal" class="modal-overlay" @click.self="closeEmpModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEmpEdit ? '编辑员工档案' : '新增员工档案' }}</h3>
            <button class="modal-close" @click="closeEmpModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-section">
              <div class="form-section-title">基本信息</div>
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label required">员工姓名</label>
                  <input v-model="empForm.name" type="text" class="form-input" placeholder="请输入姓名" />
                </div>
                <div class="form-group">
                  <label class="form-label">工号</label>
                  <input v-model="empForm.id" type="text" class="form-input" :placeholder="employeeStore.nextEmployeeId" />
                </div>
                <div class="form-group">
                  <label class="form-label">头像</label>
                  <select v-model="empForm.avatar" class="form-select">
                    <option v-for="a in avatarOptions" :key="a" :value="a">{{ a }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">性别</label>
                  <select v-model="empForm.gender" class="form-select">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="">未填</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">出生日期</label>
                  <input v-model="empForm.birthday" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">学历</label>
                  <select v-model="empForm.education" class="form-select">
                    <option value="">请选择</option>
                    <option v-for="e in EDUCATION_LIST" :key="e.value" :value="e.value">{{ e.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">手机号码</label>
                  <input v-model="empForm.phone" type="tel" class="form-input" placeholder="请输入手机号" />
                </div>
                <div class="form-group">
                  <label class="form-label">电子邮箱</label>
                  <input v-model="empForm.email" type="email" class="form-input" placeholder="请输入邮箱" />
                </div>
                <div class="form-group">
                  <label class="form-label">员工状态</label>
                  <select v-model="empForm.status" class="form-select">
                    <option v-for="s in EMPLOYEE_STATUS" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">居住地址</label>
                  <input v-model="empForm.address" type="text" class="form-input" placeholder="请输入地址" />
                </div>
                <div class="form-group">
                  <label class="form-label">紧急联系人</label>
                  <input v-model="empForm.emergencyContact" type="text" class="form-input" placeholder="姓名 电话" />
                </div>
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">工作信息</div>
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label required">所属部门</label>
                  <select v-model.number="empForm.departmentId" class="form-select">
                    <option :value="0">请选择部门</option>
                    <option v-for="dept in flatDepartments" :key="dept.id" :value="dept.id">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label required">岗位职级</label>
                  <select v-model.number="empForm.positionId" class="form-select">
                    <option :value="0">请选择岗位</option>
                    <option v-for="pos in sortedPositions" :key="pos.id" :value="pos.id">
                      [L{{ pos.level }}] {{ pos.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label required">入职日期</label>
                  <input v-model="empForm.hireDate" type="date" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">系统角色</label>
                <div class="checkbox-group">
                  <label v-for="(label, key) in ROLE_LABELS" :key="key" class="checkbox-item">
                    <input type="checkbox" :value="key" v-model="empForm.roles" />
                    <span>{{ label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeEmpModal">取消</button>
            <button class="btn btn-primary" @click="submitEmpForm">
              {{ isEmpEdit ? '保存修改' : '确认新增' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showTransferModal" class="modal-overlay" @click.self="showTransferModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">员工调岗 - {{ selectedEmployee?.name }}</h3>
            <button class="modal-close" @click="showTransferModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="transfer-info-box">
              <div class="transfer-current">
                <div class="transfer-label">当前信息</div>
                <div class="transfer-dept">{{ selectedEmployee?.department }}</div>
                <div class="transfer-pos">{{ selectedEmployee?.position }}</div>
              </div>
              <div class="transfer-arrow-icon">→</div>
              <div class="transfer-target">
                <div class="transfer-label">调岗后</div>
                <div class="transfer-dept">{{ getDeptName(transferForm.toDepartmentId) || '请选择部门' }}</div>
                <div class="transfer-pos">{{ getPosName(transferForm.toPositionId) || '请选择岗位' }}</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label required">调动类型</label>
              <select v-model="transferForm.transferType" class="form-select">
                <option value="">请选择类型</option>
                <option v-for="t in TRANSFER_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">目标部门</label>
              <select v-model.number="transferForm.toDepartmentId" class="form-select">
                <option :value="0">请选择部门</option>
                <option v-for="dept in flatDepartments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">目标岗位</label>
              <select v-model.number="transferForm.toPositionId" class="form-select">
                <option :value="0">请选择岗位</option>
                <option v-for="pos in sortedPositions" :key="pos.id" :value="pos.id">
                  [L{{ pos.level }}] {{ pos.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">生效日期</label>
              <input v-model="transferForm.transferDate" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">调动原因</label>
              <textarea v-model="transferForm.reason" class="form-textarea" rows="2" placeholder="请输入调动原因"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">备注说明</label>
              <textarea v-model="transferForm.remark" class="form-textarea" rows="2" placeholder="如薪资调整、生效说明等"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showTransferModal = false">取消</button>
            <button class="btn btn-primary" @click="submitTransfer">确认调岗</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">⚠️ 确认删除</h3>
          </div>
          <div class="modal-body">
            <p>确定要删除员工「<strong>{{ deleteTarget?.name }}</strong>」吗？</p>
            <p class="warning-text">⚠️ 此操作不可恢复，员工的所有关联数据将被移除！</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showDeleteConfirm = false">取消</button>
            <button class="btn btn-danger" @click="doDeleteEmployee">确认删除</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showResignModal" class="modal-overlay" @click.self="showResignModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">发起离职 - {{ selectedEmployee?.name }}</h3>
            <button class="modal-close" @click="showResignModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-section">
              <div class="form-section-title">离职信息</div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label required">离职类型</label>
                  <select v-model="resignForm.resignationType" class="form-select">
                    <option value="">请选择类型</option>
                    <option v-for="t in RESIGNATION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label required">离职原因</label>
                  <select v-model="resignForm.resignationReason" class="form-select">
                    <option value="">请选择原因</option>
                    <option v-for="r in RESIGNATION_REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">原因详情</label>
                <textarea v-model="resignForm.resignationReasonDetail" class="form-textarea" rows="2" placeholder="请补充说明离职原因"></textarea>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label required">申请日期</label>
                  <input v-model="resignForm.applyDate" type="date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label required">预计最后工作日</label>
                  <input v-model="resignForm.expectedLastDay" type="date" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">日薪标准</label>
                <input v-model.number="resignForm.dailySalary" type="number" class="form-input" placeholder="0" min="0" />
              </div>
              <div class="form-group">
                <label class="form-label">工作交接说明</label>
                <textarea v-model="resignForm.handoverNotes" class="form-textarea" rows="2" placeholder="请说明工作交接安排"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">备注</label>
                <textarea v-model="resignForm.remark" class="form-textarea" rows="2" placeholder="其他备注信息"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showResignModal = false">取消</button>
            <button class="btn btn-danger" @click="submitResignation">确认发起离职</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showResignConfirmModal" class="modal-overlay" @click.self="showResignConfirmModal = false">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3 class="modal-title">⚠️ 确认离职生效</h3>
            <button class="modal-close" @click="showResignConfirmModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p>确定将员工「<strong>{{ selectedEmployee?.name }}</strong>」标记为离职生效吗？</p>
            <p class="warning-text">⚠️ 生效后将冻结考勤打卡，并结算未休年假补偿</p>
            <div class="form-group">
              <label class="form-label required">实际最后工作日</label>
              <input v-model="resignConfirmActualLastDay" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea v-model="resignConfirmRemark" class="form-textarea" rows="2" placeholder="补充说明"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showResignConfirmModal = false">取消</button>
            <button class="btn btn-danger" @click="confirmResignation">确认生效</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useOrganizationStore } from '@/store/organization'
import { useEmployeeStore } from '@/store/employee'
import {
  ROLE_LABELS,
  LEVEL_LABELS,
  TRANSFER_TYPES,
  RESIGNATION_TYPES,
  RESIGNATION_REASONS,
  EMPLOYEE_STATUS,
  EDUCATION_LIST
} from '@/data/employees'
import { useVacationStore } from '@/store/vacation'

const organizationStore = useOrganizationStore()
const employeeStore = useEmployeeStore()

const searchKeyword = ref('')
const filterDeptId = ref(0)
const filterPositionId = ref(0)
const filterStatus = ref('')
const selectedEmpId = ref(null)
const activeTab = ref('basic')
const showEmpModal = ref(false)
const showTransferModal = ref(false)
const showDeleteConfirm = ref(false)
const showResignModal = ref(false)
const showResignConfirmModal = ref(false)
const isEmpEdit = ref(false)
const deleteTarget = ref(null)
const resignConfirmRecordId = ref(null)
const resignConfirmActualLastDay = ref('')
const resignConfirmRemark = ref('')

const tabs = [
  { key: 'basic', label: '基本档案' },
  { key: 'transfer', label: '调岗记录' },
  { key: 'resignation', label: '离职记录' }
]

const avatarOptions = [
  '👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '👨‍🎨', '👩‍🎨',
  '👨‍🏫', '👩‍🏫', '👨‍🔧', '👩‍🔧', '👨‍⚕️', '👩‍⚕️',
  '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '🧑‍💻', '🧑‍💼'
]

const empForm = reactive({
  id: '',
  name: '',
  avatar: '👨‍💻',
  gender: '',
  birthday: '',
  education: '',
  phone: '',
  email: '',
  status: '在职',
  address: '',
  emergencyContact: '',
  departmentId: 0,
  positionId: 0,
  hireDate: '',
  roles: []
})

const transferForm = reactive({
  transferType: '',
  toDepartmentId: 0,
  toPositionId: 0,
  transferDate: new Date().toISOString().split('T')[0],
  reason: '',
  remark: ''
})

const resignForm = reactive({
  resignationType: '',
  resignationReason: '',
  resignationReasonDetail: '',
  applyDate: '',
  expectedLastDay: '',
  dailySalary: 0,
  handoverNotes: '',
  remark: ''
})

const flatDepartments = computed(() => organizationStore.flatDepartments)
const sortedPositions = computed(() => organizationStore.sortedPositions)
const employeeStats = computed(() => employeeStore.employeeStats)
const orgDeptCount = computed(() => {
  const deptIds = new Set()
  employeeStore.employees.forEach(emp => {
    if (emp.departmentId) deptIds.add(emp.departmentId)
  })
  return deptIds.size
})
const transferCount = computed(() => organizationStore.transferRecords.length)

const filteredEmployees = computed(() => {
  return employeeStore.filteredEmployees({
    departmentId: filterDeptId.value || undefined,
    positionId: filterPositionId.value || undefined,
    status: filterStatus.value || undefined,
    keyword: searchKeyword.value || undefined
  })
})

const selectedEmployee = computed(() => {
  if (!selectedEmpId.value) return null
  return employeeStore.getEmployeeById(selectedEmpId.value)
})

const empTransferRecords = computed(() => {
  if (!selectedEmpId.value) return []
  return organizationStore.getTransferRecordsByEmployee(selectedEmpId.value)
})

const vacationStore = computed(() => useVacationStore())

const empResignationRecords = computed(() => {
  if (!selectedEmpId.value) return []
  return employeeStore.getResignationRecordByEmployee(selectedEmpId.value)
})

function selectEmployee(id) {
  selectedEmpId.value = id
  activeTab.value = 'basic'
}

function getStatusClass(status) {
  const map = {
    '在职': 'active',
    '试用期': 'probation',
    '休假': 'vacation',
    '离职中': 'resigning',
    '离职': 'left',
    '已离职': 'left'
  }
  return map[status] || 'active'
}

function getLevelLabel(positionId) {
  const pos = organizationStore.getPositionById(positionId)
  if (!pos) return '-'
  return `L${pos.level} ${LEVEL_LABELS[pos.level]}`
}

function getDeptPath(deptId) {
  if (!deptId) return '-'
  const path = organizationStore.getDepartmentPath(deptId)
  return path.map(p => p.name).join(' / ')
}

function getDeptName(deptId) {
  if (!deptId) return ''
  const dept = organizationStore.getDepartmentById(deptId)
  return dept ? dept.name : ''
}

function getPosName(posId) {
  if (!posId) return ''
  const pos = organizationStore.getPositionById(posId)
  return pos ? pos.name : ''
}

function calculateSeniority(hireDate) {
  if (!hireDate) return '-'
  const start = new Date(hireDate)
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years === 0 && months === 0) return '不足1个月'
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}年`
  return `${years}年${months}个月`
}

function getTransferTypeClass(type) {
  const map = {
    '晋升': 'promote',
    '降职': 'demote',
    '平调': 'lateral',
    '调动晋升': 'promote',
    '跨部门调动': 'cross',
    '借调': 'temp'
  }
  return map[type] || 'lateral'
}

function openAddModal() {
  isEmpEdit.value = false
  Object.assign(empForm, {
    id: '',
    name: '',
    avatar: '👨‍💻',
    gender: '',
    birthday: '',
    education: '',
    phone: '',
    email: '',
    status: '在职',
    address: '',
    emergencyContact: '',
    departmentId: 0,
    positionId: 0,
    hireDate: new Date().toISOString().split('T')[0],
    roles: []
  })
  showEmpModal.value = true
}

function openEditModal(emp) {
  isEmpEdit.value = true
  Object.assign(empForm, {
    id: emp.id,
    name: emp.name,
    avatar: emp.avatar || '👨‍💻',
    gender: emp.gender || '',
    birthday: emp.birthday || '',
    education: emp.education || '',
    phone: emp.phone || '',
    email: emp.email || '',
    status: emp.status || '在职',
    address: emp.address || '',
    emergencyContact: emp.emergencyContact || '',
    departmentId: emp.departmentId || 0,
    positionId: emp.positionId || 0,
    hireDate: emp.hireDate || '',
    roles: [...(emp.roles || [])]
  })
  showEmpModal.value = true
}

function closeEmpModal() {
  showEmpModal.value = false
}

function submitEmpForm() {
  if (!empForm.name.trim()) {
    alert('请输入员工姓名')
    return
  }
  if (!empForm.departmentId) {
    alert('请选择所属部门')
    return
  }
  if (!empForm.positionId) {
    alert('请选择岗位职级')
    return
  }
  if (!empForm.hireDate) {
    alert('请选择入职日期')
    return
  }

  const dept = organizationStore.getDepartmentById(empForm.departmentId)
  const pos = organizationStore.getPositionById(empForm.positionId)

  if (isEmpEdit.value) {
    employeeStore.updateEmployee(empForm.id, {
      name: empForm.name.trim(),
      avatar: empForm.avatar,
      gender: empForm.gender,
      birthday: empForm.birthday,
      education: empForm.education,
      phone: empForm.phone.trim(),
      email: empForm.email.trim(),
      status: empForm.status,
      address: empForm.address.trim(),
      emergencyContact: empForm.emergencyContact.trim(),
      departmentId: empForm.departmentId,
      department: dept ? dept.name : '',
      positionId: empForm.positionId,
      position: pos ? pos.name : '',
      hireDate: empForm.hireDate,
      roles: empForm.roles
    })
  } else {
    const newId = empForm.id.trim() || employeeStore.nextEmployeeId
    employeeStore.addEmployee({
      id: newId,
      name: empForm.name.trim(),
      avatar: empForm.avatar,
      gender: empForm.gender,
      birthday: empForm.birthday,
      education: empForm.education,
      phone: empForm.phone.trim(),
      email: empForm.email.trim(),
      status: empForm.status,
      address: empForm.address.trim(),
      emergencyContact: empForm.emergencyContact.trim(),
      departmentId: empForm.departmentId,
      department: dept ? dept.name : '',
      positionId: empForm.positionId,
      position: pos ? pos.name : '',
      hireDate: empForm.hireDate,
      roles: empForm.roles
    })
    selectedEmpId.value = newId
  }
  closeEmpModal()
}

function openTransferModal() {
  if (!selectedEmployee.value) return
  Object.assign(transferForm, {
    transferType: '',
    toDepartmentId: selectedEmployee.value.departmentId || 0,
    toPositionId: selectedEmployee.value.positionId || 0,
    transferDate: new Date().toISOString().split('T')[0],
    reason: '',
    remark: ''
  })
  showTransferModal.value = true
}

function submitTransfer() {
  if (!selectedEmployee.value) return
  if (!transferForm.transferType) {
    alert('请选择调动类型')
    return
  }
  if (!transferForm.toDepartmentId) {
    alert('请选择目标部门')
    return
  }
  if (!transferForm.toPositionId) {
    alert('请选择目标岗位')
    return
  }
  if (!transferForm.transferDate) {
    alert('请选择生效日期')
    return
  }

  employeeStore.transferEmployee(selectedEmployee.value.id, { ...transferForm }, organizationStore)
  showTransferModal.value = false
  activeTab.value = 'transfer'
}

function confirmDelete(emp) {
  deleteTarget.value = emp
  showDeleteConfirm.value = true
}

function doDeleteEmployee() {
  if (!deleteTarget.value) return
  employeeStore.removeEmployee(deleteTarget.value.id)
  if (selectedEmpId.value === deleteTarget.value.id) {
    selectedEmpId.value = null
  }
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

function openResignModal() {
  if (!selectedEmployee.value) return
  Object.assign(resignForm, {
    resignationType: '',
    resignationReason: '',
    resignationReasonDetail: '',
    applyDate: new Date().toISOString().split('T')[0],
    expectedLastDay: '',
    dailySalary: 0,
    handoverNotes: '',
    remark: ''
  })
  showResignModal.value = true
}

function submitResignation() {
  if (!selectedEmployee.value) return
  if (!resignForm.resignationType) {
    alert('请选择离职类型')
    return
  }
  if (!resignForm.resignationReason) {
    alert('请选择离职原因')
    return
  }
  if (!resignForm.applyDate) {
    alert('请选择申请日期')
    return
  }
  if (!resignForm.expectedLastDay) {
    alert('请选择预计最后工作日')
    return
  }
  employeeStore.processResignation(selectedEmployee.value.id, { ...resignForm })
  showResignModal.value = false
  activeTab.value = 'resignation'
}

function openResignConfirmModal(recordId) {
  resignConfirmRecordId.value = recordId
  resignConfirmActualLastDay.value = ''
  resignConfirmRemark.value = ''
  showResignConfirmModal.value = true
}

function confirmResignation() {
  if (!resignConfirmRecordId.value) return
  if (!resignConfirmActualLastDay.value) {
    alert('请选择实际最后工作日')
    return
  }
  const result = employeeStore.confirmResignation(resignConfirmRecordId.value, {
    actualLastDay: resignConfirmActualLastDay.value,
    remark: resignConfirmRemark.value
  })
  if (result) {
    showResignConfirmModal.value = false
    resignConfirmRecordId.value = null
  }
}

function cancelResignation(recordId) {
  employeeStore.cancelResignation(recordId)
}

function getResignStatusClass(status) {
  const map = {
    pending: 'resigning',
    effective: 'left',
    cancelled: 'cancelled'
  }
  return map[status] || 'resigning'
}

function getResignTypeLabel(value) {
  const item = RESIGNATION_TYPES.find(t => t.value === value)
  return item ? item.label : value
}

function getResignReasonLabel(value) {
  const item = RESIGNATION_REASONS.find(r => r.value === value)
  return item ? item.label : value
}

watch(() => employeeStore.employees, () => {
  if (selectedEmpId.value && !employeeStore.getEmployeeById(selectedEmpId.value)) {
    selectedEmpId.value = null
  }
}, { deep: true })

onMounted(() => {
  if (employeeStore.employees.length > 0) {
    selectedEmpId.value = employeeStore.employees[0].id
  }
})
</script>

<style scoped>
.employee-admin {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-light);
  margin-top: 4px;
}

.header-actions { display: flex; gap: 8px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-sm { padding: 6px 12px; font-size: 12px; }

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-ghost {
  background: white;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.btn-ghost:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: #f8faff;
}

.btn-danger { background: var(--error-color); color: white; }
.btn-danger:hover { background: #e04145; }

.btn-danger-ghost {
  background: white;
  color: var(--error-color);
  border-color: #ffccc7;
}
.btn-danger-ghost:hover { background: #fff1f0; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-icon-blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.stat-icon-green { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.stat-icon-purple { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.stat-icon-orange { background: linear-gradient(135deg, #ffedd5, #fed7aa); }
.stat-icon-red { background: linear-gradient(135deg, #fee2e2, #fecaca); }

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 4px;
}

.main-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 960px) {
  .main-layout { grid-template-columns: 1fr; }
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.panel-count {
  font-size: 12px;
  color: var(--text-light);
  background: var(--bg-secondary);
  padding: 3px 10px;
  border-radius: 12px;
}

.filter-bar {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid var(--border-light);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
  font-size: 14px;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 9px 12px 9px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.2s;
}

.filter-select {
  padding-left: 12px;
  cursor: pointer;
}

.search-input:focus,
.filter-select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.employee-list {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  padding: 8px;
}

.emp-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 4px;
}

.emp-item:hover { background: var(--bg-secondary); }
.emp-item.active {
  background: #eef2ff;
  box-shadow: 0 0 0 2px var(--primary-color) inset;
}

.emp-avatar-wrap {
  position: relative;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
}

.emp-avatar {
  font-size: 28px;
  line-height: 1;
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-dot.status-active { background: #52c41a; }
.status-dot.status-probation { background: #faad14; }
.status-dot.status-vacation { background: #1890ff; }
.status-dot.status-resigning { background: #f59e0b; }
.status-dot.status-left { background: #bfbfbf; }

.emp-info {
  flex: 1;
  min-width: 0;
}

.emp-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emp-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.emp-id {
  font-size: 11px;
  color: var(--text-light);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 4px;
}

.emp-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-sep { opacity: 0.5; }
.text-light { color: var(--text-light); }

.emp-role-tags {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.role-mini-tag {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.empty-list, .empty-detail {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-light);
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.emp-detail {
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 20px;
}

.emp-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.status-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.status-tag.status-active { background: #dcfce7; color: #15803d; }
.status-tag.status-probation { background: #fef3c7; color: #a16207; }
.status-tag.status-vacation { background: #dbeafe; color: #1e40af; }
.status-tag.status-resigning { background: #fef3c7; color: #b45309; }
.status-tag.status-left { background: #f3f4f6; color: #6b7280; }

.profile-dept {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.profile-ids {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 6px;
  display: flex;
  gap: 16px;
}

.detail-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--border-light);
  margin-bottom: 20px;
}

.tab-item {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-item:hover { color: var(--primary-color); }

.tab-item.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 600;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 12px 0 8px;
  border-bottom: 1px dashed var(--border-light);
  margin-bottom: 12px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 8px;
  border-bottom: 1px dashed var(--border-light);
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}

.info-label {
  font-size: 12px;
  color: var(--text-light);
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
  word-break: break-all;
}

.info-value.highlight {
  font-weight: 500;
  color: var(--primary-color);
}

.status-tag-sm {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  margin-right: 4px;
  margin-bottom: 2px;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  color: var(--primary-color);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.empty-records {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-light);
}

.timeline {
  position: relative;
  padding-left: 24px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: var(--border-light);
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child { padding-bottom: 0; }

.timeline-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px var(--border-light);
}

.timeline-dot.promote { background: #52c41a; box-shadow: 0 0 0 2px #52c41a; }
.timeline-dot.demote { background: #f5222d; box-shadow: 0 0 0 2px #f5222d; }
.timeline-dot.lateral { background: #1890ff; box-shadow: 0 0 0 2px #1890ff; }
.timeline-dot.cross { background: #722ed1; box-shadow: 0 0 0 2px #722ed1; }
.timeline-dot.temp { background: #faad14; box-shadow: 0 0 0 2px #faad14; }

.timeline-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 14px 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.transfer-type-tag {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.type-promote { background: #dcfce7; color: #15803d; }
.type-demote { background: #fee2e2; color: #991b1b; }
.type-lateral { background: #dbeafe; color: #1e40af; }
.type-cross { background: #ede9fe; color: #6d28d9; }
.type-temp { background: #fef3c7; color: #a16207; }

.timeline-date {
  font-size: 12px;
  color: var(--text-light);
}

.transfer-path {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 10px;
  margin-bottom: 10px;
}

.path-block { flex: 1; }
.path-block.to { text-align: right; }

.path-dept {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.path-pos {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.path-arrow {
  font-size: 20px;
  color: var(--primary-color);
  font-weight: 700;
}

.transfer-reason,
.transfer-remark {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
  line-height: 1.6;
}

.reason-label, .remark-label {
  color: var(--text-light);
}

.transfer-operator {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-light);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-lg { max-width: 720px; }
.modal-sm { max-width: 400px; }

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  transition: all 0.2s;
}

.modal-close:hover { background: var(--bg-secondary); color: var(--text-primary); }

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-section { margin-bottom: 24px; }
.form-section:last-child { margin-bottom: 0; }

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.form-group { margin-bottom: 16px; }

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-label.required::after {
  content: ' *';
  color: var(--error-color);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-select { cursor: pointer; }
.form-textarea { resize: vertical; min-height: 60px; }

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.transfer-info-box {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  border-radius: 12px;
  margin-bottom: 20px;
}

.transfer-current,
.transfer-target {
  flex: 1;
  padding: 12px;
  background: white;
  border-radius: 10px;
}

.transfer-target {
  background: linear-gradient(135deg, #dcfce7, #ecfdf5);
}

.transfer-label {
  font-size: 11px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.transfer-dept {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.transfer-pos {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.transfer-arrow-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: var(--primary-color);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.warning-text {
  margin-top: 8px;
  color: var(--warning-color);
  font-size: 13px;
}

.modal-enter-active,
.modal-leave-active { transition: opacity 0.25s ease; }

.modal-enter-active .modal,
.modal-leave-active .modal { transition: transform 0.25s ease; }

.modal-enter-from,
.modal-leave-to { opacity: 0; }

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(20px) scale(0.97);
}

@media (max-width: 640px) {
  .info-grid { grid-template-columns: 1fr; }
  .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .detail-header { flex-direction: column; }
}

.resign-status-tag {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
}

.resign-status-tag.status-resigning { background: #fef3c7; color: #b45309; }
.resign-status-tag.status-left { background: #fee2e2; color: #991b1b; }
.resign-status-tag.status-cancelled { background: #f3f4f6; color: #6b7280; }

.timeline-dot.resigning { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
.timeline-dot.left { background: #ef4444; box-shadow: 0 0 0 2px #ef4444; }
.timeline-dot.cancelled { background: #9ca3af; box-shadow: 0 0 0 2px #9ca3af; }

.resign-info-row {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
  line-height: 1.6;
  display: flex;
  gap: 4px;
}

.resign-label {
  color: var(--text-light);
  flex-shrink: 0;
}

.resign-value {
  color: var(--text-secondary);
}

.resign-summary-box {
  margin-top: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-radius: 10px;
  border: 1px solid #fde68a;
}

.resign-comp-title {
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.resign-compensation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.resign-comp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: white;
  border-radius: 6px;
}

.comp-label {
  font-size: 11px;
  color: var(--text-light);
}

.comp-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.comp-value.comp-total {
  color: #dc2626;
  font-size: 15px;
}

.resign-action-bar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-light);
}
</style>
