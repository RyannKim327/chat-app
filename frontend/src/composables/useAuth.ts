import { computed, ref } from "vue"

import { api, errorMessage, getToken, setToken } from "../lib/api"
import { socketClient } from "../lib/socket"
import type { AuthResponse, User } from "../interfaces"

const currentUser = ref<User | null>(null)
const bootstrapped = ref(false)
const loading = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === "admin")

  function applySession(payload: AuthResponse) {
    setToken(payload.token)
    currentUser.value = payload.user
    socketClient.connect()
  }

  function clearSession() {
    setToken(null)
    currentUser.value = null
    socketClient.disconnect()
  }

  async function register(username: string, password: string, avatar: string) {
    loading.value = true

    try {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        username,
        password,
        avatar,
      })

      applySession(data)
      return { success: true as const }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string) {
    loading.value = true

    try {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        username,
        password,
      })

      applySession(data)
      return { success: true as const }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    } finally {
      loading.value = false
    }
  }

  async function bootstrap() {
    if (bootstrapped.value) return

    if (getToken()) {
      try {
        const { data } = await api.get<{ user: User }>("/auth/me")
        currentUser.value = data.user
        socketClient.connect()
      } catch {
        clearSession()
      }
    }

    bootstrapped.value = true
  }

  function logout() {
    clearSession()
  }

  return {
    currentUser,
    bootstrapped,
    loading,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    bootstrap,
  }
}