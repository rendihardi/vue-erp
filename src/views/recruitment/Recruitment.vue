<script setup>
import { ref } from 'vue'
import { useRecruitmentStore } from '../../store/recruitment'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import { 
  BriefcaseIcon, 
  UserPlusIcon, 
  SparklesIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  InfoIcon
} from '@lucide/vue'

const recruitmentStore = useRecruitmentStore()

const activeTab = ref('candidates') // 'jobs' or 'candidates'
const successMessage = ref('')

const handleConvert = async (candidateId) => {
  const result = await recruitmentStore.convertCandidateAction(candidateId, '019fd564-a0ca-7f2e-bf73-670a59fa876a')
  if (result.success) {
    successMessage.value = `Sukses Onboarding! ${result.name} telah berhasil di-onboard menjadi karyawan aktif dengan NIK baru: ${result.nik}.`
    setTimeout(() => {
      successMessage.value = ''
    }, 8000)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- HEADER -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Recruitment module Active
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Rekrutmen & Onboarding
        </h1>
        <p class="text-xs text-slate-500">
          Kelola lowongan pekerjaan, pantau kandidat di setiap funnel rekrutmen, dan onboard kandidat 'hired' menjadi karyawan aktif dalam 1-klik.
        </p>
      </div>
    </div>

    <!-- SUCCESS ALERT -->
    <div 
      v-if="successMessage"
      class="p-4 mb-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3 shadow-sm shadow-emerald-100/50"
      role="alert"
      aria-live="polite"
    >
      <CheckCircle2Icon class="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
      <div>
        <span class="font-bold block mb-0.5">Proses Berhasil</span>
        <span>{{ successMessage }} Karyawan baru kini telah otomatis masuk ke daftar master karyawan dan buku besar penggajian.</span>
      </div>
    </div>

    <!-- TABS SELECTOR -->
    <div class="flex border-b border-slate-200 mb-6 gap-2" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'candidates'"
        @click="activeTab = 'candidates'"
        class="px-4 py-2.5 font-display font-bold text-xs border-b-2 transition-all"
        :class="activeTab === 'candidates' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-700'"
      >
        Kandidat & Funnel
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'jobs'"
        @click="activeTab = 'jobs'"
        class="px-4 py-2.5 font-display font-bold text-xs border-b-2 transition-all"
        :class="activeTab === 'jobs' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-700'"
      >
        Lowongan Pekerjaan (Jobs)
      </button>
    </div>

    <!-- TAB CONTENT: CANDIDATES & FUNNEL -->
    <div v-if="activeTab === 'candidates'" class="space-y-6">
      <section class="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        <div class="text-center p-2">
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Applied</span>
          <span class="block font-display font-bold text-lg text-slate-700">1</span>
        </div>
        <div class="text-center p-2 border-l border-slate-100">
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Screening</span>
          <span class="block font-display font-bold text-lg text-slate-700">0</span>
        </div>
        <div class="text-center p-2 border-l border-slate-100">
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Interview</span>
          <span class="block font-display font-bold text-lg text-slate-700">1</span>
        </div>
        <div class="text-center p-2 border-l border-slate-100">
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Offered</span>
          <span class="block font-display font-bold text-lg text-slate-700">0</span>
        </div>
        <div class="text-center p-2 border-l border-slate-100">
          <span class="block text-[9px] font-bold text-emerald-600 uppercase">Hired</span>
          <span class="block font-display font-bold text-lg text-emerald-600">
            {{ recruitmentStore.candidates.filter(c => c.status === 'hired').length }}
          </span>
        </div>
        <div class="text-center p-2 border-l border-slate-100">
          <span class="block text-[9px] font-bold text-slate-400 uppercase">Onboarded</span>
          <span class="block font-display font-bold text-lg text-slate-500">
            {{ recruitmentStore.candidates.filter(c => c.status === 'onboarded').length }}
          </span>
        </div>
      </section>

      <!-- Candidates Table -->
      <section class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="candidates-title">
        <h2 id="candidates-title" class="sr-only">Daftar Pelamar Pekerjaan</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" role="table">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th class="pb-3 font-semibold" scope="col">Nama Pelamar</th>
                <th class="pb-3 font-semibold" scope="col">Email & Kontak</th>
                <th class="pb-3 font-semibold" scope="col">Lowongan Yang Dilamar</th>
                <th class="pb-3 font-semibold text-center" scope="col">Funnel Status</th>
                <th class="pb-3 font-semibold text-center" scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr 
                v-for="cand in recruitmentStore.candidates" 
                :key="cand.id"
                class="hover:bg-slate-50/50"
              >
                <td class="py-3.5">
                  <span class="font-bold text-slate-700 block">{{ cand.name }}</span>
                  <span class="text-[10px] text-slate-400 font-mono">{{ cand.id }}</span>
                </td>
                <td class="py-3.5">
                  <span class="block text-slate-600">{{ cand.email }}</span>
                  <span class="block text-[10px] text-slate-400 font-mono">{{ cand.phone }}</span>
                </td>
                <td class="py-3.5 text-slate-700 font-medium">{{ cand.position }}</td>
                <td class="py-3.5 text-center">
                  <BaseBadge 
                    :variant="
                      cand.status === 'onboarded'
                        ? 'neutral'
                        : cand.status === 'hired'
                          ? 'success'
                          : cand.status === 'interview'
                            ? 'warning'
                            : 'info'
                    "
                  >
                    {{ cand.status }}
                  </BaseBadge>
                </td>
                <td class="py-3.5 text-center">
                  <BaseButton
                    v-if="cand.status === 'hired'"
                    variant="primary-emerald"
                    @click="handleConvert(cand.id)"
                  >
                    <UserPlusIcon class="size-3.5" aria-hidden="true" />
                    <span>Onboard Karyawan</span>
                  </BaseButton>
                  <div 
                    v-else-if="cand.status === 'onboarded'" 
                    class="inline-flex items-center gap-1 text-slate-500 text-[10px] font-semibold select-none"
                  >
                    <CheckCircle2Icon class="size-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Onboarded</span>
                  </div>
                  <span v-else class="text-slate-400 text-[10px]">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- TAB CONTENT: JOB VACANCIES -->
    <div v-if="activeTab === 'jobs'" class="space-y-6">
      <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          v-for="job in recruitmentStore.jobs" 
          :key="job.id"
          class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono font-bold uppercase">{{ job.dept }}</span>
              <span class="size-2 rounded-full bg-emerald-500" aria-hidden="true" title="Published"></span>
            </div>
            <h3 class="font-display font-bold text-base text-slate-800 mb-2 flex items-center gap-2">
              <BriefcaseIcon class="size-4.5 text-slate-500" aria-hidden="true" />
              <span>{{ job.title }}</span>
            </h3>
            <p class="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
              {{ job.requirements }}
            </p>
          </div>
          
          <div class="border-t border-slate-100 pt-4 flex items-center justify-between text-[10px] text-slate-400">
            <span>Vacancy ID: {{ job.id }}</span>
            <span class="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5">
              <span>Kelola Pelamar</span>
              <ChevronRightIcon class="size-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
