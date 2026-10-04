<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

import MarkdownToolbar from "./MarkdownToolbar.vue";
import ReplyPreview from "./ReplyPreview.vue";

import type { Message } from "../interfaces";

const props = defineProps<{
  disabled?: boolean;
  replyTo?: Message | null;
  typingNames?: string[];
}>();

const emit = defineEmits<{
  (e: "send", content: string): void;
  (e: "cancel-reply"): void;
  (e: "typing"): void;
}>();

const message = ref("");
const textarea = ref<HTMLTextAreaElement | null>(null);

watch(
  () => props.replyTo,
  async (reply) => {
    if (!reply) return

    await nextTick()
    textarea.value?.focus()
  },
);

function insert(markdown: string) {
  message.value += markdown
  textarea.value?.focus()
}

function send() {
  const content = message.value.trim()

  if (!content || props.disabled) return

  emit("send", content)
  message.value = ""
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-line bg-surface/70"
  >
    <MarkdownToolbar @insert="insert" />

    <ReplyPreview
      v-if="replyTo"
      :username="replyTo.sender.username"
      :avatar="replyTo.sender.avatar"
      :content="replyTo.content"
      class="m-4"
    >
      <button
        @click="emit('cancel-reply')"
        class="mt-2 text-xs text-muted transition hover:text-ink"
      >
        Cancel reply
      </button>
    </ReplyPreview>

    <textarea
      ref="textarea"
      v-model="message"
      rows="4"
      :disabled="disabled"
      :placeholder="disabled ? 'Join this channel to take part...' : 'Write something to the community...'"
      class="min-h-32 w-full resize-none bg-transparent p-4 text-ink outline-none disabled:opacity-50"
      @input="emit('typing')"
      @keydown.enter.exact.prevent="send"
      @keydown.shift.enter.stop
    />

    <div
      class="flex items-center justify-between gap-4 border-t border-line p-4"
    >
      <span class="truncate text-xs text-faint">
        <template v-if="typingNames?.length">
          {{ typingNames.slice(0, 2).join(", ") }}
          {{ typingNames.length > 1 ? "are" : "is" }} typing…
        </template>
        <template v-else>
          Markdown supported — Enter to send, Shift + Enter for a new line
        </template>
      </span>

      <button
        @click="send"
        :disabled="disabled || !message.trim()"
        class="shrink-0 rounded-xl bg-accent px-6 py-2 font-semibold text-accent-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </div>
  </div>
</template>