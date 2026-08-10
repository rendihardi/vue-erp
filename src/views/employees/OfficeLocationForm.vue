<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon, MapPinIcon, ShieldCheckIcon } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const isEdit = ref(false)
const locationId = ref(null)

const form = ref({
  name: '',
  address: '',
  latitude: -6.2088,
  longitude: 106.8456,
  radius_meters: 100,
  is_active: true
})

onMounted(async () => {
  await employeeStore.loadOfficeLocationsOnly()
  if (route.params.id) {
    isEdit.value = true
    locationId.value = route.params.id
    
    const loc = employeeStore.officeLocations.find(l => String(l.id) === String(locationId.value))
    if (loc) {
      form.value = {
        name: loc.name || '',
        address: loc.address || '',
        latitude: loc.latitude ?? -6.2088,
        longitude: loc.longitude ?? 106.8456,
        radius_meters: loc.radius_meters ?? 100,
        is_active: loc.is_active !== undefined ? !!loc.is_active : true
      }
    }
  }
})

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await employeeStore.updateOfficeLocationAction(locationId.value, form.value)
    } else {
      await employeeStore.createOfficeLocationAction(form.value)
    }
    router.push({ path: '/employees', query: { tab: 'locations' } })
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50/50 overscroll-none" id="main-content">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push({ path: '/employees', query: { tab: 'locations' } })" class="!p-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-white">
        <ArrowLeftIcon class="size-4 text-slate-600" />
      </BaseButton>
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <MapPinIcon class="size-3" />
          <span>Geofencing Core</span>
        </div>
        <h1 class="font-display font-black text-2xl text-slate-900 tracking-tight">
          {{ isEdit ? 'Edit Lokasi Cabang' : 'Tambah Lokasi Cabang Baru' }}
        </h1>
        <p class="text-xs text-slate-500">
          Atur titik koordinat GPS dan radius batas presensi kehadiran karyawan.
        </p>
      </div>
    </div>

    <!-- Form Container -->
    <div class="max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-sm p-8">
      <form @submit.prevent="handleSave" class="flex flex-col gap-5 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Nama Kantor Cabang / Lokasi</label>
          <input 
            v-model="form.name" 
            required 
            type="text" 
            placeholder="Contoh: Kantor Pusat HQ Jakarta" 
            class="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs font-medium text-slate-800 transition-all" 
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Alamat Lengkap</label>
          <textarea 
            v-model="form.address" 
            rows="3" 
            placeholder="Jl. Jendral Sudirman No. 45, Jakarta Selatan" 
            class="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs font-medium text-slate-800 transition-all resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Latitude (GPS)</label>
            <input 
              v-model.number="form.latitude" 
              required 
              type="number" 
              step="any" 
              placeholder="-6.2088" 
              class="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs font-mono font-medium text-slate-800 transition-all" 
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Longitude (GPS)</label>
            <input 
              v-model.number="form.longitude" 
              required 
              type="number" 
              step="any" 
              placeholder="106.8456" 
              class="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs font-mono font-medium text-slate-800 transition-all" 
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Radius Toleransi Geofence (Meter)</label>
            <div class="relative">
              <input 
                v-model.number="form.radius_meters" 
                required 
                type="number" 
                min="10" 
                max="5000" 
                placeholder="100" 
                class="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 pr-16 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs font-mono font-medium text-slate-800 transition-all" 
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-[10px]">Meter</span>
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Status Lokasi</label>
            <select 
              v-model="form.is_active" 
              class="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-xs font-medium text-slate-800 transition-all"
            >
              <option :value="true">Aktif (Dapat digunakan presensi)</option>
              <option :value="false">Nonaktif / Penutupan</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-5">
          <div class="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheckIcon class="size-4 text-emerald-600 shrink-0" />
            <span>Validasi Geofencing Terintegrasi FastAPI</span>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton variant="secondary" type="button" @click="router.push({ path: '/employees', query: { tab: 'locations' } })">
              Batal
            </BaseButton>
            <BaseButton variant="primary-emerald" type="submit">
              Simpan Lokasi
            </BaseButton>
          </div>
        </div>
      </form>
    </div>
  </main>
</template>
