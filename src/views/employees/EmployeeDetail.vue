<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import { useSharedServicesStore } from '../../store/sharedServices'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  FingerprintIcon, 
  ShieldCheckIcon,
  ClockIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()
const sharedServicesStore = useSharedServicesStore()

const employeeId = ref(route.params.id)
const employee = ref(null)
const activeTab = ref('location-history')

const locationHistory = ref([])
const faceProfile = ref(null)
const loadingFace = ref(false)
const consentGiven = ref(false)
const photoFile = ref(null)
const uploadPreview = ref(null)

const fetchEmployeeDetails = async () => {
  const emp = employeeStore.employees.find(e => String(e.id) === String(employeeId.value))
  if (emp) {
    employee.value = emp
  }

  // Load Location History
  const history = await sharedServicesStore.loadLocationHistory(employeeId.value)
  if (history) {
    locationHistory.value = history
  }

  // Load Face Profile & Consent
  const face = await sharedServicesStore.loadFaceProfile(employeeId.value)
  if (face) {
    faceProfile.value = face
  }
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    photoFile.value = file
    uploadPreview.value = URL.createObjectURL(file)
  }
}

const handleRegisterFace = async () => {
  if (!consentGiven.value) {
    alert('Anda harus menyetujui persetujuan pemrosesan data biometrik UU PDP No. 27/2022.')
    return
  }
  if (!photoFile.value) {
    alert('Pilih foto sampel wajah terlebih dahulu.')
    return
  }

  try {
    loadingFace.value = true
    const formData = new FormData()
    formData.append('photo', photoFile.value)
    formData.append('consent_given', 'true')

    await sharedServicesStore.registerFaceProfileAction(employeeId.value, formData)
    alert('Registrasi biometrik wajah & UU PDP consent berhasil disimpan.')
    photoFile.value = null
    uploadPreview.value = null
    await fetchEmployeeDetails()
  } catch (err) {
    alert('Registrasi biometrik gagal: ' + err.message)
  } finally {
    loadingFace.value = false
  }
}

const handleRevokeFace = async () => {
  if (!confirm('Apakah Anda yakin ingin menghapus data biometrik wajah karyawan ini (Hak Revoke Consent UU PDP)?')) return
  try {
    loadingFace.value = true
    await sharedServicesStore.revokeFaceProfileAction(employeeId.value)
    alert('Data biometrik wajah telah dihapus dari server.')
    await fetchEmployeeDetails()
  } catch (err) {
    alert('Penghapusan biometrik gagal: ' + err.message)
  } finally {
    loadingFace.value = false
  }
}

onMounted(async () => {
  await employeeStore.loadEmployeesOnly()
  await fetchEmployeeDetails()
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push('/employees')" class="!p-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-white">
        <ArrowLeftIcon class="size-4 text-slate-600" />
      </BaseButton>
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <ShieldCheckIcon class="size-3" />
          <span>Biometrik & Kepatuhan PDP</span>
        </div>
        <h1 class="font-display font-black text-2xl text-slate-900 tracking-tight">
          Detail Karyawan: {{ employee?.name || 'Loading...' }}
        </h1>
        <p class="text-xs text-slate-500">
          NIK: <span class="font-mono font-bold text-slate-700">{{ employee?.nik }}</span> | 
          Departemen: <span class="font-bold text-slate-700">{{ employee?.dept }}</span>
        </p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-200 mb-6 gap-2">
      <button 
        @click="activeTab = 'location-history'"
        :class="activeTab === 'location-history' ? 'border-emerald-600 text-emerald-700 font-bold bg-white shadow-sm rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
        class="px-5 py-3 border-b-2 text-xs focus:outline-none transition-all flex items-center gap-2"
      >
        <MapPinIcon class="size-3.5" />
        <span>Riwayat Penempatan Cabang</span>
      </button>
      <button 
        @click="activeTab = 'face-profile'"
        :class="activeTab === 'face-profile' ? 'border-emerald-600 text-emerald-700 font-bold bg-white shadow-sm rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-700 font-semibold'"
        class="px-5 py-3 border-b-2 text-xs focus:outline-none transition-all flex items-center gap-2"
      >
        <FingerprintIcon class="size-3.5" />
        <span>Biometrik Wajah & UU PDP</span>
      </button>
    </div>

    <!-- TAB 1: LOCATION HISTORY -->
    <section v-if="activeTab === 'location-history'" class="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
      <h2 class="font-display font-bold text-base text-slate-800 mb-4 flex items-center gap-2">
        <MapPinIcon class="size-4 text-emerald-600" />
        <span>Histori Mutasi & Penempatan Kantor Cabang</span>
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Cabang / Lokasi</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Mulai (Start Date)</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tanggal Selesai (End Date)</th>
              <th class="py-3 px-4 font-semibold rounded-r-lg" scope="col">Status Penempatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="item in locationHistory" :key="item.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3.5 px-4 font-bold text-slate-800">{{ item.office_location_name || item.location_name }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ item.start_date }}</td>
              <td class="py-3.5 px-4 font-mono text-slate-600">{{ item.end_date || 'Sekarang (Aktif)' }}</td>
              <td class="py-3.5 px-4">
                <BaseBadge :variant="!item.end_date ? 'success' : 'neutral'">
                  {{ !item.end_date ? 'Aktif Saat Ini' : 'Riwayat Lampau' }}
                </BaseBadge>
              </td>
            </tr>
            <tr v-if="locationHistory.length === 0">
              <td colspan="4" class="py-8 text-center text-slate-400 font-medium">
                Belum ada catatan histori mutasi lokasi cabang untuk karyawan ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 2: FACE PROFILE & UU PDP CONSENT -->
    <section v-if="activeTab === 'face-profile'" class="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 max-w-2xl">
      <div class="mb-6 border-b border-slate-100 pb-4">
        <h2 class="font-display font-bold text-base text-slate-800 mb-1 flex items-center gap-2">
          <FingerprintIcon class="size-4 text-emerald-600" />
          <span>Biometrik Wajah (InsightFace AI) & Persetujuan UU PDP</span>
        </h2>
        <p class="text-xs text-slate-500">
          Sesuai ketentuan **UU PDP No. 27 Tahun 2022**, pengolahan data spesifik biometrik membutuhkan persetujuan tegas pemilik data.
        </p>
      </div>

      <!-- Current Status Card -->
      <div class="mb-6 p-4 rounded-xl border" :class="faceProfile?.registered || employee?.faceRegistered ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-full flex items-center justify-center font-bold text-lg" :class="faceProfile?.registered || employee?.faceRegistered ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'">
              <CheckCircleIcon v-if="faceProfile?.registered || employee?.faceRegistered" class="size-5" />
              <AlertCircleIcon v-else class="size-5" />
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-xs">
                Status Biometrik: {{ (faceProfile?.registered || employee?.faceRegistered) ? 'Terdaftar & Aktif' : 'Belum Terdaftar' }}
              </h3>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Consent UU PDP: <span class="font-bold text-slate-700">{{ (faceProfile?.consent_given || employee?.faceRegistered) ? 'Disetujui (Granted)' : 'Belum Ada Consent' }}</span>
              </p>
            </div>
          </div>
          <BaseButton 
            v-if="faceProfile?.registered || employee?.faceRegistered" 
            variant="danger" 
            class="!text-xs" 
            @click="handleRevokeFace" 
            :disabled="loadingFace"
          >
            <TrashIcon class="size-3.5" />
            <span>Hapus Biometrik (Revoke PDP)</span>
          </BaseButton>
        </div>
      </div>

      <!-- Upload / Register Form -->
      <form @submit.prevent="handleRegisterFace" class="flex flex-col gap-5 text-xs font-sans">
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Unggah Foto Sampel Wajah Karyawan</label>
          <input 
            type="file" 
            accept="image/*" 
            @change="handleFileChange" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
          />
        </div>

        <div v-if="uploadPreview" class="size-32 rounded-xl overflow-hidden border border-slate-200">
          <img :src="uploadPreview" alt="Preview Foto Sampel Wajah" class="size-full object-cover" />
        </div>

        <!-- UU PDP Checkbox Clause -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div class="flex items-start gap-3">
            <input 
              id="pdp_consent" 
              v-model="consentGiven" 
              type="checkbox" 
              class="size-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0" 
            />
            <label for="pdp_consent" class="text-[11px] text-slate-600 leading-relaxed">
              Saya secara sadar memberikan persetujuan (consent) kepada perusahaan untuk menyimpan dan mengolah data biometrik ekstraksi wajah (*face vector*) untuk keperluan verifikasi presensi sesuai **Undang-Undang Pelindungan Data Pribadi (UU PDP) No. 27 Tahun 2022**.
            </label>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <BaseButton variant="primary-emerald" type="submit" :disabled="loadingFace || !consentGiven || !photoFile">
            <PlusIcon class="size-3.5" />
            <span>Registrasikan Biometrik Wajah</span>
          </BaseButton>
        </div>
      </form>
    </section>
  </main>
</template>
