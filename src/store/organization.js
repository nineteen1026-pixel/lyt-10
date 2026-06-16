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
    }
  }
})
