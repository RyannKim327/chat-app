<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import Sidebar from "../components/Sidebar.vue";
import ChatHeader from "../components/ChatHeader.vue";
import ChatBody from "../components/ChatBody.vue";
import ChatInput from "../components/ChatInput.vue";
import ChannelInfoModal from "../components/ChannelInfoModal.vue";

import { api } from "../lib/api";
import { useAuth } from "../composables/useAuth";
import { useChat } from "../composables/useChat";
import type { Message, Report, User } from "../interfaces";

const router = useRouter();
const { currentUser, isAdmin, logout } = useAuth();

const {
  channels,
  messages,
  threadMessages,
  activeChannelId,
  activeParentId,
  threadParent,
  visibleMessages,
  activeChannel,
  onlineUsers,
  typingUsers,
  pendingIds,
  error: chatError,
  canAccess,
  canManage,
  initialize,
  start,
  stop,
  selectChannel,
  openThread,
  createChannel,
  deleteChannel,
  joinChannel,
  leaveChannel,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  reportMessage,
  resolveReport,
  loadReports,
  notifyTyping,
} = useChat();

const infoOpen = ref(false);
const createOpen = ref(false);
const reports = ref<Report[]>([]);
const members = ref<User[]>([]);
const notice = ref<string | null>(null);

const newName = ref("");
const newDescription = ref("");
const newEmoji = ref("💬");
const replyTo = ref<Message | null>(null);
const feedBody = ref<HTMLElement | null>(null);

const channelEmojis = ["💬", "🌐", "💻", "🎮", "🎬", "📚", "🎵", "🧪", "⚽", "🍳", "🧠", "✈️"];

const currentUserId = computed(() => currentUser.value?.id ?? "");
const canPost = computed(() => Boolean(currentUser.value) && canAccess.value);
const typingNames = computed(() => typingUsers.value[activeChannelId.value] ?? []);

function flash(message: string) {
  notice.value = message;

  window.setTimeout(() => {
    if (notice.value === message) notice.value = null;
  }, 3200);
}

async function scrollToBottom(smooth = true) {
  await new Promise((resolve) => requestAnimationFrame(resolve));

  feedBody.value?.scrollTo({
    top: feedBody.value.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
}

watch(
  () => visibleMessages.value.length,
  (length, previous) => {
    if (length > (previous ?? 0)) scrollToBottom();
  },
);

watch(activeChannelId, () => {
  replyTo.value = null;
  scrollToBottom(false);
});

function startReply(id: string) {
  replyTo.value =
    messages.value.find((item) => item.id === id) ??
    threadMessages.value.find((item) => item.id === id) ??
    null;
}

function toggleThread(id: string) {
  void openThread(activeParentId.value === id ? null : id);
}

async function changeChannel(id: string) {
  if (id === activeChannelId.value) return;

  await selectChannel(id);
}

async function send(content: string) {
  const result = await sendMessage(content, replyTo.value?.id ?? null);

  if (result.success) replyTo.value = null;
  else if ("error" in result && result.error) flash(result.error);
}

async function react(payload: { id: string; emoji: string }) {
  const result = await toggleReaction(payload.id, payload.emoji);

  if (!result.success) flash(result.error ?? "Could not react");
}

async function edit(payload: { id: string; content: string }) {
  const result = await editMessage(payload.id, payload.content);

  if (!result.success) flash(result.error ?? "Could not edit");
}

async function remove(id: string) {
  if (!window.confirm("Delete this message and its replies?")) return;

  const result = await deleteMessage(id);

  if (!result.success) flash(result.error ?? "Could not delete");
}

function report(id: string) {
  const reason = window.prompt("Why are you reporting this message?");

  if (!reason || reason.trim().length < 3) return;

  void reportMessage(id, reason.trim()).then((result) => {
    flash(result.success ? "Report sent to the moderators" : result.error);
  });
}

async function submitCreate() {
  const name = newName.value.trim();

  if (name.length < 3) {
    flash("Channel names need at least 3 characters");
    return;
  }

  const result = await createChannel(name, newDescription.value.trim(), newEmoji.value);

  if (!result.success) {
    flash(result.error ?? "Could not create the channel");
    return;
  }

  createOpen.value = false;
  newName.value = "";
  newDescription.value = "";
  newEmoji.value = "💬";
  flash(`#${name} is ready`);
}

async function openInfo() {
  const channel = activeChannel.value;
  if (!channel) return;

  infoOpen.value = true;
  members.value = [];
  reports.value = [];

  if (!canAccess.value) return;

  reports.value = isAdmin.value ? await loadReports(channel.id) : [];

  try {
    const { data } = await api.get<{ members: User[] }>(`/channels/${channel.id}/members`);
    members.value = data.members;
  } catch {
    /* members are optional context */
  }
}

async function toggleMembership() {
  const channel = activeChannel.value;
  if (!channel) return;

  const result = channel.joined
    ? await leaveChannel(channel.id)
    : await joinChannel(channel.id);

  if (!result.success) flash(result.error ?? "Could not update membership");
}

async function removeChannel() {
  const channel = activeChannel.value;
  if (!channel) return;

  if (!window.confirm(`Delete #${channel.name} and all of its messages?`)) return;

  const result = await deleteChannel(channel.id);

  infoOpen.value = false;

  if (!result.success) flash(result.error ?? "Could not delete the channel");
}

async function resolve(id: string) {
  const result = await resolveReport(id);

  if (!result.success) {
    flash(result.error ?? "Could not resolve the report");
    return;
  }

  reports.value = reports.value.map((item) =>
    item.id === id ? { ...item, resolved: true } : item,
  );
}

function signOut() {
  stop();
  logout();
  void router.push("/login");
}

onMounted(async () => {
  start();
  await initialize();
  scrollToBottom(false);
});

onBeforeUnmount(stop);
</script>

<template>
  <div class="flex h-full">

    <Sidebar
      :channels="channels"
      :users="onlineUsers"
      :current-user="currentUser"
      :active-channel-id="activeChannelId"
      @select-channel="changeChannel"
      @create-channel="createOpen = true"
      @logout="signOut"
    />

    <main class="flex min-w-0 flex-1 flex-col">

      <ChatHeader
        v-if="activeChannel"
        :channel="activeChannel"
        :can-access="canAccess"
        @info="openInfo"
        @join="toggleMembership"
      />

      <p
        v-if="notice"
        role="status"
        class="border-b border-line bg-surface-2 px-6 py-2 text-sm text-ink"
      >
        {{ notice }}
      </p>

      <p
        v-if="chatError"
        class="border-b border-line bg-surface-2 px-6 py-2 text-sm text-ink"
      >
        {{ chatError }}
      </p>

      <div
        v-if="activeChannel && canAccess"
        ref="feedBody"
        class="min-h-0 flex-1"
      >
        <ChatBody
          :messages="visibleMessages"
          :thread-parent="threadParent"
          :current-user-id="currentUserId"
          :is-admin="isAdmin"
          :pending-ids="pendingIds"
          @reply="startReply"
          @thread="toggleThread"
          @react="react"
          @report="report"
          @edit="edit"
          @delete="remove"
        />
      </div>

      <div
        v-else-if="activeChannel"
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
      >

        <p class="text-4xl">🔒</p>

        <p class="text-lg font-semibold text-ink">
          This channel is private to its members
        </p>

        <p class="max-w-sm text-sm text-muted">
          Join {{ activeChannel.emoji }} {{ activeChannel.name }} to read and post in it.
          Only members can see the messages here.
        </p>

        <button
          @click="toggleMembership"
          class="rounded-xl bg-accent px-5 py-2 font-semibold text-accent-ink transition hover:opacity-90"
        >
          Join channel
        </button>

      </div>

      <div
        v-else
        class="flex min-h-0 flex-1 items-center justify-center text-muted"
      >
        No channels yet — create one with the + button.
      </div>

      <div
        v-if="canPost"
        class="border-t border-line p-5"
      >
        <ChatInput
          :disabled="!canPost"
          :reply-to="replyTo"
          :typing-names="typingNames"
          @send="send"
          @cancel-reply="replyTo = null"
          @typing="notifyTyping"
        />
      </div>

    </main>

    <!-- Channel info -->

    <ChannelInfoModal
      :open="infoOpen"
      :channel="activeChannel"
      :reports="reports"
      :members="members"
      :can-manage="activeChannel ? canManage(activeChannel) : false"
      @close="infoOpen = false"
      @join="toggleMembership"
      @leave="toggleMembership"
      @delete-channel="removeChannel"
      @resolve="resolve"
    />

    <!-- Create channel -->

    <Teleport to="body">

      <div
        v-if="createOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        @click.self="createOpen = false"
      >

        <form
          class="w-full max-w-md rounded-2xl border border-line bg-surface p-6"
          @submit.prevent="submitCreate"
        >

          <h2 class="text-xl font-bold text-ink">
            Create a channel
          </h2>

          <p class="mt-1 text-sm text-muted">
            Pick a name and an icon. You will join automatically.
          </p>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              v-for="emoji in channelEmojis"
              :key="emoji"
              type="button"
              @click="newEmoji = emoji"
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition',
                newEmoji === emoji
                  ? 'border-ink bg-surface-2 ring-2 ring-line-strong'
                  : 'border-line hover:border-line-strong'
              ]"
            >
              {{ emoji }}
            </button>
          </div>

          <label class="mb-2 mt-5 block text-sm font-medium text-muted">
            Name
          </label>

          <input
            v-model="newName"
            type="text"
            required
            minlength="3"
            maxlength="32"
            placeholder="Film Tips"
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line-strong/30"
          />

          <label class="mb-2 mt-4 block text-sm font-medium text-muted">
            Description
          </label>

          <textarea
            v-model="newDescription"
            rows="3"
            maxlength="240"
            placeholder="What is this channel about?"
            class="w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line-strong/30"
          />

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              @click="createOpen = false"
              class="rounded-xl border border-line px-5 py-2 font-semibold text-ink transition hover:border-line-strong"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="rounded-xl bg-accent px-5 py-2 font-semibold text-accent-ink transition hover:opacity-90"
            >
              Create
            </button>
          </div>

        </form>

      </div>

    </Teleport>

  </div>
</template>