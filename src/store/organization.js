import { defineStore } from 'pinia'
import {
  getDepartmentsTree, setDepartmentsTree,
  getPositions, setPositions,
  getTransferRecords, setTransferRecords
} from '@/utils/storage'
import {
  departments as mockDepartments,
  positions as mockPositions,
  transferRecords as mockTransferRecords,
  flattenDepartments
} from '@/data/employees'
import { useEmployeeStore } from '@/store/employee'
import { useScheduleStore } from '@/store/schedule'
import { useAttendanceStore } from '@/store/attendance'
import { useNotificationStore } from '@/store/notification'

export const useOrganizationStore = defineStore('organization', {
  state: () => ({
    departmentsTree: [],
    positions: [],
    transferRecords: []
  }),

  getters: {
    flatDepartments: (state) => {
      return flattenDepartments(state.departmentsTree)
    },

    getDepartmentById: (state) => (id) => {
      const all = flattenDepartments(state.departmentsTree)
      return all.find(d => d.id === id)
    },

    getDepartmentPath: (state) => (id) => {
      const path = []
      function findPath(nodes, targetId, ancestors = []) {
        for (const node of nodes) {
          const currentPath = [...ancestors, node]
          if (node.id === targetId) {
            path.push(...currentPath)
            return true
          }
          if (node.children && node.children.length > 0) {
            if (findPath(node.children, targetId, currentPath)) {
              return true
            }
          }
        }
        return false
      }
      findPath(state.departmentsTree, id)
      return path
    },

    getChildDepartments: (state) => (parentId) => {
      const all = flattenDepartments(state.departmentsTree)
      return all.filter(d => d.parentId === parentId)
    },

    getDepartmentEmployeesCount: (state, getters) => (departmentId, employeeStore) => {
      const allChildIds = getters.getAllDescendantIds(departmentId)
      allChildIds.push(departmentId)
      return employeeStore.employees.filter(e => allChildIds.includes(e.departmentId)).length
    },

    getAllDescendantIds: (state) => (departmentId) => {
      const ids = []
      function findNode(nodes, targetId) {
        for (const node of nodes) {
          if (node.id === targetId) {
            return node
          }
          if (node.children && node.children.length > 0) {
            const found = findNode(node.children, targetId)
            if (found) return found
          }
        }
        return null
      }
      function collectChildren(node) {
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            ids.push(child.id)
            collectChildren(child)
          }
        }
      }
      const targetNode = findNode(state.departmentsTree, departmentId)
      if (targetNode) {
        collectChildren(targetNode)
      }
      return ids
    },

    getPositionById: (state) => (id) => {
      return state.positions.find(p => p.id === id)
    },

    getPositionsByLevel: (state) => (level) => {
      return state.positions.filter(p => p.level === level)
    },

    sortedPositions: (state) => {
      return [...state.positions].sort((a, b) => a.level - b.level)
    },

    getTransferRecordsByEmployee: (state) => (employeeId) => {
      return state.transferRecords
        .filter(r => r.employeeId === employeeId)
        .sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate))
    },

    getPositionLabels: (state) => {
      const map = {}
      state.positions.forEach(p => {
        map[p.id] = p.name
      })
      return map
    }
  },

  actions: {
    initOrganization() {
      const storedDepts = getDepartmentsTree()
      if (storedDepts && storedDepts.length > 0) {
        this.departmentsTree = storedDepts
      } else {
        this.departmentsTree = mockDepartments
        this.saveDepartments()
      }

      const storedPositions = getPositions()
      if (storedPositions && storedPositions.length > 0) {
        this.positions = storedPositions
      } else {
        this.positions = mockPositions
        this.savePositions()
      }

      const storedTransfers = getTransferRecords()
      if (storedTransfers && storedTransfers.length > 0) {
        this.transferRecords = storedTransfers
      } else {
        this.transferRecords = mockTransferRecords
        this.saveTransferRecords()
      }
    },

    saveDepartments() {
      setDepartmentsTree(this.departmentsTree)
    },

    savePositions() {
      setPositions(this.positions)
    },

    saveTransferRecords() {
      setTransferRecords(this.transferRecords)
    },

    addDepartment(department, parentId = null) {
      const newDept = {
        ...department,
        id: Date.now(),
        parentId: parentId,
        children: []
      }

      if (parentId === null) {
        this.departmentsTree.push(newDept)
      } else {
        function addToParent(nodes) {
          for (const node of nodes) {
            if (node.id === parentId) {
              if (!node.children) node.children = []
              node.children.push(newDept)
              return true
            }
            if (node.children && node.children.length > 0) {
              if (addToParent(node.children)) return true
            }
          }
          return false
        }
        addToParent(this.departmentsTree)
      }
      this.saveDepartments()
      return newDept
    },

    updateDepartment(id, updates) {
      function update(nodes) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            nodes[i] = { ...nodes[i], ...updates }
            return true
          }
          if (nodes[i].children && nodes[i].children.length > 0) {
            if (update(nodes[i].children)) return true
          }
        }
        return false
      }
      update(this.departmentsTree)
      this.saveDepartments()
    },

    removeDepartment(id) {
      function remove(nodes) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === id) {
            nodes.splice(i, 1)
            return true
          }
          if (nodes[i].children && nodes[i].children.length > 0) {
            if (remove(nodes[i].children)) return true
          }
        }
        return false
      }
      remove(this.departmentsTree)
      this.saveDepartments()
    },

    addPosition(position) {
      const newPos = {
        ...position,
        id: Date.now()
      }
      this.positions.push(newPos)
      this.savePositions()
      return newPos
    },

    updatePosition(id, updates) {
      const index = this.positions.findIndex(p => p.id === id)
      if (index !== -1) {
        this.positions[index] = { ...this.positions[index], ...updates }
        this.savePositions()
      }
    },

    removePosition(id) {
      this.positions = this.positions.filter(p => p.id !== id)
      this.savePositions()
    },

    addTransferRecord(record) {
      const newRecord = {
        ...record,
        id: Date.now(),
        createdAt: new Date().toISOString()
      }
      this.transferRecords.unshift(newRecord)
      this.saveTransferRecords()
      return newRecord
    },

    transferDepartmentEmployees(sourceDeptId, targetDeptId, reason = '组织架构调整') {
      const employeeStore = useEmployeeStore()
      const scheduleStore = useScheduleStore()
      const attendanceStore = useAttendanceStore()
      const notificationStore = useNotificationStore()

      const sourceDept = this.getDepartmentById(sourceDeptId)
      const targetDept = this.getDepartmentById(targetDeptId)

      if (!sourceDept || !targetDept) {
        return { success: false, message: '部门不存在', migrated: 0 }
      }

      const allSourceIds = [sourceDeptId, ...this.getAllDescendantIds(sourceDeptId)]
      const affectedEmployees = []

      allSourceIds.forEach(deptId => {
        const emps = employeeStore.getEmployeesByDepartment(deptId)
        emps.forEach(emp => {
          affectedEmployees.push({
            employee: emp,
            oldDeptId: deptId,
            oldDeptName: emp.department
          })
        })
      })

      if (affectedEmployees.length === 0) {
        return { success: true, message: '没有需要迁移的员工', migrated: 0 }
      }

      const employeeIds = affectedEmployees.map(e => e.employee.id)

      scheduleStore.batchMigrateSchedules(
        employeeIds,
        sourceDeptId,
        targetDeptId,
        targetDept.name
      )

      attendanceStore.batchUpdateRequestsDepartment(
        employeeIds,
        sourceDeptId,
        targetDeptId,
        targetDept.name
      )

      const targetManagerId = targetDept.managerId
      const targetManager = targetManagerId ? employeeStore.getEmployeeById(targetManagerId) : null

      if (targetManager) {
        const sourceManagerId = sourceDept.managerId
        const sourceManager = sourceManagerId ? employeeStore.getEmployeeById(sourceManagerId) : null

        attendanceStore.reassignDepartmentPendingApprovals(
          sourceDeptId,
          sourceManagerId,
          targetManagerId,
          targetManager.name,
          employeeIds,
          reason
        )
      }

      affectedEmployees.forEach(({ employee, oldDeptName }) => {
        employeeStore.updateEmployee(employee.id, {
          departmentId: targetDeptId,
          department: targetDept.name
        })

        notificationStore.generateDeptTransferNotification(
          employee.id,
          oldDeptName,
          targetDept.name,
          reason
        )

        notificationStore.generateScheduleMigratedNotification(
          employee.id,
          oldDeptName,
          targetDept.name
        )

        if (targetManager) {
          const oldManagerName = sourceDept.managerId
            ? (employeeStore.getEmployeeById(sourceDept.managerId)?.name || '原审批人')
            : '原审批人'
          notificationStore.generateApproverChangedNotification(
            employee.id,
            oldManagerName,
            targetManager.name,
            reason
          )
        }

        this.addTransferRecord({
          employeeId: employee.id,
          employeeName: employee.name,
          fromDepartmentId: employee.departmentId,
          fromDepartment: oldDeptName,
          fromPositionId: employee.positionId,
          fromPosition: employee.position,
          toDepartmentId: targetDeptId,
          toDepartment: targetDept.name,
          toPositionId: employee.positionId,
          toPosition: employee.position,
          transferType: '组织调整',
          transferDate: new Date().toISOString().split('T')[0],
          reason,
          remark: '系统自动迁移'
        })
      })

      return {
        success: true,
        message: `已成功迁移 ${affectedEmployees.length} 名员工`,
        migrated: affectedEmployees.length,
        employeeIds
      }
    },

    mergeDepartment(sourceDeptId, targetDeptId, reason = '部门合并') {
      const scheduleStore = useScheduleStore()

      const sourceDept = this.getDepartmentById(sourceDeptId)
      const targetDept = this.getDepartmentById(targetDeptId)

      if (!sourceDept || !targetDept) {
        return { success: false, message: '部门不存在' }
      }

      const result = this.transferDepartmentEmployees(sourceDeptId, targetDeptId, reason)

      if (result.success) {
        scheduleStore.mergeDepartmentTemplates(sourceDeptId, targetDeptId, targetDept.name)

        this.removeDepartment(sourceDeptId)
      }

      return result
    },

    deleteDepartmentWithMigration(deptId, targetDeptId = null, reason = '部门撤销') {
      if (targetDeptId) {
        return this.mergeDepartment(deptId, targetDeptId, reason)
      }

      const employeeStore = useEmployeeStore()
      const scheduleStore = useScheduleStore()
      const notificationStore = useNotificationStore()

      const dept = this.getDepartmentById(deptId)
      if (!dept) {
        return { success: false, message: '部门不存在' }
      }

      const allIds = [deptId, ...this.getAllDescendantIds(deptId)]
      const affectedEmployees = []

      allIds.forEach(id => {
        const emps = employeeStore.getEmployeesByDepartment(id)
        emps.forEach(emp => {
          affectedEmployees.push({ employee: emp, oldDeptName: emp.department })
        })
      })

      affectedEmployees.forEach(({ employee, oldDeptName }) => {
        employeeStore.updateEmployee(employee.id, {
          departmentId: null,
          department: '未分配'
        })

        notificationStore.generateDeptTransferNotification(
          employee.id,
          oldDeptName,
          '未分配',
          reason
        )
      })

      scheduleStore.clearDepartmentTemplates(allIds)

      this.removeDepartment(deptId)

      return {
        success: true,
        message: `部门已删除，${affectedEmployees.length} 名员工已标记为未分配`,
        migrated: affectedEmployees.length
      }
    },

    updateDepartmentManager(deptId, newManagerId, reason = '部门负责人变更') {
      const employeeStore = useEmployeeStore()
      const attendanceStore = useAttendanceStore()
      const notificationStore = useNotificationStore()

      const dept = this.getDepartmentById(deptId)
      if (!dept) {
        return { success: false, message: '部门不存在' }
      }

      const oldManagerId = dept.managerId
      const oldManager = oldManagerId ? employeeStore.getEmployeeById(oldManagerId) : null

      const newManager = newManagerId ? employeeStore.getEmployeeById(newManagerId) : null

      this.updateDepartment(deptId, { managerId: newManagerId })

      const allDeptIds = [deptId, ...this.getAllDescendantIds(deptId)]
      const affectedEmployees = []

      allDeptIds.forEach(id => {
        const emps = employeeStore.getEmployeesByDepartment(id)
        emps.forEach(emp => {
          if (emp.id !== newManagerId) {
            affectedEmployees.push(emp)
          }
        })
      })

      if (affectedEmployees.length > 0 && newManager) {
        const employeeIds = affectedEmployees.map(e => e.id)

        attendanceStore.reassignDepartmentPendingApprovals(
          deptId,
          oldManagerId,
          newManagerId,
          newManager.name,
          employeeIds,
          reason
        )

        affectedEmployees.forEach(emp => {
          notificationStore.generateApproverChangedNotification(
            emp.id,
            oldManager?.name || '原审批人',
            newManager.name,
            reason
          )
        })
      }

      return {
        success: true,
        message: `部门负责人已更新，${affectedEmployees.length} 名员工的审批人已同步变更`,
        affectedCount: affectedEmployees.length
      }
    }
  }
})
