<template>
  <div class="rep-gallery">
    <p v-if="groups.length === 0" class="rep-empty">Nessun gruppo.</p>
    <GroupCard v-for="g in groups" :key="g.id" :group="g" />
  </div>
</template>

<script setup>
import GroupCard from './GroupCard.vue';

defineProps({
  groups: { type: Array, required: true },
});
</script>
