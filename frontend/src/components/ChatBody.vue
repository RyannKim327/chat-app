<script setup lang="ts">
import ChatMessage from "./ChatMessage.vue";

import type { Message } from "../interfaces";

const props = defineProps<{
  messages: Message[];
  currentUserId: string;
  isAdmin: boolean;
  pendingIds: string[];
  threadParent?: Message | null;
}>();

const emit = defineEmits<{
  (e: "reply", id: string): void;
  (e: "report", id: string): void;
  (e: "react", payload: { id: string; emoji: string }): void;
  (e: "thread", id: string): void;
  (e: "edit", payload: { id: string; content: string }): void;
  (e: "delete", id: string): void;
}>();

function findReply(message: Message): Message | null {
  if (!message.parentMessage) return null

  return (
    props.threadParent ??
    props.messages.find((item) => item.id === message.parentMessage) ??
    null
  )
}
</script>

<template>
  <div class="flex h-full flex-col gap-6 overflow-y-auto p-6 scrollbar-thin">
    <!-- Thread parent pinned above replies -->

    <div
      v-if="threadParent"
      class="rounded-2xl border border-line bg-surface/60 p-4"
    >

      <div class="mb-3 flex items-center justify-between">

        <span class="text-xs font-semibold uppercase tracking-widest text-faint">
          Thread
        </span>

        <button
          @click="emit('thread', threadParent.id)"
          class="text-xs text-muted transition hover:text-ink"
        >
          Close ✕
        </button>

      </div>

      <ChatMessage
        :message="threadParent"
        :current-user-id="currentUserId"
        :is-admin="isAdmin"
        :pending-ids="pendingIds"
        @reply="emit('reply', $event)"
        @report="emit('report', $event)"
        @react="(payload) => emit('react', payload)"
        @thread="emit('thread', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />

    </div>

    <!-- Feed -->

    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :current-user-id="currentUserId"
      :is-admin="isAdmin"
      :pending-ids="pendingIds"
      :reply="findReply(message)"
      @reply="emit('reply', $event)"
      @report="emit('report', $event)"
      @react="(payload) => emit('react', payload)"
      @thread="emit('thread', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>