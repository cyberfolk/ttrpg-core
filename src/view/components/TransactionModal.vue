<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <p>transazioni {{ fromId }} → {{ toId }} (stub)</p>
      <button @click="emit('close')">Chiudi</button>
    </div>
  </div>
</template>
<script setup>
defineProps({ fromId: { type: String, required: true }, toId: { type: String, required: true } });
const emit = defineEmits(['close']);
</script>
