<template>
  <div>
    <div class="rep-relbar">
      <div class="rep-searchbar">
      <div class="rep-search">
        <Icon name="search" class="rep-search__icon" />
        <input class="ds-input ds-input--with-icon" type="search" v-model="query"
          placeholder="Cerca per nome…" aria-label="Cerca per nome" />
      </div>
      <div class="rep-filters" ref="filtersWrap" @mouseleave="onFiltersLeave">
        <button class="rep-col-opts__btn" type="button"
          aria-label="Filtri righe" title="Filtri righe" :aria-expanded="filtersOpen"
          @click.stop="filtersOpen = !filtersOpen">
          <Icon name="filter" />
        </button>
        <div v-if="filtersOpen" class="rep-col-opts__menu" @click.stop>
          <label class="rep-col-opts__item">
            <input type="checkbox" v-model="hideEmpty" />
            <span>Nascondi righe senza interazioni</span>
          </label>
          <label class="rep-col-opts__item">
            <input type="checkbox" v-model="hideCharacters" />
            <span>Nascondi personaggi</span>
          </label>
          <label class="rep-col-opts__item">
            <input type="checkbox" v-model="hideGroups" />
            <span>Nascondi gruppi</span>
          </label>
        </div>
      </div>
      </div>
      <Pager v-if="total > 0" class="rep-relbar__pager"
        :page="page" :page-size="PAGE_SIZE" :total="total"
        @update:page="page = $event" />
    </div>
    <p v-if="total === 0" class="rep-empty">{{ query.trim() ? 'Nessun risultato.' : 'Nessuna relazione.' }}</p>
    <template v-else>
      <div class="rep-table-wrap rep-table--flush">
        <table class="rep-table">
          <thead>
            <tr>
              <th class="rep-table__num">#</th>
              <th class="rep-table__sortable" role="button" tabindex="0"
                @click="toggleSort('name')"
                @keydown="(e) => onSortKey(e, 'name')">
                Nome
                <Icon v-if="sort.key === 'name'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th v-if="showType" class="rep-table__sortable rep-col-type" role="button" tabindex="0"
                @click="toggleSort('kind')"
                @keydown="(e) => onSortKey(e, 'kind')">
                Tipo
                <Icon v-if="sort.key === 'kind'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th class="rep-table__sortable rep-col--right" role="button" tabindex="0"
                @click="toggleSort('score')"
                @keydown="(e) => onSortKey(e, 'score')">
                Punteggio
                <Icon v-if="sort.key === 'score'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th class="rep-col-opts" ref="optsWrap" @mouseleave="onWrapLeave">
                <button class="rep-col-opts__btn" type="button"
                  aria-label="Colonne opzionali" title="Colonne" :aria-expanded="optsOpen"
                  @click.stop="optsOpen = !optsOpen">
                  <Icon name="columns" />
                </button>
                <div v-if="optsOpen" class="rep-col-opts__menu" @click.stop>
                  <label class="rep-col-opts__item">
                    <input type="checkbox" v-model="showType" />
                    <span>Tipo</span>
                  </label>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in pageRows" :key="row.node.kind + '-' + row.node.entity.id"
              class="rep-table__row--clickable" role="button" tabindex="0"
              @click="emitTx(row.node.entity.id)"
              @keydown="(e) => onRowKey(e, row.node.entity.id)">

              <td class="rep-table__num">{{ offset + i + 1 }}</td>
              <td>
                <span class="rep-table__name" @click.stop="goToProfile(row.node)">
                  {{ row.node.entity.name }}
                  <Icon name="goto" />
                </span>
              </td>
              <td v-if="showType" class="rep-col-type">
                <span class="ds-badge">
                  {{ row.node.kind === 'group' ? 'Gruppo' : 'Personaggio' }}
                </span>
              </td>
              <td class="rep-col--right">
                <span class="ds-score ds-score--interactive"
                  :style="{ background: scoreColor(row.score) }"
                  @click.stop="emitTx(row.node.entity.id)">
                  {{ row.score }}
                </span>
              </td>
              <td class="rep-col-opts"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, listActiveGroups, computeScore, hasTransaction } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import Icon from './Icon.vue';
import Pager from './Pager.vue';

const PAGE_SIZE = 10;

const props = defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true },
});

const emit = defineEmits(['open-tx']);

const { state } = useStore();
const ui = useUiState();
const router = useRouter();

const page = ref(0);
const query = ref('');
const sort = ref({ key: 'score', dir: 'desc' }); // key: 'name' | 'kind' | 'score'

// Filtri righe (dropdown stile Odoo accanto alla ricerca).
const hideEmpty = ref(false);
const hideCharacters = ref(false);
const hideGroups = ref(false);
const filtersOpen = ref(false);
const filtersWrap = ref(null);

// Colonne opzionali (stile Odoo): toggle nel dropdown in coda all'header.
const showType = ref(true);
const optsOpen = ref(false);
const optsWrap = ref(null);

// Chiude una tendina se il click è fuori dal suo wrapper.
function closeIfOutside(wrap, openRef, target) {
  if (wrap.value && !wrap.value.contains(target)) {
    openRef.value = false;
  }
}

function onDocClick(e) {
  closeIfOutside(optsWrap, optsOpen, e.target);
  closeIfOutside(filtersWrap, filtersOpen, e.target);
}

// Chiude la tendina quando il puntatore esce da icona+menu.
function leaveCloser(wrap, openRef) {
  return (e) => {
    const to = e.relatedTarget;
    if (to instanceof Node && wrap.value && wrap.value.contains(to)) {
      return;
    }
    openRef.value = false;
  };
}

const onWrapLeave = leaveCloser(optsWrap, optsOpen);
const onFiltersLeave = leaveCloser(filtersWrap, filtersOpen);

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));

// Esiste una transazione registrata in questa direzione tra currentId e l'altro?
function hasInteraction(otherId) {
  const exists = props.direction === 'in'
    ? hasTransaction(state.value, otherId, props.currentId)
    : hasTransaction(state.value, props.currentId, otherId);
  return exists;
}

// Nodi candidati: personaggi + gruppi, ciascuno con il proprio kind.
const nodes = computed(() => {
  const chars = (ui.showArchived ? state.value.characters : listActiveCharacters(state.value))
    .map((entity) => ({ kind: 'character', entity }));
  const groups = (ui.showArchived ? state.value.groups : listActiveGroups(state.value))
    .map((entity) => ({ kind: 'group', entity }));
  const all = [...chars, ...groups];
  return all;
});

const others = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const filtered = nodes.value.filter((node) => {
    if (node.entity.id === props.currentId) return false;
    if (hideCharacters.value && node.kind === 'character') return false;
    if (hideGroups.value && node.kind === 'group') return false;
    if (hideEmpty.value && !hasInteraction(node.entity.id)) return false;
    if (needle && !node.entity.name.toLowerCase().includes(needle)) return false;
    return true;
  });
  return filtered;
});

const sortedRows = computed(() => {
  const mapped = others.value.map((node) => {
    const score = props.direction === 'in'
      ? computeScore(state.value, node.entity.id, props.currentId)
      : computeScore(state.value, props.currentId, node.entity.id);
    return { node, score };
  });
  const { key, dir } = sort.value;
  const sorted = [...mapped].sort((a, b) => {
    let cmp;
    if (key === 'name') {
      cmp = a.node.entity.name.localeCompare(b.node.entity.name);
    } else if (key === 'kind') {
      cmp = a.node.kind.localeCompare(b.node.kind);
    } else {
      cmp = a.score - b.score;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
});

const total = computed(() => sortedRows.value.length);

// Torna alla prima pagina quando cambia il filtro di ricerca.
watch(query, () => { page.value = 0; });

// Clamp pagina quando il totale cala (es. attivando "nascondi senza interazioni").
watch(total, (n) => {
  const lastPage = Math.max(0, Math.ceil(n / PAGE_SIZE) - 1);
  if (page.value > lastPage) page.value = lastPage;
});

const offset = computed(() => page.value * PAGE_SIZE);

const pageRows = computed(() => {
  const start = offset.value;
  const slice = sortedRows.value.slice(start, start + PAGE_SIZE);
  return slice;
});

function toggleSort(key) {
  if (sort.value.key === key) {
    const nextDir = sort.value.dir === 'asc' ? 'desc' : 'asc';
    sort.value = { key, dir: nextDir };
  } else {
    // nuovo campo: nome/tipo partono asc (A→Z), punteggio parte desc (alto→basso)
    sort.value = { key, dir: key === 'score' ? 'desc' : 'asc' };
  }
  page.value = 0;
}

function onSortKey(e, key) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(key); }
}

function onRowKey(e, otherId) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emitTx(otherId); }
}

function emitTx(otherId) {
  const pair = props.direction === 'in'
    ? { fromId: otherId, toId: props.currentId }
    : { fromId: props.currentId, toId: otherId };
  emit('open-tx', pair);
}

function goToProfile(node) {
  const routeName = node.kind === 'group' ? 'groupProfile' : 'profile';
  router.push({ name: routeName, params: { id: node.entity.id } });
}
</script>

<style scoped>
.rep-table__sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.rep-col--right { text-align: right; }

/* toolbar: ricerca + dropdown filtri righe */
.rep-relbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}
/* gruppo ricerca + filtri (nessun contenitore: l'input ha già il suo bordo) */
.rep-searchbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 16rem;
}
.rep-search {
  position: relative;
  flex: 1;
  min-width: 0;
  color: var(--text-muted);
}
.rep-search .ds-input { width: 100%; }
.rep-search__icon {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-faint);
}
.rep-filters { position: relative; flex: none; }
.rep-relbar__pager { flex: none; }
.rep-relbar :deep(.rep-pager) { margin-block: 0; }

/* colonna dropdown "colonne opzionali" stile Odoo */
.rep-col-opts {
  position: relative;
  width: 1%;
  white-space: nowrap;
  text-align: right;
}
.rep-col-opts__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  min-height: 38px;
  padding: 0.4rem;
  font-size: 1.2rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  transition: color var(--dur-fast), background var(--dur-fast), border-color var(--dur-fast);
}
.rep-col-opts__btn:hover {
  background: var(--surface-panel);
  border-color: transparent;
  color: var(--text-strong);
}
.rep-col-opts__menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 20;
  margin-top: 0;
  padding: 0.35rem;
  min-width: 9rem;
  background: var(--paper-0);
  border: 1px solid var(--line-gold);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
.rep-col-opts__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.4rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 400;
  white-space: nowrap;
}
.rep-col-opts__item:hover { background: var(--paper-50); }
.rep-col-opts__item input { cursor: pointer; margin: 0; }

/* tap target adeguato su touch/stylus (44px raccomandati) */
@media (pointer: coarse) {
  .rep-col-opts__btn { min-width: 44px; min-height: 44px; }
}

/* mobile: solo Nome + Punteggio; via colonna Tipo e dropdown colonne */
@media (max-width: 480px) {
  .rep-col-type,
  .rep-col-opts { display: none; }
}
</style>