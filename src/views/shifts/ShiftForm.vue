<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShiftsStore } from '../../store/shifts'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const shiftsStore = useShiftsStore()

const isEdit = ref(false)
const shiftId = ref(null)

const form = ref({
  name: '',
  code: '',
  start_time: '08:00:00',
  end_time: '16:00:00',
  grace_period_minutes: 15
})

onMounted(async () => {
  await shiftsStore.fetchShiftsOnlyAction()
  if (route.params.id) {
    isEdit.value = true
    shiftId.value = route.params.id
    
    const sf = shiftsStore.shifts.find(s => s.id === shiftId.value)
    if (sf) {
      form.value = {
        name: sf.name,
        code: sf.code,
        start_time: sf.startTime,
        end_time: sf.endTime,
        grace_period_minutes: sf.gracePeriodMinutes
      }
    }
  }
})

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await shiftsStore.updateShiftAction(shiftId.value, form.value)
    } else {
      await shiftsStore.createShiftAction(form.value)
    }
    router.push('/employees/shifts')
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push('/employees/shifts')" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          {{ isEdit ? 'Edit Data Shift Kerja' : 'Tambah Shift Kerja Baru' }}
        </h1>
        <p class="text-xs text-slate-500">
          Atur nama, kode, rentang waktu masuk/pulang, dan batas toleransi terlambat roster shift.
        </p>
      </div>
    </div>

    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Nama Shift</label>
          <input v-model="form.name" required type="text" placeholder="Shift Siang (Afternoon)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Kode Shift</label>
          <input v-model="form.code" required type="text" placeholder="AFTERNOON" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Jam Mulai</label>
          <input v-model="form.start_time" required type="text" placeholder="14:00:00" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Jam Selesai</label>
          <input v-model="form.end_time" required type="text" placeholder="22:00:00" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Toleransi Keterlambatan (Menit)</label>
          <input v-model.number="form.grace_period_minutes" required type="number" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push('/employees/shifts')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
