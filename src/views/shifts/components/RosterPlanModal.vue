<script setup>
import { ref } from 'vue'
import { useErpStore } from '../../../store/erp'
import BaseButton from '../../../components/BaseButton.vue'

const erpStore = useErpStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  editingPlan: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'saved'])

const form = ref({
  name: '',
  code: '',
  period_start: '',
  period_end: '',
  shift_team_id: '',
  rotation_pattern_id: ''
})
const isSubmitting = ref(false)

import { watch } from 'vue'
import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

watch([() => props.show, () => props.editingPlan], ([isShowing, plan]) => {
  if (isShowing) {
    if (!erpStore.shiftTeams || !erpStore.shiftTeams.length) {
      erpStore.fetchShiftTeamsOnlyAction()
    }
    if (!erpStore.rotationPatterns || !erpStore.rotationPatterns.length) {
      erpStore.fetchRotationPatternsFilteredAction({ page: 1, per_page: 100 })
    }
    if (plan && plan.id) {
      form.value = {
        name: plan.name || '',
        code: plan.code || '',
        period_start: plan.period_start || plan.periodStart || '',
        period_end: plan.period_end || plan.periodEnd || '',
        shift_team_id: plan.shift_team_id || plan.shiftTeam?.id || plan.shiftTeamId || '',
        rotation_pattern_id: plan.rotation_pattern_id || plan.rotationPattern?.id || plan.rotationPatternId || ''
      }
    } else {
      form.value = {
        name: '',
        code: '',
        period_start: '',
        period_end: '',
        shift_team_id: '',
        rotation_pattern_id: ''
      }
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!form.value.name || !form.value.period_start || !form.value.period_end) {
    showToastWarning('Harap isi nama roster plan dan periode tanggal!')
    return
  }

  try {
    isSubmitting.value = true
    const payload = {
      name: form.value.name,
      code: form.value.code ? form.value.code.trim() : null,
      period_start: form.value.period_start,
      period_end: form.value.period_end,
      ...(form.value.shift_team_id ? { shift_team_id: form.value.shift_team_id } : {}),
      rotation_pattern_id: form.value.rotation_pattern_id || null
    }

    let res
    if (props.editingPlan && props.editingPlan.id) {
      // ✏️ Mode Edit: PUT /api/v1/roster-plans/{id}
      res = await erpStore.updateRosterPlanAction(props.editingPlan.id, payload)
    } else {
      // ➕ Mode Tambah Baru: POST /api/v1/roster-plans
      if (!form.value.shift_team_id) {
        showToastWarning('Harap pilih Tim Shift Target!')
        isSubmitting.value = false
        return
      }
      res = await erpStore.createRosterPlanAction(payload)
    }

    if (res && res.success) {
      showToastSuccess(`✨ Roster Plan '${res.data?.name || form.value.name}' berhasil disimpan!`)
      emit('created')
      emit('saved')
      emit('close')
    } else {
      showToastError(res?.message || 'Gagal menyimpan Roster Plan')
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
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <h2 class="font-display font-black text-lg text-slate-800 mb-1">
        {{ editingPlan ? 'Edit Roster Plan Periode' : 'Buat Roster Plan Periode' }}
      </h2>
      <p class="text-xs text-slate-500 mb-6">
        Kontainer Roster Plan menampung seluruh jadwal harian untuk periode bulanan.
      </p>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 text-xs">
        <!-- 1. Nama Roster -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Nama Roster Plan <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.name"
            required
            type="text"
            placeholder="contoh: Roster Operasional Sep 2026"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
          />
        </div>



        <!-- 3. Periode Tanggal -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Mulai <span class="text-rose-500">*</span></label>
            <input v-model="form.period_start" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal Selesai <span class="text-rose-500">*</span></label>
            <input v-model="form.period_end" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono text-slate-800" />
          </div>
        </div>

        <!-- 4. Pilih Tim Shift Target -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Pilih Tim Shift Target <span class="text-rose-500">*</span>
          </label>
          <select v-model="form.shift_team_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:border-emerald-500">
            <option value="">-- Pilih Tim Shift Target --</option>
            <option v-for="team in erpStore.shiftTeams" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.activeMembersCount || 0 }} Anggota)
            </option>
          </select>
        </div>

        <!-- 5. Pilih Pola Rotasi Shift (Opsional / Default dari Tim) -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
            Pola Rotasi Shift (Rotation Pattern) <span class="text-slate-400 font-normal normal-case">(Opsional)</span>
          </label>
          <select v-model="form.rotation_pattern_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:outline-none focus:border-emerald-500">
            <option value="">-- Ikuti Pola Rotasi Bawaan Tim Shift --</option>
            <option v-for="pattern in (erpStore.rotationPatterns || [])" :key="pattern.id" :value="pattern.id">
              {{ pattern.name }} ({{ (pattern.rotation_sequence || pattern.sequence || []).length }} Siklus Langkah)
            </option>
          </select>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
          <BaseButton variant="secondary" type="button" @click="emit('close')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmitting">
            <span>{{ isSubmitting ? 'Memproses...' : 'Buat Roster Plan' }}</span>
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
