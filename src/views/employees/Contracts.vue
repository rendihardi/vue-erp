<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import BasePagination from '../../components/BasePagination.vue'
import TableSkeleton from '../../components/TableSkeleton.vue'
import { 
  FileTextIcon,
  SearchIcon,
  TrashIcon,
  PlusIcon,
  EditIcon,
  DownloadIcon
} from '@lucide/vue'

const router = useRouter()
const employeeStore = useEmployeeStore()

const searchQ = ref('')
const currentPage = ref(1)
const perPage = ref(10)
const isLoading = ref(true)

onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.allSettled([employeeStore.loadContractsOnly(), employeeStore.loadEmployeesOnly()])
  } finally {
    isLoading.value = false
  }
})

const getEmployeeName = (empId) => {
  const emp = employeeStore.employees.find(e => e.id === empId)
  return emp ? emp.name : 'Unknown Employee'
}

const getEmployeeNik = (empId) => {
  const emp = employeeStore.employees.find(e => e.id === empId)
  return emp ? emp.nik : '—'
}

const getEmployeeAvatar = (empId) => {
  const emp = employeeStore.employees.find(e => e.id === empId)
  return emp ? (emp.avatar || emp.avatar_url || null) : null
}

const hasDocumentFile = (c) => {
  if (!c) return false
  return !!(c.document_file || c.document_path || c.document_url || c.download_url || c.has_document || c.file_name)
}

const handleDownloadContract = async (c) => {
  if (!hasDocumentFile(c)) {
    alert('Dokumen fisik belum diunggah untuk nomor kontrak ini.')
    return
  }
  if (c.download_url || c.document_url) {
    window.open(c.download_url || c.document_url, '_blank')
    return
  }
  try {
    const res = await employeeStore.downloadContractFile(c.id)
    if (res && res.data) {
      const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Contract-${c.contract_number || c.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
  } catch (err) {
    alert('Dokumen belum tersedia / belum diunggah untuk nomor kontrak ini.')
  }
}

const filteredContracts = computed(() => {
  if (!searchQ.value) return employeeStore.contracts || []
  const q = searchQ.value.toLowerCase()
  return (employeeStore.contracts || []).filter(c => 
    c.contract_number?.toLowerCase().includes(q) ||
    c.contract_type?.toLowerCase().includes(q) ||
    getEmployeeName(c.employee_id).toLowerCase().includes(q) ||
    getEmployeeNik(c.employee_id).toLowerCase().includes(q)
  )
})

const totalContracts = computed(() => filteredContracts.value.length)
const lastPage = computed(() => Math.ceil(totalContracts.value / perPage.value) || 1)

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredContracts.value.slice(start, start + perPage.value)
})

const handleDelete = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus kontrak ini?')) return
  try {
    await employeeStore.deleteContractAction(id)
  } catch (err) {
    alert('Gagal menghapus kontrak: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-6 md:p-8 overflow-y-auto h-full bg-[#f3f4f9] font-sans overscroll-none" id="main-content">
    <!-- HEADER -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[#3b52f6] text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
          Contracts &amp; Legalities
        </div>
        <h1 class="font-display font-black text-2xl text-slate-900 tracking-tight mb-1">
          Kontrak Kerja Karyawan (PKWT/PKWTT)
        </h1>
        <p class="text-xs text-slate-500 font-medium">
          Kelola berkas legalitas, masa berlaku kerja kontrak karyawan tetap (PKWTT), PKWT, maupun pemagang.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Search Field -->
        <div class="relative w-60 hidden sm:block">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
            <SearchIcon class="size-3.5 text-slate-400" />
          </span>
          <input
            v-model="searchQ"
            @input="currentPage = 1"
            type="text"
            placeholder="Cari No. Kontrak / Karyawan..."
            class="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3b52f6] transition-all shadow-2xs"
          />
        </div>

        <BaseButton variant="primary-blue" @click="router.push('/employees/contracts/create')">
          <PlusIcon class="size-3.5" />
          <span>Tambah Kontrak</span>
        </BaseButton>
      </div>
    </div>

    <!-- CONTRACTS TABLE CARD CONTAINER -->
    <section class="p-6 rounded-2xl border border-slate-100/80 bg-white shadow-xs" aria-labelledby="contracts-title">
      <div class="flex items-center justify-between mb-4">
        <h2 id="contracts-title" class="font-display font-bold text-base text-slate-900">
          Daftar Kontrak Kerja Terdaftar
        </h2>
        <span class="text-xs font-mono font-semibold text-slate-400">Total: {{ totalContracts }} Data</span>
      </div>

      <div class="overflow-x-auto border border-slate-100/80 rounded-2xl">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/70 font-mono">
              <th class="py-3.5 px-4 font-semibold" scope="col">No. Kontrak</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Karyawan / NIK</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Tipe Kontrak</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Mulai</th>
              <th class="py-3.5 px-4 font-semibold" scope="col">Selesai</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Dokumen</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Status</th>
              <th class="py-3.5 px-4 font-semibold text-center" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <TableSkeleton v-if="isLoading" :columns="8" :rows="5" />
            <template v-else>
              <tr v-for="c in paginatedContracts" :key="c.id" class="hover:bg-slate-50/70 transition-colors">
                <td class="py-3.5 px-4 font-mono text-slate-900 font-bold">
                  {{ c.contract_number }}
                </td>
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <img v-if="getEmployeeAvatar(c.employee_id)" :src="getEmployeeAvatar(c.employee_id)" :alt="getEmployeeName(c.employee_id)" class="size-8 rounded-full object-cover border border-slate-200/80 shadow-xs" />
                    <div v-else class="size-8 rounded-full bg-blue-50 text-[#3b52f6] border border-blue-100 flex items-center justify-center font-bold text-xs font-display">
                      {{ getEmployeeName(c.employee_id).charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <span class="block font-bold text-slate-900">{{ getEmployeeName(c.employee_id) }}</span>
                      <span class="block text-[10px] text-slate-400 font-mono">{{ getEmployeeNik(c.employee_id) }}</span>
                    </div>
                  </div>
                </td>
                <td class="py-3.5 px-4">
                  <span class="font-medium text-slate-700">{{ c.contract_type }}</span>
                </td>
                <td class="py-3.5 px-4 text-slate-600 font-mono">{{ c.start_date }}</td>
                <td class="py-3.5 px-4 text-slate-600 font-mono">{{ c.end_date || 'Seumur Hidup' }}</td>
                <td class="py-3.5 px-4 text-center font-mono">
                  <button 
                    v-if="hasDocumentFile(c)" 
                    @click="handleDownloadContract(c)" 
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 transition-colors text-[11px] font-semibold cursor-pointer shadow-2xs"
                    title="Unduh Dokumen PDF"
                  >
                    <FileTextIcon class="size-3.5 text-rose-500" />
                    <span>PDF</span>
                  </button>
                  <span v-else class="text-slate-400 font-mono">—</span>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <BaseBadge 
                    :variant="
                      c.status === 'active' 
                        ? 'success' 
                        : c.status === 'expired' 
                          ? 'warning' 
                          : 'danger'
                    "
                  >
                    {{ c.status }}
                  </BaseBadge>
                </td>
                <td class="py-3.5 px-4 text-center">
                  <div class="flex justify-center gap-1.5">
                    <BaseButton v-if="hasDocumentFile(c)" variant="secondary" title="Unduh Dokumen Kontrak" @click="handleDownloadContract(c)">
                      <DownloadIcon class="size-3.5 text-blue-600" />
                    </BaseButton>
                    <BaseButton variant="secondary" title="Edit Kontrak" @click="router.push(`/employees/contracts/edit/${c.id}`)">
                      <EditIcon class="size-3.5" />
                    </BaseButton>
                    <BaseButton variant="danger" title="Hapus Kontrak" @click="handleDelete(c.id)">
                      <TrashIcon class="size-3.5" />
                    </BaseButton>
                  </div>
                </td>
              </tr>
              <tr v-if="!paginatedContracts.length">
                <td colspan="8" class="py-8 text-center text-slate-400 font-medium italic">
                  Tidak ada data kontrak kerja terdaftar.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- BASE PAGINATION COMPONENT -->
      <BasePagination
        :current-page="currentPage"
        :last-page="lastPage"
        :total="totalContracts"
        :per-page="perPage"
        @page-change="(p) => currentPage = p"
      />
    </section>
  </main>
</template>
