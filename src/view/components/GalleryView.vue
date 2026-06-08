<template>
  <div class="rep-gallery">
    <p v-if="items.length === 0" class="rep-empty">Nessun personaggio.</p>
    <CharacterCard
      v-for="item in items"
      :key="item.char.id"
      :char="item.char"
      :score="item.score"
    />
  </div>
</template>

<script setup>
import CharacterCard from './CharacterCard.vue';

defineProps({
  items: { type: Array, required: true },
});
</script>
