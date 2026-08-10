<script setup>
import { ref, onMounted, watch } from 'vue'
import { useShiftsStore } from '../../../store/shifts'
import { useEmployeeStore } from '../../../store/employees'
import BaseBadge from '../../../components/BaseBadge.vue'
import BaseButton from '../../../components/BaseButton.vue'
import BasePagination from '../../../components/BasePagination.vue'
import TableSkeleton from '../../../components/TableSkeleton.vue'
import { SearchIcon, CalendarIcon, HistoryIcon, UserIcon, PlusIcon, RefreshCwIcon, ClockIcon, XIcon, SettingsIcon } from '@lucide/vue'
import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

const shiftsStore = useShiftsStore()
const employeeStore = useEmployeeStore()

// Filter State
const searchQuery = ref('')
const selectedEmployeeId = ref('')
const startDateFilter = ref('')
const endDateFilter = ref('')
const currentPage = ref(1)

// Table State
const fixedRosters = ref([])
const rostersMeta = ref({ page: 1, last_page: 1, total: 0 })
const isLoading = ref(false)

// Modals State
const showDailyModal = ref(false)
const showHistoryModal = ref(false)
const showMasterConfigModal = ref(false)
const showWorkScheduleMasterModal = ref(false)

// Master Global Off-Days Config State
const globalOffDays = ref([0, 6]) // Default [0, 6] -> Sabtu & Minggu Libur
const isSubmittingMasterConfig = ref(false)

// Work Schedule Masters CRUD State (GET/POST/PUT/DELETE /api/v1/work-schedule-masters)
const isSubmittingMasterForm = ref(false)
const masterForm = ref({
  id: null,
  name: '',
  code: '',
  off_days: [0, 6],
  description: ''
})

const resetMasterForm = () => {
  masterForm.value = {
    id: null,
    name: '',
    code: '',
    off_days: [0, 6],
    description: ''
  }
}

const openEditMaster = (master) => {
  masterForm.value = {
    id: master.id,
    name: master.name,
    code: master.code,
    off_days: Array.isArray(master.off_days) ? [...master.off_days] : [0, 6],
    description: master.description || ''
  }
}

const handleSaveWorkScheduleMaster = async () => {
  if (!masterForm.value.name || !masterForm.value.code) {
    showToastWarning('Harap isi Nama dan Kode Master Pola Kerja!')
    return
  }

  try {
    isSubmittingMasterForm.value = true
    let res
    if (masterForm.value.id) {
      res = await shiftsStore.updateWorkScheduleMasterAction(masterForm.value.id, masterForm.value)
    } else {
      res = await shiftsStore.createWorkScheduleMasterAction(masterForm.value)
    }

    if (res && res.success) {
      showToastSuccess(`✅ Master Pola Kerja "${masterForm.value.name}" berhasil disimpan!`)
      resetMasterForm()
    } else {
      showToastError(res?.message || 'Gagal menyimpan Master Pola Kerja.')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmittingMasterForm.value = false
  }
}

const handleDeleteWorkScheduleMaster = async (id, name) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus Master Pola Kerja "${name}"?`)) return
  try {
    const res = await shiftsStore.deleteWorkScheduleMasterAction(id)
    if (res && res.success) {
      showToastSuccess(`🗑️ Master Pola Kerja "${name}" berhasil dihapus.`)
    } else {
      showToastError(res?.message || 'Penghapusan gagal.')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  }
}

const toggleOffDay = (dayIndex) => {
  const current = [...masterForm.value.off_days]
  const idx = current.indexOf(dayIndex)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(dayIndex)
  }
  masterForm.value.off_days = current
}

const handleSaveMasterConfig = async () => {
  try {
    isSubmittingMasterConfig.value = true
    const payload = {
      schedule_type: 'fixed',
      off_days: Array.isArray(globalOffDays.value) ? globalOffDays.value : [0, 6],
      notes: 'Update Master Aturan Hari Libur Perusahaan (off_days)'
    }
    const res = await shiftsStore.assignWorkScheduleAction(payload)
    if (res && res.success) {
      showToastSuccess('✅ Master Aturan Hari Libur Perusahaan berhasil diperbarui!')
      showMasterConfigModal.value = false
      await fetchFixedRostersData(1)
    } else {
      showToastError(res?.message || 'Gagal memperbarui Master Aturan Libur')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmittingMasterConfig.value = false
  }
}

// Daily Schedule Modal State
const selectedEmployee = ref(null)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const dailySchedule = ref(null)
const isLoadingDaily = ref(false)

// History Modal State
const historyList = ref([])
const isLoadingHistory = ref(false)

// Fetch Data Fixed Shift (GET /api/v1/work-schedules/assignments?schedule_type=fixed)
const fetchFixedRostersData = async (page = 1) => {
  currentPage.value = page
  try {
    isLoading.value = true
    const params = {}
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (selectedEmployeeId.value) params.employee_id = selectedEmployeeId.value
    if (startDateFilter.value) params.start_date = startDateFilter.value
    if (endDateFilter.value) params.end_date = endDateFilter.value

    let res = await shiftsStore.fetchWorkScheduleAssignments(page, 15, params)
    if (!res || !res.success) {
      res = await shiftsStore.fetchFixedRosters(page, 15, params)
    }

    if (res && res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
      
      // Client-side fallback filter
      let filtered = items
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        filtered = filtered.filter(item => {
          const empName = (item.employee?.name || item.employee_name || '').toLowerCase()
          const empNik = (item.employee?.nik || item.employee_code || '').toLowerCase()
          return empName.includes(q) || empNik.includes(q)
        })
      }
      if (selectedEmployeeId.value) {
        filtered = filtered.filter(item => String(item.employee_id || item.employee?.id) === String(selectedEmployeeId.value))
      }

      fixedRosters.value = filtered
      if (res.data.meta) {
        rostersMeta.value = res.data.meta
      } else {
        rostersMeta.value = { page, last_page: 1, total: filtered.length }
      }
    }
  } catch (err) {
    console.error('Failed to load fixed work schedule assignments:', err.message)
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedEmployeeId.value = ''
  startDateFilter.value = ''
  endDateFilter.value = ''
  fetchFixedRostersData(1)
}

// 👤 Cek Shift Tetap Karyawan per Tanggal (GET /api/v1/work-schedules/employees/{employee_id}/schedule?date=...)
const openDailyScheduleModal = async (emp) => {
  selectedEmployee.value = emp
  selectedDate.value = new Date().toISOString().split('T')[0]
  showDailyModal.value = true
  await loadDailySchedule()
}

const loadDailySchedule = async () => {
  if (!selectedEmployee.value || !selectedDate.value) return
  try {
    isLoadingDaily.value = true
    const empId = selectedEmployee.value.id || selectedEmployee.value.employee_id
    const res = await shiftsStore.fetchEmployeeDailySchedule(empId, selectedDate.value)
    if (res && res.success) {
      dailySchedule.value = res.data
    } else {
      dailySchedule.value = null
    }
  } catch (err) {
    console.error('Failed to fetch daily schedule:', err.message)
    dailySchedule.value = null
  } finally {
    isLoadingDaily.value = false
  }
}

// 📜 Lihat Riwayat Penugasan Shift Tetap (GET /api/v1/work-schedules/employees/{employee_id}/history)
const openHistoryModal = async (emp) => {
  selectedEmployee.value = emp
  showHistoryModal.value = true
  try {
    isLoadingHistory.value = true
    const empId = emp.id || emp.employee_id
    const res = await shiftsStore.fetchEmployeeScheduleHistory(empId)
    if (res && res.success && Array.isArray(res.data)) {
      historyList.value = res.data
    } else {
      historyList.value = []
    }
  } catch (err) {
    console.error('Failed to fetch schedule history:', err.message)
    historyList.value = []
  } finally {
    isLoadingHistory.value = false
  }
}

// Submit Assign Shift Tetap Baru (POST /api/v1/work-schedules/assign)
const handleAssignSubmit = async () => {
  if (!assignForm.value.employee_id || !assignForm.value.shift_id || !assignForm.value.effective_from) {
    showToastWarning('Harap lengkapi Karyawan, Shift Tetap, dan Tanggal Efektif!')
    return
  }

  try {
    isSubmittingAssign.value = true
    const payload = {
      employee_id: assignForm.value.employee_id,
      schedule_type: 'fixed',
      shift_id: assignForm.value.shift_id,
      off_days: Array.isArray(assignForm.value.off_days) ? assignForm.value.off_days : [0, 6],
      effective_from: assignForm.value.effective_from,
      effective_until: assignForm.value.effective_until || null,
      notes: assignForm.value.notes || 'Penugasan Shift Tetap Kantor'
    }

    const res = await shiftsStore.assignWorkScheduleAction(payload)
    if (res && res.success) {
      showToastSuccess('✅ Shift Tetap Kantor berhasil diterapkan!')
      showAssignModal.value = false
      assignForm.value = { employee_id: '', shift_id: '', off_days: [0, 6], effective_from: '', effective_until: '', notes: '' }
      await fetchFixedRostersData(1)
    } else {
      showToastError(res?.message || 'Gagal menerapkan Shift Tetap')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmittingAssign.value = false
  }
}

onMounted(async () => {
  if (!employeeStore.employees || !employeeStore.employees.length) {
    employeeStore.fetchEmployees()
  }
  if (!shiftsStore.shifts || !shiftsStore.shifts.length) {
    shiftsStore.fetchShiftsAction()
  }
  await Promise.allSettled([
    fetchFixedRostersData(1),
    shiftsStore.fetchWorkScheduleMastersAction()
  ])
})

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const formatOffDaysLabel = (offDays) => {
  if (!Array.isArray(offDays) || offDays.length === 0) {
    return 'Tanpa Libur (7 Hari Kerja)'
  }

  const sorted = [...offDays].map(Number).sort((a, b) => a - b)
  if (JSON.stringify(sorted) === JSON.stringify([0, 6])) {
    return '5 Hari Kerja (Sabtu & Minggu OFF)'
  }
  if (JSON.stringify(sorted) === JSON.stringify([0])) {
    return '6 Hari Kerja (Minggu OFF)'
  }

  const dayLabels = sorted.map(d => DAY_NAMES[d] || `Hari ${d}`).join(', ')
  return `Libur (${offDays.length} Hari): ${dayLabels}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (err) {
    return dateStr
  }
}
</script>

<template>
  <div class="space-y-5 font-sans">
    <!-- Header Section -->
    <div class="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md mb-1.5 font-mono">
          Non-Roster Management
        </div>
        <h2 class="font-bold text-base text-slate-900">Manajemen Shift Tetap &amp; Master Hari Libur</h2>
        <p class="text-xs text-slate-500 mt-1">
          Master Aturan Hari Libur Kantor Aktif:
          <strong class="text-slate-900 font-mono font-bold">
            {{ formatOffDaysLabel(globalOffDays) }}
          </strong>
        </p>
      </div>

      <BaseButton variant="primary-slate" @click="showMasterConfigModal = true">
        <SettingsIcon class="size-3.5" />
        <span>Edit Master Aturan Libur</span>
      </BaseButton>
    </div>

    <!-- FILTER & SEARCH BAR -->
    <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <!-- Search Input -->
        <div class="relative w-full md:w-60">
          <SearchIcon class="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            @input="fetchFixedRostersData(1)"
            type="text"
            placeholder="Cari NIK / Nama Karyawan..."
            class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-medium"
          />
        </div>

        <!-- Filter Employee -->
        <select
          v-model="selectedEmployeeId"
          @change="fetchFixedRostersData(1)"
          class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
        >
          <option value="">Semua Karyawan Kantor</option>
          <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.id">
            {{ emp.name }} ({{ emp.nik || 'EMP' }})
          </option>
        </select>
      </div>

      <!-- Date Range Filter -->
      <div class="flex items-center gap-2 w-full md:w-auto">
        <div class="flex items-center gap-1">
          <span class="text-xs font-semibold text-slate-600">Dari:</span>
          <input
            v-model="startDateFilter"
            @change="fetchFixedRostersData(1)"
            type="date"
            class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
          />
        </div>
        <div class="flex items-center gap-1">
          <span class="text-xs font-semibold text-slate-600">s/d:</span>
          <input
            v-model="endDateFilter"
            @change="fetchFixedRostersData(1)"
            type="date"
            class="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
          />
        </div>
        <button
          v-if="searchQuery || selectedEmployeeId || startDateFilter || endDateFilter"
          @click="resetFilters"
          class="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
          title="Reset Filter"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- TABLE FIXED ROSTERS (GET /api/v1/rosters?source=fixed) -->
    <div class="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/70 font-mono">
              <th class="py-3.5 px-4 font-semibold" scope="col">Nama Karyawan Kantor</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Master Shift Tetap</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Jam Kerja (Start - End)</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Tanggal Efektif Mulai</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Status</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoading" :columns="6" :rows="5" />
            <template v-else>
              <tr v-for="r in fixedRosters" :key="r.id || r.employee_id" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3.5 px-4">
                <span class="block font-bold text-slate-800">{{ r.employee ? r.employee.name : (r.employee_name || 'Karyawan Kantor') }}</span>
                <span class="block text-[10px] text-slate-400 font-mono">
                  {{ r.employee?.nik || r.employee?.employee_code || 'EMP' }} &bull; {{ r.employee?.department?.name || r.employee?.position?.name || 'Kantor Pusat' }}
                </span>
              </td>
              <td class="py-3.5 px-4 font-bold text-emerald-700">
                <span v-if="r.work_schedule_master || r.shift">
                  {{ r.work_schedule_master?.name || r.shift?.name }}
                  <span class="font-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase font-bold">({{ r.work_schedule_master?.code || r.shift?.code || 'WS-REG-5D' }})</span>
                </span>
                <span v-else class="text-slate-400 font-normal">Shift Pagi Kantor</span>
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                <span v-if="r.shift">{{ r.shift.start_time || r.shift.startTime }} &ndash; {{ r.shift.end_time || r.shift.endTime }}</span>
                <span v-else>08:00:00 &ndash; 17:00:00</span>
              </td>
              <td class="py-3.5 px-4 font-mono text-slate-600">
                {{ formatDate(r.effective_from || r.date) }}
              </td>
              <td class="py-3.5 px-4 text-center">
                <BaseBadge :variant="r.status === 'active' || !r.status ? 'success' : 'neutral'">
                  {{ (r.status || 'ACTIVE').toUpperCase() }}
                </BaseBadge>
              </td>
              <td class="py-3.5 px-4 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <BaseButton
                    variant="secondary"
                    class="!py-1 !px-2 text-[10px] font-bold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border-slate-200"
                    @click="openDailyScheduleModal(r.employee || r)"
                    title="Cek Jadwal Harian per Tanggal Spesifik"
                  >
                    <UserIcon class="size-3 text-emerald-600" />
                    <span>Cek Tanggal</span>
                  </BaseButton>
                  <BaseButton
                    variant="secondary"
                    class="!py-1 !px-2 text-[10px] font-bold text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50 border-slate-200"
                    @click="openHistoryModal(r.employee || r)"
                    title="Melihat Riwayat Penugasan Shift Tetap"
                  >
                    <HistoryIcon class="size-3 text-indigo-600" />
                    <span>Riwayat</span>
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-if="!isLoading && !fixedRosters.length">
              <td colspan="6" class="py-12 text-center text-slate-400 italic">
                Belum ada data penugasan Fixed Work Schedule.
              </td>
            </tr>
          </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION BAR -->
      <div v-if="rostersMeta.total > 0" class="p-4 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-slate-500 font-mono">Total Entri Shift Tetap: <strong>{{ rostersMeta.total }}</strong></span>
        <BasePagination
          :current-page="rostersMeta.page || rostersMeta.current_page || 1"
          :last-page="rostersMeta.last_page || 1"
          :total="rostersMeta.total || 0"
          :per-page="15"
          @page-change="(p) => fetchFixedRostersData(p)"
        />
      </div>
    </div>



    <!-- MODAL 2: CEK JADWAL PER TANGGAL (GET /api/v1/work-schedules/employees/{id}/schedule?date=...) -->
    <div v-if="showDailyModal && selectedEmployee" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">GET /work-schedules/employees/{id}/schedule</span>
            <h2 class="font-display font-black text-base text-slate-800 mt-1">Cek Shift Tetap Karyawan per Tanggal</h2>
          </div>
          <button @click="showDailyModal = false" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <XIcon class="size-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span class="block font-bold text-slate-800 text-sm">{{ selectedEmployee.name }}</span>
            <span class="block text-[10px] text-slate-400 font-mono">{{ selectedEmployee.nik || 'EMP' }}</span>
          </div>

          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Pilih Tanggal Kerja</label>
            <input
              v-model="selectedDate"
              @change="loadDailySchedule"
              type="date"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Loading / Result Card -->
          <div v-if="isLoadingDaily" class="p-6 text-center text-slate-400 font-mono italic">
            Memeriksa jadwal tanggal {{ selectedDate }}...
          </div>
          <div v-else-if="dailySchedule" class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-600">Status Hari:</span>
              <BaseBadge :variant="dailySchedule.is_day_off ? 'neutral' : 'success'">
                {{ dailySchedule.is_day_off ? '🌴 LIBUR / WEEKEND (OFF)' : 'WORK DAY' }}
              </BaseBadge>
            </div>
            <div class="flex justify-between items-center" v-if="dailySchedule.shift">
              <span class="font-bold text-slate-600">Shift Master:</span>
              <span class="font-bold text-emerald-700">{{ dailySchedule.shift.name }} ({{ dailySchedule.shift.code || 'SF' }})</span>
            </div>
            <div class="flex justify-between items-center" v-if="dailySchedule.shift">
              <span class="font-bold text-slate-600">Jam Kerja:</span>
              <span class="font-mono text-slate-700">{{ dailySchedule.shift.start_time }} &ndash; {{ dailySchedule.shift.end_time }}</span>
            </div>
          </div>
          <div v-else class="p-4 text-center text-slate-400 italic bg-slate-50 rounded-xl">
            Tidak ada data jadwal spesifik untuk tanggal {{ selectedDate }}.
          </div>

          <div class="flex justify-end pt-2">
            <BaseButton variant="secondary" @click="showDailyModal = false">Tutup</BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: RIWAYAT PENUGASAN SHIFT TETAP (GET /api/v1/work-schedules/employees/{id}/history) -->
    <div v-if="showHistoryModal && selectedEmployee" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">GET /work-schedules/employees/{id}/history</span>
            <h2 class="font-display font-black text-base text-slate-800 mt-1">Riwayat Penugasan Shift Tetap</h2>
          </div>
          <button @click="showHistoryModal = false" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <XIcon class="size-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 pr-1">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
            <span class="block font-bold text-slate-800 text-sm">{{ selectedEmployee.name }}</span>
            <span class="block text-[10px] text-slate-400 font-mono">{{ selectedEmployee.nik || 'EMP' }}</span>
          </div>

          <div v-if="isLoadingHistory" class="p-6 text-center text-slate-400 font-mono italic text-xs">
            Memuat riwayat penugasan...
          </div>
          <div v-else v-for="(h, idx) in historyList" :key="h.id || idx" class="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800">{{ h.shift ? h.shift.name : (h.schedule_type === 'fixed' ? 'Shift Tetap Kantor' : 'Roster') }}</span>
              <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{{ h.schedule_type || 'FIXED' }}</span>
            </div>
            <div class="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <ClockIcon class="size-3 text-slate-400" />
              <span>Efektif: {{ formatDate(h.effective_from) }} &ndash; {{ h.effective_until ? formatDate(h.effective_until) : 'Sekarang (Selamanya)' }}</span>
            </div>
            <p v-if="h.notes" class="text-[10px] text-slate-400 italic">"{{ h.notes }}"</p>
          </div>

          <div v-if="!isLoadingHistory && !historyList.length" class="p-6 text-center text-slate-400 italic text-xs bg-slate-50 rounded-xl">
            Belum ada riwayat penugasan shift tetap untuk karyawan ini.
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex justify-end mt-2">
          <BaseButton variant="secondary" @click="showHistoryModal = false">Tutup</BaseButton>
        </div>
      </div>
    </div>

    <!-- MODAL: MASTER ATURAN HARI LIBUR PERUSAHAAN (GLOBAL OFF-DAYS RULE) -->
    <div v-if="showMasterConfigModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Master Rule Perusahaan</span>
            <h2 class="font-display font-black text-base text-slate-800 mt-1">⚙️ Master Aturan Hari Libur Kantor</h2>
          </div>
          <button @click="showMasterConfigModal = false" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <XIcon class="size-4" />
          </button>
        </div>

        <form @submit.prevent="handleSaveMasterConfig" class="space-y-4 text-xs">
          <p class="text-slate-500">
            Pilih pola master hari libur kerja untuk seluruh karyawan kantor (non-roster):
          </p>

          <!-- Quick Presets -->
          <div class="space-y-2">
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">Preset Pilihan Cepat</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                type="button"
                @click="globalOffDays = [0, 6]"
                class="p-3 text-left rounded-xl border transition-all flex items-center justify-between"
                :class="JSON.stringify([...globalOffDays].sort()) === JSON.stringify([0, 6]) ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 hover:bg-white'"
              >
                <div>
                  <span class="block font-bold text-slate-800">5 Hari Kerja (Sabtu &amp; Minggu OFF)</span>
                  <span class="block text-[10px] text-slate-400">Jam kerja standar kantor (Senin - Jumat)</span>
                </div>
                <span class="font-mono text-xs font-bold text-emerald-700">[0, 6]</span>
              </button>

              <button
                type="button"
                @click="globalOffDays = [0]"
                class="p-3 text-left rounded-xl border transition-all flex items-center justify-between"
                :class="JSON.stringify([...globalOffDays].sort()) === JSON.stringify([0]) ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50 hover:bg-white'"
              >
                <div>
                  <span class="block font-bold text-slate-800">6 Hari Kerja (Hanya Minggu OFF)</span>
                  <span class="block text-[10px] text-slate-400">Jam kerja 6 hari (Senin - Sabtu)</span>
                </div>
                <span class="font-mono text-xs font-bold text-emerald-700">[0]</span>
              </button>
            </div>
          </div>

          <!-- Custom Checkboxes -->
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Kustomisasi Hari OFF (0=Minggu, 6=Sabtu)</label>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-4 gap-2">
              <label v-for="day in [
                { val: 0, label: 'Minggu' },
                { val: 1, label: 'Senin' },
                { val: 2, label: 'Selasa' },
                { val: 3, label: 'Rabu' },
                { val: 4, label: 'Kamis' },
                { val: 5, label: 'Jumat' },
                { val: 6, label: 'Sabtu' }
              ]" :key="day.val" class="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  :value="day.val"
                  v-model="globalOffDays"
                  class="accent-emerald-600 size-3.5"
                />
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <BaseButton variant="secondary" type="button" @click="showMasterConfigModal = false">Batal</BaseButton>
            <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmittingMasterConfig">
              <span>{{ isSubmittingMasterConfig ? 'Simpan Master...' : 'Simpan Master Aturan' }}</span>
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL MANAGEMENT MASTER POLA KERJA BARU (work-schedule-masters) -->
    <div v-if="showWorkScheduleMasterModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 class="font-display font-black text-lg text-slate-800">Master Pola Kerja Perusahaan</h3>
            <p class="text-xs text-slate-500 mt-0.5">Kelola daftar pola kerja master (RESTful API `/api/v1/work-schedule-masters`). Otomatis berlaku untuk seluruh karyawan terikat.</p>
          </div>
          <button @click="showWorkScheduleMasterModal = false" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <XIcon class="size-4" />
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Form Create / Edit Master -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 class="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <span>{{ masterForm.id ? '✏️ Edit Master Pola Kerja' : '➕ Tambah Master Pola Kerja Baru' }}</span>
            </h4>

            <form @submit.prevent="handleSaveWorkScheduleMaster" class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Nama Master Pola Kerja</label>
                <input v-model="masterForm.name" required type="text" placeholder="Contoh: Jadwal Toko Retail (Senin Libur)" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Kode Master</label>
                <input v-model="masterForm.code" required type="text" placeholder="Contoh: WS-RETAIL-MON" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold uppercase" />
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Pilih Hari Libur (off_days)</label>
                <div class="grid grid-cols-3 gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  <button
                    v-for="(dayName, dIdx) in ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']"
                    :key="dIdx"
                    type="button"
                    @click="toggleOffDay(dIdx)"
                    class="py-1 px-2 text-[10px] font-bold rounded-lg transition-colors border"
                    :class="masterForm.off_days.includes(dIdx) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
                  >
                    {{ dayName }}
                  </button>
                </div>
                <p class="text-[10px] text-slate-400 mt-1 font-mono">Hari OFF Aktif: {{ formatOffDaysLabel(masterForm.off_days) }}</p>
              </div>

              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Deskripsi Opsional</label>
                <textarea v-model="masterForm.description" rows="2" placeholder="Tuliskan keterangan detail pola kerja..." class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"></textarea>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button v-if="masterForm.id" type="button" @click="resetMasterForm" class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Batal Edit</button>
                <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmittingMasterForm">
                  <span>{{ masterForm.id ? 'Update Master' : 'Simpan Master Baru' }}</span>
                </BaseButton>
              </div>
            </form>
          </div>

          <!-- List Master Pola Kerja -->
          <div class="space-y-3">
            <h4 class="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Daftar Master Pola Kerja</span>
              <span class="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{{ shiftsStore.workScheduleMasters ? shiftsStore.workScheduleMasters.length : 0 }} Item</span>
            </h4>

            <div v-if="!shiftsStore.workScheduleMasters || !shiftsStore.workScheduleMasters.length" class="p-6 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl">
              Belum ada data master pola kerja. Silakan buat baru di form samping.
            </div>

            <div v-else class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <div v-for="m in shiftsStore.workScheduleMasters" :key="m.id" class="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors shadow-sm flex flex-col justify-between gap-2">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <h5 class="font-bold text-slate-800 text-xs">{{ m.name }}</h5>
                    <span class="font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">{{ m.code }}</span>
                  </div>
                  <p class="text-[11px] text-emerald-600 font-medium mt-1 font-mono">
                    {{ formatOffDaysLabel(m.off_days) }}
                  </p>
                  <p v-if="m.description" class="text-[10px] text-slate-400 mt-0.5 italic">{{ m.description }}</p>
                </div>

                <div class="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                  <button @click="openEditMaster(m)" class="px-2 py-1 text-[10px] font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button @click="handleDeleteWorkScheduleMaster(m.id, m.name)" class="px-2 py-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
