<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary-emerald' // 'primary-emerald', 'primary-slate', 'secondary', 'danger', 'ghost'
  },
  type: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b52f6] select-none cursor-pointer'
  
  if (props.disabled) {
    return `${base} bg-slate-100 border border-slate-200/80 text-slate-400 cursor-not-allowed shadow-none`
  }

  switch (props.variant) {
    case 'primary':
    case 'primary-blue':
    case 'primary-emerald':
    case 'primary-slate':
    case 'primary-indigo':
      return `${base} bg-[#3b52f6] hover:bg-[#3245d9] text-white shadow-xs shadow-[#3b52f6]/30 active:scale-[0.98]`
    case 'success':
      return `${base} bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/30 active:scale-[0.98]`
    case 'danger':
      return `${base} bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 active:scale-[0.98]`
    case 'danger-solid':
      return `${base} bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-[0.98]`
    case 'ghost':
      return `${base} bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900`
    case 'secondary':
    default:
      return `${base} bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 hover:text-slate-900 shadow-2xs`
  }
})
</script>

<template>
  <button 
    :type="type"
    :disabled="disabled"
    :class="buttonClasses"
  >
    <slot />
  </button>
</template>
