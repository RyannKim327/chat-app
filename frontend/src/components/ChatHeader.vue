<script setup lang="ts">
import type { Channel } from "../interfaces";

defineProps<{
  channel: Channel;
  canAccess?: boolean;
}>();

const emit = defineEmits<{
  (e: "info"): void;
  (e: "join"): void;
}>();
</script>

<template>
  <header
    class="flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface/70 px-6 py-3 backdrop-blur-xl"
  >
    <div class="min-w-0">

      <h1 class="truncate text-2xl font-bold tracking-tight text-ink">
        {{ channel.emoji }} {{ channel.name }}
      </h1>

      <p class="mt-1 truncate text-sm text-muted">
        {{ channel.description }}
      </p>

      <p
        v-if="canAccess === false"
        class="mt-1 truncate text-xs font-semibold uppercase tracking-widest text-accent"
      >
        🔒 Members only
      </p>

    </div>

    <div class="flex shrink-0 items-center gap-3">

      <span class="text-xs text-faint tabular-nums">
        {{ channel.memberCount }}
        {{ channel.memberCount === 1 ? "member" : "members" }}
      </span>

      <button
        v-if="channel.type === 'group' && !channel.joined"
        @click="emit('join')"
        class="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:opacity-90"
      >
        Join
      </button>

      <button
        @click="emit('info')"
        class="rounded-xl border border-line px-4 py-2 text-sm text-ink transition hover:border-line-strong hover:bg-surface-2"
      >
        Info
      </button>

    </div>
  </header>
</template>