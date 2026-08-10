<script setup>
import { ref, watch } from 'vue'
import { useShiftsStore } from '../../../store/shifts'
import BaseButton from '../../../components/BaseButton.vue'
import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

const shiftsStore = useShiftsStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  schedule: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const form = ref({
  shift_id: '',
  is_day_off: false,
  notes: ''
})
const isSubmitting = ref(false)

watch([() => props.show, () => props.schedule], ([isShown, sc]) => {
  if (isShown && sc) {
    if (!shiftsStore.shifts || !shiftsStore.shifts.length) {
      shiftsStore.fetchShiftsOnlyAction()
    }
    form.value = {
      shift_id: sc.shift_id || sc.shift?.id || '',
      is_day_off: sc.is_day_off || (!sc.shift && !sc.shift_id),
      notes: sc.notes || 'Adjustment manual HR Admin'
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!props.schedule || (!props.schedule.id && (!props.schedule.employee_id || !props.schedule.date))) {
    showToastError('Data jadwal tidak valid!')
    return
  }

  if (!form.value.is_day_off && !form.value.shift_id) {
    showToastWarning('Harap pilih Shift Kerja Baru atau centang Hari Libur!')
    return
  }

  try {
    isSubmitting.value = true
    const payload = {
      shift_id: form.value.is_day_off ? null : form.value.shift_id,
      is_day_off: Boolean(form.value.is_day_off),
      notes: form.value.notes || 'Adjustment manual HR'
    }

    let res
    if (props.schedule.id) {
      res = await shiftsStore.adjustIndividualScheduleAction(props.schedule.id, payload)
    } else {
      res = await shiftsStore.assignRosterAction({
        shift_id: payload.shift_id,
        is_day_off: payload.is_day_off,
        start_date: props.schedule.date,
        end_date: props.schedule.date,
        employee_ids: [props.schedule.employee_id],
        notes: payload.notes
      })
    }

    if (res && res.success) {
      showToastSuccess('✅ Jadwal shift berhasil di-adjust & dikunci (Manual Override)!')
      emit('saved')
      emit('close')
    } else {
      showToastError(res?.message || 'Gagal menyimpan adjustment jadwal')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show && schedule" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 font-sans">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <span class="text-[9px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold uppercase border border-indigo-100">
            MANUAL OVERRIDE LOCK
          </span>
          <h2 class="font-display font-black text-base text-slate-800 mt-1">
            Individual Schedule Adjustment
          </h2>
        </div>
      </div>

      <!-- Info Karyawan & Tanggal -->
      <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 text-xs space-y-1">
        <div class="flex justify-between">
          <span class="text-slate-500">Karyawan:</span>
          <span class="font-bold text-slate-800">{{ schedule.employee ? schedule.employee.name : (schedule.employee_name || 'Karyawan') }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Tanggal Kerja:</span>
          <span class="font-mono font-bold text-emerald-700">{{ schedule.date }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Jadwal Saat Ini:</span>
          <span class="font-semibold text-slate-700">
            {{ schedule.shift ? schedule.shift.name : 'OFF (Hari Libur)' }}
          </span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4 text-xs">
        <!-- Opsi Status Shift / OFF -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Status Hari Kerja
          </label>
          <select
            v-model="form.is_day_off"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option :value="false">Shift Kerja Aktif</option>
            <option :value="true">Hari Libur (OFF / Rest Day)</option>
          </select>
        </div>

        <!-- Opsi Select Shift Master (Muncul jika tidak OFF) -->
        <div v-if="!form.is_day_off">
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Pilih Shift Kerja Baru <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="form.shift_id"
            required
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Pilih Shift Master --</option>
            <option v-for="sf in shiftsStore.shifts" :key="sf.id" :value="sf.id">
              {{ sf.name }} ({{ sf.code || 'SF' }}) &mdash; {{ sf.startTime || sf.start_time }} - {{ sf.endTime || sf.end_time }}
            </option>
          </select>
        </div>

        <!-- Catatan Adjustment -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Catatan / Alasan Adjustment
          </label>
          <input
            v-model="form.notes"
            type="text"
            placeholder="contoh: Penyesuaian ketersediaan tim operasional"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-slate-800"
          />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
          <BaseButton variant="secondary" type="button" @click="emit('close')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmitting">
            <span>{{ isSubmitting ? 'Memproses...' : 'Simpan Adjustment' }}</span>
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
