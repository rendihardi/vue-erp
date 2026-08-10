<script setup>
import { computed, onMounted } from 'vue'
import { usePayrollStore } from '../../store/payroll'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import { 
  CreditCardIcon, 
  SparklesIcon,
  CheckCircle2Icon,
  HelpCircleIcon
} from '@lucide/vue'

const payrollStore = usePayrollStore()

const formatRupiah = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num)
}

// Calculate summary numbers
const totalBasicSalary = computed(() => {
  return payrollStore.payrolls.reduce((sum, p) => sum + p.baseSalary, 0)
})

const totalAllowances = computed(() => {
  return payrollStore.payrolls.reduce((sum, p) => sum + p.allowance, 0)
})

const totalDeductions = computed(() => {
  return payrollStore.payrolls.reduce((sum, p) => sum + p.deductions, 0)
})

onMounted(() => {
  payrollStore.loadInitialData()
})

const handleProcessPayout = (payrollId) => {
  payrollStore.updatePayrollStatus(payrollId, 'Paid')
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- MODULE SUB-HEADER -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Payroll Engine Active
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Kalkulasi & Buku Besar Gaji
        </h1>
        <p class="text-xs text-slate-500">
          Kelola pembayaran bulanan terintegrasi dengan denda keterlambatan absensi otomatis.
        </p>
      </div>
      
      <div class="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg font-medium">
        <SparklesIcon class="size-4 text-indigo-600 animate-pulse" aria-hidden="true" />
        <span>Gaji Bersih Terkalkulasi</span>
      </div>
    </div>

    <!-- METRICS SUB-GRID -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" aria-label="Ringkasan Finansial Payroll">
      <!-- Total Basic -->
      <div class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gaji Pokok Karyawan</span>
        <span class="block font-mono font-bold text-lg text-slate-800 tabular-nums">
          {{ formatRupiah(totalBasicSalary) }}
        </span>
      </div>

      <!-- Total Allowances -->
      <div class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Tunjangan</span>
        <span class="block font-mono font-bold text-lg text-slate-800 tabular-nums">
          {{ formatRupiah(totalAllowances) }}
        </span>
      </div>

      <!-- Total Deductions -->
      <div class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Denda Keterlambatan</span>
        <span class="block font-mono font-bold text-lg text-amber-600 tabular-nums">
          - {{ formatRupiah(totalDeductions) }}
        </span>
      </div>

      <!-- Total Net Paid -->
      <div class="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 shadow-sm">
        <span class="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5 font-sans">Total Transfer Bersih</span>
        <span class="block font-mono font-extrabold text-xl text-indigo-700 tabular-nums">
          {{ formatRupiah(payrollStore.totalPayrollAugust) }}
        </span>
      </div>
    </div>

    <!-- PAYROLL LEDGER TABLE -->
    <section class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm" aria-labelledby="ledger-title">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 id="ledger-title" class="font-display font-bold text-base text-slate-800">
            Buku Besar Penggajian Agustus 2026
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Semua data potongan dihitung dari rekonsiliasi data absensi real-time.</p>
        </div>
        <div class="flex gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 p-2 rounded-lg items-center uppercase font-mono">
          <HelpCircleIcon class="size-4 text-slate-400" aria-hidden="true" />
          <span>Potongan: Rp 50.000 / Keterlambatan</span>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th class="pb-3 font-semibold" scope="col">Nama Karyawan / ID</th>
              <th class="pb-3 font-semibold text-right" scope="col">Gaji Pokok</th>
              <th class="pb-3 font-semibold text-right" scope="col">Tunjangan</th>
              <th class="pb-3 font-semibold text-right" scope="col">Potongan</th>
              <th class="pb-3 font-semibold text-right" scope="col">Gaji Bersih</th>
              <th class="pb-3 font-semibold text-center" scope="col">Status</th>
              <th class="pb-3 font-semibold text-center" scope="col">Aksi Transfer</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="pay in payrollStore.payrolls" 
              :key="pay.id"
              class="hover:bg-slate-50/50"
            >
              <td class="py-3.5">
                <span class="block font-bold text-slate-700">{{ pay.name }}</span>
                <span class="block text-[10px] text-slate-400 font-mono">{{ pay.employeeId }} — {{ pay.dept }}</span>
              </td>
              <td class="py-3.5 font-mono text-right text-slate-600 tabular-nums">
                {{ formatRupiah(pay.baseSalary) }}
              </td>
              <td class="py-3.5 font-mono text-right text-slate-600 tabular-nums">
                {{ formatRupiah(pay.allowance) }}
              </td>
              <td class="py-3.5 font-mono text-right text-amber-600 tabular-nums">
                - {{ formatRupiah(pay.deductions) }}
              </td>
              <td class="py-3.5 font-mono text-right text-slate-800 font-bold tabular-nums">
                {{ formatRupiah(pay.baseSalary + pay.allowance - pay.deductions) }}
              </td>
              <td class="py-3.5 text-center">
                <BaseBadge :variant="pay.status === 'Paid' ? 'success' : 'info'">
                  {{ pay.status }}
                </BaseBadge>
              </td>
              <td class="py-3.5 text-center">
                <BaseButton
                  v-if="pay.status === 'Processing'"
                  variant="primary-indigo"
                  @click="handleProcessPayout(pay.id)"
                >
                  Bayar Gaji
                </BaseButton>
                <div v-else class="flex items-center justify-center text-emerald-600 gap-1 select-none text-[10px] font-semibold">
                  <CheckCircle2Icon class="size-3.5" aria-hidden="true" />
                  <span>Transfer Selesai</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
