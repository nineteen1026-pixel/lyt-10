export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function getToday() {
  return formatDate(new Date(), 'YYYY-MM-DD')
}

export function getNow() {
  return formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
}

export function getCurrentTime() {
  return formatTime(new Date())
}

export function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export function isTimeAfter(time1, time2) {
  return parseTime(time1) > parseTime(time2)
}

export function isTimeBefore(time1, time2) {
  return parseTime(time1) < parseTime(time2)
}

export function getMonthDays(year, month) {
  return new Date(year, month, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

export function getCalendarDays(year, month) {
  const days = []
  const totalDays = getMonthDays(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push({
      year,
      month,
      day: i,
      date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    })
  }

  return days
}

export function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-${getMonthDays(year, month)}`
  return { start, end }
}

export function formatMonthDisplay(year, month) {
  return `${year}年${month}月`
}

export function getWeekDays() {
  return ['日', '一', '二', '三', '四', '五', '六']
}

export function isWeekend(date) {
  const day = new Date(date).getDay()
  return day === 0 || day === 6
}
