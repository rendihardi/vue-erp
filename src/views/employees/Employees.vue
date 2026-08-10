<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import BasePagination from '../../components/BasePagination.vue'
import TableSkeleton from '../../components/TableSkeleton.vue'
import { 
  UsersIcon, 
  MapPinIcon, 
  FileTextIcon,
  FingerprintIcon,
  SearchIcon,
  SparklesIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  BookmarkIcon,
  BuildingIcon,
  Building2Icon,
  BriefcaseIcon,
  ClockIcon
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const activeTab = ref(route.query.tab || 'employees')
const searchQ = ref('')
const isLoading = ref(false)

const loadTabData = async (tab, page = 1) => {
  try {
    isLoading.value = true
    if (tab === 'employees') {
      await employeeStore.loadEmployeesPaginated(page, 10, searchQ.value)
    } else if (tab === 'locations') {
      await employeeStore.loadOfficeLocationsPaginated(page, 10)
    } else if (tab === 'departments') {
      await employeeStore.loadDepartmentsPaginated(page, 10)
    } else if (tab === 'positions') {
      await employeeStore.loadPositionsPaginated(page, 10)
    }
  } finally {
    isLoading.value = false
  }
}

// Watch activeTab and query parameter changes to trigger API fetch
watch(activeTab, (newTab) => {
  if (newTab) loadTabData(newTab, 1)
}, { immediate: true })

watch(() => route.query.tab, (newTab) => {
  if (newTab && newTab !== activeTab.value) {
    activeTab.value = newTab
  }
})

const handleSearchInput = () => {
  loadTabData('employees', 1)
}

// Page change handlers
const handleEmployeePageChange = (page) => {
  loadTabData('employees', page)
}
const handleLocationPageChange = (page) => {
  loadTabData('locations', page)
}
const handleDepartmentPageChange = (page) => {
  loadTabData('departments', page)
}
const handlePositionPageChange = (page) => {
  loadTabData('positions', page)
}

const handleDelete = async (type, id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
  try {
    if (type === 'employee') {
      await employeeStore.deleteEmployeeAction(id)
    } else if (type === 'location') {
      await employeeStore.deleteOfficeLocationAction(id)
    } else if (type === 'department') {
      await employeeStore.deleteDepartmentAction(id)
    } else if (type === 'position') {
      await employeeStore.deletePositionAction(id)
    }
    loadTabData(activeTab.value, 1)
  } catch (err) {
    alert('Penghapusan gagal: ' + err.message)
  }
}

onMounted(async () => {
  await loadTabData(activeTab.value, 1)
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- MODULE SUB-HEADER -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          HRIS Core & Master Data (API v1)
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Master Data Karyawan & Lokasi
        </h1>
        <p class="text-xs text-slate-500">
          Kelola struktur organisasi, lokasi kantor cabang geofencing, departemen, jabatan, dan data karyawan.
        </p>
      </div>

      <!-- Search Field -->
      <div v-if="activeTab === 'employees'" class="relative max-w-xs w-full">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
          <SearchIcon class="size-4 text-slate-400" />
        </span>
        <input
          v-model="searchQ"
          @input="handleSearchInput"
          type="text"
          placeholder="Cari NIK, Nama, Departemen..."
          class="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-sm font-medium"
        />
      </div>
    </div>

    <!-- TABS NAVIGATION (Royal Blue Pill Tabs) -->
    <div class="flex bg-white/80 p-1.5 rounded-2xl border border-slate-100 shadow-2xs mb-6 gap-1 overflow-x-auto">
      <button 
        @click="activeTab = 'employees'; router.replace('/employees?tab=employees')"
        :class="activeTab === 'employees' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-4 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-2 cursor-pointer"
      >
        <UsersIcon class="size-3.5" />
        <span>Daftar Karyawan</span>
      </button>
      <button 
        @click="activeTab = 'locations'; router.replace('/employees?tab=locations')"
        :class="activeTab === 'locations' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-4 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-2 cursor-pointer"
      >
        <MapPinIcon class="size-3.5" />
        <span>Lokasi Cabang (GPS)</span>
      </button>
      <button 
        @click="activeTab = 'departments'; router.replace('/employees?tab=departments')"
        :class="activeTab === 'departments' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-4 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-2 cursor-pointer"
      >
        <Building2Icon class="size-3.5" />
        <span>Departemen</span>
      </button>
      <button 
        @click="activeTab = 'positions'; router.replace('/employees?tab=positions')"
        :class="activeTab === 'positions' ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
        class="px-4 py-2 text-xs font-semibold rounded-xl focus:outline-none transition-all flex items-center gap-2 cursor-pointer"
      >
        <BriefcaseIcon class="size-3.5" />
        <span>Jabatan (Positions)</span>
      </button>
    </div>

    <!-- TAB CONTENT: EMPLOYEES -->
    <section v-if="activeTab === 'employees'" class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm mb-8" aria-labelledby="employee-title">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 id="employee-title" class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <UsersIcon class="size-4 text-emerald-600" aria-hidden="true" />
            <span>Master Karyawan (Employees)</span>
          </h2>
          <p class="text-[11px] text-slate-400 font-medium mt-0.5">Daftar seluruh staf karyawan terdaftar beserta pola shift & lokasi cabang.</p>
        </div>
        <BaseButton variant="primary-emerald" @click="router.push('/employees/create')">
          <PlusIcon class="size-3.5" />
          <span>Tambah Karyawan</span>
        </BaseButton>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">NIK</th>
              <th class="py-3 px-4 font-semibold" scope="col">Nama / Email</th>
              <th class="py-3 px-4 font-semibold" scope="col">Departemen & Jabatan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Lokasi Kantor</th>
              <th class="py-3 px-4 font-semibold" scope="col">Mode Shift</th>
              <th class="py-3 px-4 font-semibold" scope="col">Status</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoading" :columns="7" :rows="6" />
            <template v-else>
              <tr v-for="emp in employeeStore.employees" :key="emp.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-mono text-slate-600 font-bold">{{ emp.nik }}</td>
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <img v-if="emp.avatar" :src="emp.avatar" :alt="emp.name" class="size-8 rounded-full object-cover border border-slate-200/80 shadow-xs" />
                    <div v-else class="size-8 rounded-full bg-blue-50 text-[#3b52f6] border border-blue-100 flex items-center justify-center font-bold text-xs font-display">
                      {{ emp.name ? emp.name.charAt(0).toUpperCase() : 'E' }}
                    </div>
                    <div>
                      <span class="block font-bold text-slate-800">{{ emp.name }}</span>
                      <span class="block text-[11px] text-slate-400 font-mono">{{ emp.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="block text-slate-700 font-semibold">{{ emp.dept }}</span>
                  <span class="block text-[11px] text-slate-400 font-medium">{{ emp.position }}</span>
                </td>
                <td class="py-3.5 px-4">
                  <div class="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                    <MapPinIcon class="size-3 text-emerald-600" />
                    <span>{{ emp.officeLocation }}</span>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <BaseBadge :variant="emp.shiftMode === 'roster' ? 'warning' : 'info'">
                    {{ emp.shiftMode === 'roster' ? 'Roster Shift' : 'Fixed Shift' }}
                  </BaseBadge>
                </td>
                <td class="py-3.5 px-4">
                  <BaseBadge :variant="emp.status === 'Active' ? 'success' : 'neutral'">
                    {{ emp.status }}
                  </BaseBadge>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex justify-center gap-1.5">
                    <BaseButton variant="secondary" class="!p-1.5" title="Detail, Riwayat Lokasi & Biometrik" @click="router.push(`/employees/detail/${emp.id}`)">
                      <FingerprintIcon class="size-3.5 text-emerald-600" />
                    </BaseButton>
                    <BaseButton variant="secondary" class="!p-1.5" title="Edit Karyawan" @click="router.push(`/employees/edit/${emp.id}`)">
                      <EditIcon class="size-3.5" />
                    </BaseButton>
                    <BaseButton variant="danger" class="!p-1.5" title="Hapus Karyawan" @click="handleDelete('employee', emp.id)">
                      <TrashIcon class="size-3.5" />
                    </BaseButton>
                  </div>
                </td>
              </tr>
              <tr v-if="!employeeStore.employees || employeeStore.employees.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400 font-medium">
                  Belum ada data karyawan terdaftar.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <BasePagination
        :current-page="employeeStore.employeesPaginated.current_page || 1"
        :last-page="employeeStore.employeesPaginated.last_page || 1"
        :total="employeeStore.employeesPaginated.total || employeeStore.employees.length"
        :per-page="10"
        @page-change="handleEmployeePageChange"
      />
    </section>

    <!-- TAB CONTENT: LOCATIONS -->
    <section v-if="activeTab === 'locations'" class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm mb-8" aria-labelledby="loc-title">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 id="loc-title" class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <MapPinIcon class="size-4 text-emerald-600" aria-hidden="true" />
            <span>Master Lokasi Kantor Cabang (Office Locations)</span>
          </h2>
          <p class="text-[11px] text-slate-400 font-medium mt-0.5">Pengaturan koordinat GPS & radius geofencing presensi kehadiran karyawan.</p>
        </div>
        <BaseButton variant="primary-emerald" @click="router.push('/employees/locations/create')">
          <PlusIcon class="size-3.5" />
          <span>Tambah Lokasi Cabang</span>
        </BaseButton>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Lokasi Cabang</th>
              <th class="py-3 px-4 font-semibold" scope="col">Alamat Lengkap</th>
              <th class="py-3 px-4 font-semibold" scope="col">Koordinat GPS</th>
              <th class="py-3 px-4 font-semibold" scope="col">Radius Geofence</th>
              <th class="py-3 px-4 font-semibold" scope="col">Status</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoading" :columns="6" :rows="5" />
            <template v-else>
              <tr v-for="loc in employeeStore.officeLocations" :key="loc.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-800">{{ loc.name }}</td>
                <td class="py-3.5 px-4 text-slate-600 max-w-xs truncate">{{ loc.address || '-' }}</td>
                <td class="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                  <span>{{ loc.latitude }}, {{ loc.longitude }}</span>
                </td>
                <td class="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                  {{ loc.radius_meters || 100 }} Meter
                </td>
                <td class="py-3.5 px-4">
                  <BaseBadge :variant="loc.is_active !== false ? 'success' : 'neutral'">
                    {{ loc.is_active !== false ? 'Aktif' : 'Nonaktif' }}
                  </BaseBadge>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex justify-center gap-1.5">
                    <BaseButton variant="secondary" class="!p-1.5" @click="router.push(`/employees/locations/edit/${loc.id}`)">
                      <EditIcon class="size-3.5" />
                    </BaseButton>
                    <BaseButton variant="danger" class="!p-1.5" @click="handleDelete('location', loc.id)">
                      <TrashIcon class="size-3.5" />
                    </BaseButton>
                  </div>
                </td>
              </tr>
              <tr v-if="employeeStore.officeLocations.length === 0">
                <td colspan="6" class="py-8 text-center text-slate-400 font-medium">
                  Belum ada data lokasi kantor cabang terdaftar.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Locations Pagination Bar -->
      <BasePagination
        :current-page="employeeStore.officeLocationsPaginated.current_page || 1"
        :last-page="employeeStore.officeLocationsPaginated.last_page || 1"
        :total="employeeStore.officeLocationsPaginated.total || employeeStore.officeLocations.length"
        :per-page="10"
        @page-change="handleLocationPageChange"
      />
    </section>

    <!-- TAB CONTENT: DEPARTMENTS -->
    <section v-if="activeTab === 'departments'" class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm mb-8" aria-labelledby="dept-title">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 id="dept-title" class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <BuildingOfficeIcon class="size-4 text-emerald-600" aria-hidden="true" />
            <span>Master Departemen</span>
          </h2>
          <p class="text-[11px] text-slate-400 font-medium mt-0.5">Daftar unit departemen operasional organisasi perusahaan.</p>
        </div>
        <BaseButton variant="primary-emerald" @click="router.push('/employees/departments/create')">
          <PlusIcon class="size-3.5" />
          <span>Tambah Departemen</span>
        </BaseButton>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Departemen</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoading" :columns="2" :rows="5" />
            <template v-else>
              <tr v-for="dept in employeeStore.departments" :key="dept.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-800">{{ dept.name }}</td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex justify-center gap-1.5">
                    <BaseButton variant="secondary" class="!p-1.5" @click="router.push(`/employees/departments/edit/${dept.id}`)">
                      <EditIcon class="size-3.5" />
                    </BaseButton>
                    <BaseButton variant="danger" class="!p-1.5" @click="handleDelete('department', dept.id)">
                      <TrashIcon class="size-3.5" />
                    </BaseButton>
                  </div>
                </td>
              </tr>
              <tr v-if="employeeStore.departments.length === 0">
                <td colspan="2" class="py-8 text-center text-slate-400 font-medium">
                  Belum ada data departemen terdaftar.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Departments Pagination Bar -->
      <BasePagination
        :current-page="employeeStore.departmentsPaginated.current_page || 1"
        :last-page="employeeStore.departmentsPaginated.last_page || 1"
        :total="employeeStore.departmentsPaginated.total || employeeStore.departments.length"
        :per-page="10"
        @page-change="handleDepartmentPageChange"
      />
    </section>

    <!-- TAB CONTENT: POSITIONS -->
    <section v-if="activeTab === 'positions'" class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm mb-8" aria-labelledby="pos-title">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 id="pos-title" class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <BookmarkIcon class="size-4 text-emerald-600" aria-hidden="true" />
            <span>Master Jabatan</span>
          </h2>
          <p class="text-[11px] text-slate-400 font-medium mt-0.5">Daftar jenjang karir dan struktur jabatan karyawan.</p>
        </div>
        <BaseButton variant="primary-emerald" @click="router.push('/employees/positions/create')">
          <PlusIcon class="size-3.5" />
          <span>Tambah Jabatan</span>
        </BaseButton>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Jabatan</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoading" :columns="2" :rows="5" />
            <template v-else>
              <tr v-for="pos in employeeStore.positions" :key="pos.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-800">{{ pos.name }}</td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex justify-center gap-1.5">
                    <BaseButton variant="secondary" class="!p-1.5" @click="router.push(`/employees/positions/edit/${pos.id}`)">
                      <EditIcon class="size-3.5" />
                    </BaseButton>
                    <BaseButton variant="danger" class="!p-1.5" @click="handleDelete('position', pos.id)">
                      <TrashIcon class="size-3.5" />
                    </BaseButton>
                  </div>
                </td>
              </tr>
              <tr v-if="employeeStore.positions.length === 0">
                <td colspan="2" class="py-8 text-center text-slate-400 font-medium">
                  Belum ada data jabatan terdaftar.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Positions Pagination Bar -->
      <BasePagination
        :current-page="employeeStore.positionsPaginated.current_page || 1"
        :last-page="employeeStore.positionsPaginated.last_page || 1"
        :total="employeeStore.positionsPaginated.total || employeeStore.positions.length"
        :per-page="10"
        @page-change="handlePositionPageChange"
      />
    </section>
  </main>
</template>

