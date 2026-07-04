<template>
  <div>
    <div class="rep-relbar">
      <div class="rep-searchbar">
      <div class="rep-search">
        <Icon name="search" class="rep-search__icon" />
        <input class="ds-input ds-input--with-icon" type="search" v-model="query"
          placeholder="Cerca per nome…" aria-label="Cerca per nome" />
      </div>
      <HoverTip :text="menuActive ? 'Filtri (attivi)' : 'Filtri'"
        label="Filtri" :tab-index="-1">
        <button ref="optsBtn" type="button"
          class="rep-col-opts__btn" :class="{ 'rep-col-opts__btn--active': menuActive }"
          :aria-label="menuActive ? 'Filtri (attivi)' : 'Filtri'"
          aria-controls="rep-opts-menu" :aria-expanded="optsOpen"
          @click.stop="toggleOpts">
          <Icon name="filter" />
          <span v-if="menuActive" class="rep-col-opts__dot" aria-hidden="true"></span>
        </button>
      </HoverTip>
      <Teleport to="body">
        <div v-if="optsOpen" id="rep-opts-menu" ref="optsMenu"
          class="rep-col-opts__menu rep-col-opts__menu--float" role="group"
          aria-label="Filtri" :style="optsStyle"
          @click.stop @focusout="onOptsFocusout">
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
      <Pager v-if="total > 0" class="rep-relbar__pager"
        :page="page" :page-size="pageSize" :total="total"
        @update:page="page = $event" @update:page-size="pageSize = $event" />
    </div>
    <p v-if="total === 0" class="rep-empty">{{ query.trim() ? 'Nessun risultato.' : 'Nessuna relazione.' }}</p>
    <template v-else>
      <div class="rep-table-wrap rep-table--flush">
        <table class="rep-table">
          <thead>
            <tr>
              <th class="rep-table__num">#</th>
              <SortableTh col="name" :sort="sort" @sort="toggleSort">Nome</SortableTh>
              <SortableTh col="score" class="rep-col--right" :sort="sort" @sort="toggleSort">Rep.</SortableTh>
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
                    {{ $name(row.node.entity) }}
                    <Icon name="goto" />
                  </router-link>
                </span>
              </td>
              <td class="rep-col--right">
                <button type="button" class="ds-score ds-score--interactive"
                  :style="{ background: scoreColor(row.score) }"
                  :aria-label="`Registra transazione con ${$name(row.node.entity)}`"
                  @click.stop="emitTx(row.node.entity.id)">
                  {{ row.score }}
                </button>
              </td>
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
import { useSortable } from '../useSortable.js';
import { usePagedList } from '../usePagedList.js';
import Icon from './Icon.vue';
import Pager from './Pager.vue';
import SortableTh from './SortableTh.vue';
import HoverTip from './HoverTip.vue';

const pageSize = ref(10);

const props = defineProps({
  currentId: { type: String, required: true },
  direction: { type: String, required: true },
});

const emit = defineEmits(['open-tx']);

const { state } = useStore();
const ui = useUiState();

const query = ref('');

// Ordinamento colonne (stato locale). name/kind partono asc, score parte desc.
// Il reset a pagina 0 su ricerca/ordinamento è nel watch più in basso, dopo che
// la paginazione è stata creata. key: 'name' | 'kind' | 'score'.
const { sort, toggleSort } = useSortable({
  initial: { key: 'score', dir: 'desc' },
  descKeys: ['score'],
});

// Filtri righe + colonne opzionali, fusi in un unico dropdown (stile Odoo) in
// coda all'header: icona filtro, posizione della vecchia tendina colonne.
const hideEmpty = ref(false);
const hideCharacters = ref(false);
const hideGroups = ref(false);
const optsOpen = ref(false);
const optsBtn = ref(null);
const optsMenu = ref(null);
const optsStyle = ref(null);

// Stato non-default del menu: marca visivamente l'icona (un dot) così l'utente sa
// che righe/colonne sono filtrate anche a tendina chiusa.
const menuActive = computed(() =>
  hideEmpty.value || hideCharacters.value || hideGroups.value);

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

async function toggleOpts() {
  if (optsOpen.value) { closeOpts(); return; }
  optsStyle.value = floatStyle(optsBtn.value);
  optsOpen.value = true;
  await nextTick();
  focusFirst(optsMenu);
}

// Chiusura "intenzionale" (toggle, Esc): riporta il focus al bottone di apertura.
function closeOpts() {
  optsOpen.value = false;
  optsBtn.value?.focus();
}

// Chiusura "passiva" (click esterno, scroll, resize): non rubare il focus.
function closeMenus() {
  optsOpen.value = false;
}

// Tab fuori dal menu (es. oltre l'ultimo checkbox) → chiudi senza spostare il focus.
// NB: chiudiamo solo quando il focus va su un elemento reale fuori dal menu. Un blur
// senza relatedTarget (click sul testo della label, che non è focusabile) NON deve
// chiudere, altrimenti il toggle via stringa si annulla; al click davvero esterno
// pensa il listener su document.
function makeFocusout(menuRef, openRef) {
  return (e) => {
    const to = e.relatedTarget;
    if (!(to instanceof Node)) return;
    if (menuRef.value && menuRef.value.contains(to)) return;
    openRef.value = false;
  };
}
const onOptsFocusout = makeFocusout(optsMenu, optsOpen);

// Esc chiude il menu aperto e riporta il focus al suo trigger.
function onKeydown(e) {
  if (e.key !== 'Escape') return;
  if (optsOpen.value) closeOpts();
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

// Paginazione locale: clamp su totale che cala dentro il composable; qui resta
// il reset a pagina 0 quando cambiano ricerca o ordinamento.
const { page, offset, reset: resetPage, paginate } = usePagedList(total, pageSize);
watch([query, sort], resetPage);

const pageRows = computed(() => paginate(sortedRows.value));

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
/* Cella nome: glifo kind + link. Il glifo compare solo quando la colonna
   Tipo NON è visibile, così il dato personaggio/gruppo non si perde mai
   (toggle colonna off su desktop, oppure colonna nascosta su mobile). */
/* inline (non flex): così il link nome resta un box inline e l'evidenziazione
   su piu' righe segue il testo riga per riga (box-decoration-break: clone). */
.rep-name-cell { display: inline; }
.rep-kind-ico {
  display: inline-flex;
  vertical-align: -0.15em;
  margin-right: 0.4rem;
  color: var(--text-muted);
}
.rep-kind-ico :deep(svg) { width: 1em; height: 1em; }

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
.rep-relbar__pager { flex: none; }
.rep-relbar :deep(.rep-pager) { margin-block: 0; }

/* Bottone filtri: vive nella searchbar, a destra dell'input. Icon-button bordato
   accoppiato all'input (stesso bordo/raggio/altezza) → ricerca + filtro leggono
   come un unico gruppo di controlli, non un'icona che fluttua. */
.rep-col-opts__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;      /* altezza = input accanto */
  flex: none;
  aspect-ratio: 1;          /* quadrato: larghezza segue l'altezza */
  padding: 0.4rem;
  font-size: 1.2rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-faint);
  cursor: pointer;
  line-height: 1;
  transition: color var(--dur-fast), background var(--dur-fast), border-color var(--dur-fast);
}
.rep-col-opts__btn:hover {
  background: var(--surface-card);
  border-color: var(--border-strong);
  color: var(--text-strong);
}
.rep-col-opts__btn:focus-visible {
  outline: none; border-color: var(--gold-500); box-shadow: var(--shadow-focus);
}
/* filtri attivi: bordo oro + icona accento (oltre al dot), niente solo-colore */
.rep-col-opts__btn--active { color: var(--accent-text); border-color: var(--gold-500); }
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
/* NB: gli stili del popover (.rep-col-opts__menu e .rep-col-opts__item) sono in
   main.css (globali): il menu e' in Teleport su <body>, fuori dallo scope del
   componente, quindi lo stile scoped non lo raggiungerebbe. */

/* tap target adeguato su touch/stylus (44px raccomandati) */
@media (pointer: coarse) {
  .rep-col-opts__btn { min-width: 44px; min-height: 44px; }
}
</style>