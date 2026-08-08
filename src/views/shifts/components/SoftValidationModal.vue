<script setup>
import { useErpStore } from '../../../store/erp'
import BaseBadge from '../../../components/BaseBadge.vue'
import BaseButton from '../../../components/BaseButton.vue'

const erpStore = useErpStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'publish'])
</script>

<template>
  <div v-if="show && erpStore.activeValidationReport" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mb-1">
            Soft Validation Engine Result Matrix
          </div>
          <h2 class="font-display font-black text-lg text-slate-800">Laporan Validasi Kelengkapan Roster</h2>
        </div>
        <BaseBadge :variant="erpStore.activeValidationReport.can_publish ? 'success' : 'danger'">
          {{ erpStore.activeValidationReport.can_publish ? 'Siap Dipublikasikan' : 'Terdapat Isu Kritis' }}
        </BaseBadge>
      </div>

      <!-- Metric Summary Boxes -->
      <div class="grid grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-6">
        <div>
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Coverage Rate</span>
          <span class="font-mono font-black text-lg text-emerald-600">
            {{ erpStore.activeValidationReport.coverage_percentage }}%
          </span>
        </div>
        <div>
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Jadwal Kosong</span>
          <span class="font-mono font-black text-lg text-amber-600">
            {{ erpStore.activeValidationReport.summary?.missing_schedules || 0 }}
          </span>
        </div>
        <div>
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Jeda Istirahat</span>
          <span class="font-mono font-black text-lg text-rose-600">
            {{ erpStore.activeValidationReport.summary?.rest_time_violations || 0 }}
          </span>
        </div>
        <div>
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Bentrok Cuti</span>
          <span class="font-mono font-black text-lg text-indigo-600">
            {{ erpStore.activeValidationReport.summary?.leave_conflicts || 0 }}
          </span>
        </div>
      </div>

      <!-- Warning Items Matrix -->
      <div class="mb-6">
        <h3 class="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
          Rincian Warning &amp; Isu Pelanggaran ({{ erpStore.activeValidationReport.warnings?.length || 0 }})
        </h3>

        <div class="space-y-2.5 max-h-60 overflow-y-auto border border-slate-100 rounded-xl p-2 divide-y divide-slate-100">
          <div
            v-for="(warn, idx) in erpStore.activeValidationReport.warnings"
            :key="idx"
            class="pt-2 first:pt-0 flex items-start gap-3 text-xs"
          >
            <span
              class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase flex-shrink-0"
              :class="
                warn.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                warn.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
              "
            >
              {{ warn.severity }}
            </span>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-800">{{ warn.employee_name }}</span>
                <span class="font-mono text-[10px] text-slate-400">{{ warn.date }}</span>
              </div>
              <p class="text-slate-600 mt-0.5 leading-relaxed">{{ warn.message }}</p>
            </div>
          </div>

          <div v-if="!erpStore.activeValidationReport.warnings?.length" class="p-6 text-center text-emerald-600 font-semibold text-xs">
            🎉 Tidak ditemukan warning atau konflik jadwal! Roster sempurna 100%.
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <BaseButton variant="secondary" @click="emit('close')">Tutup Report</BaseButton>
        <BaseButton
          v-if="erpStore.activeValidationReport.can_publish"
          variant="primary-emerald"
          @click="emit('publish', erpStore.activeValidationReport.roster_plan_id)"
        >
          🚀 Publikasikan Roster Sekarang
        </BaseButton>
      </div>
    </div>
  </div>
</template>
