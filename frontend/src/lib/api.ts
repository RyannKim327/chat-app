import axios from "axios"

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export const API_BASE = `${API_URL}/api/v1`

export const WS_URL = API_URL.replace(/^http/, "ws")

const TOKEN_KEY = "usapp_token"

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export const api = axios.create({ baseURL: API_BASE })

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    return data?.error ?? error.message ?? fallback
  }

  if (error instanceof Error) return error.message

  return fallback
}

export function isAuthError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401
}