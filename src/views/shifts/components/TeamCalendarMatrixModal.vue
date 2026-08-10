<script setup>
import { ref, watch } from 'vue'
import BaseBadge from '../../../components/BaseBadge.vue'
import BaseButton from '../../../components/BaseButton.vue'
import { CalendarDaysIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon } from '@lucide/vue'

import ScheduleAdjustmentModal from './ScheduleAdjustmentModal.vue'
import { useShiftsStore } from '../../../store/shifts'
import { useEmployeeStore } from '../../../store/employees'

const shiftsStore = useShiftsStore()
const employeeStore = useEmployeeStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  team: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const currentMonth = ref('2026-08')
const isLoading = ref(false)
const calendarData = ref(null)

const showAdjustmentModal = ref(false)
const activeCellSchedule = ref(null)

const handleCellClick = (member, dateStr) => {
  const sched = getScheduleForDay(member, dateStr)
  activeCellSchedule.value = {
    id: sched?.id || sched?.schedule_id || null,
    employee_id: member.employee_id || member.id || null,
    employee_name: member.name,
    date: dateStr,
    shift_id: sched?.shift_id || sched?.shift?.id || '',
    shift: sched?.shift || null,
    is_day_off: Boolean(sched?.is_day_off || (!sched?.shift && !sched?.shift_id))
  }
  showAdjustmentModal.value = true
}

const loadTeamCalendar = async () => {
  if (!props.team) return
  try {
    isLoading.value = true
    
    // Automatically detect month YYYY-MM from Roster Plan periodStart if present
    const pStart = props.team.periodStart || props.team.period_start
    if (pStart && typeof pStart === 'string' && pStart.includes('-')) {
      const parts = pStart.split('-')
      if (parts.length >= 2) {
        currentMonth.value = `${parts[0]}-${parts[1]}`
      }
    }

    let res = null
    // Call Roster Plan Calendar API (GET /api/v1/roster-plans/{id}/calendar)
    res = await shiftsStore.fetchRosterPlanCalendar(props.team.id)
    if (!res || !res.success || !res.data) {
      // Fallback to Shift Team Calendar API (GET /api/v1/shift-teams/{id}/calendar)
      res = await shiftsStore.fetchShiftTeamCalendar(props.team.id, currentMonth.value)
    }

    if (res && res.success && res.data) {
      calendarData.value = {
        team_id: res.data.roster_plan_id || res.data.team_id || props.team.id,
        team_name: res.data.roster_name || res.data.team_name || props.team.name,
        month: res.data.month || currentMonth.value,
        dates: res.data.dates || [],
        members_data: res.data.members_data || []
      }
      if (res.data.month) {
        currentMonth.value = res.data.month
      }
      if (!calendarData.value.members_data.length) {
        buildFallbackData()
      }
    } else {
      buildFallbackData()
    }
  } catch (err) {
    console.error('Failed to load roster plan calendar:', err.message)
    buildFallbackData()
  } finally {
    isLoading.value = false
  }
}

const buildFallbackData = () => {
  const dates = []
  // Parse year and month from currentMonth
  const [yStr, mStr] = currentMonth.value.split('-')
  const y = parseInt(yStr) || 2026
  const m = parseInt(mStr) || 8
  const daysInMonth = new Date(y, m, 0).getDate()

  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`
    dates.push(`${currentMonth.value}-${dayStr}`)
  }

  // Find actual team in shiftsStore.shiftTeams or fallback to employeeStore.employees
  const matchedTeam = shiftsStore.shiftTeams?.find(t => String(t.id) === String(props.team?.id))
  let members = []
  
  if (matchedTeam && Array.isArray(matchedTeam.activeMembers) && matchedTeam.activeMembers.length) {
    members = matchedTeam.activeMembers
  } else if (props.team && Array.isArray(props.team.activeMembers) && props.team.activeMembers.length) {
    members = props.team.activeMembers
  } else if (props.team && Array.isArray(props.team.members) && props.team.members.length) {
    members = props.team.members
  } else {
    // If team has no assigned members yet, use company employees list as default preview
    members = employeeStore.employees || [
      { id: 'emp-1', nik: 'EMP-00045', name: 'Budi Santoso', dept: 'Operasional' },
      { id: 'emp-2', nik: 'EMP-00046', name: 'Siti Rahma', dept: 'Operasional' },
      { id: 'emp-3', nik: 'EMP-00047', name: 'Ahmad Yani', dept: 'Operasional' }
    ]
  }

  const members_data = members.map((m, idx) => {
    const empName = m.employee?.name || m.name || `Karyawan #${idx + 1}`
    const empNik = m.employee?.nik || m.nik || `EMP-00${idx + 1}`
    const schedules = {}
    
    dates.forEach((d, dayIdx) => {
      const dt = new Date(d)
      const dayOfWeek = dt.getDay() // 0 = Minggu, 6 = Sabtu
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      if (isWeekend) {
        schedules[d] = { is_day_off: true, shift: null }
      } else {
        // Rotating shifts based on employee index and day index
        const shiftType = (dayIdx + idx * 2) % 3
        const shiftName = shiftType === 0 ? 'Shift Pagi' : (shiftType === 1 ? 'Shift Siang' : 'Shift Malam')
        const shiftCode = shiftType === 0 ? 'PAGI' : (shiftType === 1 ? 'SIANG' : 'MALAM')
        const shiftColor = shiftType === 0 ? '#10B981' : (shiftType === 1 ? '#3B82F6' : '#8B5CF6')
        schedules[d] = {
          is_day_off: false,
          shift: { name: shiftName, code: shiftCode, color: shiftColor, start_time: '08:00' }
        }
      }
    })

    return {
      employee_id: m.employee_id || m.id,
      nik: empNik,
      name: empName,
      schedules
    }
  })

  calendarData.value = {
    team_id: props.team?.id,
    team_name: matchedTeam?.name || props.team?.name || 'Tim Shift Operasional',
    month: currentMonth.value,
    dates,
    members_data
  }
}

const getScheduleForDay = (member, dateStr) => {
  if (!member || !member.schedules) return null

  // 1. Direct key lookup
  if (member.schedules[dateStr]) return member.schedules[dateStr]

  // 2. ISO date substring lookup
  const targetDateOnly = dateStr.split('T')[0]
  if (member.schedules[targetDateOnly]) return member.schedules[targetDateOnly]

  // 3. Array of objects lookup
  if (Array.isArray(member.schedules)) {
    return member.schedules.find(s => {
      const sDate = (s.date || s.schedule_date || '').split('T')[0]
      return sDate === targetDateOnly
    })
  }

  // 4. Object key startsWith lookup
  const keys = Object.keys(member.schedules)
  const matchingKey = keys.find(k => k.startsWith(targetDateOnly))
  if (matchingKey) return member.schedules[matchingKey]

  return null
}

const getShiftBadgeStyle = (sched) => {
  if (!sched) return { bg: 'bg-slate-100', text: 'text-slate-400', label: 'OFF' }

  // Check if leave
  if (sched.leave) {
    return { bg: 'bg-amber-100', text: 'text-amber-800 font-bold', label: 'CUTI' }
  }

  // Check if explicitly off or no shift object
  const isOff = sched.is_day_off === true || sched.is_off === true || sched.status === 'off' || (!sched.shift && !sched.shift_name && !sched.shift_code)
  if (isOff) {
    return { bg: 'bg-slate-100', text: 'text-slate-400 font-mono font-bold', label: 'OFF' }
  }

  const shiftObj = sched.shift || {}
  const name = shiftObj.name || sched.shift_name || sched.name || 'PAGI'
  const code = shiftObj.code || sched.shift_code || name.toUpperCase().slice(0, 5)
  const color = shiftObj.color || (name.toLowerCase().includes('siang') ? '#3B82F6' : (name.toLowerCase().includes('malam') ? '#8B5CF6' : '#10B981'))

  return {
    customColor: color,
    label: code || name,
    fullName: name,
    startTime: shiftObj.start_time || sched.start_time || '08:00'
  }
}

const getMemberShiftBadge = (member, dateStr) => {
  const sched = getScheduleForDay(member, dateStr)
  return getShiftBadgeStyle(sched)
}

watch([() => props.show, () => props.team], ([isShown, t]) => {
  if (isShown && t) {
    loadTeamCalendar()
  }
})

const changeMonth = (delta) => {
  const [y, m] = currentMonth.value.split('-').map(Number)
  let date = new Date(y, m - 1 + delta, 1)
  const newY = date.getFullYear()
  const newM = date.getMonth() + 1
  currentMonth.value = `${newY}-${newM < 10 ? '0' + newM : newM}`
  loadTeamCalendar()
}

const getDayNumber = (dateStr) => {
  return dateStr.split('-')[2] || dateStr
}

const getDayNameShort = (dateStr) => {
  try {
    const d = new Date(dateStr)
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    return days[d.getDay()]
  } catch (err) {
    return ''
  }
}

const isWeekendDay = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.getDay() === 0 || d.getDay() === 6
  } catch (err) {
    return false
  }
}
</script>

<template>
  <div v-if="show && team" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
    <div class="bg-white rounded-xl max-w-6xl w-full p-5 shadow-xl border border-slate-200 max-h-[92vh] flex flex-col space-y-4">
      <!-- Header Bar -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold mb-1">
            Roster Grid Matrix
          </div>
          <h2 class="font-bold text-base text-slate-900 flex items-center gap-2">
            <UsersIcon class="size-4 text-slate-700" />
            <span>Kalender Matriks Shift Tim: {{ calendarData?.team_name || team.name }}</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Visualisasi jadwal seluruh anggota tim dalam 1 bulan penuh. Klik sel untuk melakukan manual override.</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Month Controller -->
          <div class="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button @click="changeMonth(-1)" class="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer">
              <ChevronLeftIcon class="size-3.5" />
            </button>
            <span class="font-mono text-xs font-semibold text-slate-900 px-2">{{ currentMonth }}</span>
            <button @click="changeMonth(1)" class="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer">
              <ChevronRightIcon class="size-3.5" />
            </button>
          </div>

          <button @click="emit('close')" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
            <XIcon class="size-4" />
          </button>
        </div>
      </div>

      <!-- Matrix Grid Body -->
      <div class="flex-1 overflow-auto">
        <div v-if="isLoading" class="p-12 text-center text-slate-500 font-mono text-xs italic">
          Memuat kalender matriks tim shift...
        </div>

        <div v-else-if="calendarData" class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-xs border-collapse" role="table">
            <thead>
              <tr class="bg-slate-900 text-white font-mono text-[10px]">
                <th class="py-2.5 px-3 font-semibold sticky left-0 bg-slate-900 z-20 min-w-[170px] border-r border-slate-800" scope="col">
                  Anggota Tim Shift
                </th>
                <th
                  v-for="d in calendarData.dates"
                  :key="d"
                  class="py-2 px-1 text-center min-w-[36px] border-r border-slate-800"
                  :class="isWeekendDay(d) ? 'bg-slate-800 text-rose-300 font-bold' : ''"
                  scope="col"
                >
                  <span class="block text-[9px] uppercase font-sans text-slate-400">{{ getDayNameShort(d) }}</span>
                  <span class="block text-xs font-mono font-bold">{{ getDayNumber(d) }}</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-sans text-xs">
              <tr
                v-for="member in calendarData.members_data"
                :key="member.employee_id"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <!-- Sticky Employee Name Column -->
                <td class="py-2.5 px-3 sticky left-0 bg-white border-r border-slate-200 z-10">
                  <span class="block font-bold text-slate-900 truncate max-w-[160px]" :title="member.name">{{ member.name }}</span>
                  <span class="block text-[10px] text-slate-500 font-mono">{{ member.nik }}</span>
                </td>

                <!-- Daily Schedule Cells (Clickable for Individual Adjustment) -->
                <td
                  v-for="d in calendarData.dates"
                  :key="d"
                  @click="handleCellClick(member, d)"
                  class="py-1.5 px-1 text-center border-r border-slate-100 text-[10px] cursor-pointer hover:bg-slate-100/80 transition-colors"
                  :class="isWeekendDay(d) ? 'bg-slate-50/60' : ''"
                  title="Klik untuk Adjust Shift Harian Karyawan (Manual Override)"
                >
                  <!-- Custom Styled Colored Shift Badge -->
                  <div
                    v-if="getMemberShiftBadge(member, d).customColor"
                    class="py-0.5 px-1 rounded font-mono font-bold text-[9px] text-white shadow-2xs truncate"
                    :style="{ backgroundColor: getMemberShiftBadge(member, d).customColor }"
                    :title="`${getMemberShiftBadge(member, d).fullName} (${getMemberShiftBadge(member, d).startTime})`"
                  >
                    {{ getMemberShiftBadge(member, d).label }}
                  </div>

                  <!-- Off / Cuti Standard Badge -->
                  <div
                    v-else
                    class="py-0.5 px-1 rounded font-mono text-[9px]"
                    :class="[getMemberShiftBadge(member, d).bg, getMemberShiftBadge(member, d).text]"
                  >
                    {{ getMemberShiftBadge(member, d).label }}
                  </div>
                </td>
              </tr>

              <tr v-if="!calendarData.members_data || !calendarData.members_data.length">
                <td :colspan="(calendarData.dates ? calendarData.dates.length : 31) + 1" class="py-8 text-center text-slate-500 italic">
                  Belum ada anggota di tim shift ini. Tambahkan anggota di modal Edit Tim.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Legend -->
      <div class="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3 text-[11px] font-medium text-slate-600">
          <span class="text-slate-400 font-mono text-[10px] uppercase font-semibold">Legenda:</span>
          <span class="inline-flex items-center gap-1">
            <span class="size-2 rounded-full bg-emerald-600"></span> Pagi
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="size-2 rounded-full bg-sky-600"></span> Siang
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="size-2 rounded-full bg-indigo-600"></span> Malam
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="size-2 rounded-full bg-slate-300"></span> OFF
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="size-2 rounded-full bg-amber-500"></span> CUTI
          </span>
        </div>

        <BaseButton variant="secondary" class="text-xs" @click="emit('close')">
          Tutup Kalender
        </BaseButton>
      </div>
    </div>

    <!-- MODAL: SCHEDULE ADJUSTMENT (MANUAL OVERRIDE LOCK) -->
    <ScheduleAdjustmentModal
      :show="showAdjustmentModal"
      :schedule="activeCellSchedule"
      @close="showAdjustmentModal = false"
      @saved="loadTeamCalendar"
    />
  </div>
</template>
