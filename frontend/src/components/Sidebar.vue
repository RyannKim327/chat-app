<script setup lang="ts">
import ChannelList from "./ChannelList.vue";
import OnlineUsers from "./OnlineUsers.vue";
import ThemeToggle from "./ThemeToggle.vue";

import type { Channel, User } from "../interfaces";

defineProps<{
  channels: Channel[];
  users: User[];
  currentUser: User | null;
  activeChannelId: string;
}>();

const emit = defineEmits<{
  (e: "select-channel", id: string): void;
  (e: "create-channel"): void;
  (e: "logout"): void;
}>();
</script>

<template>
  <aside
    class="flex h-full w-80 shrink-0 flex-col border-r border-line bg-surface/40 backdrop-blur-xl"
  >

    <!-- Logo -->

    <div class="border-b border-line p-6">

      <div class="flex items-start justify-between gap-2">

        <div class="min-w-0">
          <h1
            class="bg-gradient-to-r from-ink to-faint bg-clip-text text-3xl font-black text-transparent"
          >
            Us-APP
          </h1>

          <p class="mt-1 text-sm text-faint">
            Anonymous Communities
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <ThemeToggle />

          <button
            v-if="currentUser"
            @click="emit('logout')"
            title="Log out"
            class="flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs text-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
          >
            Exit
          </button>
        </div>

      </div>

    </div>

    <!-- Channels -->

    <div class="flex-1 overflow-hidden p-5">
      <ChannelList
        :channels="channels"
        :active-channel-id="activeChannelId"
        @select="emit('select-channel', $event)"
        @create="emit('create-channel')"
      />
    </div>

    <!-- Divider -->

    <div class="mx-5 border-t border-line" />

    <!-- Users -->

    <div class="h-72 shrink-0 overflow-hidden p-5">
      <OnlineUsers :users="users" />
    </div>

  </aside>
</template>