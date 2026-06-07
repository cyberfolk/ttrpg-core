<template>
  <div class="relation-list">
    <p>relazioni (stub) — direzione: {{ direction }}, pg: {{ currentId }}</p>
  </div>
</template>
<script setup>
defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true },
});
defineEmits(['open-tx']);
</script>
