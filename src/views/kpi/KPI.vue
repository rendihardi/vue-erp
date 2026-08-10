<script setup>
import { ref } from 'vue'
import { usePerformanceStore } from '../../store/performance'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import { 
  SparklesIcon, 
  CheckCircle2Icon,
  HelpCircleIcon,
  ClipboardCheckIcon,
  UserCheckIcon
} from '@lucide/vue'

const performanceStore = usePerformanceStore()

// State for rating modal/inline form
const activeRatingReviewId = ref(null)
const tempManagerScore = ref(4)
const tempManagerNotes = ref('')

const handleStartRating = (review) => {
  activeRatingReviewId.value = review.id
  tempManagerScore.value = 4
  tempManagerNotes.value = ''
}

const handleCancelRating = () => {
  activeRatingReviewId.value = null
}

const handleSubmitRating = async (reviewId) => {
  if (!tempManagerScore.value) return
  await performanceStore.rateManagerAction(reviewId, tempManagerScore.value, tempManagerNotes.value)
  activeRatingReviewId.value = null
}

const handleReleaseScorecard = async (reviewId) => {
  await performanceStore.releaseScorecardAction(reviewId)
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- HEADER -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Performance module Active
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Evaluasi Kinerja & KPI Karyawan
        </h1>
        <p class="text-xs text-slate-500">
          Kelola periode penilaian kinerja, input skor atasan, dan rilis scorecard final otomatis dengan kombinasi kehadiran.
        </p>
      </div>
    </div>

    <!-- KPI CALCULATION FORMULA & PERIOD DETAILS -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Period Card -->
      <section class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between" aria-labelledby="period-title">
        <div>
          <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Periode Aktif</span>
          <h2 id="period-title" class="font-display font-bold text-lg text-slate-800 mb-1">
            Quarter 1 2026
          </h2>
          <p class="text-xs text-slate-400 font-mono mb-4">Type: quarterly</p>
          
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
            <span class="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Terbuka untuk Penilaian</span>
          </div>
        </div>
        <div class="text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
          Tenggat penilaian: 31 Maret 2026
        </div>
      </section>

      <!-- KPI Formula Card -->
      <section class="lg:col-span-2 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between" aria-labelledby="formula-title">
        <div>
          <h2 id="formula-title" class="font-display font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
            <HelpCircleIcon class="size-4.5 text-emerald-600" aria-hidden="true" />
            <span>Bobot Penilaian Scorecard Akhir (Sprint 7)</span>
          </h2>
          <p class="text-xs text-slate-500 leading-relaxed mb-4">
            Nilai akhir dihitung otomatis berdasarkan proporsi bobot di bawah ini. Nilai evaluasi diri dan manajer dikonversikan ke skala 100 sebelum dihitung.
          </p>

          <!-- Formula display block -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-[10px] font-bold text-slate-400 uppercase">Kehadiran</span>
              <span class="font-display font-bold text-base text-slate-700">20%</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-[10px] font-bold text-slate-400 uppercase">Evaluasi Atasan</span>
              <span class="font-display font-bold text-base text-slate-700">50%</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span class="block text-[10px] font-bold text-slate-400 uppercase">Evaluasi Diri</span>
              <span class="font-display font-bold text-base text-slate-700">30%</span>
            </div>
          </div>
        </div>
        
        <div class="mt-4 text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5">
          <SparklesIcon class="size-3.5" aria-hidden="true" />
          <span>Skala Grade: A (&ge;85), B (&ge;70), C (&ge;55), D (&ge;40), E (&lt;40)</span>
        </div>
      </section>
    </div>

    <!-- REVIEWS TABLE -->
    <section class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="reviews-title">
      <h2 id="reviews-title" class="font-display font-bold text-base text-slate-800 mb-4">
        Daftar Penilaian KPI Karyawan
      </h2>

      <!-- Table wrapper -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th class="pb-3 font-semibold" scope="col">Nama Karyawan / ID</th>
              <th class="pb-3 font-semibold" scope="col">Kehadiran</th>
              <th class="pb-3 font-semibold" scope="col">Evaluasi Diri (Self)</th>
              <th class="pb-3 font-semibold" scope="col">Evaluasi Atasan (Manager)</th>
              <th class="pb-3 font-semibold text-right" scope="col">Nilai Akhir</th>
              <th class="pb-3 font-semibold text-center" scope="col">Grade</th>
              <th class="pb-3 font-semibold text-center" scope="col">Status</th>
              <th class="pb-3 font-semibold text-center" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="rev in performanceStore.reviews" :key="rev.id">
              <tr class="hover:bg-slate-50/50">
                <td class="py-3.5">
                  <span class="block font-bold text-slate-700">{{ rev.name }}</span>
                  <span class="block text-[10px] text-slate-400 font-mono">{{ rev.employeeId }} — {{ rev.dept }}</span>
                </td>
                <td class="py-3.5 font-mono text-slate-600">95%</td>
                <td class="py-3.5">
                  <span class="block font-bold text-slate-700">{{ rev.selfScore.toFixed(1) }} / 5.0</span>
                  <span class="block text-[10px] text-slate-400 max-w-xs truncate" :title="rev.selfNotes">{{ rev.selfNotes }}</span>
                </td>
                <td class="py-3.5">
                  <div v-if="rev.managerScore > 0">
                    <span class="block font-bold text-slate-700">{{ rev.managerScore.toFixed(1) }} / 5.0</span>
                    <span class="block text-[10px] text-slate-400 max-w-xs truncate" :title="rev.managerNotes">{{ rev.managerNotes }}</span>
                  </div>
                  <span v-else class="text-slate-400 italic">Belum dinilai atasan</span>
                </td>
                <td class="py-3.5 text-right font-mono font-bold text-slate-800 tabular-nums">
                  {{ rev.finalScore > 0 ? rev.finalScore.toFixed(1) : '—' }}
                </td>
                <td class="py-3.5 text-center">
                  <span 
                    v-if="rev.grade"
                    class="inline-block size-6 rounded-full leading-6 font-display font-bold text-xs"
                    :class="[
                      rev.grade === 'A'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rev.grade === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{ rev.grade }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="py-3.5 text-center">
                  <BaseBadge 
                    :variant="
                      rev.status === 'released'
                        ? 'success'
                        : rev.status === 'manager_rated'
                          ? 'info'
                          : 'warning'
                    "
                  >
                    {{ rev.status }}
                  </BaseBadge>
                </td>
                <td class="py-3.5 text-center">
                  <BaseButton
                    v-if="rev.status === 'self_assessed' && activeRatingReviewId !== rev.id"
                    variant="primary-emerald"
                    @click="handleStartRating(rev)"
                  >
                    <UserCheckIcon class="size-3" aria-hidden="true" />
                    <span>Beri Nilai</span>
                  </BaseButton>

                  <BaseButton
                    v-else-if="rev.status === 'manager_rated'"
                    variant="primary-emerald"
                    @click="handleReleaseScorecard(rev.id)"
                  >
                    <ClipboardCheckIcon class="size-3" aria-hidden="true" />
                    <span>Rilis Scorecard</span>
                  </BaseButton>

                  <div v-else-if="rev.status === 'released'" class="flex items-center justify-center text-emerald-600 gap-1 text-[10px] font-semibold">
                    <CheckCircle2Icon class="size-3.5" aria-hidden="true" />
                    <span>Rilis Resmi</span>
                  </div>

                  <span v-else class="text-slate-400">—</span>
                </td>
              </tr>

              <!-- Expandable Inline Rating Form Row -->
              <tr v-if="activeRatingReviewId === rev.id" class="bg-slate-50/50">
                <td colspan="8" class="p-4 border-t border-slate-100">
                  <form @submit.prevent="handleSubmitRating(rev.id)" class="space-y-4" role="form" aria-label="Beri Nilai Atasan">
                    <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Beri Penilaian Atasan untuk {{ rev.name }}
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div class="md:col-span-1">
                        <label for="rating-score" class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Skor Manager (1.0 - 5.0)
                        </label>
                        <input
                          id="rating-score"
                          v-model.number="tempManagerScore"
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          required
                          class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div class="md:col-span-3">
                        <label for="rating-notes" class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Catatan Ulasan Manajer
                        </label>
                        <input
                          id="rating-notes"
                          v-model="tempManagerNotes"
                          type="text"
                          required
                          placeholder="Contoh: Sangat baik, target tercapai dengan memuaskan..."
                          class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div class="flex justify-end gap-2 text-xs">
                      <BaseButton variant="secondary" @click="handleCancelRating">Batal</BaseButton>
                      <BaseButton variant="primary-emerald" type="submit">Simpan Nilai</BaseButton>
                    </div>
                  </form>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
