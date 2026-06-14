import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import { useEmployeeStore } from './store/employee'
import { useAttendanceStore } from './store/attendance'
import { useScheduleStore } from './store/schedule'
import './style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()
const scheduleStore = useScheduleStore()

employeeStore.initEmployees()
attendanceStore.initRecords()
scheduleStore.initSchedule()

app.mount('#app')
