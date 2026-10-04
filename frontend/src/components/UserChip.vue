<script setup lang="ts">
import type { User } from "../interfaces";

defineProps<{
  user: User;
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-line bg-surface/40 px-3 py-2"
  >
    <div class="relative">

      <div
        class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-xl"
      >
        {{ user.avatar }}
      </div>

      <span
        :class="[
          'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface',
          user.online ? 'bg-ink' : 'bg-transparent ring-1 ring-line-strong'
        ]"
      />
    </div>

    <div class="flex min-w-0 flex-col">

      <span class="truncate font-medium text-ink">
        {{ user.username }}
      </span>

      <span
        class="text-xs"
        :class="user.online ? 'text-muted' : 'text-faint'"
      >
        {{ user.online ? "Online" : "Offline" }}
      </span>

    </div>
  </div>
</template>