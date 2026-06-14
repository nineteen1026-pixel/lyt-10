export const departments = [
  { id: 1, name: '技术研发部' },
  { id: 2, name: '产品设计部' },
  { id: 3, name: '市场运营部' },
  { id: 4, name: '人力资源部' },
  { id: 5, name: '财务管理部' }
]

export const employees = [
  { id: 'E001', name: '张明', departmentId: 1, department: '技术研发部', position: '前端工程师', avatar: '👨‍💻', roles: [] },
  { id: 'E002', name: '李华', departmentId: 1, department: '技术研发部', position: '后端工程师', avatar: '👩‍💻', roles: ['supervisor'] },
  { id: 'E003', name: '王芳', departmentId: 2, department: '产品设计部', position: '产品经理', avatar: '👩‍💼', roles: ['supervisor', 'manager'] },
  { id: 'E004', name: '刘伟', departmentId: 2, department: '产品设计部', position: 'UI设计师', avatar: '👨‍🎨', roles: [] },
  { id: 'E005', name: '陈静', departmentId: 3, department: '市场运营部', position: '市场专员', avatar: '👩‍🦰', roles: [] },
  { id: 'E006', name: '赵强', departmentId: 3, department: '市场运营部', position: '运营主管', avatar: '👨‍💼', roles: ['supervisor', 'manager'] },
  { id: 'E007', name: '孙丽', departmentId: 4, department: '人力资源部', position: 'HR专员', avatar: '👩‍🏫', roles: ['hr'] },
  { id: 'E008', name: '周杰', departmentId: 4, department: '人力资源部', position: 'HR经理', avatar: '👨‍💼', roles: ['supervisor', 'manager', 'hr'] },
  { id: 'E009', name: '吴敏', departmentId: 5, department: '财务管理部', position: '会计', avatar: '👩‍💼', roles: [] },
  { id: 'E010', name: '郑涛', departmentId: 5, department: '财务管理部', position: '财务主管', avatar: '👨‍💼', roles: ['supervisor', 'manager'] }
]

export const ROLE_LABELS = {
  supervisor: '直属领导',
  manager: '部门经理',
  hr: '人事'
}

export const workTimeConfig = {
  morningStart: '09:00',
  morningEnd: '12:00',
  afternoonStart: '13:30',
  afternoonEnd: '18:00',
  lateThreshold: 15,
  earlyLeaveThreshold: 15
}
