<script setup lang="ts">
defineProps<{
  username: string;
  avatar: string;
  content: string;
}>();
</script>

<template>
  <div
    class="mb-2 rounded-lg border border-line border-l-2 border-l-ink bg-surface/60 p-3"
  >
    <div class="flex items-center gap-2">
      <span class="text-lg">
        {{ avatar }}
      </span>

      <span class="font-medium text-ink">
        {{ username }}
      </span>
    </div>

    <p class="mt-1 line-clamp-2 text-sm text-muted">
      {{ content }}
    </p>

    <slot />
  </div>
</template>