<template>
  <img v-if="url" :src="url" :alt="alt" class="gthumb" :class="{ 'gthumb--cover': cover }"
    :style="cover ? focusStyle : null" />
  <span v-else class="gthumb gthumb--empty" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5L5 20" />
    </svg>
  </span>
</template>

<script setup>
import { toRef, computed } from 'vue';
import { usePhotoUrl } from '../usePhotoUrl.js';

const props = defineProps({
  photoId: { type: String, default: null },
  alt: { type: String, default: '' },
  // cover: riempi il riquadro (griglia/avatar); false → contain (dettaglio).
  cover: { type: Boolean, default: true },
  // Punto focale {x,y} in 0..100: dove ancorare l'immagine in object-fit: cover.
  focus: { type: Object, default: null },
});

const url = usePhotoUrl(toRef(() => props.photoId));

// object-position dal punto focale: sposta il soggetto dentro il riquadro (evita
// la testa tagliata). null → centro (default del browser).
const focusStyle = computed(() => {
  if (!props.focus) {
    return null;
  }
  const style = { objectPosition: `${props.focus.x}% ${props.focus.y}%` };
  return style;
});
</script>

<style scoped>
.gthumb {
  display: block;
  width: 100%;
  height: 100%;
}
.gthumb--cover { object-fit: cover; }
.gthumb:not(.gthumb--cover) { object-fit: contain; }

/* Placeholder (byte assenti / in caricamento): glifo mute su superficie del tomo. */
.gthumb--empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--text-faint);
  background:
    repeating-linear-gradient(45deg,
      var(--surface-panel), var(--surface-panel) 10px,
      var(--paper-50) 10px, var(--paper-50) 20px);
}
.gthumb--empty svg { width: 30%; max-width: 2.4rem; min-width: 1.4rem; }
</style>
