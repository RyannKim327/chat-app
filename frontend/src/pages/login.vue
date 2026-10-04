<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import ThemeToggle from "../components/ThemeToggle.vue";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { login, loading } = useAuth();

const username = ref("");
const password = ref("");
const error = ref<string | null>(null);

async function submit() {
  error.value = null;

  const result = await login(username.value.trim(), password.value);

  if (result.success) {
    await router.push("/chat");
    return;
  }

  error.value = result.error ?? "Could not log you in";
}
</script>

<template>
  <div class="flex h-full w-full items-center justify-center overflow-y-auto p-6 scrollbar-none">
    <div
      class="relative w-full max-w-md rounded-3xl border border-line bg-surface/70 p-10 backdrop-blur-xl"
    >

      <!-- Theme -->

      <div class="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <!-- Header -->

      <div class="mb-8 flex flex-col items-center">

        <div
          class="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-line bg-surface-2"
        >
          <span class="text-3xl font-black text-ink">
            U
          </span>
        </div>

        <h1 class="text-3xl font-bold tracking-tight text-ink">
          Welcome back
        </h1>

        <p class="mt-2 text-center text-sm text-muted">
          Sign in to continue joining anonymous community discussions.
        </p>

      </div>

      <!-- Error -->

      <p
        v-if="error"
        role="alert"
        class="mb-5 rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm font-medium text-ink"
      >
        {{ error }}
      </p>

      <!-- Form -->

      <form
        class="space-y-5"
        @submit.prevent="submit"
      >

        <div>

          <label
            for="username"
            class="mb-2 block text-sm font-medium text-muted"
          >
            Username
          </label>

          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
            :disabled="loading"
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line-strong/30 disabled:opacity-50"
          />

        </div>

        <div>

          <label
            for="password"
            class="mb-2 block text-sm font-medium text-muted"
          >
            Password
          </label>

          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="loading"
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line-strong/30 disabled:opacity-50"
          />

        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-accent py-3 text-lg font-semibold text-accent-ink transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ loading ? "Signing in…" : "Login" }}
        </button>

      </form>

      <!-- Divider -->

      <div class="my-8 flex items-center gap-4">

        <div class="h-px flex-1 bg-line" />

        <span class="text-xs uppercase tracking-widest text-faint">
          or
        </span>

        <div class="h-px flex-1 bg-line" />

      </div>

      <!-- Register -->

      <div class="text-center">

        <span class="text-sm text-muted">
          Don't have an account?
        </span>

        <RouterLink
          to="/register"
          class="ml-2 font-medium text-ink underline underline-offset-4 transition hover:opacity-70"
        >
          Create one
        </RouterLink>

      </div>

    </div>
  </div>
</template>