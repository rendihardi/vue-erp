<script setup>
import { ref, watch } from 'vue'
import { useErpStore } from '../../../store/erp'
import BaseButton from '../../../components/BaseButton.vue'

const erpStore = useErpStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submitted'])

const swapTargetEmpId = ref('')
const swapRequesterDate = ref('')
const swapTargetDate = ref('')
const peerSearchQ = ref('')
const isSubmitting = ref(false)

const loadAvailablePeers = async () => {
  if (!swapTargetDate.value) return
  await erpStore.fetchAvailablePeersAction({
    date: swapTargetDate.value,
    search: peerSearchQ.value
  })
}

watch([swapTargetDate, peerSearchQ], () => {
  if (props.show && swapTargetDate.value) {
    loadAvailablePeers()
  }
})

import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

const handleSubmit = async () => {
  if (!swapTargetEmpId.value || !swapRequesterDate.value || !swapTargetDate.value) {
    showToastWarning('Lengkapi semua data pengajuan tukar shift!')
    return
  }
  try {
    isSubmitting.value = true
    const res = await erpStore.requestShiftSwapAction({
      requested_employee_id: swapTargetEmpId.value,
      requester_date: swapRequesterDate.value,
      requested_date: swapTargetDate.value
    })
    if (res && res.success) {
      showToastSuccess('✨ Pengajuan tukar shift berhasil dikirim ke rekan kerja!')
      swapTargetEmpId.value = ''
      swapRequesterDate.value = ''
      swapTargetDate.value = ''
      emit('submitted')
      emit('close')
    } else {
      showToastError(res?.message || 'Pengajuan tukar shift gagal')
    }
  } catch (err) {
    showToastError('Pengajuan Gagal: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
      <h2 class="font-display font-black text-lg text-slate-800 mb-1">
        Pengajuan Pertukaran Shift
      </h2>
      <p class="text-xs text-slate-500 mb-6">Pilih rekan kerja dan tanggal jadwal yang akan ditukar.</p>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Jadwal Saya</label>
          <input v-model="swapRequesterDate" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
        </div>

        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Jadwal Rekan Kerja Target</label>
          <input v-model="swapTargetDate" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
        </div>

        <!-- Available Peers Dropdown / Search (API Contract 03 §3.3) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Rekan Kerja Target &amp; Shift</label>
            <span v-if="erpStore.availablePeers?.length" class="text-[9px] text-emerald-600 font-bold font-mono">
              {{ erpStore.availablePeers.length }} rekan tersedia
            </span>
          </div>

          <!-- Optional search field -->
          <input
            v-if="swapTargetDate"
            v-model="peerSearchQ"
            type="text"
            placeholder="Cari nama / NIK rekan..."
            class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 mb-2 focus:outline-none focus:border-emerald-500"
          />

          <select v-model="swapTargetEmpId" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800">
            <option value="">-- Pilih Rekan Kerja --</option>
            <template v-if="erpStore.availablePeers?.length">
              <option v-for="peer in erpStore.availablePeers" :key="peer.employee_id" :value="peer.employee_id">
                {{ peer.employee_name }} ({{ peer.nik }}) — {{ peer.shift ? `${peer.shift.name} (${peer.shift.start_time}-${peer.shift.end_time})` : 'No Shift' }}
              </option>
            </template>
            <template v-else>
              <option v-for="emp in erpStore.employees" :key="emp.id" :value="emp.id">
                {{ emp.name }} ({{ emp.dept }})
              </option>
            </template>
          </select>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" type="button" @click="emit('close')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmitting">Kirim Pengajuan</BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
