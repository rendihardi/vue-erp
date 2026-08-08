<script setup>
defineProps({
  columns: {
    type: Number,
    default: 6
  },
  rows: {
    type: Number,
    default: 5
  }
})
</script>

<template>
  <tr 
    v-for="r in rows" 
    :key="r"
    class="animate-pulse border-b border-slate-100/60"
  >
    <td v-for="c in columns" :key="c" class="py-4 px-4">
      <div class="h-3.5 bg-slate-200/70 rounded-md w-full max-w-[85%]"></div>
    </td>
  </tr>
</template>
