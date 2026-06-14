export const departments = [
  { id: 1, name: '技术研发部' },
  { id: 2, name: '产品设计部' },
  { id: 3, name: '市场运营部' },
  { id: 4, name: '人力资源部' },
  { id: 5, name: '财务管理部' }
]

export const employees = [
  { id: 'E001', name: '张明', departmentId: 1, department: '技术研发部', position: '前端工程师', avatar: '👨‍💻', roles: [], hireDate: '2022-03-15' },
  { id: 'E002', name: '李华', departmentId: 1, department: '技术研发部', position: '后端工程师', avatar: '👩‍💻', roles: ['supervisor'], hireDate: '2018-07-20' },
  { id: 'E003', name: '王芳', departmentId: 2, department: '产品设计部', position: '产品经理', avatar: '👩‍💼', roles: ['supervisor', 'manager'], hireDate: '2015-11-01' },
  { id: 'E004', name: '刘伟', departmentId: 2, department: '产品设计部', position: 'UI设计师', avatar: '👨‍🎨', roles: [], hireDate: '2023-01-10' },
  { id: 'E005', name: '陈静', departmentId: 3, department: '市场运营部', position: '市场专员', avatar: '👩‍🦰', roles: [], hireDate: '2021-05-08' },
  { id: 'E006', name: '赵强', departmentId: 3, department: '市场运营部', position: '运营主管', avatar: '👨‍💼', roles: ['supervisor', 'manager'], hireDate: '2016-09-12' },
  { id: 'E007', name: '孙丽', departmentId: 4, department: '人力资源部', position: 'HR专员', avatar: '👩‍🏫', roles: ['hr'], hireDate: '2020-02-28' },
  { id: 'E008', name: '周杰', departmentId: 4, department: '人力资源部', position: 'HR经理', avatar: '👨‍💼', roles: ['supervisor', 'manager', 'hr'], hireDate: '2012-06-15' },
  { id: 'E009', name: '吴敏', departmentId: 5, department: '财务管理部', position: '会计', avatar: '👩‍💼', roles: [], hireDate: '2019-04-01' },
  { id: 'E010', name: '郑涛', departmentId: 5, department: '财务管理部', position: '财务主管', avatar: '👨‍💼', roles: ['supervisor', 'manager'], hireDate: '2014-08-20' }
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
