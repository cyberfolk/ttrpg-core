<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <header class="modal-head">
        <h3>{{ fromName }} → {{ toName }} : {{ score }}</h3>
        <button @click="emit('close')">Chiudi</button>
      </header>

      <ul class="tx-list">
        <li v-for="t in transactions" :key="t.id">
          <input type="number" v-model.number="edits[t.id].delta" />
          <input type="text" v-model="edits[t.id].name" />
          <button @click="onSave(t.id)">Salva</button>
          <button @click="onDelete(t.id)">Elimina</button>
        </li>
      </ul>

      <form class="tx-add" @submit.prevent="onAdd">
        <input type="number" v-model.number="newDelta" placeholder="Delta (es. -5)" />
        <input type="text" v-model="newName" placeholder="Motivo" />
        <button type="submit">Aggiungi transazione</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watchEffect } from 'vue';
import { useStore } from '../useStore.js';
import {
  computeScore, listTransactions, addTransaction, editTransaction, deleteTransaction,
} from '../../model/reputation.js';

const props = defineProps({
  fromId: { type: String, required: true },
  toId: { type: String, required: true },
});

const emit = defineEmits(['close']);

const { state, dispatch } = useStore();

const newDelta = ref(0);
const newName = ref('');
const edits = reactive({});

function charName(id) {
  const found = state.value.characters.find((c) => c.id === id);
  const name = found ? found.name : '???';
  return name;
}

const fromName = computed(() => charName(props.fromId));
const toName = computed(() => charName(props.toId));
const score = computed(() => computeScore(state.value, props.fromId, props.toId));
const transactions = computed(() => listTransactions(state.value, props.fromId, props.toId));

watchEffect(() => {
  for (const t of transactions.value) {
    if (!edits[t.id]) {
      edits[t.id] = { delta: t.delta, name: t.name };
    }
  }
});

function onSave(txId) {
  const buf = edits[txId];
  const name = buf.name.trim();
  if (Number.isNaN(buf.delta) || name.length === 0) {
    return;
  }
  dispatch((s) => editTransaction(s, txId, { delta: Number(buf.delta), name }));
}

function onDelete(txId) {
  dispatch((s) => deleteTransaction(s, txId));
  delete edits[txId];
}

function onAdd() {
  const delta = Number(newDelta.value);
  const name = newName.value.trim();
  if (Number.isNaN(delta) || name.length === 0) {
    return;
  }
  dispatch((s) => addTransaction(s, props.fromId, props.toId, delta, name));
  newDelta.value = 0;
  newName.value = '';
}
</script>
