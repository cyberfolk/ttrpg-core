<template>
  <div>
    <div class="rep-relbar">
      <div class="rep-searchbar">
      <div class="rep-search">
        <Icon name="search" class="rep-search__icon" />
        <input class="ds-input ds-input--with-icon" type="search" v-model="query"
          placeholder="Cerca per nome…" aria-label="Cerca per nome" />
      </div>
      <div class="rep-filters">
        <button ref="filtersBtn" type="button"
          class="rep-col-opts__btn" :class="{ 'rep-col-opts__btn--active': filtersActive }"
          :aria-label="filtersActive ? 'Filtri righe (attivi)' : 'Filtri righe'"
          :title="filtersActive ? 'Filtri righe (attivi)' : 'Filtri righe'"
          aria-controls="rep-filters-menu" :aria-expanded="filtersOpen"
          @click.stop="toggleFilters">
          <Icon name="filter" />
          <span v-if="filtersActive" class="rep-col-opts__dot" aria-hidden="true"></span>
        </button>
        <Teleport to="body">
          <div v-if="filtersOpen" id="rep-filters-menu" ref="filtersMenu"
            class="rep-col-opts__menu rep-col-opts__menu--float" role="group"
            aria-label="Filtri righe" :style="filtersStyle"
            @click.stop @focusout="onFiltersFocusout">
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
        </Teleport>
      </div>
      </div>
      <Pager v-if="total > 0" class="rep-relbar__pager"
        :page="page" :page-size="PAGE_SIZE" :total="total"
        @update:page="page = $event" />
    </div>
    <p v-if="total === 0" class="rep-empty">{{ query.trim() ? 'Nessun risultato.' : 'Nessuna relazione.' }}</p>
    <template v-else>
      <div class="rep-table-wrap rep-table--flush">
        <table class="rep-table" :class="{ 'rep-has-type': showType }">
          <thead>
            <tr>
              <th class="rep-table__num">#</th>
              <th class="rep-table__sortable" :aria-sort="ariaSort('name')"
                role="button" tabindex="0"
                @click="toggleSort('name')"
                @keydown="(e) => onSortKey(e, 'name')">
                Nome
                <Icon v-if="sort.key === 'name'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th v-if="showType" class="rep-table__sortable rep-col-type" :aria-sort="ariaSort('kind')"
                role="button" tabindex="0"
                @click="toggleSort('kind')"
                @keydown="(e) => onSortKey(e, 'kind')">
                Tipo
                <Icon v-if="sort.key === 'kind'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th class="rep-table__sortable rep-col--right" :aria-sort="ariaSort('score')"
                role="button" tabindex="0"
                @click="toggleSort('score')"
                @keydown="(e) => onSortKey(e, 'score')">
                Punteggio
                <Icon v-if="sort.key === 'score'" :name="sort.dir === 'asc' ? 'up' : 'down'" />
              </th>
              <th class="rep-col-opts">
                <button ref="optsBtn" type="button"
                  class="rep-col-opts__btn" :class="{ 'rep-col-opts__btn--active': colsActive }"
                  :aria-label="colsActive ? 'Colonne opzionali (Tipo nascosto)' : 'Colonne opzionali'"
                  :title="colsActive ? 'Colonne (Tipo nascosto)' : 'Colonne'"
                  aria-controls="rep-cols-menu" :aria-expanded="optsOpen"
                  @click.stop="toggleOpts">
                  <Icon name="columns" />
                  <span v-if="colsActive" class="rep-col-opts__dot" aria-hidden="true"></span>
                </button>
                <Teleport to="body">
                  <div v-if="optsOpen" id="rep-cols-menu" ref="optsMenu"
                    class="rep-col-opts__menu rep-col-opts__menu--float" role="group"
                    aria-label="Colonne opzionali" :style="optsStyle"
                    @click.stop @focusout="onOptsFocusout">
                    <label class="rep-col-opts__item">
                      <input type="checkbox" v-model="showType" />
                      <span>Tipo</span>
                    </label>
                  </div>
                </Teleport>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in pageRows" :key="row.node.kind + '-' + row.node.entity.id"
              class="rep-table__row--clickable"
              @click="emitTx(row.node.entity.id)">

              <td class="rep-table__num">{{ offset + i + 1 }}</td>
              <td>
                <span class="rep-name-cell">
                  <span class="rep-kind-ico" role="img" :aria-label="kindLabel(row.node)"
                    :title="kindLabel(row.node)">
                    <Icon :name="row.node.kind === 'group' ? 'users' : 'user'" />
                  </span>
                  <router-link class="rep-table__name" :to="profileTo(row.node)" @click.stop>
                    {{ row.node.entity.name }}
                    <Icon name="goto" />
                  </router-link>
                </span>
              </td>
              <td v-if="showType" class="rep-col-type">
                <span class="ds-badge">{{ kindLabel(row.node) }}</span>
              </td>
              <td class="rep-col--right">
                <button type="button" class="ds-score ds-score--interactive"
                  :style="{ background: scoreColor(row.score) }"
                  :aria-label="`Registra transazione con ${row.node.entity.name}`"
                  @click.stop="emitTx(row.node.entity.id)">
                  {{ row.score }}
                </button>
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
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
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

const page = ref(0);
const query = ref('');
const sort = ref({ key: 'score', dir: 'desc' }); // key: 'name' | 'kind' | 'score'

// Filtri righe (dropdown stile Odoo accanto alla ricerca).
const hideEmpty = ref(false);
const hideCharacters = ref(false);
const hideGroups = ref(false);
const filtersOpen = ref(false);
const filtersBtn = ref(null);
const filtersMenu = ref(null);
const filtersStyle = ref(null);

// Colonne opzionali (stile Odoo): toggle nel dropdown in coda all'header.
const showType = ref(true);
const optsOpen = ref(false);
const optsBtn = ref(null);
const optsMenu = ref(null);
const optsStyle = ref(null);

// Stato non-default dei due menu: serve a marcare visivamente le icone (un dot)
// così l'utente sa che righe/colonne sono filtrate anche a tendina chiusa.
const filtersActive = computed(() => hideEmpty.value || hideCharacters.value || hideGroups.value);
const colsActive = computed(() => !showType.value);

// I menu sono in Teleport su <body> (la card profilo ha overflow:hidden e la
// tabella overflow-x:auto: in posizione assoluta verrebbero clippati). Posizione
// fixed calcolata dal rettangolo del bottone, allineata al suo bordo destro.
function floatStyle(btnEl) {
  const r = btnEl.getBoundingClientRect();
  const style = {
    position: 'fixed',
    top: `${r.bottom + 4}px`,
    right: `${window.innerWidth - r.right}px`,
  };
  return style;
}

// Porta il focus sul primo input del menu appena aperto (accessibilità tastiera).
function focusFirst(menuRef) {
  const first = menuRef.value?.querySelector('input');
  if (first) first.focus();
}

async function toggleFilters() {
  if (filtersOpen.value) { closeFilters(); return; }
  optsOpen.value = false;
  filtersStyle.value = floatStyle(filtersBtn.value);
  filtersOpen.value = true;
  await nextTick();
  focusFirst(filtersMenu);
}

async function toggleOpts() {
  if (optsOpen.value) { closeOpts(); return; }
  filtersOpen.value = false;
  optsStyle.value = floatStyle(optsBtn.value);
  optsOpen.value = true;
  await nextTick();
  focusFirst(optsMenu);
}

// Chiusura "intenzionale" (toggle, Esc): riporta il focus al bottone di apertura.
function closeFilters() {
  filtersOpen.value = false;
  filtersBtn.value?.focus();
}
function closeOpts() {
  optsOpen.value = false;
  optsBtn.value?.focus();
}

// Chiusura "passiva" (click esterno, scroll, resize): non rubare il focus.
function closeMenus() {
  filtersOpen.value = false;
  optsOpen.value = false;
}

// Tab fuori dal menu (es. oltre l'ultimo checkbox) → chiudi senza spostare il focus.
function makeFocusout(menuRef, openRef) {
  return (e) => {
    const to = e.relatedTarget;
    if (to instanceof Node && menuRef.value && menuRef.value.contains(to)) return;
    openRef.value = false;
  };
}
const onFiltersFocusout = makeFocusout(filtersMenu, filtersOpen);
const onOptsFocusout = makeFocusout(optsMenu, optsOpen);

// Esc chiude il menu aperto e riporta il focus al suo trigger.
function onKeydown(e) {
  if (e.key !== 'Escape') return;
  if (filtersOpen.value) closeFilters();
  else if (optsOpen.value) closeOpts();
}

// Click sul menu o sui bottoni: @click.stop non raggiunge il document, quindi
// qui chiudiamo solo su click realmente esterni. Scroll/resize: la posizione
// fixed si scollegherebbe dal bottone → chiudi.
onMounted(() => {
  document.addEventListener('click', closeMenus);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', closeMenus, true);
  window.addEventListener('resize', closeMenus);
});
onUnmounted(() => {
  document.removeEventListener('click', closeMenus);
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('scroll', closeMenus, true);
  window.removeEventListener('resize', closeMenus);
});

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

// Stato di ordinamento per gli screen reader (aria-sort sull'header attivo).
function ariaSort(key) {
  if (sort.value.key !== key) return 'none';
  const direction = sort.value.dir === 'asc' ? 'ascending' : 'descending';
  return direction;
}

function emitTx(otherId) {
  const pair = props.direction === 'in'
    ? { fromId: otherId, toId: props.currentId }
    : { fromId: props.currentId, toId: otherId };
  emit('open-tx', pair);
}

// Etichetta del tipo nodo (badge colonna Tipo + nome accessibile del glifo kind).
function kindLabel(node) {
  const label = node.kind === 'group' ? 'Gruppo' : 'Personaggio';
  return label;
}

// Destinazione del link al profilo: gruppo o personaggio.
function profileTo(node) {
  const routeName = node.kind === 'group' ? 'groupProfile' : 'profile';
  const location = { name: routeName, params: { id: node.entity.id } };
  return location;
}
</script>

<style scoped>
.rep-table__sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.rep-col--right { text-align: right; }

/* Cella nome: glifo kind + link. Il glifo compare solo quando la colonna
   Tipo NON è visibile, così il dato personaggio/gruppo non si perde mai
   (toggle colonna off su desktop, oppure colonna nascosta su mobile). */
.rep-name-cell { display: inline-flex; align-items: center; gap: 0.4rem; min-width: 0; }
.rep-kind-ico {
  display: none;
  flex: none;
  align-items: center;
  color: var(--text-muted);
}
.rep-kind-ico :deep(svg) { width: 1em; height: 1em; }
/* colonna Tipo nascosta dal toggle → mostra il glifo */
.rep-table:not(.rep-has-type) .rep-kind-ico { display: inline-flex; }

/* Nome = link reale al profilo: niente stile <a> nativo, focus visibile. */
.rep-table__name { color: inherit; text-decoration: none; }
.rep-table__name:focus-visible {
  outline: 2px solid var(--gold-500);
  outline-offset: 2px;
}

/* Punteggio = <button> reale (apre la transazione): azzera il chrome nativo. */
button.ds-score {
  appearance: none;
  -webkit-appearance: none;
  border: 0;
  cursor: pointer;
}
.ds-score:focus-visible {
  outline: 2px solid var(--gold-500);
  outline-offset: 2px;
}

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
  position: relative;
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
/* filtri/colonne in stato non-default: icona oro + dot, niente solo-colore */
.rep-col-opts__btn--active { color: var(--accent-text); }
.rep-col-opts__dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  box-shadow: 0 0 0 2px var(--surface-card);
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

/* mobile: via colonna Tipo e dropdown colonne; il tipo resta come glifo
   inline sul nome (il dato si sposta, non si perde) */
@media (max-width: 480px) {
  .rep-col-type,
  .rep-col-opts { display: none; }
  .rep-table .rep-kind-ico { display: inline-flex; }
}
</style>