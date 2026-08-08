<script setup>
import { ref, onMounted } from 'vue'
import { useErpStore } from '../../store/erp'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import { 
  ClockIcon, 
  SparklesIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  AlertCircleIcon,
  PlusIcon,
  FileCheckIcon
} from '@lucide/vue'

const erpStore = useErpStore()

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num || 0)
}

// ── Pre-Approval Request Modal ─────────────────────────────
const showPreApprovalModal = ref(false)
const preApprovalForm = ref({
  date: '',
  planned_start: '',
  planned_end: '',
  reason: ''
})
const isSubmittingPreApproval = ref(false)

const handleSubmitPreApproval = async () => {
  if (!preApprovalForm.value.date || !preApprovalForm.value.planned_start || !preApprovalForm.value.planned_end || !preApprovalForm.value.reason) {
    alert('Harap lengkapi semua field pengajuan rencana lembur!')
    return
  }
  try {
    isSubmittingPreApproval.value = true
    const res = await erpStore.requestOvertimeAction({ ...preApprovalForm.value })
    if (res && res.success) {
      alert(`Rencana lembur berhasil diajukan! (${res.data?.planned_hours || ''} jam direncanakan) Status: ${res.data?.status || 'pending_approval'}`)
      showPreApprovalModal.value = false
      preApprovalForm.value = { date: '', planned_start: '', planned_end: '', reason: '' }
    } else {
      alert('Pengajuan rencana lembur gagal: ' + (res?.message || 'Server error'))
    }
  } catch (err) {
    alert('Error: ' + err.message)
  } finally {
    isSubmittingPreApproval.value = false
  }
}

// ── Actual Claim Modal ─────────────────────────────────────
const showClaimModal = ref(false)
const selectedOtForClaim = ref(null)
const claimForm = ref({
  actual_start: '',
  actual_end: '',
  work_report: ''
})
const isSubmittingClaim = ref(false)

const openClaimModal = (ot) => {
  selectedOtForClaim.value = ot
  claimForm.value = {
    actual_start: ot.plannedStart || '',
    actual_end: ot.plannedEnd || '',
    work_report: ''
  }
  showClaimModal.value = true
}

const handleSubmitClaim = async () => {
  if (!claimForm.value.actual_start || !claimForm.value.actual_end || !claimForm.value.work_report) {
    alert('Harap lengkapi jam aktual dan laporan pekerjaan!')
    return
  }
  try {
    isSubmittingClaim.value = true
    const res = await erpStore.claimOvertimeAction(selectedOtForClaim.value.id, { ...claimForm.value })
    if (res && res.success) {
      alert(`Klaim lembur aktual berhasil dikirim! Jam aktual: ${res.data?.actual_hours || ''} jam. Status: ${res.data?.status}`)
      showClaimModal.value = false
    } else {
      alert('Klaim lembur gagal: ' + (res?.message || 'Server error'))
    }
  } catch (err) {
    alert('Error: ' + err.message)
  } finally {
    isSubmittingClaim.value = false
  }
}

// ── HR Approval Actions ────────────────────────────────────
const handleApprovePreRequest = async (ot) => {
  const res = await erpStore.approveOvertimeAction(ot.id, 'approved')
  if (res && res.success && res.data?.calculated_pay) {
    alert(`Lembur disetujui! Upah Depnaker dihitung: ${formatRupiah(res.data.calculated_pay)}`)
  }
}

const handleRejectPreRequest = async (ot) => {
  const reason = prompt('Masukkan alasan penolakan:')
  if (reason === null) return
  await erpStore.approveOvertimeAction(ot.id, 'rejected', reason)
}

const handleApproveClaim = async (ot) => {
  const res = await erpStore.approveOvertimeAction(ot.id, 'approved')
  if (res && res.success) {
    const pay = res.data?.calculated_pay
    alert(`Klaim lembur disetujui!${pay ? ' Upah Depnaker: ' + formatRupiah(pay) : ''}`)
  }
}

const statusVariant = (status) => {
  if (status === 'approved' || status === 'completed') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'claimed') return 'info'
  return 'warning'
}

import { usePayrollStore } from '../../store/payroll'
const payrollStore = usePayrollStore()

onMounted(() => {
  payrollStore.loadInitialData()
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- SUB-HEADER -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Module 06: Overtime Active
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Klaim & Pengajuan Lembur
        </h1>
        <p class="text-xs text-slate-500">
          Pengajuan rencana lembur (pre-approval) → klaim aktual → persetujuan HR → kalkulasi upah Depnaker otomatis.
        </p>
      </div>
      <BaseButton variant="primary-emerald" @click="showPreApprovalModal = true">
        <PlusIcon class="size-3.5" />
        <span>Ajukan Rencana Lembur</span>
      </BaseButton>
    </div>

    <!-- FORMULA INFORMATION BANNER -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Depnaker formula card -->
      <section class="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="formula-title">
        <h2 id="formula-title" class="font-display font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <HelpCircleIcon class="size-4.5 text-indigo-600" aria-hidden="true" />
          <span>Alur Lembur 2-Tahap (API Contract 06)</span>
        </h2>
        <div class="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-600 mb-4">
          <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-center">
            <div class="font-bold text-amber-700 mb-0.5">Tahap 1</div>
            <div>Ajukan Rencana</div>
            <div class="text-[9px] text-amber-600 font-semibold mt-1">pending_approval</div>
          </div>
          <div class="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-center">
            <div class="font-bold text-blue-700 mb-0.5">Tahap 2</div>
            <div>HR Pre-Setujui</div>
            <div class="text-[9px] text-blue-600 font-semibold mt-1">approved</div>
          </div>
          <div class="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-center">
            <div class="font-bold text-indigo-700 mb-0.5">Tahap 3</div>
            <div>Klaim Aktual</div>
            <div class="text-[9px] text-indigo-600 font-semibold mt-1">claimed</div>
          </div>
          <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
            <div class="font-bold text-emerald-700 mb-0.5">Tahap 4</div>
            <div>Finalisasi HR</div>
            <div class="text-[9px] text-emerald-600 font-semibold mt-1">completed</div>
          </div>
        </div>
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[10.5px] text-slate-600 space-y-1">
          <div>Upah per Jam = (1 / 173) × (Gaji Pokok + Tunjangan Tetap)</div>
          <div>Jam ke-1 &nbsp; &nbsp; &nbsp;= 1.5 × Upah per Jam</div>
          <div>Jam ke-2 dst &nbsp;= 2.0 × Upah per Jam</div>
        </div>
      </section>

      <!-- Cross-check rule -->
      <div class="p-6 rounded-2xl border border-amber-100 bg-amber-50/50 shadow-sm">
        <h3 class="font-display font-bold text-sm text-amber-800 mb-2 flex items-center gap-2">
          <AlertCircleIcon class="size-4.5 text-amber-600" aria-hidden="true" />
          <span>Validasi Silang Absensi</span>
        </h3>
        <p class="text-xs text-amber-700/90 leading-relaxed">
          Waktu klaim lembur <strong>tidak boleh melebihi</strong> jam check-out absensi aktual hari pengajuan. Mencegah klaim lembur tanpa kehadiran fisik.
        </p>
        <span class="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-4 block">Cross-check rule active</span>
      </div>
    </div>

    <!-- OVERTIME TABLE -->
    <section class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="overtime-title">
      <h2 id="overtime-title" class="font-display font-bold text-base text-slate-800 mb-4">
        Daftar Pengajuan & Klaim Lembur (API Contract 06)
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-3 font-semibold rounded-l-lg" scope="col">Karyawan</th>
              <th class="py-3 px-3 font-semibold" scope="col">Tanggal</th>
              <th class="py-3 px-3 font-semibold" scope="col">Rencana (Planned)</th>
              <th class="py-3 px-3 font-semibold" scope="col">Aktual (Claimed)</th>
              <th class="py-3 px-3 font-semibold" scope="col">Alasan / Laporan</th>
              <th class="py-3 px-3 font-semibold text-right" scope="col">Upah Depnaker</th>
              <th class="py-3 px-3 font-semibold text-center" scope="col">Status</th>
              <th class="py-3 px-3 font-semibold text-center rounded-r-lg" scope="col">Aksi HR</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr 
              v-for="ot in erpStore.overtimes" 
              :key="ot.id"
              class="hover:bg-slate-50/80 transition-colors"
            >
              <td class="py-3.5 px-3">
                <span class="block font-bold text-slate-800">{{ ot.name }}</span>
                <span class="block text-[10px] text-slate-400 font-mono">{{ ot.idShort || String(ot.id).slice(0,8) }} — {{ ot.dept }}</span>
              </td>
              <td class="py-3.5 px-3 font-mono text-slate-600">{{ ot.date }}</td>
              <td class="py-3.5 px-3 font-mono text-slate-500">
                <span class="block">{{ ot.plannedStart }} - {{ ot.plannedEnd }}</span>
                <span v-if="ot.plannedHours" class="block text-[10px] text-slate-400">{{ ot.plannedHours }} jam</span>
              </td>
              <td class="py-3.5 px-3 font-mono">
                <span v-if="ot.actualStart && ot.actualEnd" class="text-slate-700">
                  <span class="block">{{ ot.actualStart }} - {{ ot.actualEnd }}</span>
                  <span v-if="ot.actualHours" class="block text-[10px] text-emerald-600 font-bold">{{ ot.actualHours }} jam aktual</span>
                </span>
                <span v-else class="text-slate-300 text-[10px]">Belum diklaim</span>
              </td>
              <td class="py-3.5 px-3 text-slate-600 max-w-[160px]">
                <span class="block truncate" :title="ot.reason">{{ ot.reason }}</span>
                <span v-if="ot.workReport" class="block text-[10px] text-indigo-600 font-medium truncate" :title="ot.workReport">📄 {{ ot.workReport }}</span>
              </td>
              <td class="py-3.5 px-3 text-right">
                <span v-if="ot.calculatedPay > 0" class="font-mono font-bold text-emerald-700 tabular-nums block">
                  {{ formatRupiah(ot.calculatedPay) }}
                </span>
                <span v-else class="text-slate-300 text-[10px]">—</span>
              </td>
              <td class="py-3.5 px-3 text-center">
                <BaseBadge :variant="statusVariant(ot.status)">
                  {{ ot.status }}
                </BaseBadge>
              </td>
              <td class="py-3.5 px-3 text-center">
                <!-- Tahap 1: HR Pre-Approval -->
                <div v-if="ot.status === 'pending_approval'" class="flex flex-col gap-1.5 items-center">
                  <BaseButton variant="primary-emerald" class="!py-1 !px-2 text-[10px] w-full" @click="handleApprovePreRequest(ot)">
                    Setujui Rencana
                  </BaseButton>
                  <BaseButton variant="secondary" class="!py-1 !px-2 text-[10px] w-full" @click="handleRejectPreRequest(ot)">
                    Tolak
                  </BaseButton>
                </div>
                <!-- Tahap 2: Klaim Aktual (setelah HR pre-approve) -->
                <div v-else-if="ot.status === 'approved'">
                  <BaseButton variant="secondary" class="!py-1 !px-2 text-[10px]" @click="openClaimModal(ot)">
                    <FileCheckIcon class="size-3 mr-1" />
                    Klaim Aktual
                  </BaseButton>
                </div>
                <!-- Tahap 3: HR Finalisasi Klaim -->
                <div v-else-if="ot.status === 'claimed'" class="flex flex-col gap-1.5">
                  <BaseButton variant="primary-emerald" class="!py-1 !px-2 text-[10px] w-full" @click="handleApproveClaim(ot)">
                    Proses & Hitung Upah
                  </BaseButton>
                </div>
                <!-- Completed -->
                <div v-else-if="ot.status === 'completed'" class="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                  <CheckCircle2Icon class="size-3.5" />
                  <span>Dibayar</span>
                </div>
                <span v-else class="text-slate-300 text-[10px]">—</span>
              </td>
            </tr>
            <tr v-if="!erpStore.overtimes || erpStore.overtimes.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-400 font-medium">
                Belum ada data pengajuan lembur.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Modal: Pre-Approval Rencana Lembur -->
    <div v-if="showPreApprovalModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <h2 class="font-display font-black text-lg text-slate-800 mb-1">Pengajuan Rencana Lembur</h2>
        <p class="text-xs text-slate-500 mb-6">Pre-approval sebelum pelaksanaan lembur. HR akan menyetujui rencana ini terlebih dahulu.</p>

        <form @submit.prevent="handleSubmitPreApproval" class="flex flex-col gap-4 text-xs font-sans">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Lembur</label>
            <input v-model="preApprovalForm.date" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jam Mulai</label>
              <input v-model="preApprovalForm.planned_start" required type="time" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jam Selesai</label>
              <input v-model="preApprovalForm.planned_end" required type="time" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Alasan Lembur</label>
            <textarea v-model="preApprovalForm.reason" required rows="3" placeholder="Jelaskan kebutuhan lembur..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <BaseButton variant="secondary" type="button" @click="showPreApprovalModal = false">Batal</BaseButton>
            <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmittingPreApproval">Ajukan Rencana</BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Klaim Aktual Lembur -->
    <div v-if="showClaimModal && selectedOtForClaim" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
        <h2 class="font-display font-black text-lg text-slate-800 mb-1">Klaim Lembur Aktual</h2>
        <p class="text-xs text-slate-500 mb-1">Tanggal: <strong class="font-mono">{{ selectedOtForClaim.date }}</strong></p>
        <p class="text-xs text-slate-500 mb-6">Rencana: <strong class="font-mono">{{ selectedOtForClaim.plannedStart }} – {{ selectedOtForClaim.plannedEnd }}</strong></p>

        <form @submit.prevent="handleSubmitClaim" class="flex flex-col gap-4 text-xs font-sans">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jam Mulai Aktual</label>
              <input v-model="claimForm.actual_start" required type="time" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono text-slate-800" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Jam Selesai Aktual</label>
              <input v-model="claimForm.actual_end" required type="time" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono text-slate-800" />
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Laporan Pekerjaan</label>
            <textarea v-model="claimForm.work_report" required rows="3" placeholder="Uraian pekerjaan yang dilakukan selama lembur..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 resize-none"></textarea>
          </div>
          <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <BaseButton variant="secondary" type="button" @click="showClaimModal = false">Batal</BaseButton>
            <BaseButton variant="primary-indigo" type="submit" :disabled="isSubmittingClaim">Kirim Klaim</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
