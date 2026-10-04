<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import ThemeToggle from "../components/ThemeToggle.vue";
import { api } from "../lib/api";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { register, loading } = useAuth();

const avatars = ref<string[]>([]);
const selectedAvatar = ref("");
const username = ref("");
const password = ref("");
const verifyPassword = ref("");
const error = ref<string | null>(null);
const avatarError = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data } = await api.get<string[]>("/avatars")
    avatars.value = data
    selectedAvatar.value = data[0] ?? ""
  } catch {
    avatarError.value = "Could not load avatars, is the backend running?"
  }
});

async function submit() {
  error.value = null

  if (password.value !== verifyPassword.value) {
    error.value = "Those passwords do not match"
    return
  }

  if (password.value.length < 6) {
    error.value = "Password needs to be at least 6 characters"
    return
  }

  const result = await register(username.value.trim(), password.value, selectedAvatar.value)

  if (result.success) {
    await router.push("/chat")
    return
  }

  error.value = result.error ?? "Could not create your account"
}
</script>

<template>
  <div class="flex h-full w-full items-center justify-center overflow-y-auto px-6 py-10 scrollbar-none">
    <div
      class="relative w-full max-w-xl rounded-3xl border border-line bg-surface/70 p-10 backdrop-blur-xl"
    >

      <!-- Theme -->

      <div class="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <!-- Header -->

      <div class="text-center">

        <div
          class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-line bg-surface-2"
        >
          <span class="text-3xl">
            {{ selectedAvatar || "?" }}
          </span>
        </div>

        <h1 class="text-3xl font-bold tracking-tight text-ink">
          Create your account
        </h1>

        <p class="mt-2 text-sm text-muted">
          Choose an anonymous avatar and start joining community discussions.
        </p>

      </div>

      <!-- Avatars -->

      <div class="mt-8">

        <label class="mb-3 block text-sm font-medium text-muted">
          Choose your avatar
        </label>

        <p
          v-if="avatarError"
          class="mb-3 text-xs text-faint"
        >
          {{ avatarError }}
        </p>

        <div class="grid grid-cols-8 gap-3">

          <button
            v-for="avatar in avatars"
            :key="avatar"
            type="button"
            @click="selectedAvatar = avatar"
            :class="[
              'flex h-12 w-12 items-center justify-center rounded-lg border text-xl transition-all duration-200',
              selectedAvatar === avatar
                ? 'border-ink bg-surface-2 ring-2 ring-line-strong scale-105'
                : 'border-line bg-surface hover:border-line-strong hover:scale-105'
            ]"
          >
            {{ avatar }}
          </button>

        </div>

      </div>

      <!-- Error -->

      <p
        v-if="error"
        role="alert"
        class="mt-6 rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm font-medium text-ink"
      >
        {{ error }}
      </p>

      <!-- Form -->

      <form
        class="mt-8 space-y-5"
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
            minlength="3"
            maxlength="24"
            pattern="[a-zA-Z0-9_\-]+"
            :disabled="loading"
            title="3-24 characters: letters, numbers, _ or -"
            placeholder="Letters, numbers, _ or -"
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
            autocomplete="new-password"
            required
            minlength="6"
            :disabled="loading"
            placeholder="At least 6 characters"
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line-strong/30 disabled:opacity-50"
          />

        </div>

        <div>

          <label
            for="verify"
            class="mb-2 block text-sm font-medium text-muted"
          >
            Verify password
          </label>

          <input
            id="verify"
            v-model="verifyPassword"
            type="password"
            autocomplete="new-password"
            required
            :disabled="loading"
            class="w-full rounded-xl border border-line bg-bg px-4 py-3 text-ink outline-none transition placeholder:text-faint focus:border-line-strong focus:ring-2 focus:ring-line-strong/30 disabled:opacity-50"
          />

        </div>

        <button
          type="submit"
          :disabled="loading || !selectedAvatar"
          class="w-full rounded-xl bg-accent py-3 text-lg font-semibold text-accent-ink transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ loading ? "Creating…" : "Create account" }}
        </button>

      </form>

      <!-- Footer -->

      <div class="mt-8 text-center">

        <span class="text-sm text-muted">
          Already have an account?
        </span>

        <RouterLink
          to="/login"
          class="ml-2 font-medium text-ink underline underline-offset-4 transition hover:opacity-70"
        >
          Login
        </RouterLink>

      </div>

    </div>
  </div>
</template>