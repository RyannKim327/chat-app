<script setup lang="ts">
import { onMounted } from "vue";

import ThemeToggle from "../components/ThemeToggle.vue";
import { useAuth } from "../composables/useAuth";

const { bootstrap, isAuthenticated } = useAuth();

onMounted(() => {
  bootstrap();
});
</script>

<template>
  <div class="flex h-full w-full flex-col items-center overflow-y-auto p-6 scrollbar-none">

    <!-- Top bar -->

    <div class="flex w-full max-w-5xl justify-end">
      <ThemeToggle />
    </div>

    <div class="flex max-w-4xl flex-1 flex-col items-center justify-center text-center">

      <!-- Logo -->

      <div
        class="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-line bg-surface/70 backdrop-blur"
      >
        <span class="text-4xl font-black text-ink">U</span>
      </div>

      <!-- Heading -->

      <h1
        class="text-7xl font-extrabold tracking-tight text-ink"
      >
        Us-APP
      </h1>

      <p class="mt-6 text-3xl font-semibold text-ink">
        Join conversations that matter.
      </p>

      <!-- Description -->

      <p class="mt-5 max-w-3xl text-lg leading-8 text-muted">
        Us-APP is an anonymous community platform where people gather in
        discussion rooms based on their interests, profession, course, or field of
        expertise. Share ideas, ask questions, help others, and participate in
        meaningful conversations without revealing your identity.
      </p>

      <!-- Buttons -->

      <div class="mt-12 flex flex-col gap-4 sm:flex-row">

        <RouterLink
          v-if="isAuthenticated"
          to="/chat"
          class="rounded-xl bg-accent px-10 py-3 text-lg font-semibold text-accent-ink transition hover:opacity-90 active:scale-95"
        >
          Open chat
        </RouterLink>

        <RouterLink
          v-else
          to="/login"
          class="rounded-xl bg-accent px-10 py-3 text-lg font-semibold text-accent-ink transition hover:opacity-90 active:scale-95"
        >
          Login
        </RouterLink>

        <RouterLink
          v-if="!isAuthenticated"
          to="/register"
          class="rounded-xl border border-line bg-surface/60 px-10 py-3 text-lg font-semibold text-ink transition hover:border-line-strong hover:bg-surface-2 active:scale-95"
        >
          Register
        </RouterLink>

      </div>

      <!-- Features -->

      <div class="mt-20 grid w-full max-w-5xl gap-5 md:grid-cols-3">

        <div class="rounded-2xl border border-line bg-surface/50 p-6">
          <div class="mb-3 text-3xl">💬</div>
          <h3 class="text-lg font-semibold text-ink">
            Discussion Rooms
          </h3>
          <p class="mt-2 text-sm text-muted">
            Join communities focused on topics that interest you.
          </p>
        </div>

        <div class="rounded-2xl border border-line bg-surface/50 p-6">
          <div class="mb-3 text-3xl">🎭</div>
          <h3 class="text-lg font-semibold text-ink">
            Stay Anonymous
          </h3>
          <p class="mt-2 text-sm text-muted">
            Share opinions and ask questions without exposing your identity.
          </p>
        </div>

        <div class="rounded-2xl border border-line bg-surface/50 p-6">
          <div class="mb-3 text-3xl">🤝</div>
          <h3 class="text-lg font-semibold text-ink">
            Learn Together
          </h3>
          <p class="mt-2 text-sm text-muted">
            Connect with students, professionals, and communities through
            collaborative discussions.
          </p>
        </div>

      </div>

    </div>
  </div>
</template>