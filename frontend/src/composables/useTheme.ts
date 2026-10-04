import { ref, watch } from "vue"

export type Theme = "dark" | "light"

const STORAGE_KEY = "usapp_theme"

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark"

  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored === "dark" || stored === "light") return stored

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

const theme = ref<Theme>(readInitial())

function apply(value: Theme) {
  document.documentElement.classList.toggle("light", value === "light")
}

apply(theme.value)

watch(theme, (value) => {
  apply(value)
  localStorage.setItem(STORAGE_KEY, value)
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === "dark" ? "light" : "dark"
  }

  return { theme, toggle }
}