<script setup>
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  lastPage: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    default: 0
  },
  perPage: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['page-change'])

const fromItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.perPage + 1
})

const toItem = computed(() => {
  return Math.min(props.currentPage * props.perPage, props.total)
})

const pages = computed(() => {
  const current = props.currentPage
  const last = props.lastPage
  const delta = 2
  const range = []

  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) range.unshift('...')
  if (current + delta < last - 1) range.push('...')

  range.unshift(1)
  if (last > 1) range.push(last)

  return range
})

const goToPage = (page) => {
  if (typeof page !== 'number') return
  if (page >= 1 && page <= props.lastPage && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-600 font-sans">
    <!-- Items Counter -->
    <div class="font-medium text-slate-600">
      Menampilkan <span class="font-semibold text-slate-900 font-mono">{{ fromItem }}</span> – <span class="font-semibold text-slate-900 font-mono">{{ toItem }}</span> dari <span class="font-bold text-slate-900 font-mono">{{ total }}</span> data
    </div>

    <!-- Navigation Buttons -->
    <div class="flex items-center gap-1" role="navigation" aria-label="Pagination Navigation">
      <!-- Previous Button -->
      <button
        type="button"
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage <= 1"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        aria-label="Halaman Sebelumnya"
      >
        <ChevronLeftIcon class="size-3.5" />
        <span class="hidden sm:inline text-xs">Prev</span>
      </button>

      <!-- Page Numbers -->
      <div class="flex items-center gap-1">
        <template v-for="(p, idx) in pages" :key="idx">
          <span v-if="p === '...'" class="px-2 py-1 text-slate-400 font-mono select-none">...</span>
          <button
            v-else
            type="button"
            @click="goToPage(p)"
            :class="[
              'px-3 py-1 rounded-xl font-mono text-xs font-semibold transition-all focus:outline-none cursor-pointer',
              p === currentPage
                ? 'bg-[#3b52f6] text-white shadow-xs shadow-[#3b52f6]/30 font-bold'
                : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
            ]"
          >
            {{ p }}
          </button>
        </template>
      </div>

      <!-- Next Button -->
      <button
        type="button"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= lastPage"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        aria-label="Halaman Selanjutnya"
      >
        <span class="hidden sm:inline text-xs">Next</span>
        <ChevronRightIcon class="size-3.5" />
      </button>
    </div>
  </div>
</template>
