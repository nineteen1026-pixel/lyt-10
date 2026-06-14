import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import { useEmployeeStore } from './store/employee'
import { useAttendanceStore } from './store/attendance'
import { useScheduleStore } from './store/schedule'
import { useVacationStore } from './store/vacation'
import './style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()
const scheduleStore = useScheduleStore()
const vacationStore = useVacationStore()

employeeStore.initEmployees()
attendanceStore.initRecords()
scheduleStore.initSchedule()

const initVacation = () => {
  vacationStore.initVacation(employeeStore.employees)
}

if (employeeStore.employees.length > 0) {
  initVacation()
} else {
  const unwatch = employeeStore.$subscribe(() => {
    if (employeeStore.employees.length > 0) {
      initVacation()
      unwatch()
    }
  })
}

app.mount('#app')
