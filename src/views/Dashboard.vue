<script setup>
import { ref } from 'vue'
import SummaryCard from '../components/SummaryCard.vue'
import ProgressBar from '../components/ProgressBar.vue'
import DonutChart from '../components/DonutChart.vue'
import UpcomingEvent from '../components/UpcomingEvent.vue'
import QuickLink from '../components/QuickLink.vue'
import LeaveBalance from '../components/LeaveBalance.vue'
import { 
  UsersIcon, 
  TrendingUpIcon, 
  HourglassIcon, 
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon
} from '@lucide/vue'

const currentDateFormatted = ref('Tuesday, 15 September 2026')

// Who's Off mock list matching reference
const whosOffList = ref([
  { id: 1, name: 'Samuel Henry', role: 'STAFF HRD', reason: 'Sick · Only today', avatarColor: 'bg-amber-100 text-amber-700' },
  { id: 2, name: 'Caterin Smith', role: 'CEO', reason: 'Annual Leave · 25 to 30 Sept 2026', avatarColor: 'bg-emerald-100 text-emerald-700' },
  { id: 3, name: 'James Queen', role: 'STAFF HRD', reason: 'Married · 25 to 30 Sept 2026', avatarColor: 'bg-blue-100 text-blue-700' },
  { id: 4, name: 'Mahmud Derawan', role: 'STAFF HRD', reason: 'Sick · Only today', avatarColor: 'bg-[#3b52f6]/10 text-[#3b52f6]' }
])
</script>

<template>
  <main class="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-6 font-sans bg-[#f3f4f9]" id="main-content">
    <!-- DASHBOARD GREETING HEADER -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="font-black text-2xl sm:text-3xl text-slate-900 font-display flex items-center gap-2">
          <span>Good morning, Samuel!</span>
          <span class="text-2xl">👋</span>
        </h1>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Here's what's happening with your team today.
        </p>
      </div>

      <!-- Right Date Badge -->
      <div class="inline-flex items-center gap-2 bg-white border border-slate-100/80 shadow-xs px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-700 shrink-0">
        <CalendarIcon class="size-4 text-slate-400" />
        <span>{{ currentDateFormatted }}</span>
      </div>
    </div>

    <!-- ROW 1: SUMMARY STAT CARDS (4 COLUMNS) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard 
        title="Total Employee" 
        value="1,284" 
        trend="12.5% from last month"
        iconBg="bg-indigo-50 text-[#3b52f6]"
      >
        <UsersIcon class="size-5" />
      </SummaryCard>

      <SummaryCard 
        title="Attendance Rate" 
        value="94.8%" 
        trend="4.3% from last month"
        iconBg="bg-emerald-50 text-emerald-600"
      >
        <TrendingUpIcon class="size-5" />
      </SummaryCard>

      <SummaryCard 
        title="Pending Request" 
        value="23" 
        trend="8 from last month"
        iconBg="bg-amber-50 text-amber-600"
      >
        <HourglassIcon class="size-5" />
      </SummaryCard>

      <SummaryCard 
        title="Overtime (This Month)" 
        value="128.5h" 
        trend="18.2% from last month"
        iconBg="bg-blue-50 text-blue-600"
      >
        <ClockIcon class="size-5" />
      </SummaryCard>
    </div>

    <!-- MAIN DASHBOARD CONTENT GRID (3 COLUMNS: 2 COLUMNS LEFT + 1 COLUMN RIGHT) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- LEFT 2 COLUMNS: ANALYTICS & WORKFORCE WIDGETS -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- ROW 2: ANALYTICS CARDS (3 COLUMNS) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProgressBar 
            title="Employment Status"
            :total="50"
            :segments="[
              { label: 'Permanent', count: 10, percent: 20, color: 'bg-amber-500' },
              { label: 'Contract', count: 40, percent: 80, color: 'bg-[#3b52f6]' }
            ]"
          />

          <ProgressBar 
            title="Task Progress"
            :total="50"
            :segments="[
              { label: 'To Do List', count: 10, percent: 20, color: 'bg-cyan-400' },
              { label: 'Complete', count: 40, percent: 80, color: 'bg-[#3b52f6]' }
            ]"
          />

          <DonutChart 
            title="Gender Diversity"
            :items="[
              { label: 'Man', count: 10, percent: 20, color: 'bg-amber-500' },
              { label: 'Woman', count: 40, percent: 80, color: 'bg-[#3b52f6]' }
            ]"
          />
        </div>

        <!-- ROW 3: QUICK LINKS & WHO'S OFF -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Quick Links (1 Column) -->
          <div class="md:col-span-1">
            <QuickLink />
          </div>

          <!-- Who's Off Widget (2 Columns) -->
          <div class="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-sm text-slate-900">Who's Off</h3>
              <div class="flex items-center gap-1 text-xs text-slate-400 font-semibold cursor-pointer">
                <span>15 Sept, 2026</span>
                <ChevronDownIcon class="size-3.5" />
              </div>
            </div>

            <div class="space-y-2.5">
              <div 
                v-for="off in whosOffList" 
                :key="off.id"
                class="bg-slate-50/60 border border-slate-100/60 rounded-xl p-2.5 flex items-center justify-between transition-all hover:bg-slate-100/60"
              >
                <div class="flex items-center gap-3">
                  <!-- Avatar Circle -->
                  <div class="size-9 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0" :class="off.avatarColor">
                    {{ off.name.split(' ').map(n=>n[0]).join('') }}
                  </div>
                  <div>
                    <span class="block font-bold text-slate-900 text-xs leading-tight">
                      {{ off.name }} <span class="text-slate-400 text-[10px] font-mono font-normal">({{ off.role }})</span>
                    </span>
                    <span class="block text-[10px] text-slate-500 font-medium mt-0.5">{{ off.reason }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: UPCOMING EVENTS & LEAVE BALANCE -->
      <div class="space-y-6">
        <!-- Upcoming Meeting Widget -->
        <UpcomingEvent />

        <!-- Leave Balance Widget -->
        <LeaveBalance />
      </div>

    </div>
  </main>
</template>
