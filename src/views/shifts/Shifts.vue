<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShiftsStore } from '../../store/shifts'
import BaseButton from '../../components/BaseButton.vue'
import BasePagination from '../../components/BasePagination.vue'
import BaseBadge from '../../components/BaseBadge.vue'

// Import Modular Components
import RosterPlansTab from './components/RosterPlansTab.vue'
import RosterPlanModal from './components/RosterPlanModal.vue'
import SoftValidationModal from './components/SoftValidationModal.vue'
import ShiftTeamsTab from './components/ShiftTeamsTab.vue'
import ShiftTeamModal from './components/ShiftTeamModal.vue'
import RotationPatternModal from './components/RotationPatternModal.vue'
import ShiftSwapModal from './components/ShiftSwapModal.vue'
import TeamCalendarMatrixModal from './components/TeamCalendarMatrixModal.vue'
import FixedShiftsTab from './components/FixedShiftsTab.vue'
import WorkScheduleMastersTab from './components/WorkScheduleMastersTab.vue'

import { 
  SparklesIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  UserCheckIcon,
  LayersIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  XCircleIcon
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const shiftsStore = useShiftsStore()

const activeTab = ref(route.query.tab || 'shifts')

watch(() => route.query.tab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

// Modals Controls
const showCreateRosterPlanModal = ref(false)
const editingRosterPlan = ref(null)
const showValidationModal = ref(false)
const showTeamModal = ref(false)
const editingTeam = ref(null)
const showPatternModal = ref(false)
const patternTeam = ref(null)
const showMatrixCalendarModal = ref(false)
const matrixCalendarTeam = ref(null)
const showSwapModal = ref(false)
const showGenerateRosterModal = ref(false)
const selectedTeamId = ref('')
const generateStartDate = ref('')
const generateEndDate = ref('')
const isGeneratingRoster = ref(false)

// Form Penugasan Pola Kerja
const assignEmpId = ref('')
const assignScheduleType = ref('fixed')
const assignShiftId = ref('')
const assignEffectiveFrom = ref('')
const isAssigningSchedule = ref(false)

// Form Penugasan Roster Bulk
const selectedEmployees = ref([])
const selectedShift = ref('')
const startDate = ref('')
const endDate = ref('')
const isAssigningRoster = ref(false)

// State Search & Pagination Pola Rotasi
const patternSearchQuery = ref('')
const patternCurrentPage = ref(1)

const fetchFilteredRotationPatterns = async (page = 1) => {
  patternCurrentPage.value = page
  try {
    await shiftsStore.fetchRotationPatternsFilteredAction({
      page: patternCurrentPage.value,
      per_page: 9,
      search: patternSearchQuery.value
    })
  } catch (err) {
    showToastError('Gagal memuat Pola Rotasi: ' + err.message)
  }
}

const fetchFilteredRosterPlans = async (page = 1) => {
  try {
    await shiftsStore.fetchRosterPlansFilteredAction({ page, per_page: 9 })
  } catch (err) {
    console.warn('[Roster Plans Fetch Warning]', err.message)
  }
}

watch(patternSearchQuery, () => {
  fetchFilteredRotationPatterns(1)
})

// Event Handlers & Notifications
import { confirmAction, promptInput } from '../../utils/swal'
import { showToastSuccess, showToastError, showToastInfo, showToastWarning } from '../../utils/toast'

const handleAssignWorkSchedule = async () => {
  if (!assignEmpId.value || !assignEffectiveFrom.value) {
    showToastWarning('Harap lengkapi karyawan dan tanggal efektif!')
    return
  }
  if (assignScheduleType.value === 'fixed' && !assignShiftId.value) {
    showToastWarning('Shift tetap harus dipilih untuk mode fixed!')
    return
  }
  try {
    isAssigningSchedule.value = true
    const res = await shiftsStore.assignWorkScheduleAction({
      employee_id: assignEmpId.value,
      schedule_type: assignScheduleType.value,
      shift_id: assignScheduleType.value === 'fixed' ? assignShiftId.value : null,
      effective_from: assignEffectiveFrom.value
    })
    if (res && res.success) {
      showToastSuccess(`✅ Pola kerja '${assignScheduleType.value}' berhasil diterapkan!`)
      assignEmpId.value = ''
      assignShiftId.value = ''
      assignEffectiveFrom.value = ''
    } else {
      showToastError(res?.message || 'Gagal menerapkan pola kerja')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isAssigningSchedule.value = false
  }
}

const handleAssignRoster = async () => {
  if (!selectedShift.value || !startDate.value || !endDate.value || selectedEmployees.value.length === 0) {
    showToastWarning('Harap pilih shift, rentang tanggal, dan minimal satu karyawan!')
    return
  }
  try {
    isAssigningRoster.value = true
    const res = await shiftsStore.assignRosterAction({
      shift_id: selectedShift.value,
      start_date: startDate.value,
      end_date: endDate.value,
      employee_ids: selectedEmployees.value
    })
    if (res && res.success) {
      showToastSuccess('✅ Jadwal roster kerja massal berhasil diterapkan!')
      selectedEmployees.value = []
      selectedShift.value = ''
      startDate.value = ''
      endDate.value = ''
    } else {
      showToastError(res?.message || 'Gagal menetapkan roster massal')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isAssigningRoster.value = false
  }
}

const handleValidateRosterPlan = async (planId) => {
  const res = await shiftsStore.validateRosterPlanAction(planId)
  if (res && res.success) showValidationModal.value = true
}

const handleGenerateRosterPlan = async (planId) => {
  const isConfirmed = await confirmAction({
    title: 'Generate Entri Roster?',
    text: 'Sistem akan meng-generate jadwal shift harian untuk seluruh anggota tim di periode Roster Plan ini.',
    confirmButtonText: 'Ya, Generate Roster',
    icon: 'question'
  })
  if (!isConfirmed) return

  showToastInfo('Sedang meng-generate roster harian...')
  try {
    const res = await shiftsStore.generateRosterPlanAction(planId)
    if (res && res.success) {
      showToastSuccess(`⚡ Berhasil membuat ${res.data?.created_count || 0} entri roster harian!`)
    } else {
      showToastError(res?.message || 'Gagal meng-generate roster plan')
    }
  } catch (err) {
    showToastError(err.response?.data?.message || err.message || 'Gagal meng-generate roster plan')
  }
}

const handlePublishRosterPlan = async (planId) => {
  const isConfirmed = await confirmAction({
    title: 'Publikasikan Roster Plan?',
    text: 'Roster ini akan resmi diaktifkan untuk Mobile App karyawan dan mesin presensi.',
    confirmButtonText: 'Ya, Publikasikan Sekarang',
    icon: 'info'
  })
  if (!isConfirmed) return

  try {
    const res = await shiftsStore.publishRosterPlanAction(planId)
    if (res && res.success) {
      showToastSuccess('🚀 Roster Plan kini aktif di Mobile App & Presensi!')
    } else {
      showToastError(res?.message || 'Gagal mempublikasikan Roster Plan')
    }
  } catch (err) {
    showToastError(err.response?.data?.message || err.message || 'Gagal mempublikasikan Roster Plan')
  }
}

const handleLockRosterPlan = async (planId) => {
  const isConfirmed = await confirmAction({
    title: 'Kunci Periode Roster Plan?',
    text: 'Roster yang dikunci tidak dapat diubah lagi untuk keperluan finalisasi penggajian (payroll).',
    confirmButtonText: 'Ya, Kunci Roster',
    icon: 'warning'
  })
  if (!isConfirmed) return

  try {
    const res = await shiftsStore.lockRosterPlanAction(planId)
    if (res && res.success) {
      showToastSuccess('🔒 Roster Plan resmi dikunci!')
    } else {
      showToastError(res?.message || 'Gagal mengunci Roster Plan')
    }
  } catch (err) {
    showToastError(err.response?.data?.message || err.message || 'Gagal mengunci Roster Plan')
  }
}

const handlePeerRespond = async (swapId, responseType) => {
  let rejectionReason = null
  if (responseType === 'reject') {
    rejectionReason = await promptInput({
      title: 'Alasan Penolakan',
      placeholder: 'Tuliskan alasan Anda menolak tukar shift...'
    })
    if (rejectionReason === null) return
  }
  await shiftsStore.respondShiftSwapPeerAction(swapId, responseType, rejectionReason)
  showToastSuccess('Respon pertukaran shift berhasil diperbarui!')
}

const handleHrApprove = async (swapId, status) => {
  let rejectionReason = null
  if (status === 'rejected') {
    rejectionReason = await promptInput({
      title: 'Alasan Penolakan HR Admin',
      placeholder: 'Tuliskan alasan penolakan HR...'
    })
    if (rejectionReason === null) return
  }
  await shiftsStore.approveShiftSwapAction(swapId, status, rejectionReason)
  showToastSuccess(status === 'approved' ? '✅ Pertukaran shift disetujui HR Admin!' : '❌ Pertukaran shift ditolak HR Admin!')
}

const handleDeleteShift = async (id) => {
  const isConfirmed = await confirmAction({
    title: 'Hapus Shift Kerja?',
    text: 'Shift kerja ini akan dihapus permanen dari master data.',
    confirmButtonText: 'Ya, Hapus Shift',
    icon: 'error'
  })
  if (!isConfirmed) return
  await shiftsStore.deleteShiftAction(id)
  showToastSuccess('🗑️ Shift kerja berhasil dihapus!')
}

const handleDeleteTeam = async (team) => {
  const isConfirmed = await confirmAction({
    title: `Hapus Tim '${team.name}'?`,
    text: 'Tim shift ini akan dihapus dari sistem.',
    confirmButtonText: 'Ya, Hapus Tim',
    icon: 'error'
  })
  if (!isConfirmed) return
  await shiftsStore.deleteShiftTeamAction(team.id)
  showToastSuccess(`🗑️ Tim shift '${team.name}' berhasil dihapus!`)
}

const handleDeletePattern = async (pattern) => {
  const isConfirmed = await confirmAction({
    title: `Hapus Pola Rotasi '${pattern.name}'?`,
    text: 'Pola rotasi shift ini akan dihapus dari sistem.',
    confirmButtonText: 'Ya, Hapus Pola Rotasi',
    icon: 'error'
  })
  if (!isConfirmed) return
  try {
    const res = await shiftsStore.deleteRotationPatternAction(pattern.id)
    if (res && res.success) {
      showToastSuccess(`🗑️ Pola rotasi '${pattern.name}' berhasil dihapus!`)
    } else {
      showToastError(res?.message || 'Gagal menghapus pola rotasi')
    }
  } catch (err) {
    showToastError('Error menghapus pola rotasi: ' + err.message)
  }
}

// Lazy load data per tab dynamically on demand
const loadDataForTab = (tab) => {
  if (tab === 'shifts') {
    shiftsStore.fetchShiftsOnlyAction()
  } else if (tab === 'patterns') {
    fetchFilteredRotationPatterns(1)
  } else if (tab === 'teams') {
    shiftsStore.fetchShiftTeamsOnlyAction()
  } else if (tab === 'plans' || tab === 'roster-plans') {
    fetchFilteredRosterPlans(1)
  } else if (tab === 'swaps') {
    shiftsStore.fetchShiftSwapsOnlyAction()
  }
}

watch(activeTab, (newTab) => {
  loadDataForTab(newTab)
})

onMounted(() => {
  loadDataForTab(activeTab.value)
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- HEADER -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Module 03: Shift &amp; Roster Management (Enterprise Architecture)
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Manajemen Pola Shift &amp; Enterprise Roster
        </h1>
        <p class="text-xs text-slate-500">
          Kelola master shift, kontainer Roster Plan, tim shift, pola rotasi, dan pertukaran shift 2-tahap.
        </p>
      </div>

      <div>
        <BaseButton v-if="activeTab === 'shifts'" variant="primary-emerald" @click="router.push('/employees/shifts/create')">
          <PlusIcon class="size-3.5" />
          <span>Tambah Shift</span>
        </BaseButton>
        <BaseButton v-else-if="activeTab === 'plans'" variant="primary-emerald" @click="showCreateRosterPlanModal = true">
          <PlusIcon class="size-3.5" />
          <span>Buat Roster Plan Baru</span>
        </BaseButton>
        <div v-else-if="activeTab === 'teams'">
          <BaseButton variant="primary-emerald" @click="editingTeam = null; showTeamModal = true">
            <PlusIcon class="size-3.5" />
            <span>Buat Tim Shift Baru</span>
          </BaseButton>
        </div>
        <BaseButton v-else-if="activeTab === 'swaps'" variant="primary-emerald" @click="showSwapModal = true">
          <PlusIcon class="size-3.5" />
          <span>Pengajuan Tukar Shift</span>
        </BaseButton>
      </div>
    </div>

    <!-- TABS NAVIGATION (Royal Blue Pill Tabs) -->
    <div class="flex bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 gap-1 overflow-x-auto" role="tablist">
      <button
        @click="activeTab = 'shifts'; router.replace('/employees/shifts?tab=shifts')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'shifts' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Shift Master</span>
      </button>
      <button
        @click="activeTab = 'patterns'; router.replace('/employees/shifts?tab=patterns')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'patterns' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Rotation Pattern</span>
      </button>
      <button
        @click="activeTab = 'teams'; router.replace('/employees/shifts?tab=teams')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'teams' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Shift Team</span>
      </button>
      <button
        @click="activeTab = 'plans'; router.replace('/employees/shifts?tab=plans')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'plans' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Roster Plan</span>
      </button>
      <button
        @click="activeTab = 'work-schedules'; router.replace('/employees/shifts?tab=work-schedules')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'work-schedules' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Master Pola Kerja</span>
      </button>
      <button
        @click="activeTab = 'fixed'; router.replace('/employees/shifts?tab=fixed')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'fixed' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Penugasan Shift Tetap</span>
      </button>
      <button
        @click="activeTab = 'swaps'; router.replace('/employees/shifts?tab=swaps')"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl transition-all focus:outline-none whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        :class="activeTab === 'swaps' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
      >
        <span>Pertukaran Shift</span>
      </button>
    </div>

    <!-- TAB 1: MASTER SHIFTS -->
    <div v-if="activeTab === 'shifts'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        v-for="sf in shiftsStore.shifts" 
        :key="sf.id"
        class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono font-bold uppercase">{{ sf.code }}</span>
            <div class="flex gap-1">
              <BaseButton variant="secondary" @click="router.push(`/employees/shifts/edit/${sf.id}`)" class="!p-1">
                <EditIcon class="size-3 text-slate-500" />
              </BaseButton>
              <BaseButton variant="danger" @click="handleDeleteShift(sf.id)" class="!p-1">
                <TrashIcon class="size-3 text-white" />
              </BaseButton>
            </div>
          </div>
          <h2 class="font-display font-black text-base text-slate-800 mb-1">{{ sf.name }}</h2>
          <p class="text-xs text-slate-500 font-mono mt-2 flex items-center gap-1">
            <ClockIcon class="size-3.5" />
            <span>Jam Kerja: {{ sf.startTime }} - {{ sf.endTime }}</span>
          </p>
        </div>
        <div class="text-[10px] text-indigo-600 font-semibold mt-4 border-t border-slate-100 pt-3">
          Toleransi keterlambatan: {{ sf.gracePeriodMinutes }} Menit
        </div>
      </div>
      <div v-if="!shiftsStore.shifts.length" class="col-span-3 text-center text-slate-400 italic py-8 bg-white border border-slate-200 rounded-2xl">
        Belum ada data shift terdaftar.
      </div>
    </div>

    <!-- TAB 2: ROTATION PATTERN -->
    <section v-if="activeTab === 'patterns'" class="space-y-6 font-sans">
      <div class="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 shadow-sm flex items-start justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/60 px-2 py-0.5 rounded-full mb-1">
            Sequence Engine &bull; Mode Libur Rotasi vs Weekend
          </div>
          <h2 class="font-display font-black text-base text-slate-800">Master Pola Rotasi Shift (Rotation Patterns)</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Pola rotasi mengatur urutan jam kerja berulang (misal: <em>2 Pagi &rarr; 2 Sore &rarr; 2 Malam &rarr; 2 Off</em>). Pola ini dikaitkan dengan Tim Shift &amp; Roster Plan.
          </p>
        </div>
        <BaseButton variant="primary-emerald" @click="patternTeam = null; showPatternModal = true">
          <PlusIcon class="size-3.5" />
          <span>Atur Pola Rotasi Baru</span>
        </BaseButton>
      </div>

      <!-- SEARCH CONTROL BAR FOR ROTATION PATTERNS -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div class="relative w-full sm:w-80">
          <SearchIcon class="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="patternSearchQuery"
            type="text"
            placeholder="Cari nama Pola Rotasi..."
            class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <span class="text-xs text-slate-400 font-mono">
          Paginasi Pola Rotasi Aktif
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="pattern in (shiftsStore.rotationPatterns || [])" 
          :key="pattern.id"
          class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between group relative"
        >
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[9px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-bold uppercase border border-indigo-100">
                ROTATION PATTERN
              </span>
              <span class="text-[10px] text-slate-400 font-mono font-semibold">{{ (pattern.rotation_sequence || pattern.sequence || []).length }} Langkah</span>
            </div>
            <h3 class="font-display font-black text-base text-slate-800 mb-1">{{ pattern.name }}</h3>
            <p v-if="pattern.description" class="text-xs text-slate-500 mb-3">{{ pattern.description }}</p>

            <!-- Render Langkah-Langkah Siklus Rotasi -->
            <div v-if="(pattern.rotation_sequence || pattern.sequence) && (pattern.rotation_sequence || pattern.sequence).length" class="flex flex-wrap gap-1.5 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span
                v-for="(step, idx) in (pattern.rotation_sequence || pattern.sequence)"
                :key="idx"
                class="px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1"
                :class="step.is_day_off ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'"
              >
                <span>{{ step.shift?.name || step.shift_name || (step.is_day_off ? 'OFF' : 'SHIFT') }}</span>
                <span class="text-[9px] opacity-75">({{ step.duration_days }}x)</span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
            <BaseButton variant="secondary" class="flex-1 justify-center text-xs" @click="patternTeam = pattern; showPatternModal = true">
              <EditIcon class="size-3.5" />
              <span>Detail &amp; Edit</span>
            </BaseButton>
            <BaseButton
              v-if="pattern.id"
              variant="danger"
              class="!py-2 !px-3 text-xs"
              @click="handleDeletePattern(pattern)"
              title="Hapus Pola Rotasi"
            >
              <TrashIcon class="size-3.5" />
            </BaseButton>
          </div>
        </div>

        <div v-if="!shiftsStore.rotationPatterns || !shiftsStore.rotationPatterns.length" class="col-span-3 p-10 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <RefreshCwIcon class="size-8 text-slate-300 mx-auto mb-2" />
          <p class="text-xs text-slate-500 font-medium mb-3">Belum ada pola rotasi khusus terdaftar.</p>
          <BaseButton variant="primary-emerald" @click="patternTeam = null; showPatternModal = true">
            <PlusIcon class="size-3.5" />
            <span>Atur Pola Rotasi Pertama</span>
          </BaseButton>
        </div>
      </div>

      <!-- PAGINATION BAR FOR ROTATION PATTERNS -->
      <div v-if="shiftsStore.rotationPatternsPaginated && shiftsStore.rotationPatternsPaginated.total > 0" class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <span class="text-xs text-slate-500 font-mono">
          Total Pola Rotasi: <strong>{{ shiftsStore.rotationPatternsPaginated.total }}</strong>
        </span>
        <BasePagination
          :current-page="shiftsStore.rotationPatternsPaginated.current_page || 1"
          :last-page="shiftsStore.rotationPatternsPaginated.last_page || 1"
          :total="shiftsStore.rotationPatternsPaginated.total || 0"
          :per-page="9"
          @page-change="(p) => fetchFilteredRotationPatterns(p)"
        />
      </div>
    </section>

    <!-- TAB 3: TIM SHIFT -->
    <ShiftTeamsTab
      v-if="activeTab === 'teams'"
      @open-create-team="editingTeam = null; showTeamModal = true"
      @open-edit-team="(t) => { editingTeam = t; showTeamModal = true }"
      @delete-team="handleDeleteTeam"
      @open-pattern-modal="(t) => { patternTeam = t; showPatternModal = true }"
      @open-matrix-calendar="(t) => { matrixCalendarTeam = t; showMatrixCalendarModal = true }"
      @open-generate-roster="(id) => { selectedTeamId = id; showGenerateRosterModal = true }"
    />

    <!-- TAB 4: ENTERPRISE ROSTER PLANS -->
    <RosterPlansTab
      v-if="activeTab === 'plans'"
      @open-create-plan="editingRosterPlan = null; showCreateRosterPlanModal = true"
      @open-edit-plan="(plan) => { editingRosterPlan = plan; showCreateRosterPlanModal = true }"
      @generate-plan="handleGenerateRosterPlan"
      @validate-plan="handleValidateRosterPlan"
      @publish-plan="handlePublishRosterPlan"
      @lock-plan="handleLockRosterPlan"
      @open-matrix-calendar="(t) => { matrixCalendarTeam = t; showMatrixCalendarModal = true }"
    />

    <!-- TAB 5: DEDICATED MASTER POLA KERJA PERUSAHAAN (work-schedule-masters) -->
    <WorkScheduleMastersTab v-if="activeTab === 'work-schedules'" />

    <!-- TAB 6: FIXED SHIFTS (SHIFT TETAP NON-ROSTER KANTOR) -->
    <FixedShiftsTab v-if="activeTab === 'fixed'" />



    <!-- TAB 6: SHIFT SWAPS -->
    <section v-if="activeTab === 'swaps'" class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm font-sans" aria-labelledby="swaps-title">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 id="swaps-title" class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <RefreshCwIcon class="size-4.5 text-emerald-600" aria-hidden="true" />
            <span>Permohonan Pertukaran Shift (Alur 2-Tahap / 2-Stage Interaction)</span>
          </h2>
          <p class="text-xs text-slate-500">
            Alur: Pemohon ajukan (<code class="font-mono text-[10px] bg-slate-100 px-1 rounded">pending_peer</code>) &rarr; Rekan setujui (<code class="font-mono text-[10px] bg-slate-100 px-1 rounded">pending_hr</code>) / tolak &rarr; HR Admin finalisasi (<code class="font-mono text-[10px] bg-slate-100 px-1 rounded">approved</code>/<code class="font-mono text-[10px] bg-slate-100 px-1 rounded">rejected</code>).
          </p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Pemohon (Requester)</th>
              <th class="py-3 px-4 font-semibold" scope="col">Rekan Target (Peer)</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Pemohon</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Rekan</th>
              <th class="py-3 px-4 font-semibold text-center" scope="col">Status Alur 2-Tahap</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi Persetujuan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr 
              v-for="sw in shiftsStore.shiftSwaps" 
              :key="sw.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="py-3.5 px-4 font-bold text-slate-800">{{ sw.requesterName }}</td>
              <td class="py-3.5 px-4 font-semibold text-slate-700">{{ sw.targetName }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ sw.requesterDate }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ sw.requestedDate }}</td>
              <td class="py-3.5 px-4 text-center">
                <BaseBadge 
                  :variant="
                    sw.status === 'approved' ? 'success' : 
                    sw.status === 'pending_hr' ? 'info' : 
                    sw.status === 'pending_peer' ? 'warning' : 'danger'
                  "
                >
                  {{ 
                    sw.status === 'pending_peer' ? 'Tahap 1: Menunggu Rekan' : 
                    sw.status === 'pending_hr' ? 'Tahap 2: Menunggu HR' : 
                    sw.status === 'approved' ? 'Approved &amp; Shift Ditukar' :
                    sw.status === 'rejected_peer' ? 'Ditolak Rekan Kerja' : 'Ditolak HR'
                  }}
                </BaseBadge>
              </td>
              <td class="py-3.5 px-4 text-center">
                <!-- Tahap 1: Menunggu Rekan Kerja (Tanpa Tombol, HR Menunggu Rekan Setuju) -->
                <div v-if="sw.status === 'pending_peer'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-medium italic">
                  <span>⏳ Menunggu Persetujuan Rekan Kerja</span>
                </div>

                <!-- Tahap 2: Rekan Sudah Setuju -> HR Admin Bisa Aksi Final -->
                <div v-else-if="sw.status === 'pending_hr' || sw.status === 'peer_approved'" class="flex justify-center gap-1.5">
                  <BaseButton variant="primary-emerald" class="!py-1 !px-2 text-[10px]" @click="handleHrApprove(sw.id, 'approved')">
                    Setujui HR
                  </BaseButton>
                  <BaseButton variant="danger" class="!py-1 !px-2 text-[10px]" @click="handleHrApprove(sw.id, 'rejected')">
                    Tolak HR
                  </BaseButton>
                </div>

                <!-- Status Final: Approved / Rejected -->
                <div v-else-if="sw.status === 'approved'" class="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                  <CheckCircle2Icon class="size-3.5" />
                  <span>Approved &amp; Shift Ditukar</span>
                </div>
                <div v-else-if="sw.status === 'rejected_peer' || sw.status === 'peer_rejected'" class="inline-flex items-center gap-1 text-rose-600 text-[10px] font-semibold">
                  <XCircleIcon class="size-3.5" />
                  <span>Ditolak Rekan Kerja</span>
                </div>
                <div v-else-if="sw.status === 'rejected' || sw.status === 'hr_rejected'" class="inline-flex items-center gap-1 text-rose-600 text-[10px] font-semibold">
                  <XCircleIcon class="size-3.5" />
                  <span>Ditolak HR Admin</span>
                </div>
              </td>
            </tr>
            <tr v-if="!shiftsStore.shiftSwaps.length">
              <td colspan="6" class="py-8 text-center text-slate-400 italic font-medium">
                Tidak ada permohonan pertukaran shift kerja aktif.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- MODALS CONTAINER -->
    <RosterPlanModal
      :show="showCreateRosterPlanModal"
      :editing-plan="editingRosterPlan"
      @close="showCreateRosterPlanModal = false"
      @created="fetchFilteredRosterPlans(1)"
      @saved="fetchFilteredRosterPlans(1)"
    />

    <SoftValidationModal
      :show="showValidationModal"
      @close="showValidationModal = false"
      @publish="(planId) => { showValidationModal = false; handlePublishRosterPlan(planId) }"
    />

    <ShiftTeamModal
      :show="showTeamModal"
      :editing-team="editingTeam"
      @close="showTeamModal = false"
      @saved="shiftsStore.fetchShiftTeamsOnlyAction()"
    />

    <RotationPatternModal
      :show="showPatternModal"
      :team="patternTeam"
      @close="showPatternModal = false"
      @saved="fetchFilteredRotationPatterns(1)"
    />

    <TeamCalendarMatrixModal
      :show="showMatrixCalendarModal"
      :team="matrixCalendarTeam"
      @close="showMatrixCalendarModal = false"
    />

    <ShiftSwapModal
      :show="showSwapModal"
      @close="showSwapModal = false"
      @submitted="shiftsStore.fetchShiftSwapsOnlyAction()"
    />
  </main>
</template>
