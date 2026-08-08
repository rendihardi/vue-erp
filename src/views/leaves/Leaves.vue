<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErpStore } from '../../store/erp'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import BasePagination from '../../components/BasePagination.vue'
import TableSkeleton from '../../components/TableSkeleton.vue'
import { 
  CalendarDaysIcon, 
  SparklesIcon,
  CheckCircle2Icon,
  XCircleIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  CalendarIcon,
  UploadIcon,
  PaperclipIcon
} from '@lucide/vue'

import { useLeavesStore } from '../../store/leaves'
const leavesStore = useLeavesStore()

const route = useRoute()
const router = useRouter()
const erpStore = useErpStore()

const activeTab = ref(route.query.tab || 'requests')

// HR Admin All-Balances Table State (GET /api/v1/leaves/all-balances)
const balanceSearchQuery = ref('')
const balanceYearFilter = ref(new Date().getFullYear())
const balanceCurrentPage = ref(1)
const isLoadingAllBalances = ref(false)

const fetchAllBalancesData = async (page = 1) => {
  balanceCurrentPage.value = page
  try {
    isLoadingAllBalances.value = true
    const params = { year: balanceYearFilter.value }
    if (balanceSearchQuery.value.trim()) params.search = balanceSearchQuery.value.trim()
    await leavesStore.loadAllLeaveBalancesAction(page, 15, params)
  } catch (err) {
    console.warn('[API Warning] All balances fetch error:', err.message)
  } finally {
    isLoadingAllBalances.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'balances') {
    fetchAllBalancesData(1)
  }
}, { immediate: true })

watch(() => route.query.tab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

import { showSuccess, showError, showWarning, confirmAction, promptInput } from '../../utils/swal'
import { showToastSuccess, showToastError } from '../../utils/toast'

// Leave request modal state
const showRequestModal = ref(false)
const requestForm = ref({
  leave_type_id: '',
  start_date: '',
  end_date: '',
  reason: ''
})
const attachmentFile = ref(null)
const isSubmittingRequest = ref(false)

// Leave Balance Adjust Modal State (POST /api/v1/leaves/balances/adjust)
const showAdjustBalanceModal = ref(false)
const adjustBalanceForm = ref({
  employee_id: '',
  leave_type_id: '',
  year: new Date().getFullYear(),
  allocated: 12
})
const isSubmittingAdjust = ref(false)

const openAdjustModal = (balanceItem = null) => {
  if (balanceItem) {
    adjustBalanceForm.value = {
      employee_id: balanceItem.employeeId || balanceItem.employee_id || '',
      leave_type_id: balanceItem.leaveTypeId || balanceItem.leave_type_id || '',
      year: balanceItem.year || new Date().getFullYear(),
      allocated: balanceItem.quotaAllocated || balanceItem.allocated || 12
    }
  } else {
    adjustBalanceForm.value = {
      employee_id: erpStore.employees?.[0]?.id || '',
      leave_type_id: erpStore.leaveTypes?.[0]?.id || '',
      year: new Date().getFullYear(),
      allocated: 12
    }
  }
  showAdjustBalanceModal.value = true
}

const handleAdjustBalance = async () => {
  if (!adjustBalanceForm.value.employee_id || !adjustBalanceForm.value.leave_type_id || !adjustBalanceForm.value.allocated) {
    showToastWarning('Harap lengkapi karyawan, jenis cuti, dan kuota teralokasi!')
    return
  }

  try {
    isSubmittingAdjust.value = true
    const res = await leavesStore.adjustLeaveBalanceAction(adjustBalanceForm.value)
    if (res && res.success) {
      showToastSuccess('✅ Kuota jatah cuti karyawan berhasil diperbarui!')
      showAdjustBalanceModal.value = false
      if (activeTab.value === 'balances') {
        fetchAllBalancesData(balanceCurrentPage.value)
      }
    } else {
      showToastError(res?.message || 'Gagal mengubah kuota cuti.')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmittingAdjust.value = false
  }
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    attachmentFile.value = file
  }
}

const handleCreateLeaveRequest = async () => {
  if (!requestForm.value.leave_type_id || !requestForm.value.start_date || !requestForm.value.end_date || !requestForm.value.reason) {
    showWarning('Form Belum Lengkap', 'Harap lengkapi semua field permohonan cuti!')
    return
  }

  // Check if chosen leave type requires attachment
  const selectedType = erpStore.leaveTypes.find(t => String(t.id) === String(requestForm.value.leave_type_id))
  if (selectedType && selectedType.requires_attachment && !attachmentFile.value) {
    showWarning('Lampiran Wajib', `Jenis cuti "${selectedType.name}" mewajibkan lampiran berkas pendukung (surat sakit/dokumen medis).`)
    return
  }

  try {
    isSubmittingRequest.value = true
    const formData = new FormData()
    formData.append('leave_type_id', requestForm.value.leave_type_id)
    formData.append('start_date', requestForm.value.start_date)
    formData.append('end_date', requestForm.value.end_date)
    formData.append('reason', requestForm.value.reason)
    if (attachmentFile.value) {
      formData.append('attachment', attachmentFile.value)
    }

    await erpStore.requestLeaveAction(formData)
    showSuccess('Permohonan Terkirim!', 'Permohonan cuti berhasil diajukan! (Kalkulasi hari otomatis mengabaikan weekend & libur nasional).')
    showRequestModal.value = false
    requestForm.value = { leave_type_id: '', start_date: '', end_date: '', reason: '' }
    attachmentFile.value = null
  } catch (err) {
    showError('Pengajuan Gagal', err.message)
  } finally {
    isSubmittingRequest.value = false
  }
}

const handleApprove = async (leaveId) => {
  const isConfirmed = await confirmAction({
    title: 'Setujui Permohonan Cuti?',
    text: 'Permohonan cuti ini akan disetujui HR & saldo cuti karyawan akan otomatis terpotong.',
    confirmButtonText: 'Ya, Setujui Cuti',
    icon: 'info'
  })
  if (!isConfirmed) return

  try {
    await erpStore.approveLeaveAction(leaveId, 'approved')
    showSuccess('Cuti Disetujui!', 'Permohonan cuti berhasil disetujui & saldo cuti otomatis terpotong.')
  } catch (err) {
    showError('Persetujuan Gagal', err.message)
  }
}

const handleReject = async (leaveId) => {
  const rejectionReason = await promptInput({
    title: 'Alasan Penolakan Cuti',
    placeholder: 'Tuliskan alasan penolakan permohonan cuti ini...'
  })
  if (rejectionReason === null) return

  try {
    await erpStore.approveLeaveAction(leaveId, 'rejected', rejectionReason)
    showSuccess('Permohonan Ditolak', 'Permohonan cuti berhasil ditolak.')
  } catch (err) {
    showError('Penolakan Gagal', err.message)
  }
}



const handleDeleteLeaveType = async (id) => {
  const isConfirmed = await confirmAction({
    title: 'Hapus Kebijakan Cuti?',
    text: 'Kebijakan jenis cuti ini akan dihapus dari master data.',
    confirmButtonText: 'Ya, Hapus Kebijakan',
    icon: 'error'
  })
  if (!isConfirmed) return

  try {
    await erpStore.deleteLeaveTypeAction(id)
    showToastSuccess('🗑️ Kebijakan cuti berhasil dihapus!')
    showSuccess('Kebijakan Dihapus', 'Kebijakan jenis cuti berhasil dihapus.')
  } catch (err) {
    showError('Penghapusan Gagal', err.message)
  }
}

onMounted(async () => {
  await Promise.allSettled([
    leavesStore.loadInitialData(),
    erpStore.loadEmployeesOnly()
  ])
})
</script>

<template>
  <main class="flex-1 p-6 md:p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- HEADER -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold mb-2">
          Module 04: Leave Management
        </div>
        <h1 class="font-bold text-xl text-slate-900 tracking-tight mb-1">
          Pengajuan &amp; Saldo Cuti Karyawan
        </h1>
        <p class="text-xs text-slate-500">
          Kelola kebijakan jenis cuti, alokasi kuota cuti tahunan, dan persetujuan permohonan cuti staf.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <BaseButton variant="primary-slate" @click="showRequestModal = true">
          <PlusIcon class="size-3.5" />
          <span>Ajukan Cuti Baru</span>
        </BaseButton>
        <BaseButton v-if="activeTab === 'leave-types'" variant="secondary" @click="router.push('/employees/leaves/types/create')">
          <PlusIcon class="size-3.5 text-slate-600" />
          <span>Tambah Kebijakan Cuti</span>
        </BaseButton>
      </div>
    </div>

    <!-- TABS NAVIGATION (Royal Blue Pill Tabs) -->
    <div class="flex bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 gap-1 overflow-x-auto" role="tablist">
      <button 
        @click="activeTab = 'leave-types'; router.replace('/employees/leaves?tab=leave-types')"
        :class="activeTab === 'leave-types' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
      >
        <SparklesIcon class="size-3.5" />
        <span>Master Cuti</span>
      </button>
      <button 
        @click="activeTab = 'balances'; router.replace('/employees/leaves?tab=balances')"
        :class="activeTab === 'balances' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
      >
        <CalendarIcon class="size-3.5" />
        <span>Saldo Cuti (All Balances)</span>
      </button>
      <button 
        @click="activeTab = 'adjust-balance'; router.replace('/employees/leaves?tab=adjust-balance')"
        :class="activeTab === 'adjust-balance' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
      >
        <EditIcon class="size-3.5" />
        <span>Penyesuaian Kuota</span>
      </button>
      <button 
        @click="activeTab = 'requests'; router.replace('/employees/leaves?tab=requests')"
        :class="activeTab === 'requests' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
      >
        <FileTextIcon class="size-3.5" />
        <span>Daftar Persetujuan Cuti</span>
      </button>
      <button 
        @click="activeTab = 'calendar'; router.replace('/employees/leaves?tab=calendar')"
        :class="activeTab === 'calendar' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-3.5 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
      >
        <CalendarIcon class="size-3.5" />
        <span>Kalender Tim Cuti</span>
      </button>
    </div>

    <!-- TAB 2: HR ADMIN ALL LEAVE BALANCES (GET /api/v1/leaves/all-balances) -->
    <section v-if="activeTab === 'balances'" class="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4 font-sans">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 class="font-bold text-base text-slate-900 flex items-center gap-2">
            <CalendarIcon class="size-4 text-slate-700" />
            <span>Tabel Kuota &amp; Sisa Cuti Seluruh Karyawan (HR Admin View)</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Daftar alokasi, penggunaan, dan sisa jatah kuota cuti seluruh staf perusahaan terpaginasi.</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Search NIK / Nama -->
          <input
            v-model="balanceSearchQuery"
            @input="fetchAllBalancesData(1)"
            type="text"
            placeholder="Cari NIK / Nama Karyawan..."
            class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 w-full md:w-56 font-medium"
          />

          <!-- Filter Tahun -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-slate-600">Tahun:</span>
            <input
              v-model.number="balanceYearFilter"
              @change="fetchAllBalancesData(1)"
              type="number"
              min="2020"
              max="2035"
              class="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 w-24 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs bg-white">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/70 font-mono">
              <th class="py-3.5 px-4 font-semibold" scope="col">Nama Karyawan &amp; NIK</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Departemen</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Jenis Cuti</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Jatah (Allocated)</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Dipakai (Used)</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Sisa Kuota (Remaining)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoadingAllBalances" :columns="6" :rows="5" />
            <template v-else>
              <tr v-for="b in leavesStore.allLeaveBalances" :key="b.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3 px-4">
                <span class="block font-bold text-slate-900">{{ b.employeeName }}</span>
                <span class="block text-[11px] text-slate-500 font-mono">{{ b.employeeId }}</span>
              </td>
              <td class="py-3 px-4 text-slate-600 font-medium">
                {{ b.dept }}
              </td>
              <td class="py-3 px-4 font-semibold text-slate-900">
                {{ b.name }}
              </td>
              <td class="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                {{ b.quotaAllocated }} Hari
              </td>
              <td class="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                {{ b.quotaUsed }} Hari
              </td>
              <td class="py-3 px-4 text-center">
                <BaseBadge variant="success">
                  {{ b.quotaRemaining }} Hari
                </BaseBadge>
              </td>
            </tr>
            <tr v-if="!isLoadingAllBalances && (!leavesStore.allLeaveBalances || !leavesStore.allLeaveBalances.length)">
              <td colspan="6" class="py-8 text-center text-slate-500 font-medium">
                Belum ada data kuota cuti karyawan terdaftar pada tahun {{ balanceYearFilter }}.
              </td>
            </tr>
          </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION BAR FOR ALL BALANCES -->
      <BasePagination
        :current-page="leavesStore.allLeaveBalancesMeta.current_page || 1"
        :last-page="leavesStore.allLeaveBalancesMeta.last_page || 1"
        :total="leavesStore.allLeaveBalancesMeta.total || 0"
        :per-page="15"
        @page-change="(p) => fetchAllBalancesData(p)"
      />
    </section>

    <!-- TAB 3: DEDICATED LEAVE BALANCE ADJUSTMENT (POST /api/v1/leaves/balances/adjust) -->
    <section v-if="activeTab === 'adjust-balance'" class="space-y-5 font-sans">
      <div class="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md mb-1.5 font-mono">
            API: POST /api/v1/leaves/balances/adjust
          </div>
          <h2 class="font-bold text-base text-slate-900 flex items-center gap-2">
            <EditIcon class="size-4 text-slate-700" />
            <span>Penyesuaian Jatah Kuota Cuti Karyawan (Leave Balance Adjustment)</span>
          </h2>
          <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Atur alokasi jatah kuota cuti tahunan spesifik untuk karyawan tertentu (pemberian bonus cuti tambahan, kompensasi khusus, atau penetapan ulang alokasi).
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Form Penyesuaian -->
        <div class="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 class="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            Form Penyesuaian Kuota
          </h3>

          <form @submit.prevent="handleAdjustBalance" class="flex flex-col gap-4 text-xs font-sans">
            <div>
              <label class="block font-semibold text-slate-700 text-xs mb-1.5">Pilih Karyawan <span class="text-rose-600">*</span></label>
              <select v-model="adjustBalanceForm.employee_id" required class="w-full bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-medium text-slate-900">
                <option value="">-- Pilih Karyawan --</option>
                <option v-for="emp in (erpStore.employees || [])" :key="emp.id" :value="emp.id">
                  {{ emp.name }} ({{ emp.nik || emp.employee_code || 'EMP' }}) &bull; {{ emp.dept || emp.department?.name || 'Kantor Pusat' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 text-xs mb-1.5">Jenis Cuti <span class="text-rose-600">*</span></label>
              <select v-model="adjustBalanceForm.leave_type_id" required class="w-full bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-medium text-slate-900">
                <option value="">-- Pilih Jenis Cuti --</option>
                <option v-for="lt in erpStore.leaveTypes" :key="lt.id" :value="lt.id">
                  {{ lt.name }} (Standar: {{ lt.quota }} Hari)
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 text-xs mb-1.5">Tahun Kuota</label>
                <input v-model.number="adjustBalanceForm.year" required type="number" min="2020" max="2035" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-slate-900" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 text-xs mb-1.5">Jatah Hari (Allocated)</label>
                <input v-model.number="adjustBalanceForm.allocated" required type="number" min="0" max="365" class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800" />
              </div>
            </div>

            <div class="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <BaseButton variant="primary-slate" type="submit" :disabled="isSubmittingAdjust" class="w-full justify-center">
                <span>{{ isSubmittingAdjust ? 'Menyimpan...' : 'Simpan Penyesuaian Kuota' }}</span>
              </BaseButton>
            </div>
          </form>
        </div>

        <!-- Panduan & List Ringkas -->
        <div class="lg:col-span-2 space-y-5">
          <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 class="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <SparklesIcon class="size-4 text-slate-700" />
              <span>Panduan Penyesuaian Saldo Cuti</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <h4 class="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2Icon class="size-3.5 text-emerald-600" />
                  <span>Kalkulasi Sisa Cuti Realtime</span>
                </h4>
                <p class="text-[11px] text-slate-500 leading-relaxed">
                  Perubahan alokasi kuota (`allocated`) akan secara otomatis memperbarui sisa cuti (`remaining = allocated - used`) karyawan pada tahun terkait.
                </p>
              </div>

              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <h4 class="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <CheckCircle2Icon class="size-3.5 text-emerald-600" />
                  <span>Log Audit HR Admin</span>
                </h4>
                <p class="text-[11px] text-slate-500 leading-relaxed">
                  Seluruh aksi penyesuaian kuota tercatat di Audit Log sistem ERP untuk keperluan pertanggungjawaban audit tahunan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB CONTENT: REQUESTS -->
    <section v-if="activeTab === 'requests'" class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="requests-title">
      <h2 id="requests-title" class="font-display font-bold text-base text-slate-800 mb-4">
        Daftar Pengajuan Cuti (Persetujuan 1-Level HR Admin)
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Karyawan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Jenis Cuti</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Mulai</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Selesai</th>
              <th class="py-3 px-4 font-semibold" scope="col">Alasan Pengajuan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Berkas Pendukung</th>
              <th class="py-3 px-4 font-semibold text-center" scope="col">Status</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi HR</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr 
              v-for="lv in erpStore.leaves" 
              :key="lv.id"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="py-3.5 px-4">
                <span class="block font-bold text-slate-800">{{ lv.name }}</span>
                <span class="block text-[10px] text-slate-400 font-mono">{{ lv.employeeId }} &mdash; {{ lv.dept }}</span>
              </td>
              <td class="py-3.5 px-4 text-slate-700 font-semibold">{{ lv.type }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ lv.startDate }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ lv.endDate }}</td>
              <td class="py-3.5 px-4 text-slate-600 max-w-xs truncate" :title="lv.reason">{{ lv.reason }}</td>
              <td class="py-3.5 px-4 text-slate-600">
                <span v-if="lv.attachment" class="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <PaperclipIcon class="size-3" /> Lampiran File
                </span>
                <span v-else class="text-slate-400 text-[10px]">-</span>
              </td>
              <td class="py-3.5 px-4 text-center">
                <BaseBadge 
                  :variant="
                    lv.status === 'approved' 
                      ? 'success' 
                      : lv.status === 'rejected' 
                        ? 'danger' 
                        : 'warning'
                  "
                >
                  {{ lv.status }}
                </BaseBadge>
              </td>
              <td class="py-3.5 px-4 text-center">
                <div v-if="lv.status === 'pending'" class="flex justify-center gap-1.5">
                  <BaseButton variant="primary-emerald" class="!py-1 !px-2 text-[10px]" @click="handleApprove(lv.id)">
                    Setujui
                  </BaseButton>
                  <BaseButton variant="secondary" class="!py-1 !px-2 text-[10px]" @click="handleReject(lv.id)">
                    Tolak
                  </BaseButton>
                </div>
                <div 
                  v-else-if="lv.status === 'approved'" 
                  class="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold"
                >
                  <CheckCircle2Icon class="size-3.5" aria-hidden="true" />
                  <span>Approved (Kuota Terpotong)</span>
                </div>
                <div 
                  v-else-if="lv.status === 'rejected'" 
                  class="inline-flex items-center gap-1 text-rose-600 text-[10px] font-semibold"
                >
                  <XCircleIcon class="size-3.5" aria-hidden="true" />
                  <span>Rejected</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <BasePagination
        :current-page="1"
        :last-page="1"
        :total="erpStore.leaves ? erpStore.leaves.length : 0"
        :per-page="10"
        @page-change="() => {}"
      />
    </section>

    <!-- TAB CONTENT: CALENDAR -->
    <section v-if="activeTab === 'calendar'" class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 class="font-display font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
        <CalendarDaysIcon class="size-4.5 text-emerald-600" />
        <span>Kalender Cuti Tim Perusahaan</span>
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Karyawan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Jenis Cuti</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Cuti</th>
              <th class="py-3 px-4 font-semibold rounded-r-lg" scope="col">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="item in erpStore.leaveCalendar" :key="item.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3.5 px-4 font-bold text-slate-800">{{ item.employee_name || item.employee?.name || item.name || 'Karyawan' }}</td>
              <td class="py-3.5 px-4 text-slate-700 font-semibold text-emerald-700">{{ item.leave_type_name || item.leave_type?.name || item.leave_type || item.type || 'Cuti Tahunan' }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ item.start_date }} s/d {{ item.end_date }}</td>
              <td class="py-3.5 px-4">
                <BaseBadge variant="success">Sedang Cuti</BaseBadge>
              </td>
            </tr>
            <tr v-if="!erpStore.leaveCalendar || erpStore.leaveCalendar.length === 0">
              <td colspan="4" class="py-8 text-center text-slate-400 font-medium">
                Tidak ada anggota tim yang sedang cuti pada bulan ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB CONTENT: LEAVE TYPES -->
    <section v-if="activeTab === 'leave-types'" class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="types-title">
      <h2 id="types-title" class="font-display font-bold text-base text-slate-800 mb-4">
        Kebijakan Jenis Cuti Perusahaan
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Kebijakan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Kode</th>
              <th class="py-3 px-4 font-semibold" scope="col">Kuota Tahunan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Perlu Berkas</th>
              <th class="py-3 px-4 font-semibold" scope="col">Cuti Berbayar</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="lt in erpStore.leaveTypes" :key="lt.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3.5 px-4 font-bold text-slate-800">{{ lt.name }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ lt.code }}</td>
              <td class="py-3.5 px-4 font-medium text-slate-700">{{ lt.quota }} Hari</td>
              <td class="py-3.5 px-4 text-slate-600">{{ lt.requires_attachment ? 'Ya (Wajib Surat/Lampiran)' : 'Tidak' }}</td>
              <td class="py-3.5 px-4 text-slate-600">{{ lt.is_paid ? 'Ya (Berbayar)' : 'Tidak (Potong Gaji)' }}</td>
              <td class="py-3.5 px-4 text-center">
                <div class="flex justify-center gap-1.5">
                  <BaseButton variant="secondary" class="!p-1.5" @click="router.push(`/employees/leaves/types/edit/${lt.id}`)">
                    <EditIcon class="size-3.5" />
                  </BaseButton>
                  <BaseButton variant="danger" class="!p-1.5" @click="handleDeleteLeaveType(lt.id)">
                    <TrashIcon class="size-3.5" />
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal Form Create Leave Request -->
    <div v-if="showRequestModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <h2 class="font-display font-black text-lg text-slate-800 mb-1">
          Pengajuan Cuti Baru
        </h2>
        <p class="text-xs text-slate-500 mb-6">Pilih jenis cuti, rentang tanggal, dan sertakan berkas jika diwajibkan.</p>

        <form @submit.prevent="handleCreateLeaveRequest" class="flex flex-col gap-4 text-xs font-sans">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jenis Cuti</label>
            <select v-model="requestForm.leave_type_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800">
              <option value="">-- Pilih Jenis Cuti --</option>
              <option v-for="lt in erpStore.leaveTypes" :key="lt.id" :value="lt.id">
                {{ lt.name }} (Kuota: {{ lt.quota }} Hari) {{ lt.requires_attachment ? '*Wajib Lampiran' : '' }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Mulai</label>
              <input v-model="requestForm.start_date" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Selesai</label>
              <input v-model="requestForm.end_date" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Alasan Cuti</label>
            <textarea v-model="requestForm.reason" required rows="3" placeholder="Jelaskan kebutuhan permohonan cuti..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800 resize-none"></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Lampiran Berkas Pendukung (Dokumen/Surat)</label>
            <input type="file" @change="handleFileChange" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700" />
          </div>

          <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <BaseButton variant="secondary" type="button" @click="showRequestModal = false">Batal</BaseButton>
            <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmittingRequest">Ajukan Cuti</BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form Adjust Kuota Cuti Karyawan (POST /api/v1/leaves/balances/adjust) -->
    <div v-if="showAdjustBalanceModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <div class="flex items-center justify-between mb-1">
          <h2 class="font-display font-black text-lg text-slate-800">
            Penyesuaian Kuota Cuti
          </h2>
          <span class="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">API v1 Adjust Balance</span>
        </div>
        <p class="text-xs text-slate-500 mb-6">Atur jatah alokasi kuota cuti tahunan spesifik untuk karyawan tertentu.</p>

        <form @submit.prevent="handleAdjustBalance" class="flex flex-col gap-4 text-xs font-sans">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Pilih Karyawan</label>
              <select v-model="adjustBalanceForm.employee_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800">
                <option value="">-- Pilih Karyawan --</option>
                <option v-for="emp in (erpStore.employees || [])" :key="emp.id" :value="emp.id">
                  {{ emp.name }} ({{ emp.nik || emp.employee_code || 'EMP' }}) &bull; {{ emp.dept || emp.department?.name || 'Kantor Pusat' }}
                </option>
              </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jenis Cuti</label>
            <select v-model="adjustBalanceForm.leave_type_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800">
              <option value="">-- Pilih Jenis Cuti --</option>
              <option v-for="lt in erpStore.leaveTypes" :key="lt.id" :value="lt.id">
                {{ lt.name }} (Standar: {{ lt.quota }} Hari)
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tahun Kuota</label>
              <input v-model.number="adjustBalanceForm.year" required type="number" min="2020" max="2035" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jatah Hari (Allocated)</label>
              <input v-model.number="adjustBalanceForm.allocated" required type="number" min="0" max="365" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700 text-sm" />
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <BaseButton variant="secondary" type="button" @click="showAdjustBalanceModal = false">Batal</BaseButton>
            <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmittingAdjust">Simpan Penyesuaian Kuota</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

