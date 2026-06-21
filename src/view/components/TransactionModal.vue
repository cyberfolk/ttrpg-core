<template>
  <div class="ds-overlay" @click.self="emit('close')">
    <div class="ds-dialog">
      <div class="ds-dialog__head">
        <h3 class="ds-dialog__title">
          <span class="rep-tx-title">
            <span class="rep-tx-row">
              <span class="rep-rel-arrow">
                <span class="rep-rel-arrow__label">Cosa</span>
                <span class="rep-rel-arrow__glyph" aria-hidden="true"></span>
              </span>
              <span class="rep-tx-title__name">{{ fromName }}</span>
            </span>
            <span class="rep-tx-row">
              <span class="rep-rel-arrow">
                <span class="rep-rel-arrow__label">Pensa di</span>
                <span class="rep-rel-arrow__glyph" aria-hidden="true"></span>
              </span>
              <span class="rep-tx-title__name">{{ toName }}</span>
            </span>
          </span>
        </h3>
        <span class="rep-tx-headscore">
          <HoverTip text="Punteggio Totale" label="Punteggio totale" class-name="rep-cc__scoretip">
            <span class="rep-tx-headscore__inner">
              <span class="rep-tx-headscore__label">Totale</span>
              <span class="ds-score ds-score--sm"
                :class="{ 'ds-score--empty': score === null }"
                :style="score !== null ? { background: scoreColor(score) } : undefined">
                {{ score !== null ? score : '–' }}
              </span>
            </span>
          </HoverTip>
        </span>
        <button class="ds-dialog__close ds-dialog__close--corner" @click="emit('close')" aria-label="Chiudi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <div class="ds-dialog__body">
        <Pager :page="page" :page-size="PAGE_SIZE" :total="total"
          @update:page="page = $event" />
        <div class="rep-table-wrap rep-tx-bleed">
          <table class="rep-table rep-tx-table">
            <thead>
              <tr>
                <th class="rep-tx__delta-col">Delta</th>
                <th>Motivo</th>
                <th class="rep-tx__when-col">Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="total === 0">
                <td colspan="4" class="rep-empty">Nessuna transazione — punteggio di base 50.</td>
              </tr>
              <tr v-for="t in pagedTransactions" :key="t.id">
                <td class="rep-tx__delta-col">
                  <input v-if="editingId === t.id" class="ds-input rep-tx__delta"
                    :class="t.delta >= 0 ? 'pos' : 'neg'" type="number" :value="t.delta"
                    aria-label="Delta" @change="onEditDelta(t.id, $event)" @keyup.enter="stopEdit" />
                  <span v-else class="rep-tx__delta" :class="t.delta >= 0 ? 'pos' : 'neg'">
                    {{ t.delta >= 0 ? '+' : '' }}{{ t.delta }}
                  </span>
                </td>
                <td class="rep-tx__reason">
                  <input v-if="editingId === t.id" class="ds-input" type="text" :value="t.name"
                    aria-label="Motivo" @change="onEditReason(t.id, $event)" @keyup.enter="stopEdit" />
                  <span v-else>{{ t.name }}</span>
                </td>
                <td class="rep-tx__when">{{ fmtDay(t.createdAt) }}</td>
                <td>
                  <div class="rep-table__actions">
                    <HoverTip v-if="editingId === t.id" text="Fatto" label="Conferma modifica" :tab-index="-1">
                      <button class="ds-btn ds-btn--sm ds-btn--primary ds-btn--icon"
                        type="button" aria-label="Conferma modifica" @click="stopEdit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      </button>
                    </HoverTip>
                    <template v-else>
                      <HoverTip text="Modifica" label="Modifica transazione" :tab-index="-1">
                        <button class="ds-btn ds-btn--sm ds-btn--secondary ds-btn--icon"
                          type="button" aria-label="Modifica transazione" @click="startEdit(t.id)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>
                      </HoverTip>
                      <HoverTip text="Elimina" label="Elimina transazione" :tab-index="-1">
                        <button class="ds-btn ds-btn--sm ds-btn--danger ds-btn--icon rep-tx__del"
                          type="button" aria-label="Elimina transazione" @click="onDelete(t.id)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em">
                            <path d="M3 6h18"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </HoverTip>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="rep-tx-addrow">
                <td class="rep-tx__delta-col">
                  <input ref="deltaInput" class="ds-input" type="number" placeholder="-5"
                    aria-label="Delta" v-model.number="newDelta" @keyup.enter="onAdd" />
                </td>
                <td colspan="2">
                  <input class="ds-input" type="text" placeholder="Es. salvato in battaglia"
                    aria-label="Motivo" v-model="newReason" @keyup.enter="onAdd" />
                </td>
                <td>
                  <HoverTip text="Aggiungi" label="Aggiungi transazione" :tab-index="-1">
                    <button class="ds-btn ds-btn--primary ds-btn--sm ds-btn--icon"
                      type="button" @click="onAdd" aria-label="Aggiungi transazione">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14"/><path d="M12 5v14"/>
                      </svg>
                    </button>
                  </HoverTip>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from '../useStore.js';
import { computeScore, listTransactions, addTransaction, editTransaction, deleteTransaction } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import HoverTip from './HoverTip.vue';
import Pager from './Pager.vue';

const PAGE_SIZE = 5;

const props = defineProps({
  fromId: { type: String, required: true },
  toId:   { type: String, required: true },
});

const emit = defineEmits(['close']);

const { state, dispatch } = useStore();
const newDelta  = ref(0);
const newReason = ref('');
const deltaInput = ref(null);
const editingId = ref(null);

const page = ref(0);

onMounted(async () => {
  window.addEventListener('keydown', onKey);
  await nextTick();
  deltaInput.value?.select();
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
});

function onKey(e) {
  if (e.key === 'Escape') emit('close');
}

function charName(id) {
  const character = state.value.characters.find((c) => c.id === id);
  if (character) {
    const charName = character.name;
    return charName;
  }
  const group = state.value.groups.find((g) => g.id === id);
  const name = group ? group.name : '???';
  return name;
}

const fromName    = computed(() => charName(props.fromId));
const toName      = computed(() => charName(props.toId));
const score       = computed(() => computeScore(state.value, props.fromId, props.toId));
const transactions = computed(() => listTransactions(state.value, props.fromId, props.toId));
const total = computed(() => transactions.value.length);
const pagedTransactions = computed(() => {
  const start = page.value * PAGE_SIZE;
  const slice = transactions.value.slice(start, start + PAGE_SIZE);
  return slice;
});

// Clamp della pagina quando il totale cala (es. dopo una cancellazione).
watch(total, (n) => {
  const lastPage = Math.max(0, Math.ceil(n / PAGE_SIZE) - 1);
  if (page.value > lastPage) page.value = lastPage;
});

const fmtDay = (ts) => new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

function onDelete(txId) {
  dispatch((s) => deleteTransaction(s, txId));
}

function startEdit(txId) {
  editingId.value = txId;
}

function stopEdit() {
  editingId.value = null;
}

function onEditDelta(txId, e) {
  const delta = Number(e.target.value);
  if (Number.isNaN(delta)) return;
  dispatch((s) => editTransaction(s, txId, { delta }));
}

function onEditReason(txId, e) {
  const name = e.target.value.trim();
  if (!name) return;
  dispatch((s) => editTransaction(s, txId, { name }));
}

function onAdd() {
  const delta = Number(newDelta.value);
  const reason = newReason.value.trim();
  if (Number.isNaN(delta) || !reason) return;
  dispatch((s) => addTransaction(s, props.fromId, props.toId, delta, reason));
  newDelta.value = 0;
  newReason.value = '';
  // mostra la riga appena aggiunta (in coda all'ultima pagina)
  page.value = Math.max(0, Math.ceil(transactions.value.length / PAGE_SIZE) - 1);
}
</script>
