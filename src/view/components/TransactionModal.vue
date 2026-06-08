<template>
  <div class="ds-overlay" @click.self="emit('close')">
    <div class="ds-dialog">
      <div class="ds-dialog__head">
        <h3 class="ds-dialog__title">
          <span style="display:inline-flex;align-items:center;gap:10px">
            {{ fromName }}
            <span class="rep-rel-arrow">
              <span class="rep-rel-arrow__label">Pensa di</span>
              <span class="rep-rel-arrow__glyph">→</span>
            </span>
            {{ toName }}
            <span class="ds-score ds-score--sm"
              :class="{ 'ds-score--empty': score === null }"
              :style="score !== null ? { background: scoreColor(score) } : undefined">
              {{ score !== null ? score : '–' }}
            </span>
          </span>
        </h3>
        <button class="ds-dialog__close" @click="emit('close')" aria-label="Chiudi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <div class="ds-dialog__body">
        <!-- Transaction list -->
        <p v-if="transactions.length === 0" class="rep-empty">
          Nessuna transazione — punteggio di base 50.
        </p>
        <div v-for="t in transactions" :key="t.id" class="rep-tx">
          <span class="rep-tx__delta" :class="t.delta >= 0 ? 'pos' : 'neg'">
            {{ t.delta >= 0 ? '+' : '' }}{{ t.delta }}
          </span>
          <span class="rep-tx__reason">{{ t.name }}</span>
          <span class="rep-tx__when">{{ fmtDay(t.createdAt) }}</span>
          <button class="ds-btn ds-btn--sm ds-btn--danger rep-tx__del"
            aria-label="Elimina transazione" @click="onDelete(t.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em">
              <path d="M3 6h18"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        <!-- Add transaction form -->
        <form class="rep-tx-add" @submit.prevent="onAdd">
          <span class="ds-field" style="width:5.5rem">
            <label class="ds-field__label" for="tx-delta">Delta</label>
            <span class="ds-field__wrap">
              <input id="tx-delta" ref="deltaInput" class="ds-input" type="number" placeholder="-5"
                v-model.number="newDelta" />
            </span>
          </span>
          <span class="ds-field ds-field--block">
            <label class="ds-field__label" for="tx-reason">Motivo</label>
            <span class="ds-field__wrap">
              <input id="tx-reason" class="ds-input" type="text"
                placeholder="Es. salvato in battaglia" v-model="newReason" />
            </span>
          </span>
          <button class="ds-btn ds-btn--primary" type="submit" style="align-self:flex-end">
            <span class="ds-btn__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
            </span>
            Aggiungi
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue';
import { useStore } from '../useStore.js';
import { computeScore, listTransactions, addTransaction, deleteTransaction } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';

const props = defineProps({
  fromId: { type: String, required: true },
  toId:   { type: String, required: true },
});

const emit = defineEmits(['close']);

const { state, dispatch } = useStore();
const newDelta  = ref(0);
const newReason = ref('');
const deltaInput = ref(null);

onMounted(async () => {
  await nextTick();
  deltaInput.value?.select();
});

function charName(id) {
  const found = state.value.characters.find((c) => c.id === id);
  return found ? found.name : '???';
}

const fromName    = computed(() => charName(props.fromId));
const toName      = computed(() => charName(props.toId));
const score       = computed(() => computeScore(state.value, props.fromId, props.toId));
const transactions = computed(() => listTransactions(state.value, props.fromId, props.toId));

const fmtDay = (ts) => new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

function onDelete(txId) {
  dispatch((s) => deleteTransaction(s, txId));
}

function onAdd() {
  const delta = Number(newDelta.value);
  const reason = newReason.value.trim();
  if (Number.isNaN(delta) || !reason) return;
  dispatch((s) => addTransaction(s, props.fromId, props.toId, delta, reason));
  newDelta.value = 0;
  newReason.value = '';
}
</script>
