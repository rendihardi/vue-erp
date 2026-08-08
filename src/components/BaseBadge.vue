<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral' // 'success', 'danger', 'warning', 'info', 'neutral', 'slate'
  }
})

const badgeClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 font-semibold'
    case 'danger':
      return 'bg-rose-50 text-rose-700 border-rose-200/60 font-semibold'
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200/60 font-semibold'
    case 'info':
      return 'bg-blue-50 text-[#3b52f6] border-blue-200/60 font-semibold'
    case 'slate':
      return 'bg-slate-100 text-slate-700 border-slate-200/60 font-semibold'
    case 'neutral':
    default:
      return 'bg-slate-100/70 text-slate-600 border-slate-200/60 font-medium'
  }
})
</script>

<template>
  <span 
    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border tracking-tight transition-colors select-none font-mono"
    :class="badgeClasses"
  >
    <slot />
  </span>
</template>
