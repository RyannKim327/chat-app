<script setup lang="ts">
import { computed, ref } from "vue";

import ReactionBar from "./ReactionBar.vue";
import ReplyPreview from "./ReplyPreview.vue";

import type { Message } from "../interfaces";

const props = defineProps<{
  message: Message;
  currentUserId: string;
  isAdmin: boolean;
  pendingIds: string[];
  reply?: Message | null;
}>();

const emit = defineEmits<{
  (e: "reply", id: string): void;
  (e: "report", id: string): void;
  (e: "react", payload: { id: string; emoji: string }): void;
  (e: "thread", id: string): void;
  (e: "edit", payload: { id: string; content: string }): void;
  (e: "delete", id: string): void;
}>();

const editing = ref(false);
const draft = ref("");

const isOwn = computed(() => props.message.sender.id === props.currentUserId);
const canDelete = computed(() => isOwn.value || props.isAdmin);
const pending = computed(() => props.pendingIds.includes(props.message.id));
const isEdited = computed(
  () => props.message.editedAt !== null && props.message.editedAt !== undefined,
);

const reacted = computed(() =>
  props.message.reactions.some((reaction) => reaction.users.includes(props.currentUserId)),
);

function time(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function startEdit() {
  draft.value = props.message.content
  editing.value = true
}

function saveEdit() {
  const content = draft.value.trim()

  if (!content || content === props.message.content) {
    editing.value = false
    return
  }

  emit("edit", { id: props.message.id, content })
  editing.value = false
}
</script>

<template>
  <div
    class="group flex gap-4"
    :class="pending ? 'opacity-50' : ''"
  >

    <!-- Avatar -->

    <div
      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-2xl"
    >
      {{ message.sender.avatar }}
    </div>

    <!-- Content -->

    <div class="min-w-0 flex-1">

      <div class="flex flex-wrap items-center gap-3">

        <span class="font-semibold text-ink">
          {{ message.sender.username }}
        </span>

        <span
          v-if="message.sender.role === 'admin'"
          class="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted"
        >
          admin
        </span>

        <span class="text-xs text-faint">
          {{ time(message.createdAt) }}
        </span>

        <span
          v-if="isEdited"
          class="text-xs text-faint"
        >
          (edited)
        </span>

      </div>

      <!-- Reply context -->

      <ReplyPreview
        v-if="reply"
        :username="reply.sender.username"
        :avatar="reply.sender.avatar"
        :content="reply.content"
        class="mt-2"
      />

      <!-- Edit -->

      <div
        v-if="editing"
        class="mt-2 space-y-2"
      >

        <textarea
          v-model="draft"
          rows="3"
          class="w-full resize-none rounded-xl border border-line-strong bg-surface p-3 text-sm outline-none transition focus:border-ink/40"
        />

        <div class="flex gap-2 text-xs">

          <button
            @click="saveEdit"
            class="rounded-lg bg-accent px-3 py-1.5 font-semibold text-accent-ink transition hover:opacity-90"
          >
            Save
          </button>

          <button
            @click="editing = false"
            class="rounded-lg border border-line px-3 py-1.5 transition hover:border-line-strong"
          >
            Cancel
          </button>

        </div>

      </div>

      <!-- Content -->

      <div
        v-else
        class="mt-2 whitespace-pre-wrap break-words rounded-2xl border border-line bg-surface/60 p-4 text-ink"
      >
        {{ message.content }}
      </div>

      <!-- Reactions -->

      <ReactionBar
        :reactions="message.reactions"
        :current-user-id="currentUserId"
        :any-reacted="reacted"
        @react="emit('react', { id: message.id, emoji: $event })"
      />

      <!-- Hover actions -->

      <div
        class="mt-2 flex flex-wrap gap-4 text-sm opacity-0 transition group-hover:opacity-100 focus-within:opacity-100"
      >

        <button
          @click="emit('reply', message.id)"
          class="text-muted transition hover:text-ink"
        >
          Reply
        </button>

        <button
          v-if="message.replyCount > 0"
          @click="emit('thread', message.id)"
          class="text-muted transition hover:text-ink"
        >
          {{ message.replyCount }}
          {{ message.replyCount === 1 ? "reply" : "replies" }}
        </button>

        <button
          v-if="isOwn"
          @click="startEdit"
          class="text-muted transition hover:text-ink"
        >
          Edit
        </button>

        <button
          v-if="canDelete"
          @click="emit('delete', message.id)"
          class="text-muted transition hover:text-ink"
        >
          Delete
        </button>

        <button
          v-if="!isOwn"
          @click="emit('report', message.id)"
          class="text-muted transition hover:text-ink"
        >
          Report
        </button>

      </div>

    </div>

  </div>
</template>