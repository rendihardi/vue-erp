import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import { useErpStore } from '../store/erp'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  // Employees
  {
    path: '/employees',
    name: 'Employees',
    component: () => import('../views/employees/Employees.vue')
  },
  {
    path: '/employees/attendance',
    name: 'Attendance',
    component: () => import('../views/employees/Attendance.vue')
  },
  {
    path: '/employees/create',
    name: 'EmployeeCreate',
    component: () => import('../views/employees/EmployeeCreate.vue')
  },
  {
    path: '/employees/edit/:id',
    name: 'EmployeeEdit',
    component: () => import('../views/employees/EmployeeEdit.vue')
  },
  {
    path: '/employees/contracts',
    name: 'Contracts',
    component: () => import('../views/employees/Contracts.vue')
  },
  {
    path: '/employees/contracts/create',
    name: 'ContractCreate',
    component: () => import('../views/employees/ContractCreate.vue')
  },
  {
    path: '/employees/contracts/edit/:id',
    name: 'ContractEdit',
    component: () => import('../views/employees/ContractEdit.vue')
  },
  // Master Office Locations
  {
    path: '/employees/locations/create',
    name: 'OfficeLocationCreate',
    component: () => import('../views/employees/OfficeLocationCreate.vue')
  },
  {
    path: '/employees/locations/edit/:id',
    name: 'OfficeLocationEdit',
    component: () => import('../views/employees/OfficeLocationEdit.vue')
  },
  // Departments
  {
    path: '/employees/departments/create',
    name: 'DepartmentCreate',
    component: () => import('../views/employees/DepartmentCreate.vue')
  },
  {
    path: '/employees/departments/edit/:id',
    name: 'DepartmentEdit',
    component: () => import('../views/employees/DepartmentEdit.vue')
  },
  // Positions
  {
    path: '/employees/positions/create',
    name: 'PositionCreate',
    component: () => import('../views/employees/PositionCreate.vue')
  },
  {
    path: '/employees/positions/edit/:id',
    name: 'PositionEdit',
    component: () => import('../views/employees/PositionEdit.vue')
  },
  // KPI & Performance
  {
    path: '/employees/kpi',
    name: 'KPI',
    component: () => import('../views/kpi/KPI.vue')
  },
  // Recruitment
  {
    path: '/employees/recruitment',
    name: 'Recruitment',
    component: () => import('../views/recruitment/Recruitment.vue')
  },
  // Leaves
  {
    path: '/employees/leaves',
    name: 'Leaves',
    component: () => import('../views/leaves/Leaves.vue')
  },
  {
    path: '/employees/leaves/types/create',
    name: 'LeaveTypeCreate',
    component: () => import('../views/leaves/LeaveTypeCreate.vue')
  },
  {
    path: '/employees/leaves/types/edit/:id',
    name: 'LeaveTypeEdit',
    component: () => import('../views/leaves/LeaveTypeEdit.vue')
  },
  // Shifts
  {
    path: '/employees/shifts',
    name: 'Shifts',
    component: () => import('../views/shifts/Shifts.vue')
  },
  {
    path: '/employees/shifts/create',
    name: 'ShiftCreate',
    component: () => import('../views/shifts/ShiftCreate.vue')
  },
  {
    path: '/employees/shifts/edit/:id',
    name: 'ShiftEdit',
    component: () => import('../views/shifts/ShiftEdit.vue')
  },
  // Payroll & Overtime
  {
    path: '/payroll',
    name: 'Payroll',
    component: () => import('../views/payroll/Payroll.vue')
  },
  {
    path: '/payroll/overtime',
    name: 'Overtime',
    component: () => import('../views/payroll/Overtime.vue')
  },
  // Shared Services & Audit (Module 02)
  {
    path: '/employees/leaves/holidays',
    name: 'NationalHolidays',
    component: () => import('../views/leaves/NationalHolidays.vue')
  },
  {
    path: '/employees/detail/:id',
    name: 'EmployeeDetail',
    component: () => import('../views/employees/EmployeeDetail.vue')
  },
  {
    path: '/audit-logs',
    name: 'AuditLogs',
    component: () => import('../views/AuditLogs.vue')
  },
  // Authentication
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard for authentication checks
router.beforeEach((to, from, next) => {
  const erpStore = useErpStore()
  
  if (to.name !== 'Login' && !erpStore.isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && erpStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
