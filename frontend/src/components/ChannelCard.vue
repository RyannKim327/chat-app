<script setup lang="ts">
import type { Channel } from "../interfaces";

defineProps<{
  channel: Channel;
  active?: boolean;
}>();

const emit = defineEmits<{
  (e: "select"): void;
}>();
</script>

<template>
  <button
    @click="emit('select')"
    :class="[
      'w-full rounded-xl border p-4 text-left transition-all duration-200',
      active
        ? 'border-line-strong bg-surface-2'
        : 'border-line bg-surface/50 hover:border-line-strong hover:bg-surface-2/60'
    ]"
  >
    <div class="flex items-center justify-between gap-2">

      <h3 class="truncate font-semibold text-ink">
        {{ channel.emoji }} {{ channel.name }}
        <span
          v-if="channel.type !== 'global' && !channel.joined"
          class="ml-1 text-xs text-faint"
          title="Members only"
        >
          🔒
        </span>
      </h3>

      <span
        :class="[
          'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums',
          channel.joined
            ? 'border-line-strong bg-surface-2 text-ink'
            : 'border-line text-faint'
        ]"
      >
        {{ channel.memberCount }}
      </span>

    </div>

    <p class="mt-1 line-clamp-2 text-sm text-muted">
      {{ channel.description }}
    </p>
  </button>
</template>