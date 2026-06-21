export const departments = [
  {
    id: 1,
    name: '技术研发中心',
    parentId: null,
    code: 'TECH',
    description: '负责公司产品的技术研发与架构设计',
    managerId: 'E002',
    children: [
      {
        id: 11,
        name: '前端开发部',
        parentId: 1,
        code: 'TECH-FE',
        description: '负责Web及移动端前端开发',
        managerId: 'E001',
        children: [
          { id: 111, name: 'Web前端组', parentId: 11, code: 'TECH-FE-WEB', description: 'PC端Web开发', children: [] },
          { id: 112, name: '移动前端组', parentId: 11, code: 'TECH-FE-MOB', description: 'H5/小程序开发', children: [] }
        ]
      },
      {
        id: 12,
        name: '后端开发部',
        parentId: 1,
        code: 'TECH-BE',
        description: '负责服务端架构与API开发',
        managerId: 'E002',
        children: [
          { id: 121, name: '业务开发组', parentId: 12, code: 'TECH-BE-BIZ', description: '业务系统开发', children: [] },
          { id: 122, name: '基础架构组', parentId: 12, code: 'TECH-BE-INF', description: '基础设施维护', children: [] }
        ]
      },
      {
        id: 13,
        name: '测试质量部',
        parentId: 1,
        code: 'TECH-QA',
        description: '负责产品质量保障与测试',
        managerId: 'E011',
        children: [
          { id: 131, name: '功能测试组', parentId: 13, code: 'TECH-QA-FUNC', description: '功能测试', children: [] },
          { id: 132, name: '自动化测试组', parentId: 13, code: 'TECH-QA-AUTO', description: '自动化测试', children: [] }
        ]
      }
    ]
  },
  {
    id: 2,
    name: '产品设计中心',
    parentId: null,
    code: 'PD',
    description: '负责产品规划与交互设计',
    managerId: 'E003',
    children: [
      { id: 21, name: '产品经理部', parentId: 2, code: 'PD-PM', description: '需求分析与产品规划', managerId: 'E003', children: [] },
      { id: 22, name: '视觉设计部', parentId: 2, code: 'PD-UI', description: '视觉界面设计', managerId: 'E004', children: [] },
      { id: 23, name: '用户研究部', parentId: 2, code: 'PD-UX', description: '用户体验研究', children: [] }
    ]
  },
  {
    id: 3,
    name: '市场运营中心',
    parentId: null,
    code: 'MK',
    description: '负责市场推广与用户运营',
    managerId: 'E006',
    children: [
      { id: 31, name: '品牌市场部', parentId: 3, code: 'MK-BRAND', description: '品牌策划与推广', children: [] },
      { id: 32, name: '用户运营部', parentId: 3, code: 'MK-OPS', description: '用户增长与留存', managerId: 'E005', children: [] },
      { id: 33, name: '渠道合作部', parentId: 3, code: 'MK-CH', description: '渠道拓展与合作', children: [] }
    ]
  },
  {
    id: 4,
    name: '人力资源中心',
    parentId: null,
    code: 'HR',
    description: '负责人才招聘与员工发展',
    managerId: 'E008',
    children: [
      { id: 41, name: '招聘配置部', parentId: 4, code: 'HR-RC', description: '人才招聘与配置', children: [] },
      { id: 42, name: '员工关系部', parentId: 4, code: 'HR-ER', description: '员工服务与关系维护', managerId: 'E007', children: [] },
      { id: 43, name: '培训发展部', parentId: 4, code: 'HR-TD', description: '培训与人才发展', children: [] }
    ]
  },
  {
    id: 5,
    name: '财务管理中心',
    parentId: null,
    code: 'FIN',
    description: '负责财务核算与资金管理',
    managerId: 'E010',
    children: [
      { id: 51, name: '会计核算部', parentId: 5, code: 'FIN-ACC', description: '财务核算与报表', managerId: 'E009', children: [] },
      { id: 52, name: '资金管理部', parentId: 5, code: 'FIN-CASH', description: '资金调度与管理', children: [] }
    ]
  }
]

export const positions = [
  { id: 1, name: '助理工程师', code: 'P1', level: 1, category: '技术', description: '入门级技术岗位，协助开发工作', baseSalary: 8000 },
  { id: 2, name: '初级工程师', code: 'P2', level: 2, category: '技术', description: '独立完成模块开发任务', baseSalary: 12000 },
  { id: 3, name: '中级工程师', code: 'P3', level: 3, category: '技术', description: '负责复杂功能模块设计开发', baseSalary: 18000 },
  { id: 4, name: '高级工程师', code: 'P4', level: 4, category: '技术', description: '系统架构设计与技术方案评审', baseSalary: 28000 },
  { id: 5, name: '资深工程师', code: 'P5', level: 5, category: '技术', description: '技术方向引领，跨团队协作', baseSalary: 40000 },
  { id: 6, name: '技术专家', code: 'P6', level: 6, category: '技术', description: '行业技术专家，解决疑难问题', baseSalary: 55000 },
  { id: 7, name: '技术总监', code: 'M3', level: 7, category: '管理', description: '负责技术中心整体管理', baseSalary: 70000 },
  { id: 8, name: '初级产品经理', code: 'P2-PM', level: 2, category: '产品', description: '协助需求调研与原型设计', baseSalary: 12000 },
  { id: 9, name: '产品经理', code: 'P3-PM', level: 3, category: '产品', description: '独立负责产品线规划', baseSalary: 20000 },
  { id: 10, name: '高级产品经理', code: 'P4-PM', level: 4, category: '产品', description: '多产品线协调与战略规划', baseSalary: 32000 },
  { id: 11, name: '产品总监', code: 'M3-PM', level: 7, category: '管理', description: '负责产品中心整体管理', baseSalary: 65000 },
  { id: 12, name: 'UI设计师', code: 'P3-DES', level: 3, category: '设计', description: '视觉界面设计', baseSalary: 16000 },
  { id: 13, name: '高级UI设计师', code: 'P4-DES', level: 4, category: '设计', description: '设计规范制定与团队指导', baseSalary: 25000 },
  { id: 14, name: '运营专员', code: 'P2-OPS', level: 2, category: '运营', description: '日常运营工作执行', baseSalary: 10000 },
  { id: 15, name: '运营主管', code: 'P3-OPS', level: 3, category: '运营', description: '运营项目统筹管理', baseSalary: 18000 },
  { id: 16, name: '运营经理', code: 'M2-OPS', level: 5, category: '管理', description: '运营部门管理', baseSalary: 35000 },
  { id: 17, name: 'HR专员', code: 'P2-HR', level: 2, category: '人事', description: '日常人事事务处理', baseSalary: 9000 },
  { id: 18, name: 'HR主管', code: 'P3-HR', level: 3, category: '人事', description: 'HR模块负责人', baseSalary: 16000 },
  { id: 19, name: 'HR经理', code: 'M2-HR', level: 5, category: '管理', description: 'HR部门管理', baseSalary: 32000 },
  { id: 20, name: '会计', code: 'P2-FIN', level: 2, category: '财务', description: '日常财务核算', baseSalary: 10000 },
  { id: 21, name: '财务主管', code: 'P3-FIN', level: 3, category: '财务', description: '财务模块管理', baseSalary: 18000 },
  { id: 22, name: '测试工程师', code: 'P3-QA', level: 3, category: '技术', description: '质量测试与保障', baseSalary: 15000 },
  { id: 23, name: '测试主管', code: 'P4-QA', level: 4, category: '技术', description: '测试团队管理', baseSalary: 25000 }
]

export const employees = [
  { id: 'E001', name: '张明', departmentId: 111, department: 'Web前端组', positionId: 4, position: '高级工程师', avatar: '👨‍💻', roles: ['supervisor'], hireDate: '2022-03-15', phone: '13800138001', email: 'zhangming@company.com', gender: '男', birthday: '1995-06-20', education: '本科', status: '在职', emergencyContact: '张母 13900139001', address: '北京市朝阳区' },
  { id: 'E002', name: '李华', departmentId: 12, department: '后端开发部', positionId: 7, position: '技术总监', avatar: '👩‍💻', roles: ['supervisor', 'manager'], hireDate: '2018-07-20', phone: '13800138002', email: 'lihua@company.com', gender: '女', birthday: '1990-02-15', education: '硕士', status: '在职', emergencyContact: '李父 13900139002', address: '北京市海淀区' },
  { id: 'E003', name: '王芳', departmentId: 21, department: '产品经理部', positionId: 11, position: '产品总监', avatar: '👩‍💼', roles: ['supervisor', 'manager'], hireDate: '2015-11-01', phone: '13800138003', email: 'wangfang@company.com', gender: '女', birthday: '1988-09-10', education: '硕士', status: '在职', emergencyContact: '王夫 13900139003', address: '北京市西城区' },
  { id: 'E004', name: '刘伟', departmentId: 22, department: '视觉设计部', positionId: 13, position: '高级UI设计师', avatar: '👨‍🎨', roles: ['supervisor'], hireDate: '2023-01-10', phone: '13800138004', email: 'liuwei@company.com', gender: '男', birthday: '1996-11-25', education: '本科', status: '在职', emergencyContact: '刘母 13900139004', address: '北京市东城区' },
  { id: 'E005', name: '陈静', departmentId: 32, department: '用户运营部', positionId: 16, position: '运营经理', avatar: '👩‍🦰', roles: ['supervisor'], hireDate: '2021-05-08', phone: '13800138005', email: 'chenjing@company.com', gender: '女', birthday: '1993-04-18', education: '本科', status: '在职', emergencyContact: '陈父 13900139005', address: '北京市丰台区' },
  { id: 'E006', name: '赵强', departmentId: 3, department: '市场运营中心', positionId: 16, position: '运营经理', avatar: '👨‍💼', roles: ['supervisor', 'manager'], hireDate: '2016-09-12', phone: '13800138006', email: 'zhaoqiang@company.com', gender: '男', birthday: '1987-12-03', education: '本科', status: '在职', emergencyContact: '赵妻 13900139006', address: '北京市石景山区' },
  { id: 'E007', name: '孙丽', departmentId: 42, department: '员工关系部', positionId: 18, position: 'HR主管', avatar: '👩‍🏫', roles: ['hr'], hireDate: '2020-02-28', phone: '13800138007', email: 'sunli@company.com', gender: '女', birthday: '1992-07-22', education: '本科', status: '在职', emergencyContact: '孙母 13900139007', address: '北京市通州区' },
  { id: 'E008', name: '周杰', departmentId: 4, department: '人力资源中心', positionId: 19, position: 'HR经理', avatar: '👨‍💼', roles: ['supervisor', 'manager', 'hr'], hireDate: '2012-06-15', phone: '13800138008', email: 'zhoujie@company.com', gender: '男', birthday: '1985-03-30', education: '硕士', status: '在职', emergencyContact: '周妻 13900139008', address: '北京市昌平区' },
  { id: 'E009', name: '吴敏', departmentId: 51, department: '会计核算部', positionId: 21, position: '财务主管', avatar: '👩‍💼', roles: ['supervisor'], hireDate: '2019-04-01', phone: '13800138009', email: 'wumin@company.com', gender: '女', birthday: '1991-08-14', education: '本科', status: '在职', emergencyContact: '吴父 13900139009', address: '北京市大兴区' },
  { id: 'E010', name: '郑涛', departmentId: 5, department: '财务管理中心', positionId: 21, position: '财务主管', avatar: '👨‍💼', roles: ['supervisor', 'manager'], hireDate: '2014-08-20', phone: '13800138010', email: 'zhengtao@company.com', gender: '男', birthday: '1986-01-05', education: '本科', status: '在职', emergencyContact: '郑妻 13900139010', address: '北京市顺义区' },
  { id: 'E011', name: '黄丽', departmentId: 13, department: '测试质量部', positionId: 23, position: '测试主管', avatar: '👩‍💻', roles: ['supervisor'], hireDate: '2019-10-15', phone: '13800138011', email: 'huangli@company.com', gender: '女', birthday: '1993-02-28', education: '本科', status: '在职', emergencyContact: '黄母 13900139011', address: '北京市房山区' },
  { id: 'E012', name: '林峰', departmentId: 121, department: '业务开发组', positionId: 3, position: '中级工程师', avatar: '👨‍💻', roles: [], hireDate: '2021-06-20', phone: '13800138012', email: 'linfeng@company.com', gender: '男', birthday: '1994-10-12', education: '本科', status: '在职', emergencyContact: '林父 13900139012', address: '北京市门头沟区' },
  { id: 'E013', name: '徐娜', departmentId: 122, department: '基础架构组', positionId: 4, position: '高级工程师', avatar: '👩‍💻', roles: [], hireDate: '2020-03-08', phone: '13800138013', email: 'xuna@company.com', gender: '女', birthday: '1992-11-20', education: '硕士', status: '在职', emergencyContact: '徐夫 13900139013', address: '北京市平谷区' },
  { id: 'E014', name: '马超', departmentId: 111, department: 'Web前端组', positionId: 2, position: '初级工程师', avatar: '👨‍💻', roles: [], hireDate: '2023-07-01', phone: '13800138014', email: 'machao@company.com', gender: '男', birthday: '1998-05-16', education: '本科', status: '在职', emergencyContact: '马父 13900139014', address: '北京市怀柔区' },
  { id: 'E015', name: '何雪', departmentId: 112, department: '移动前端组', positionId: 3, position: '中级工程师', avatar: '👩‍💻', roles: [], hireDate: '2022-09-10', phone: '13800138015', email: 'hexue@company.com', gender: '女', birthday: '1995-12-08', education: '本科', status: '在职', emergencyContact: '何母 13900139015', address: '北京市密云区' }
]

export const transferRecords = [
  {
    id: 1001,
    employeeId: 'E001',
    employeeName: '张明',
    fromDepartmentId: 112,
    fromDepartment: '移动前端组',
    fromPositionId: 3,
    fromPosition: '中级工程师',
    toDepartmentId: 111,
    toDepartment: 'Web前端组',
    toPositionId: 4,
    toPosition: '高级工程师',
    transferType: '调动晋升',
    transferDate: '2024-01-15',
    reason: '业务调整，负责Web前端核心模块开发',
    operatorId: 'E008',
    operatorName: '周杰',
    remark: '调薪+20%'
  },
  {
    id: 1002,
    employeeId: 'E007',
    employeeName: '孙丽',
    fromDepartmentId: 41,
    fromDepartment: '招聘配置部',
    fromPositionId: 17,
    fromPosition: 'HR专员',
    toDepartmentId: 42,
    toDepartment: '员工关系部',
    toPositionId: 18,
    toPosition: 'HR主管',
    transferType: '晋升',
    transferDate: '2023-08-01',
    reason: '工作表现优秀，晋升为主管',
    operatorId: 'E008',
    operatorName: '周杰',
    remark: '年度优秀员工'
  },
  {
    id: 1003,
    employeeId: 'E011',
    employeeName: '黄丽',
    fromDepartmentId: 12,
    fromDepartment: '后端开发部',
    fromPositionId: 3,
    fromPosition: '中级工程师',
    toDepartmentId: 13,
    toDepartment: '测试质量部',
    toPositionId: 23,
    toPosition: '测试主管',
    transferType: '跨部门调动',
    transferDate: '2023-05-20',
    reason: '测试团队扩张，调岗负责测试管理',
    operatorId: 'E002',
    operatorName: '李华',
    remark: '自愿申请'
  }
]

export const ROLE_LABELS = {
  supervisor: '直属领导',
  manager: '部门经理',
  hr: '人事'
}

export const LEVEL_LABELS = {
  1: '入门级',
  2: '初级',
  3: '中级',
  4: '高级',
  5: '资深/经理',
  6: '专家',
  7: '总监',
  8: 'VP',
  9: 'SVP',
  10: 'CEO'
}

export const TRANSFER_TYPES = [
  { value: '平调', label: '平级调动' },
  { value: '晋升', label: '晋升' },
  { value: '降职', label: '降职' },
  { value: '调动晋升', label: '调动并晋升' },
  { value: '跨部门调动', label: '跨部门调动' },
  { value: '借调', label: '临时借调' }
]

export const RESIGNATION_TYPES = [
  { value: 'voluntary', label: '主动离职' },
  { value: 'dismissal', label: '辞退' },
  { value: 'retirement', label: '退休' },
  { value: 'contract_expire', label: '合同到期' },
  { value: 'other', label: '其他' }
]

export const RESIGNATION_REASONS = [
  { value: 'personal', label: '个人原因' },
  { value: 'career', label: '职业发展' },
  { value: 'compensation', label: '薪资待遇' },
  { value: 'relocation', label: '异地搬迁' },
  { value: 'health', label: '健康原因' },
  { value: 'performance', label: '绩效不达标' },
  { value: 'violation', label: '违纪违规' },
  { value: 'restructure', label: '组织架构调整' },
  { value: 'other', label: '其他' }
]

export const EMPLOYEE_STATUS = [
  { value: '在职', label: '在职' },
  { value: '试用期', label: '试用期' },
  { value: '休假', label: '休假中' },
  { value: '离职中', label: '离职中' },
  { value: '已离职', label: '已离职' }
]

export const EDUCATION_LIST = [
  { value: '高中', label: '高中/中专' },
  { value: '大专', label: '大专' },
  { value: '本科', label: '本科' },
  { value: '硕士', label: '硕士' },
  { value: '博士', label: '博士' },
  { value: '其他', label: '其他' }
]

export const workTimeConfig = {
  morningStart: '09:00',
  morningEnd: '12:00',
  afternoonStart: '13:30',
  afternoonEnd: '18:00',
  lateThreshold: 15,
  earlyLeaveThreshold: 15
}

export function flattenDepartments(tree, parentId = null) {
  const result = []
  for (const node of tree) {
    result.push({
      id: node.id,
      name: node.name,
      parentId: node.parentId ?? parentId,
      code: node.code || '',
      description: node.description || '',
      managerId: node.managerId || null
    })
    if (node.children && node.children.length > 0) {
      result.push(...flattenDepartments(node.children, node.id))
    }
  }
  return result
}
