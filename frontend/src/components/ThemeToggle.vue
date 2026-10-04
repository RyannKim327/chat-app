<script setup lang="ts">
import { useTheme } from "../composables/useTheme";

const { theme, toggle } = useTheme();
</script>

<template>
  <button
    @click="toggle"
    :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
    :title="`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`"
    class="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink transition hover:border-line-strong hover:bg-surface-2"
  >
    <!-- Sun: filled in dark mode (the light you can switch to) -->

    <svg
      v-if="theme === 'dark'"
      viewBox="0 0 24 24"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    >
      <circle cx="12" cy="12" r="4.2" />
      <path
        d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"
      />
    </svg>

    <!-- Moon: hollow in light mode -->

    <svg
      v-else
      viewBox="0 0 24 24"
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20.5 14.6A8.6 8.6 0 1 1 9.4 3.5a7 7 0 0 0 11.1 11.1Z" />
    </svg>
  </button>
</template>