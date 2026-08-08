import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAuthStore } from './auth'
import { useEmployeesStore } from './employees'
import { usePayrollStore } from './payroll'
import { useLeavesStore } from './leaves'
import { useShiftsStore } from './shifts'
import { usePerformanceStore } from './performance'
import { useRecruitmentStore } from './recruitment'
import { useModulesStore } from './modules'
import { useSharedServicesStore } from './sharedServices'

export const useErpStore = defineStore('erp', () => {
  const auth = useAuthStore()
  const employees = useEmployeesStore()
  const payroll = usePayrollStore()
  const leaves = useLeavesStore()
  const shifts = useShiftsStore()
  const performance = usePerformanceStore()
  const recruitment = useRecruitmentStore()
  const modules = useModulesStore()
  const sharedServices = useSharedServicesStore()

  // Expose aggregated state and actions for backward compatibility
  return {
    // Auth
    token: computed(() => auth.token),
    user: computed(() => auth.user),
    isAuthenticated: computed(() => auth.isAuthenticated),
    loginAction: auth.loginAction,
    logoutAction: auth.logoutAction,

    // Modules
    modules: computed(() => modules.modules),
    activeModules: computed(() => modules.activeModules),

    // Shared Services & Audit (Module 02)
    nationalHolidays: computed(() => sharedServices.nationalHolidays),
    auditLogs: computed(() => sharedServices.auditLogs),
    employeeLocationHistories: computed(() => sharedServices.employeeLocationHistories),
    faceProfiles: computed(() => sharedServices.faceProfiles),
    loadNationalHolidays: sharedServices.loadNationalHolidays,
    createNationalHolidayAction: sharedServices.createNationalHolidayAction,
    updateNationalHolidayAction: sharedServices.updateNationalHolidayAction,
    deleteNationalHolidayAction: sharedServices.deleteNationalHolidayAction,
    loadLocationHistory: sharedServices.loadLocationHistory,
    loadFaceProfile: sharedServices.loadFaceProfile,
    registerFaceProfileAction: sharedServices.registerFaceProfileAction,
    revokeFaceProfileAction: sharedServices.revokeFaceProfileAction,
    loadAuditLogs: sharedServices.loadAuditLogs,

    // Employees & Master Data
    employees: computed(() => employees.employees),
    attendanceLogs: computed(() => employees.attendanceLogs),
    departments: computed(() => employees.departments),
    positions: computed(() => employees.positions),
    officeLocations: computed(() => employees.officeLocations),
    contracts: computed(() => employees.contracts),
    employeesPaginated: computed(() => employees.employeesPaginated),
    departmentsPaginated: computed(() => employees.departmentsPaginated),
    positionsPaginated: computed(() => employees.positionsPaginated),
    officeLocationsPaginated: computed(() => employees.officeLocationsPaginated),
    contractsPaginated: computed(() => employees.contractsPaginated),
    totalEmployees: computed(() => employees.totalEmployees),
    todayAttendanceRate: computed(() => employees.todayAttendanceRate),
    checkInEmployee: employees.checkInEmployee,
    loadEmployeesPaginated: employees.loadEmployeesPaginated,
    loadOfficeLocationsPaginated: employees.loadOfficeLocationsPaginated,
    loadDepartmentsPaginated: employees.loadDepartmentsPaginated,
    loadPositionsPaginated: employees.loadPositionsPaginated,
    loadContractsPaginated: employees.loadContractsPaginated,
    createEmployeeAction: employees.createEmployeeAction,
    updateEmployeeAction: employees.updateEmployeeAction,
    deleteEmployeeAction: employees.deleteEmployeeAction,
    createOfficeLocationAction: employees.createOfficeLocationAction,
    updateOfficeLocationAction: employees.updateOfficeLocationAction,
    deleteOfficeLocationAction: employees.deleteOfficeLocationAction,
    createDepartmentAction: employees.createDepartmentAction,
    updateDepartmentAction: employees.updateDepartmentAction,
    deleteDepartmentAction: employees.deleteDepartmentAction,
    createPositionAction: employees.createPositionAction,
    updatePositionAction: employees.updatePositionAction,
    deletePositionAction: employees.deletePositionAction,
    createContractAction: employees.createContractAction,
    updateContractAction: employees.updateContractAction,
    deleteContractAction: employees.deleteContractAction,

    // Payroll (Module 07)
    payrolls: computed(() => payroll.payrolls),
    overtimes: computed(() => payroll.overtimes),
    myPayslips: computed(() => payroll.myPayslips),
    totalPayrollAugust: computed(() => payroll.totalPayrollAugust),
    updatePayrollStatus: payroll.updatePayrollStatus,
    releasePayrollAction: payroll.releasePayrollAction,
    // Overtime (Module 06)
    requestOvertimeAction: payroll.requestOvertimeAction,
    claimOvertimeAction: payroll.claimOvertimeAction,
    approveOvertimeAction: payroll.approveOvertimeAction,

    // Performance
    reviews: computed(() => performance.reviews),
    rateManagerAction: performance.rateManagerAction,
    releaseScorecardAction: performance.releaseScorecardAction,

    // Recruitment
    jobs: computed(() => recruitment.jobs),
    candidates: computed(() => recruitment.candidates),
    convertCandidateAction: recruitment.convertCandidateAction,

    // Leaves (Module 04)
    leaves: computed(() => leaves.leaves),
    leaveTypes: computed(() => leaves.leaveTypes),
    leaveBalances: computed(() => leaves.leaveBalances),
    allLeaveBalances: computed(() => leaves.allLeaveBalances),
    allLeaveBalancesMeta: computed(() => leaves.allLeaveBalancesMeta),
    leaveCalendar: computed(() => leaves.leaveCalendar),
    requestLeaveAction: leaves.requestLeaveAction,
    approveLeaveAction: leaves.approveLeaveAction,
    createLeaveTypeAction: leaves.createLeaveTypeAction,
    updateLeaveTypeAction: leaves.updateLeaveTypeAction,
    deleteLeaveTypeAction: leaves.deleteLeaveTypeAction,
    adjustLeaveBalanceAction: leaves.adjustLeaveBalanceAction,
    loadAllLeaveBalancesAction: leaves.loadAllLeaveBalancesAction,
    loadLeavesOnly: leaves.loadInitialData,

    // Shifts & Roster Planning (Module 03 - Enterprise Blueprint)
    shifts: computed(() => shifts.shifts),
    shiftsPaginated: computed(() => shifts.shiftsPaginated),
    shiftTeams: computed(() => shifts.shiftTeams),
    rotationPatterns: computed(() => shifts.rotationPatterns),
    rotationPatternsPaginated: computed(() => shifts.rotationPatternsPaginated),
    workScheduleMasters: computed(() => shifts.workScheduleMasters),
    shiftSwaps: computed(() => shifts.shiftSwaps),
    rosterPlans: computed(() => shifts.rosterPlans),
    rosterPlansPaginated: computed(() => shifts.rosterPlansPaginated),
    activeValidationReport: computed(() => shifts.activeValidationReport),
    availablePeers: computed(() => shifts.availablePeers),
    rosters: computed(() => shifts.rosters),
    myRosters: computed(() => shifts.myRosters),
    todayRoster: computed(() => shifts.todayRoster),
    myShiftSwaps: computed(() => shifts.myShiftSwaps),
    assignWorkScheduleAction: shifts.assignWorkScheduleAction,
    assignRosterAction: shifts.assignRosterAction,
    adjustIndividualScheduleAction: shifts.adjustIndividualScheduleAction,
    requestShiftSwapAction: shifts.requestShiftSwapAction,
    respondShiftSwapPeerAction: shifts.respondShiftSwapPeerAction,
    approveShiftSwapAction: shifts.approveShiftSwapAction,
    createShiftAction: shifts.createShiftAction,
    updateShiftAction: shifts.updateShiftAction,
    deleteShiftAction: shifts.deleteShiftAction,
    fetchWorkScheduleMastersAction: shifts.fetchWorkScheduleMastersAction,
    createWorkScheduleMasterAction: shifts.createWorkScheduleMasterAction,
    updateWorkScheduleMasterAction: shifts.updateWorkScheduleMasterAction,
    deleteWorkScheduleMasterAction: shifts.deleteWorkScheduleMasterAction,
    loadRostersAction: shifts.loadRostersAction,
    generateTeamRosterAction: shifts.generateTeamRosterAction,
    createShiftTeamAction: shifts.createShiftTeamAction,
    updateShiftTeamAction: shifts.updateShiftTeamAction,
    deleteShiftTeamAction: shifts.deleteShiftTeamAction,
    addTeamMemberAction: shifts.addTeamMemberAction,
    setTeamRotationPatternAction: shifts.setTeamRotationPatternAction,
    updateRotationPatternAction: shifts.updateRotationPatternAction,
    createRosterPlanAction: shifts.createRosterPlanAction,
    fetchRosterPlanAction: shifts.fetchRosterPlanAction,
    updateRosterPlanAction: shifts.updateRosterPlanAction,
    generateRosterPlanAction: shifts.generateRosterPlanAction,
    validateRosterPlanAction: shifts.validateRosterPlanAction,
    publishRosterPlanAction: shifts.publishRosterPlanAction,
    lockRosterPlanAction: shifts.lockRosterPlanAction,
    deleteRosterPlanAction: shifts.deleteRosterPlanAction,
    deleteRotationPatternAction: shifts.deleteRotationPatternAction,
    fetchRosterPlansFilteredAction: shifts.fetchRosterPlansFilteredAction,
    fetchRotationPatternsFilteredAction: shifts.fetchRotationPatternsFilteredAction,
    fetchShiftsOnlyAction: shifts.fetchShiftsOnlyAction,
    fetchShiftTeamsOnlyAction: shifts.fetchShiftTeamsOnlyAction,
    fetchRosterPlansOnlyAction: shifts.fetchRosterPlansOnlyAction,
    fetchShiftSwapsOnlyAction: shifts.fetchShiftSwapsOnlyAction,
    fetchAvailablePeersAction: shifts.fetchAvailablePeersAction,

    // Employees Lazy Loaders (per-page on-demand)
    loadEmployeesOnly: employees.loadEmployeesOnly,
    loadDepartmentsOnly: employees.loadDepartmentsOnly,
    loadPositionsOnly: employees.loadPositionsOnly,
    loadOfficeLocationsOnly: employees.loadOfficeLocationsOnly,
    loadAttendanceSummaryOnly: employees.loadAttendanceSummaryOnly,
    loadContractsOnly: employees.loadContractsOnly,

    // Global Load — MINIMAL: only employees for dropdown references
    async loadInitialData() {
      if (!auth.isAuthenticated) return
      await employees.loadInitialData()
    }
  }
})
