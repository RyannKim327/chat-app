<script setup lang="ts">
const emit = defineEmits<{
  (e: "insert", markdown: string): void;
}>();

const buttons = [
  { label: "B", markdown: "****", title: "Bold" },
  { label: "I", markdown: "**", title: "Italic" },
  { label: "</>", markdown: "``", title: "Code" },
  { label: "•", markdown: "- ", title: "List" },
];
</script>

<template>
  <div
    class="flex gap-2 border-b border-line bg-surface/60 px-4 py-2"
  >
    <button
      v-for="button in buttons"
      :key="button.title"
      @click="emit('insert', button.markdown)"
      :title="button.title"
      class="rounded-lg border border-line px-3 py-1 text-xs text-muted transition hover:border-line-strong hover:bg-surface-2 hover:text-ink"
    >
      {{ button.label }}
    </button>
  </div>
</template>