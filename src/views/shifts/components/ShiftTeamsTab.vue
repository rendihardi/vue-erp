<script setup>
import { useShiftsStore } from '../../../store/shifts'
import BaseButton from '../../../components/BaseButton.vue'
import { PlusIcon, EditIcon, TrashIcon, RefreshCwIcon, ShieldCheckIcon, UsersIcon } from '@lucide/vue'

const shiftsStore = useShiftsStore()

const emit = defineEmits([
  'open-create-team',
  'open-edit-team',
  'delete-team',
  'open-pattern-modal',
  'open-matrix-calendar'
])
</script>

<template>
  <div class="font-sans">
    <!-- Info banner -->
    <div class="mb-6 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex items-start gap-3">
      <UsersIcon class="size-4.5 text-indigo-600 mt-0.5 flex-shrink-0" />
      <div>
        <h3 class="font-display font-bold text-sm text-indigo-900 mb-0.5">Manajemen Kelompok Tim Shift</h3>
        <p class="text-xs text-indigo-700 leading-relaxed">
          Kelola keanggotaan kelompok tim shift kerja. Pengaturan <strong>Pola Rotasi Shift</strong> &amp; jadwal harian kini dihubungkan secara fleksibel saat membuat <strong>Roster Plan Periode</strong>.
        </p>
      </div>
    </div>

    <!-- Team Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="team in shiftsStore.shiftTeams"
        :key="team.id"
        class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between group"
      >
        <div>
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-bold uppercase border border-indigo-100">
                TIM SHIFT
              </span>
              <span class="text-[10px] text-slate-400 font-mono">{{ team.activeMembersCount || 0 }} anggota</span>
            </div>
            <!-- Edit & Delete actions -->
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <BaseButton variant="secondary" class="!p-1.5" @click="emit('open-edit-team', team)">
                <EditIcon class="size-3 text-slate-500" />
              </BaseButton>
              <BaseButton variant="danger" class="!p-1.5" @click="emit('delete-team', team)">
                <TrashIcon class="size-3 text-white" />
              </BaseButton>
            </div>
          </div>
          <h2 class="font-display font-black text-base text-slate-800 mb-1.5">{{ team.name }}</h2>
          <p class="text-xs text-slate-500 leading-relaxed">{{ team.description || 'Tidak ada deskripsi.' }}</p>
        </div>
        <div class="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Keanggotaan Aktif</span>
          <span class="font-bold text-slate-800">{{ team.activeMembersCount || 0 }} Karyawan</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!shiftsStore.shiftTeams || !shiftsStore.shiftTeams.length"
        class="col-span-3 p-10 text-center bg-white border border-dashed border-slate-200 rounded-2xl"
      >
        <ShieldCheckIcon class="size-8 text-slate-200 mx-auto mb-3" />
        <p class="text-sm text-slate-400 font-medium mb-2">Belum ada Tim Shift terdaftar.</p>
        <BaseButton variant="primary-emerald" @click="emit('open-create-team')">
          <PlusIcon class="size-3.5" />
          <span>Buat Tim Shift Pertama</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
