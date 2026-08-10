<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const router = useRouter()
const employeeStore = useEmployeeStore()

const form = ref({
  name: '',
  latitude: -6.2088,
  longitude: 106.8456,
  radius_meters: 100
})

const handleSave = async () => {
  try {
    await employeeStore.createDepartmentAction(form.value)
    router.push({ path: '/employees', query: { tab: 'departments' } })
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push({ path: '/employees', query: { tab: 'departments' } })" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          Tambah Departemen Baru
        </h1>
        <p class="text-xs text-slate-500">
          Atur nama dan batasan geofencing untuk kantor cabang/departemen absensi baru.
        </p>
      </div>
    </div>

    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Nama Departemen</label>
          <input v-model="form.name" required type="text" placeholder="Finance Department" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Latitude</label>
          <input v-model.number="form.latitude" required type="number" step="any" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Longitude</label>
          <input v-model.number="form.longitude" required type="number" step="any" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Radius Geofence (Meter)</label>
          <input v-model.number="form.radius_meters" required type="number" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push({ path: '/employees', query: { tab: 'departments' } })">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
