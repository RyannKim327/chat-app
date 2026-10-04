<script setup lang="ts">
import UserChip from "./UserChip.vue";

import type { User } from "../interfaces";

defineProps<{
  users: User[];
}>();
</script>

<template>
  <div class="flex h-full flex-col">

    <div class="mb-4 flex items-center justify-between">

      <h2 class="text-lg font-semibold text-ink">
        Online
      </h2>

      <span class="rounded-full border border-line px-2 py-0.5 text-xs text-muted tabular-nums">
        {{ users.length }}
      </span>

    </div>

    <div class="space-y-2 overflow-y-auto scrollbar-thin">
      <UserChip
        v-for="user in users"
        :key="user.id"
        :user="user"
      />
    </div>

  </div>
</template>