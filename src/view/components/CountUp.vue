<template>{{ display }}</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

// Numero che si anima verso il suo valore (count-up) al mount e a ogni cambio.
// Feedback di stato per i punteggi: comunica che il valore è cambiato senza
// scatti. Rispetta prefers-reduced-motion (salta diretto al valore finale).
const props = defineProps({
  value: { type: Number, required: true },
  duration: { type: Number, default: 500 },
});

const display = ref(props.value);
let raf = 0;

const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateTo(to, from) {
  if (reduceMotion) {
    display.value = to;
    return;
  }
  cancelAnimationFrame(raf);
  const start = performance.now();
  const delta = to - from;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / props.duration);
    const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
    display.value = Math.round(from + delta * eased);
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    }
  };
  raf = requestAnimationFrame(tick);
}

onMounted(() => { animateTo(props.value, 0); });
watch(() => props.value, (to, from) => { animateTo(to, from ?? 0); });
onUnmounted(() => cancelAnimationFrame(raf));
</script>
