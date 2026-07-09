<template>
  <div>
    <div class="rep-relbar">
      <div class="rep-searchbar">
      <div class="rep-search ds-search">
        <span class="ds-search__icon"><Icon name="search" /></span>
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
          <label class="ds-check">
            <input class="ds-check__input" type="checkbox" v-model="hideEmpty" />
            <span class="ds-check__box" aria-hidden="true"></span>
            <span>Nascondi righe senza interazioni</span>
          </label>
          <label class="ds-check">
            <input class="ds-check__input" type="checkbox" v-model="hideCharacters" />
            <span class="ds-check__box" aria-hidden="true"></span>
            <span>Nascondi personaggi</span>
          </label>
          <label class="ds-check">
            <input class="ds-check__input" type="checkbox" v-model="hideGroups" />
            <span class="ds-check__box" aria-hidden="true"></span>
            <span>Nascondi gruppi</span>
          </label>
        </div>
      </Teleport>
      </div>
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
            <tr v-for="(row, i) in sortedRows" :key="row.node.kind + '-' + row.node.entity.id"
              class="rep-table__row--clickable"
              @click="emitTx(row.node.entity.id)">

              <td class="rep-table__num">{{ i + 1 }}</td>
              <td>
                <span class="rep-name-cell">
                  <span class="rep-kind-ico" role="img" :aria-label="kindLabel(row.node.kind)"
                    :title="kindLabel(row.node.kind)">
                    <Icon :name="kindIcon(row.node.kind)" />
                  </span>
                  <router-link class="rep-table__name"
                    :to="entityRouteTo(row.node.kind, row.node.entity.id)" @click.stop>
                    {{ $name(row.node.entity) }}
                    <Icon name="goto" />
                  </router-link>
                </span>
              </td>
              <td class="rep-col--right">
                <ScoreChip :score="row.score" interactive
                  :aria-label="`Registra transazione con ${$name(row.node.entity)}`"
                  @click.stop="emitTx(row.node.entity.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from '../useStore.js';
import { useUiState } from '../useUiState.js';
import { listActiveCharacters, listActiveGroups, computeScore, hasTransaction } from '../../model/reputation.js';
import { useSortable } from '../useSortable.js';
import { useAnchoredMenu } from '../useAnchoredMenu.js';
import { kindIcon, kindLabel, entityRouteTo } from '../entityKind.js';
import Icon from './Icon.vue';
import SortableTh from './SortableTh.vue';
import HoverTip from './HoverTip.vue';
import ScoreChip from './ScoreChip.vue';

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
const optsBtn = ref(null);
const optsMenu = ref(null);

// Stato non-default del menu: marca visivamente l'icona (un dot) così l'utente sa
// che righe/colonne sono filtrate anche a tendina chiusa.
const menuActive = computed(() =>
  hideEmpty.value || hideCharacters.value || hideGroups.value);

// Dropdown "Filtri" (Teleport su <body>): apertura/chiusura, posizione ancorata
// al bordo destro del bottone, dismiss su click esterno/scroll/resize ed Esc dal
// composable. Focus alla prima checkbox (input) all'apertura.
const { open: optsOpen, popStyle: optsStyle, closePassive, toggle: toggleOpts } =
  useAnchoredMenu(optsBtn, optsMenu, { focusSelector: 'input' });

// Tab fuori dal menu (oltre l'ultimo checkbox) → chiudi senza spostare il focus.
// Chiudiamo solo quando il focus va su un elemento reale fuori dal menu; un blur
// senza relatedTarget (click sul testo della label, non focusabile) non chiude.
function onOptsFocusout(e) {
  const to = e.relatedTarget;
  if (!(to instanceof Node)) return;
  if (optsMenu.value && optsMenu.value.contains(to)) return;
  closePassive();
}

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

function emitTx(otherId) {
  const pair = props.direction === 'in'
    ? { fromId: otherId, toId: props.currentId }
    : { fromId: props.currentId, toId: otherId };
  emit('open-tx', pair);
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

/* Punteggio = ScoreChip interattivo (<button>): reset e focus-ring nel DS globale. */

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
/* .rep-search dà solo il sizing nella searchbar; icona e posizione da .ds-search. */
.rep-search {
  flex: 1;
  min-width: 0;
  color: var(--text-muted);
}
/* Nessun override del placeholder: vale il globale (--text-muted, AA). */

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
  opacity: .6;
  cursor: pointer;
  line-height: 1;
  transition: color var(--dur-fast), background var(--dur-fast), border-color var(--dur-fast), opacity var(--dur-fast);
}
.rep-col-opts__btn:hover {
  background: var(--surface-card);
  border-color: var(--border-strong);
  color: var(--text-strong);
  opacity: 1;
}
.rep-col-opts__btn--active { opacity: 1; }
.rep-col-opts__btn:focus-visible {
  outline: none; border-color: var(--gold-500); box-shadow: var(--shadow-focus); opacity: 1;
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
/* NB: lo stile del popover (.rep-col-opts__menu) e delle sue voci (.ds-check) sta
   in main.css (globale): il menu e' in Teleport su <body>, fuori dallo scope del
   componente, quindi lo stile scoped non lo raggiungerebbe. */

/* tap target adeguato su touch/stylus (44px raccomandati) */
@media (pointer: coarse) {
  .rep-col-opts__btn { min-width: 44px; min-height: 44px; }
}
</style>