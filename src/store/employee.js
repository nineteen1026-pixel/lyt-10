import { defineStore } from 'pinia'
import { employees as mockEmployees } from '@/data/employees'
import { getEmployees, setEmployees, getCurrentUser, setCurrentUser } from '@/utils/storage'

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [],
    currentUser: null
  }),

  getters: {
    getEmployeeById: (state) => (id) => {
      return state.employees.find(emp => emp.id === id)
    },

    getEmployeesByDepartment: (state) => (departmentId) => {
      return state.employees.filter(emp => emp.departmentId === departmentId)
    },

    departments: (state) => {
      const deps = new Map()
      state.employees.forEach(emp => {
        if (!deps.has(emp.departmentId)) {
          deps.set(emp.departmentId, emp.department)
        }
      })
      return Array.from(deps, ([id, name]) => ({ id, name }))
    }
  },

  actions: {
    initEmployees() {
      const stored = getEmployees()
      if (stored.length === 0) {
        this.employees = mockEmployees
        this.saveToStorage()
      } else {
        this.employees = mockEmployees
        this.saveToStorage()
      }

      const storedUser = getCurrentUser()
      if (storedUser) {
        const freshUser = this.employees.find(e => e.id === storedUser.id)
        this.currentUser = freshUser || this.employees[0]
      } else {
        this.setCurrentUser(this.employees[0])
      }
    },

    saveToStorage() {
      setEmployees(this.employees)
    },

    setCurrentUser(employee) {
      this.currentUser = employee
      setCurrentUser(employee)
    },

    addEmployee(employee) {
      this.employees.push(employee)
      this.saveToStorage()
    },

    updateEmployee(id, updates) {
      const index = this.employees.findIndex(emp => emp.id === id)
      if (index !== -1) {
        this.employees[index] = { ...this.employees[index], ...updates }
        this.saveToStorage()
      }
    },

    removeEmployee(id) {
      this.employees = this.employees.filter(emp => emp.id !== id)
      this.saveToStorage()
    }
  }
})
