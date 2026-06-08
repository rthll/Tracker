import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isReady = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const uid = computed(() => user.value?.uid ?? null)

  return { user, isReady, isLoggedIn, uid }
})
