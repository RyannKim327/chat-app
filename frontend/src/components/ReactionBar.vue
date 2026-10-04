<script setup lang="ts">
import type { Reaction } from "../interfaces";

defineProps<{
  reactions: Reaction[];
  currentUserId: string;
  anyReacted?: boolean;
}>();

const emit = defineEmits<{
  (e: "react", emoji: string): void;
}>();

const availableReactions = ["👍", "❤️", "😂", "🔥", "👀"];
</script>

<template>
  <div class="mt-2 flex flex-wrap items-center gap-2">

    <button
      v-for="reaction in reactions"
      :key="reaction.emoji"
      @click="emit('react', reaction.emoji)"
      :class="[
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition',
        reaction.users.includes(currentUserId)
          ? 'border-line-strong bg-surface-2 text-ink'
          : 'border-line bg-transparent text-muted hover:border-line-strong hover:text-ink'
      ]"
    >
      <span>{{ reaction.emoji }}</span>
      <span class="tabular-nums">
        {{ reaction.count }}
      </span>
    </button>

    <div class="flex gap-1">

      <button
        v-for="emoji in availableReactions"
        :key="emoji"
        @click="emit('react', emoji)"
        :title="`React with ${emoji}`"
        :class="[
          'rounded-full p-1 transition hover:bg-surface-2',
          anyReacted ? 'opacity-70 hover:opacity-100' : 'opacity-40 hover:opacity-100'
        ]"
      >
        {{ emoji }}
      </button>

    </div>

  </div>
</template>