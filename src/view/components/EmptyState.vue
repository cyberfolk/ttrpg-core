<template>
  <!-- Stato vuoto che insegna: glifo + titolo Cinzel + una riga di corpo + azioni.
       È l'affordance di primo accesso — rimpiazza il "rep-empty" nudo dove un
       punto morto deve invece instradare al passo successivo del flusso caldo. -->
  <div class="ds-empty" :class="compact ? 'ds-empty--compact' : ''">
    <span v-if="icon" class="ds-empty__glyph" aria-hidden="true">
      <Icon :name="icon" />
    </span>
    <h2 class="ds-empty__title">{{ title }}</h2>
    <p v-if="body" class="ds-empty__body">{{ body }}</p>
    <div v-if="$slots.default" class="ds-empty__actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue';

defineProps({
  icon: { type: String, default: null },
  title: { type: String, required: true },
  body: { type: String, default: null },
  // compact: variante più stretta per stati secondari (es. "nessun risultato").
  compact: { type: Boolean, default: false },
});
</script>

<style scoped>
.ds-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  padding: clamp(2.5rem, 8vw, 4rem) 1.25rem;
  max-width: 32rem;
  margin-inline: auto;
}

/* Glifo dentro un disco di velina d'oro: la segnatura dell'archivista, tenue. */
.ds-empty__glyph {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--radius-pill);
  background: var(--accent-tint);
  border: 1px solid var(--line-gold);
  color: var(--gold-700);
  font-size: 1.4rem;
  margin-bottom: var(--space-2);
}

.ds-empty__title {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: var(--fw-semibold);
  color: var(--text-strong);
  text-wrap: balance;
}

.ds-empty__body {
  font-family: var(--font-sans);
  /* Corpo su text-body (ink-700), mai muted slavato: è testo, regge il 4.5:1. */
  color: var(--text-body);
  line-height: var(--lh-normal, 1.5);
  max-width: 34ch;
  text-wrap: pretty;
}

.ds-empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
  margin-top: var(--space-2);
}

/* Compact: stato secondario (nessun risultato di ricerca), meno aria, niente disco. */
.ds-empty--compact {
  padding: 2.25rem 1.25rem;
  gap: var(--space-2);
}
.ds-empty--compact .ds-empty__glyph {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.05rem;
  margin-bottom: 0;
}
.ds-empty--compact .ds-empty__title {
  font-size: var(--fs-h3);
}

/* Entrata misurata: fade + rise breve, annullata su reduced-motion. */
@media (prefers-reduced-motion: no-preference) {
  .ds-empty {
    animation: ds-empty-in 0.28s var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
}
@keyframes ds-empty-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
</style>
