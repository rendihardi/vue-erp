import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api'

export const usePayrollStore = defineStore('payroll', () => {
  // Payroll runs (Admin HR view)
  const payrolls = ref([])
  const overtimes = ref([])
  const myPayslips = ref([])

  const totalPayrollAugust = computed(() => {
    return payrolls.value.reduce((acc, pay) => {
      return acc + (pay.baseSalary + pay.allowance - pay.deductions)
    }, 0)
  })

  async function loadInitialData() {
    try {
      console.log('[API] Loading payroll runs history...')
      const payrollRes = await api.fetchPayrollRuns()
      if (payrollRes && payrollRes.success && Array.isArray(payrollRes.data)) {
        payrolls.value = payrollRes.data.map(pay => ({
          id: pay.id,
          idShort: String(pay.id).slice(0, 8),
          employeeId: pay.employee_id || 'EMP-001',
          name: pay.employee_name || pay.name || 'Karyawan',
          dept: pay.department || 'Departemen',
          baseSalary: pay.base_salary || 10000000,
          allowance: pay.allowance || 1500000,
          deductions: pay.deductions || 0,
          overtimePay: pay.overtime_pay || 0,
          netSalary: pay.net_salary || 0,
          status: pay.status || 'draft',
          month: pay.month,
          year: pay.year,
          totalEmployees: pay.total_employees,
          totalTakeHomePay: pay.total_take_home_pay
        }))
      }

      console.log('[API] Loading overtime requests...')
      const otRes = await api.fetchOvertimes()
      if (otRes && otRes.success) {
        const otData = Array.isArray(otRes.data) ? otRes.data : (otRes.data?.data || [])
        overtimes.value = otData.map(ot => ({
          id: ot.id,
          idShort: String(ot.id).slice(0, 8),
          employeeId: ot.employee_id,
          name: ot.employee_name || ot.employee?.name || 'Karyawan',
          dept: ot.department || ot.employee?.department?.name || 'Departemen',
          date: ot.date,
          plannedStart: ot.planned_start,
          plannedEnd: ot.planned_end,
          plannedHours: ot.planned_hours || 0,
          actualStart: ot.actual_start || null,
          actualEnd: ot.actual_end || null,
          actualHours: ot.actual_hours || 0,
          reason: ot.reason || '',
          workReport: ot.work_report || null,
          preApprovalStatus: ot.pre_approval_status || ot.status || 'pending_approval',
          claimStatus: ot.claim_status || 'none',
          // API Contract 06: calculated_pay after HR approval
          calculatedPay: ot.calculated_pay || 0,
          status: ot.status || 'pending_approval'
        }))
      }

      console.log('[API] Loading my payslips (self-service)...')
      const slipsRes = await api.fetchMyPayslips()
      if (slipsRes && slipsRes.success && Array.isArray(slipsRes.data)) {
        myPayslips.value = slipsRes.data.map(slip => ({
          id: slip.id,
          period: slip.period,
          basicSalary: slip.basic_salary || 0,
          overtimePay: slip.overtime_pay || 0,
          totalEarnings: slip.total_earnings || 0,
          totalDeductions: slip.total_deductions || 0,
          netSalary: slip.net_salary || 0
        }))
      }
    } catch (err) {
      console.error('[API Error] Fetching payroll data failed:', err.message)
    }
  }

  // API Contract 06.1: Pre-Approval Rencana Lembur
  async function requestOvertimeAction(data) {
    try {
      console.log('[API] Submitting overtime pre-approval request...')
      const res = await api.requestOvertime(data)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // API Contract 06.2: Klaim Aktual Lembur
  async function claimOvertimeAction(overtimeId, data) {
    try {
      console.log(`[API] Submitting actual overtime claim for ID: ${overtimeId}...`)
      const res = await api.claimOvertime(overtimeId, data)
      if (res && res.success) {
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // API Contract 06: HR Final Approval + calculated_pay
  async function approveOvertimeAction(otId, status, rejectionReason = null) {
    try {
      console.log(`[API] HR approving overtime ID: ${otId} to status: ${status}`)
      const res = await api.approveOvertime(otId, status, rejectionReason)
      if (res && res.success) {
        console.log(`[API] Overtime approved. Calculated pay: ${res.data?.calculated_pay || 0}`)
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // API Contract 07: Run Payroll
  async function updatePayrollStatus(runId = null, status = null) {
    try {
      console.log('[API] Running payroll calculation on server...')
      const currentDate = new Date()
      const res = await api.runPayroll(currentDate.getMonth() + 1, currentDate.getFullYear())
      if (res && res.success) {
        console.log('[API] Payroll run completed successfully')
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  // API Contract 07: Finalisasi & Release Payroll Slip
  async function releasePayrollAction(runId) {
    try {
      console.log(`[API] Releasing payroll run ID: ${runId}...`)
      const res = await api.releasePayroll(runId)
      if (res && res.success) {
        console.log('[API] Payroll released. Payslips now accessible to employees.')
        await loadInitialData()
      }
      return res
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message }
    }
  }

  return {
    payrolls,
    overtimes,
    myPayslips,
    totalPayrollAugust,
    loadInitialData,
    requestOvertimeAction,
    claimOvertimeAction,
    approveOvertimeAction,
    updatePayrollStatus,
    releasePayrollAction
  }
})

