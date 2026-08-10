<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useShiftsStore } from '../../../store/shifts'
import BaseButton from '../../../components/BaseButton.vue'
import { PlusIcon, TrashIcon } from '@lucide/vue'
import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

const shiftsStore = useShiftsStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  team: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const availableShifts = computed(() => {
  return Array.isArray(shiftsStore.shifts) ? shiftsStore.shifts : []
})

const form = ref({
  name: '',
  start_date: '',
  is_weekend_off: false,
  rotation_sequence: [
    { shift_id: '', duration_days: 1, is_day_off: false }
  ]
})
const isSubmitting = ref(false)

watch([() => props.show, () => props.team], async ([isShowing, t]) => {
  if (isShowing) {
    if (!shiftsStore.shifts || !shiftsStore.shifts.length) {
      await shiftsStore.fetchShiftsOnlyAction()
    }
    if (t && t.id) {
      const rawSeq = Array.isArray(t.rotation_sequence) && t.rotation_sequence.length
        ? t.rotation_sequence
        : (Array.isArray(t.sequence) ? t.sequence : [])

      form.value = {
        name: t.name || '',
        start_date: t.start_date || '',
        is_weekend_off: Boolean(t.is_weekend_off),
        rotation_sequence: rawSeq.length > 0
          ? rawSeq.map(step => ({
              shift_id: step.shift_id || step.shift?.id || step.shiftId || '',
              duration_days: step.duration_days ?? '',
              is_day_off: step.is_day_off === true || step.is_day_off === 1 || step.is_day_off === '1'
            }))
          : [{ shift_id: '', duration_days: '', is_day_off: false }]
      }
    } else {
      // RESET FORM TOTAL KOSONG BERSIH (CREATE MODE)
      form.value = {
        name: '',
        start_date: '',
        is_weekend_off: false,
        rotation_sequence: [
          { shift_id: '', duration_days: '', is_day_off: false }
        ]
      }
    }
  }
}, { immediate: true })

const addStep = () => {
  form.value.rotation_sequence.push({
    shift_id: '',
    duration_days: '',
    is_day_off: false
  })
}

onMounted(() => {
  if (!shiftsStore.shifts || !shiftsStore.shifts.length) {
    shiftsStore.fetchShiftsOnlyAction()
  }
})

const removeStep = (index) => {
  if (form.value.rotation_sequence.length <= 1) {
    showToastWarning('Minimal 1 langkah rotasi diperlukan!')
    return
  }
  form.value.rotation_sequence.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.start_date || !form.value.rotation_sequence.length) {
    showToastWarning('Harap lengkapi nama pola, tanggal mulai, dan urutan rotasi!')
    return
  }
  try {
    isSubmitting.value = true
    const payload = {
      name: form.value.name,
      start_date: form.value.start_date,
      is_weekend_off: Boolean(form.value.is_weekend_off),
      rotation_sequence: form.value.rotation_sequence.map(step => ({
        shift_id: step.is_day_off ? null : step.shift_id,
        duration_days: Number(step.duration_days) || 1,
        is_day_off: Boolean(step.is_day_off)
      }))
    }

    let res
    if (props.team && props.team.id) {
      // ✏️ Mode Edit: Gunakan PUT /api/v1/rotation-patterns/{id}
      res = await shiftsStore.updateRotationPatternAction(props.team.id, payload)
    } else {
      // ➕ Mode Tambah Baru: Gunakan POST /api/v1/shift-teams/{teamId}/patterns
      const targetTeamId = shiftsStore.shiftTeams[0]?.id
      if (!targetTeamId) {
        showToastError('Belum ada Tim Shift terdaftar untuk mengaitkan pola rotasi!')
        return
      }
      res = await shiftsStore.setTeamRotationPatternAction(targetTeamId, payload)
    }

    if (res && res.success) {
      showToastSuccess(`✅ Pola rotasi '${form.value.name}' berhasil disimpan!`)
      emit('saved')
      emit('close')
    } else {
      showToastError(res?.message || 'Gagal menyimpan pola rotasi')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div class="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <h2 class="font-display font-black text-lg text-slate-800 mb-1">
        {{ team?.name ? 'Edit Pola Rotasi Tim' : 'Buat Pola Rotasi Baru' }}
      </h2>
      <p v-if="team?.name" class="text-xs text-slate-500 mb-1">Tim: <strong class="text-emerald-700 font-bold">{{ team.name }}</strong></p>
      <p class="text-xs text-slate-500 mb-6">
        Atur urutan rotasi harian (shift / libur). Pola ini akan dipakai saat meng-generate roster massal.
      </p>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Nama Pola Rotasi <span class="text-rose-500">*</span></label>
          <input
            v-model="form.name"
            required
            type="text"
            placeholder="Contoh: Pola Rotasi Operasional 2 Pagi → 2 Sore → 2 Malam → 2 Off"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Mulai Berlaku Pola <span class="text-rose-500">*</span></label>
          <input
            v-model="form.start_date"
            required
            type="date"
            placeholder="Pilih Tanggal Mulai Siklus"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800"
          />
        </div>

        <!-- OPSI PENGARUH WEEKEND (SABTU & MINGGU LIBUR AUTOMATIC) -->
        <div class="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3">
          <input
            v-model="form.is_weekend_off"
            type="checkbox"
            id="is_weekend_off"
            class="accent-emerald-600 size-4 mt-0.5 cursor-pointer"
          />
          <label for="is_weekend_off" class="cursor-pointer text-xs">
            <span class="block font-bold text-slate-800">Otomatis Liburkan Hari Weekend (Sabtu &amp; Minggu)</span>
            <span class="block text-[11px] text-slate-500 mt-0.5">
              Jika dicentang, sistem akan otomatis menetapkan status Hari Libur (Day Off) pada setiap hari Sabtu &amp; Minggu tanpa memotong urutan siklus rotasi reguler.
            </span>
          </label>
        </div>

        <!-- Sequence List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Urutan Langkah Rotasi (Sequence)
            </label>
            <BaseButton variant="secondary" type="button" class="!py-1 !px-2 text-[10px]" @click="addStep">
              <PlusIcon class="size-3" />
              <span>Tambah Langkah</span>
            </BaseButton>
          </div>

          <div class="space-y-3">
            <div
              v-for="(step, idx) in form.rotation_sequence"
              :key="idx"
              class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3"
            >
              <span class="font-mono text-[10px] font-bold text-slate-400 w-5">#{{ idx + 1 }}</span>

              <!-- Mode: Shift vs Day Off -->
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div>
                  <label class="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Tipe</label>
                  <select
                    v-model="step.is_day_off"
                    class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option :value="false">Shift Kerja</option>
                    <option :value="true">Hari Libur (Off)</option>
                  </select>
                </div>

                <div v-if="!step.is_day_off">
                  <label class="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Pilih Shift</label>
                  <select
                    v-model="step.shift_id"
                    required
                    class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Shift --</option>
                    <option v-for="sf in availableShifts" :key="sf.id" :value="sf.id">
                      {{ sf.name }} ({{ sf.code || 'SF' }})
                    </option>
                  </select>
                </div>
                <div v-else class="text-[10px] text-slate-400 italic self-center pt-3">
                  🌴 Day Off / Libur
                </div>

                <div>
                  <label class="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Durasi (Hari)</label>
                  <input
                    v-model.number="step.duration_days"
                    required
                    type="number"
                    min="1"
                    class="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <!-- Remove step -->
              <BaseButton
                variant="danger"
                type="button"
                class="!p-1.5 self-center"
                @click="removeStep(idx)"
              >
                <TrashIcon class="size-3 text-white" />
              </BaseButton>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
          <BaseButton variant="secondary" type="button" @click="emit('close')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmitting">
            <span>{{ isSubmitting ? 'Menyimpan...' : 'Simpan Pola Rotasi' }}</span>
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
