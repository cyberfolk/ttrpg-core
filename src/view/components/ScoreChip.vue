<template>
  <!-- Chip punteggio del DS: pillola tinta con scoreColor. `interactive` lo rende
       un <button> (apre la transazione); attributi extra (aria-label, @click)
       cadono per fallthrough sull'elemento radice. -->
  <component :is="tag" class="ds-score" :class="chipClass" :style="chipStyle"
    :type="tag === 'button' ? 'button' : undefined">
    {{ display }}
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { scoreColor } from '../scoreColor.js';

// Incapsula il pattern ripetuto in ~9 componenti: classe ds-score + variante
// size, stato "vuoto" (score null), tinta scoreColor inline e simbolo di fallback.
const props = defineProps({
  score: { type: Number, default: null }, // null → chip "vuoto"
  size: { type: String, default: 'md' }, // 'sm' | 'md' | 'lg'
  interactive: { type: Boolean, default: false },
  empty: { type: String, default: '–' }, // simbolo mostrato quando score è null
});

const tag = computed(() => {
  const el = props.interactive ? 'button' : 'span';
  return el;
});

const isEmpty = computed(() => {
  const empty = props.score === null;
  return empty;
});

const chipClass = computed(() => {
  const cls = [];
  if (props.size === 'sm') cls.push('ds-score--sm');
  else if (props.size === 'lg') cls.push('ds-score--lg');
  if (props.interactive) cls.push('ds-score--interactive');
  if (isEmpty.value) cls.push('ds-score--empty');
  return cls;
});

const chipStyle = computed(() => {
  const style = isEmpty.value ? undefined : { background: scoreColor(props.score) };
  return style;
});

const display = computed(() => {
  const text = isEmpty.value ? props.empty : props.score;
  return text;
});
</script>
