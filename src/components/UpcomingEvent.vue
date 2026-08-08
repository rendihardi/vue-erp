<script setup>
defineProps({
  events: {
    type: Array,
    default: () => [
      { id: 1, date: '23', day: 'Mon', title: 'Redesign Landing Page', time: '10:00 - 11:00 am', participants: ['SH', 'CS', 'JQ'] },
      { id: 2, date: '24', day: 'Sun', title: 'Project apps food delivery', time: '10:00 - 11:00 am', participants: ['SH', 'CS', 'MD'] },
      { id: 3, date: '25', day: 'Mon', title: 'Redesign Landing Page', time: '10:00 - 11:00 am', participants: ['CS', 'JQ'] },
      { id: 4, date: '24', day: 'Sun', title: 'Project apps food delivery', time: '10:00 - 11:00 am', participants: ['SH', 'MD'] },
      { id: 5, date: '23', day: 'Mon', title: 'Redesign Landing Page', time: '10:00 - 11:00 am', participants: ['SH', 'CS', 'JQ'] }
    ]
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-sm text-slate-900">Upcoming Meeting</h3>
      <button class="text-xs font-semibold text-[#3b52f6] hover:underline">See All</button>
    </div>

    <div class="space-y-3">
      <div 
        v-for="evt in events" 
        :key="evt.id"
        class="bg-slate-50/70 border border-slate-100/80 rounded-xl p-3 flex items-center justify-between transition-all hover:bg-slate-100/50"
      >
        <div class="flex items-center gap-3">
          <!-- Date Box -->
          <div class="bg-white rounded-xl border border-slate-100 p-2 text-center shrink-0 w-11 shadow-2xs font-mono">
            <span class="block text-xs font-black text-slate-900 leading-tight">{{ evt.date }}</span>
            <span class="block text-[10px] text-slate-400 font-medium leading-tight">{{ evt.day }}</span>
          </div>
          <div>
            <span class="block font-bold text-slate-900 text-xs leading-tight">{{ evt.title }}</span>
            <span class="block text-[10px] text-slate-400 font-medium mt-0.5">{{ evt.time }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Avatars Stack -->
          <div class="flex -space-x-2 overflow-hidden">
            <div 
              v-for="(p, pIdx) in evt.participants.slice(0, 3)" 
              :key="pIdx"
              class="inline-block size-6 rounded-full ring-2 ring-white bg-[#3b52f6]/10 text-[#3b52f6] text-[9px] font-bold font-mono flex items-center justify-center"
            >
              {{ p }}
            </div>
            <span v-if="evt.participants.length > 3" class="inline-block size-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 text-[9px] font-bold font-mono flex items-center justify-center">
              +{{ evt.participants.length - 3 }}
            </span>
          </div>

          <button class="text-slate-300 hover:text-slate-600 text-xs font-bold px-1">•••</button>
        </div>
      </div>
    </div>
  </div>
</template>
