<script setup lang="ts">
import ChannelCard from "./ChannelCard.vue";

import type { Channel } from "../interfaces";

defineProps<{
  channels: Channel[];
  activeChannelId: string;
}>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "create"): void;
}>();
</script>

<template>
  <div class="flex h-full flex-col">

    <!-- Header -->

    <div class="mb-4 flex items-center justify-between">

      <h2 class="text-lg font-semibold text-ink">
        Channels
      </h2>

      <button
        @click="emit('create')"
        title="Create a channel"
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xl font-bold text-accent-ink transition hover:opacity-90"
      >
        +
      </button>

    </div>

    <!-- List -->

    <div class="space-y-3 overflow-y-auto scrollbar-thin">
      <ChannelCard
        v-for="channel in channels"
        :key="channel.id"
        :channel="channel"
        :active="activeChannelId === channel.id"
        @select="emit('select', channel.id)"
      />
    </div>

  </div>
</template>