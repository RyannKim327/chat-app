<script setup lang="ts">
import type { Channel, Report, User } from "../interfaces";

defineProps<{
  open: boolean;
  channel: Channel | null;
  reports: Report[];
  members: User[];
  canManage: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "join"): void;
  (e: "leave"): void;
  (e: "delete-channel"): void;
  (e: "resolve", reportId: string): void;
}>();

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
</script>

<template>
  <Teleport to="body">

    <div
      v-if="open && channel"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      @click.self="emit('close')"
    >

      <div
        class="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface"
      >

        <!-- Header -->

        <div class="flex items-center justify-between border-b border-line p-6">

          <h2 class="truncate text-2xl font-bold text-ink">
            {{ channel.emoji }} {{ channel.name }}
          </h2>

          <button
            @click="emit('close')"
            title="Close"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>

        </div>

        <!-- Body -->

        <div class="max-h-[65vh] space-y-6 overflow-y-auto p-6 scrollbar-thin">

          <div>

            <h3 class="font-semibold text-ink">
              Description
            </h3>

            <p class="mt-2 text-sm text-muted">
              {{ channel.description }}
            </p>

          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">

            <div>

              <h3 class="font-semibold text-ink">
                Members
              </h3>

              <p class="mt-2 text-muted">
                {{ channel.memberCount }}
              </p>

            </div>

            <div>

              <h3 class="font-semibold text-ink">
                Created
              </h3>

              <p class="mt-2 text-muted">
                {{ formatDate(channel.createdAt) }}
              </p>

            </div>

          </div>

          <div v-if="members.length">

            <h3 class="mb-3 font-semibold text-ink">
              Who is here
            </h3>

            <div class="flex flex-wrap gap-2">

              <span
                v-for="member in members"
                :key="member.id"
                class="rounded-full border border-line bg-surface-2 px-3 py-1 text-sm text-muted"
              >
                {{ member.avatar }} {{ member.username }}
              </span>

            </div>

          </div>

          <!-- Actions -->

          <div class="flex flex-wrap gap-3">

            <button
              v-if="channel.type === 'group' && !channel.joined"
              @click="emit('join')"
              class="rounded-xl bg-accent px-5 py-2 font-semibold text-accent-ink transition hover:opacity-90"
            >
              Join channel
            </button>

            <button
              v-else-if="channel.type === 'group' && channel.joined"
              @click="emit('leave')"
              class="rounded-xl border border-line px-5 py-2 font-semibold text-ink transition hover:border-line-strong hover:bg-surface-2"
            >
              Leave channel
            </button>

            <button
              v-if="canManage"
              @click="emit('delete-channel')"
              class="rounded-xl border border-line px-5 py-2 font-semibold text-ink transition hover:bg-accent hover:text-accent-ink"
            >
              Delete channel
            </button>

          </div>

          <!-- Reports -->

          <div v-if="reports.length">

            <h3 class="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-ink">
              Message Reports
            </h3>

            <div
              v-for="report in reports"
              :key="report.id"
              class="mb-3 rounded-xl border border-line bg-surface-2 p-4"
            >

              <p class="text-sm text-ink">
                <strong>
                  {{ report.reporter.avatar }} {{ report.reporter.username }}
                </strong>
                reported
              </p>

              <p
                v-if="report.message"
                class="mt-2 rounded-lg border border-line bg-surface p-3 text-sm text-muted"
              >
                “{{ report.message.content }}”
              </p>

              <p class="mt-2 text-sm text-muted">
                {{ report.reason }}
              </p>

              <div class="mt-3 flex items-center justify-between">

                <p class="text-xs text-faint">
                  {{ formatDate(report.createdAt) }}
                </p>

                <button
                  v-if="!report.resolved"
                  @click="emit('resolve', report.id)"
                  class="rounded-lg border border-line px-3 py-1 text-xs text-ink transition hover:border-line-strong hover:bg-surface"
                >
                  Mark resolved
                </button>

                <span
                  v-else
                  class="rounded-full border border-line px-2 py-0.5 text-xs text-muted"
                >
                  Resolved
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  </Teleport>
</template>