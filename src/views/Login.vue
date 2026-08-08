<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useErpStore } from '../store/erp'
import { ShieldCheckIcon, AlertCircleIcon, KeyIcon } from '@lucide/vue'

const router = useRouter()
const erpStore = useErpStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMsg.value = 'Harap isi semua kolom email dan password.'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const result = await erpStore.loginAction(email.value, password.value)
    if (result.success) {
      router.push({ name: 'Dashboard' })
    } else {
      errorMsg.value = result.message || 'Kredensial login salah.'
    }
  } catch (err) {
    errorMsg.value = 'Koneksi ke server gagal. Harap coba lagi.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="w-full h-full flex items-center justify-center bg-slate-50 py-12 px-6 sm:px-12 md:px-24" id="main-content">
    <div class="max-w-md w-full">
      <!-- Top Logo / Identity -->
      <div class="text-center mb-8">
        <div class="inline-flex size-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 mx-auto">
          <ShieldCheckIcon class="size-6 text-white" aria-hidden="true" />
        </div>
        <h1 class="font-display font-black text-3xl text-slate-800 tracking-tight leading-none mb-2">
          ApexERP Suite
        </h1>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
          Enterprise Portal Login
        </p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
        <form @submit.prevent="handleLogin" class="space-y-5" role="form" aria-label="Form Login Pengguna">
          <!-- Error alert -->
          <div 
            v-if="errorMsg" 
            class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5"
            role="alert"
            aria-live="polite"
          >
            <AlertCircleIcon class="size-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
            <span>{{ errorMsg }}</span>
          </div>

          <!-- Email Input -->
          <div>
            <label for="login-email" class="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
              Alamat Email
            </label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              spellcheck="false"
              placeholder="nama@perusahaan.com"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <!-- Password Input -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label for="login-password" class="block text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                Kata Sandi
              </label>
            </div>
            <input
              id="login-password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || !email || !password"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            <span v-if="isLoading">Menghubungkan…</span>
            <span v-else>Masuk Portal</span>
          </button>
        </form>

        <!-- Fallback Help note -->
        <div class="mt-6 border-t border-slate-100 pt-5 flex items-start gap-3">
          <div class="size-7 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
            <KeyIcon class="size-3.5" aria-hidden="true" />
          </div>
          <div class="text-left">
            <h2 class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Uji Coba Luring (Offline Demo)
            </h2>
            <p class="text-[10px] text-slate-400 leading-normal mt-0.5">
              Jika backend server offline, gunakan kredensial berikut:<br/>
              Email: <strong class="text-slate-600 font-mono">admin@erp.com</strong><br/>
              Sandi: <strong class="text-slate-600 font-mono">password</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
