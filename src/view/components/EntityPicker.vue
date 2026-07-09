<template>
  <div class="ep" :class="{ 'ep--filled': selected }">
    <span class="ep__label" :class="{ 'ds-sr-only': hideLabel }" :id="labelId">{{ label }}</span>

    <!-- Stato selezionato: gettone cliccabile (riapre la ricerca) + X per svuotare -->
    <div v-if="selected" class="ep__token">
      <button type="button" class="ep__token-main"
        :aria-label="`Cambia ${label.toLowerCase()}: ${$name(selected.entity)}`"
        @click="clear">
        <span class="ep__glyph" aria-hidden="true">
          <Icon :name="kindIcon(selected.kind)" />
        </span>
        <span class="ep__token-name">{{ $name(selected.entity) }}</span>
        <span v-if="ambiguous.has(selected.entity.id)" class="ds-idhint">#{{ ambiguous.get(selected.entity.id) }}</span>
        <span v-if="showKind" class="ds-badge ep__token-kind">{{ kindLabel(selected.kind) }}</span>
      </button>
      <button type="button" class="ep__clear" :aria-label="`Svuota ${label.toLowerCase()}`"
        @click="clear">
        <Icon name="close" />
      </button>
    </div>

    <!-- Stato ricerca: combobox -->
    <div v-else class="ep__field ds-search" @focusout="onFocusout">
      <span class="ds-search__icon" aria-hidden="true"><Icon name="search" /></span>
      <input
        ref="inputEl"
        class="ds-input ds-input--with-icon ep__input"
        type="text"
        role="combobox"
        :aria-labelledby="labelId"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined"
        autocomplete="off"
        :placeholder="placeholder"
        v-model="query"
        @focus="onFocus"
        @keydown="onKeydown" />

      <!-- Popup in top-layer (Teleport a body): sfugge a overflow:hidden/auto dei
           container (es. la tabella profilo). Posizione fixed calcolata dall'input. -->
      <Teleport to="body">
        <ul v-if="open" ref="listEl" :id="listId" class="ep__list" role="listbox"
          :aria-label="label" :style="listStyle">
          <li v-if="results.length === 0" class="ep__none" role="presentation">
            {{ query.trim() ? 'Nessun risultato.' : 'Nessuna entità disponibile.' }}
          </li>
          <template v-for="(item, i) in items" :key="itemKey(item, i)">
            <li v-if="item.sep" class="ep__sep" role="presentation" aria-hidden="true"></li>
            <li
              :id="`${listId}-opt-${i}`"
              class="ep__opt"
              :class="{ 'ep__opt--active': i === activeIndex, 'ep__opt--action': item.kind !== 'entity' }"
              role="option"
              :aria-selected="i === activeIndex"
              @mousedown.prevent="activate(item)"
              @mousemove="activeIndex = i">
              <template v-if="item.kind === 'entity'">
                <span class="ep__glyph" aria-hidden="true">
                  <Icon :name="kindIcon(item.node.kind)" />
                </span>
                <span class="ep__opt-name">{{ $name(item.node.entity) }}</span>
                <span v-if="ambiguous.has(item.node.entity.id)" class="ds-idhint">#{{ ambiguous.get(item.node.entity.id) }}</span>
                <span v-if="showKind" class="ep__opt-kind">{{ kindLabel(item.node.kind) }}</span>
              </template>
              <template v-else>
                <span class="ep__glyph" aria-hidden="true">
                  <Icon :name="item.kind === 'browse' ? 'list' : 'plus'" />
                </span>
                <span class="ep__action-label">{{ item.label }}</span>
              </template>
            </li>
          </template>
        </ul>
      </Teleport>
    </div>

    <!-- Dialog creazione entità (dalle righe "Aggiungi personaggio/gruppo"):
         crea e seleziona subito la nuova entità nel picker. -->
    <Teleport to="body">
      <div v-if="createOpen" class="ds-overlay" @click.self="closeCreate">
        <div ref="createDialogEl" class="ds-dialog ds-dialog--sm" role="dialog" aria-modal="true">
          <div class="ds-dialog__head">
            <h3 class="ds-dialog__title">{{ createKind === 'group' ? 'Aggiungi gruppo' : 'Aggiungi personaggio' }}</h3>
            <button class="ds-dialog__close" @click="closeCreate" aria-label="Chiudi">
              <Icon name="close" />
            </button>
          </div>
          <div class="ds-dialog__body">
            <form class="rep-addchar" @submit.prevent="confirmCreate">
              <span class="ds-field ds-field--block">
                <label class="ds-field__label" :for="`${uid}-cname`">
                  {{ createKind === 'group' ? 'Nome del gruppo' : 'Nome del personaggio' }}
                </label>
                <span class="ds-field__wrap">
                  <input :id="`${uid}-cname`" ref="createNameInput" class="ds-input" type="text"
                    :placeholder="createKind === 'group' ? 'Es. La Compagnia' : 'Es. Aragorn'"
                    v-model="createName" />
                </span>
              </span>
              <span v-if="createKind === 'group'" class="ds-field ds-field--block">
                <label class="ds-field__label" :for="`${uid}-ctype`">Tipo (opzionale)</label>
                <span class="ds-field__wrap">
                  <input :id="`${uid}-ctype`" class="ds-input" type="text"
                    placeholder="Es. fazione, città, gilda…" v-model="createType" />
                </span>
              </span>
            </form>
          </div>
          <div class="ds-dialog__foot">
            <button class="ds-btn ds-btn--ghost" @click="closeCreate">Annulla</button>
            <button class="ds-btn ds-btn--primary" :disabled="!createName.trim()" @click="confirmCreate">
              Aggiungi
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Dialog "Vedi tutti": elenco completo, ricercabile, per scegliere quando i
         5 in evidenza non bastano. -->
    <Teleport to="body">
      <div v-if="browseOpen" class="ds-overlay" @click.self="closeBrowse">
        <div ref="browseDialogEl" class="ds-dialog ds-dialog--md ep-browse" role="dialog" aria-modal="true"
          :aria-label="`Scegli ${label.toLowerCase()}`">
          <div class="ds-dialog__head">
            <h3 class="ds-dialog__title">Scegli {{ label.toLowerCase() }}</h3>
            <button class="ds-dialog__close" @click="closeBrowse" aria-label="Chiudi">
              <Icon name="close" />
            </button>
          </div>
          <div class="ds-dialog__body">
            <span class="ds-search ep-browse__search">
              <span class="ds-search__icon" aria-hidden="true"><Icon name="search" /></span>
              <input ref="browseInput" class="ds-input ds-input--with-icon" type="text"
                placeholder="Cerca per nome…" v-model="browseQuery" @keydown.esc.prevent="closeBrowse" />
            </span>
            <ul class="ep-browse__list" role="listbox" :aria-label="label">
              <li v-if="browseResults.length === 0" class="ep__none">Nessun risultato.</li>
              <li v-for="node in browseResults" :key="node.entity.id">
                <button type="button" class="ep-browse__opt" @click="chooseFromBrowse(node)">
                  <span class="ep__glyph" aria-hidden="true"><Icon :name="kindIcon(node.kind)" /></span>
                  <span class="ep__opt-name">{{ $name(node.entity) }}</span>
                  <span v-if="ambiguous.has(node.entity.id)" class="ds-idhint">#{{ ambiguous.get(node.entity.id) }}</span>
                  <span v-if="showKind" class="ep__opt-kind">{{ kindLabel(node.kind) }}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, useId, nextTick, onBeforeUnmount } from 'vue';
import { useStore } from '../useStore.js';
import { listActiveCharacters, listActiveGroups, resolveNode, addCharacter, addGroup } from '../../model/reputation.js';
import { ambiguousIds } from '../disambiguation.js';
import { kindIcon, kindLabel } from '../entityKind.js';
import { useDialog } from '../useDialog.js';
import { useListNav } from '../useListNav.js';
import { placeInViewport } from '../anchoring.js';
import Icon from './Icon.vue';

// Selettore riusabile di UNA entità (personaggio o gruppo) su tutti gli attivi.
// Combobox accessibile: ricerca → lista opzioni → gettone selezionato.
const props = defineProps({
  modelValue: { type: String, default: null }, // id selezionato, o null
  label: { type: String, required: true },
  placeholder: { type: String, default: 'Cerca nome…' },
  excludeId: { type: String, default: null }, // id da nascondere (l'altra scelta)
  only: { type: Array, default: null }, // se valorizzato, restringe le scelte a questi id
  hideLabel: { type: Boolean, default: false }, // etichetta solo per screen reader (contesti compatti)
  // Estensioni opzionali (usate in Faccia a faccia): lista corta in evidenza +
  // righe azione. Off di default: le altre schermate restano combobox semplice.
  maxResults: { type: Number, default: null }, // cap dei risultati in evidenza (null = tutti)
  allowCreate: { type: Boolean, default: false }, // righe "Aggiungi personaggio/gruppo"
  browseAll: { type: Boolean, default: false }, // riga "Vedi tutti (N)" quando la lista è tagliata
});

const emit = defineEmits(['update:modelValue']);

const { state, dispatch } = useStore();

const uid = useId();
const labelId = `${uid}-label`;
const listId = `${uid}-list`;

const query = ref('');
const open = ref(false);
const inputEl = ref(null);
const listEl = ref(null);
const listStyle = ref({});
const createDialogEl = ref(null);
const browseDialogEl = ref(null);

// Allowlist di id: null = nessun vincolo (tutte le entità attive).
const onlySet = computed(() => (props.only ? new Set(props.only) : null));

// Tutti i nodi selezionabili: personaggi + gruppi attivi, con il proprio kind.
const nodes = computed(() => {
  const chars = listActiveCharacters(state.value).map((entity) => ({ kind: 'character', entity }));
  const groups = listActiveGroups(state.value).map((entity) => ({ kind: 'group', entity }));
  let all = [...chars, ...groups];
  if (onlySet.value) all = all.filter((node) => onlySet.value.has(node.entity.id));
  return all;
});

// Badge di tipo (Personaggio/Gruppo) utile solo se la lista mescola i due kind.
// Con `only` che restringe a un solo tipo diventa ridondante col glifo: lo nascondo.
const showKind = computed(() => {
  const kinds = new Set(nodes.value.map((node) => node.kind));
  const isMixed = kinds.size > 1;
  return isMixed;
});

// Coda-id per gli omonimi (stesso tipo + stesso nome): mostrata solo quando serve.
const ambiguous = computed(() => {
  const list = nodes.value.map((n) => ({ id: n.entity.id, name: n.entity.name, kind: n.kind }));
  const map = ambiguousIds(list);
  return map;
});

// Filtra per `needle` ed ordina per rilevanza: prefisso prima, poi sottostringa,
// poi alfabetico. Riusata dal combobox e dal dialog "Vedi tutti".
function rankNodes(needleRaw) {
  const needle = needleRaw.trim().toLowerCase();
  const filtered = nodes.value.filter((node) => {
    if (node.entity.id === props.excludeId) return false;
    if (needle && !node.entity.name.toLowerCase().includes(needle)) return false;
    return true;
  });
  const sorted = filtered.slice().sort((a, b) => {
    if (needle) {
      const ap = a.entity.name.toLowerCase().startsWith(needle) ? 0 : 1;
      const bp = b.entity.name.toLowerCase().startsWith(needle) ? 0 : 1;
      if (ap !== bp) return ap - bp;
    }
    return a.entity.name.localeCompare(b.entity.name);
  });
  return sorted;
}

// Tutti i match ordinati; `results` è la porzione mostrata (cap a maxResults).
const allMatches = computed(() => rankNodes(query.value));
const results = computed(() => {
  const cap = props.maxResults;
  const shown = cap ? allMatches.value.slice(0, cap) : allMatches.value;
  return shown;
});
const truncated = computed(() => allMatches.value.length > results.value.length);

// Voci navigabili del popup: opzioni entità + eventuali righe azione in coda.
const items = computed(() => {
  const list = results.value.map((node) => ({ kind: 'entity', node }));
  const actions = [];
  if (props.allowCreate) {
    const q = query.value.trim();
    actions.push({ kind: 'create', createKind: 'character', label: q ? `Crea «${q}»` : 'Aggiungi personaggio' });
    actions.push({ kind: 'create', createKind: 'group', label: q ? `Crea gruppo «${q}»` : 'Aggiungi gruppo' });
  }
  if (props.browseAll && truncated.value) {
    actions.push({ kind: 'browse', label: `Vedi tutti (${allMatches.value.length})` });
  }
  if (actions.length) actions[0].sep = true; // primo action → separatore in cima
  return [...list, ...actions];
});

function itemKey(item, i) {
  if (item.kind === 'entity') return item.node.entity.id;
  const key = `${item.kind}-${item.createKind || ''}-${i}`;
  return key;
}

// Frecce + Invio dal composable condiviso con InlineSelect e Many2ManyField:
// una sola grammatica di tastiera per tutte le liste di opzioni dell'app.
const { activeIndex, reset, onKeydown: onListKey } = useListNav({
  count: () => items.value.length,
  onPick: (index) => activate(items.value[index]),
  container: listEl,
  itemSelector: '.ep__opt',
});

const selected = computed(() => {
  if (!props.modelValue) return null;
  const node = resolveNode(state.value, props.modelValue);
  return node;
});

function choose(node) {
  emit('update:modelValue', node.entity.id);
  query.value = '';
  open.value = false;
}

// Attiva la voce sotto il cursore/tastiera: entità → seleziona; azione → dialog.
function activate(item) {
  if (item.kind === 'entity') { choose(item.node); return; }
  if (item.kind === 'create') { openCreate(item.createKind); return; }
  if (item.kind === 'browse') { openBrowse(); return; }
}

async function clear() {
  emit('update:modelValue', null);
  query.value = '';
  await nextTick();
  inputEl.value?.focus();
  open.value = true;
}

// --- Creazione entità in loco -------------------------------------------------
const createOpen = ref(false);
const createKind = ref('character'); // 'character' | 'group'
const createName = ref('');
const createType = ref('');
const createNameInput = ref(null);

function openCreate(kind) {
  createKind.value = kind;
  createName.value = query.value.trim(); // pre-compila col testo cercato
  createType.value = '';
  open.value = false;
  createOpen.value = true;
}

function closeCreate() {
  createOpen.value = false;
  createName.value = '';
  createType.value = '';
}

function confirmCreate() {
  const name = createName.value.trim();
  if (!name) return;
  const kind = createKind.value;
  // Diff prima/dopo per ricavare l'id appena creato (il MODEL genera l'uuid):
  // dispatch è sincrono, quindi `state` è già aggiornato dopo la chiamata.
  const listBefore = kind === 'group' ? listActiveGroups(state.value) : listActiveCharacters(state.value);
  const before = new Set(listBefore.map((e) => e.id));
  if (kind === 'group') dispatch((s) => addGroup(s, name, createType.value.trim()));
  else dispatch((s) => addCharacter(s, name));
  const listAfter = kind === 'group' ? listActiveGroups(state.value) : listActiveCharacters(state.value);
  const created = listAfter.find((e) => !before.has(e.id));
  if (created) emit('update:modelValue', created.id); // seleziona subito la nuova entità
  closeCreate();
}

useDialog({
  isOpen: () => createOpen.value,
  onClose: closeCreate,
  container: createDialogEl,
  onOpen: () => createNameInput.value?.focus(),
});

// --- "Vedi tutti": elenco completo in un dialog -------------------------------
const browseOpen = ref(false);
const browseQuery = ref('');
const browseInput = ref(null);

const browseResults = computed(() => rankNodes(browseQuery.value));

function openBrowse() {
  browseQuery.value = query.value.trim();
  open.value = false;
  browseOpen.value = true;
}

function closeBrowse() {
  browseOpen.value = false;
}

function chooseFromBrowse(node) {
  choose(node);
  closeBrowse();
}

useDialog({
  isOpen: () => browseOpen.value,
  onClose: closeBrowse,
  container: browseDialogEl,
  onOpen: () => browseInput.value?.focus(),
});

// Su puntatore grossolano la tastiera software copre il fondo del viewport: porto
// l'input verso l'alto così la lista sottostante resta visibile, e il ritardo dà
// tempo alla tastiera di comparire. Col mouse non esiste nessuna tastiera da
// schivare: lo scroll automatico strapperebbe solo la pagina sotto al cursore,
// 300ms dopo, mentre l'utente sta già digitando.
function onFocus() {
  open.value = true;
  const el = inputEl.value;
  if (!el) return;
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const scrollIntoView = () => el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  setTimeout(scrollIntoView, 300);
}

function onKeydown(e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') open.value = true;
  if (onListKey(e)) return;
  if (e.key === 'Escape' && open.value) {
    e.preventDefault();
    open.value = false;
  }
}

// Chiusura quando il focus lascia il campo (Tab fuori, click esterno reale).
function onFocusout(e) {
  const to = e.relatedTarget;
  if (to instanceof Node && e.currentTarget.contains(to)) return;
  open.value = false;
}

// La query che cambia riporta l'evidenziazione in testa alla lista e, cambiando
// l'altezza del popup, ne aggiorna la posizione (per l'apertura verso l'alto).
watch(query, async () => {
  reset();
  if (open.value) { await nextTick(); positionList(); }
});

// Popup teleportato a body: posizione `fixed` ancorata all'input, dallo stesso
// helper degli altri popover (clamp orizzontale + flip verticale). La lista è
// larga esattamente quanto l'input: `minWidth` = larghezza del campo, e il CSS
// non le lascia superare quella misura.
const LIST_MAX = 320; // ~20rem, coerente con max-height del CSS
function positionList() {
  const el = inputEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const style = placeInViewport(el, listEl.value, {
    gap: 4, cap: LIST_MAX, minWidth: rect.width,
  });
  // La lista resta larga quanto il campo (non si allarga sui nomi lunghi: quelli
  // vanno in ellissi). `minWidth` dall'helper è già clampata al viewport.
  style.width = style.minWidth;
  listStyle.value = style;
}

function onViewportChange() {
  if (open.value) positionList();
}

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    positionList();
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
  } else {
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onViewportChange, true);
  window.removeEventListener('resize', onViewportChange);
});
</script>

<style scoped>
.ep {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.ep__label {
  font-family: var(--font-display);
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--accent-text);
}
/* Contesti compatti (es. add-row in tabella): etichetta solo per screen reader
   → utility .ds-sr-only. Il campo ricerca usa .ds-search (icona a sinistra). */

/* scroll-margin: riserva lo spazio dell'header sticky quando scrollIntoView porta su l'input. */
.ep__input { scroll-margin-top: 5rem; }

.ep__list {
  position: fixed;
  z-index: var(--z-popover);
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  max-height: 20rem;
  overflow-y: auto;
  background: var(--paper-0);
  border: 1px solid var(--line-gold);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  transform-origin: top center;
  animation: ep-pop 150ms var(--ease-out);
}
@keyframes ep-pop {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
.ep__none {
  padding: var(--space-3);
  color: var(--text-muted);
  font-size: var(--fs-sm);
}
.ep__opt {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.35rem 0.6rem;
  line-height: 1.35;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--dur-fast);
}
.ep__opt--active { background: var(--accent-tint); }
.ep__opt-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-body);
}
.ep__opt-kind {
  flex: none;
  font-size: var(--fs-xs);
  color: var(--text-muted);
}
/* Coda-id per omonimi (#) → utility .ds-idhint. */

/* Separatore tra opzioni entità e righe azione (crea / vedi tutti). */
.ep__sep {
  height: 1px;
  margin: 0.2rem 0;
  padding: 0;
  background: var(--line-gold);
}

/* Righe azione: voce "link" in oro, distinta dai risultati entità. Un filo più
   piccola dei nomi (glifo 1em → scala insieme). */
.ep__opt--action { font-size: var(--fs-sm); }
.ep__opt--action .ep__glyph { color: var(--gold-600); }
.ep__opt--action.ep__opt--active .ep__glyph { color: var(--accent-text); }
.ep__action-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--fw-medium);
  color: var(--gold-700);
}

/* Glifo kind (personaggio/gruppo) */
.ep__glyph {
  flex: none;
  display: inline-flex;
  color: var(--text-muted);
}
.ep__opt--active .ep__glyph { color: var(--accent-text); }

/* Gettone selezionato */
.ep__token {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  /* Padding verticale = ds-input (0.55rem): il gettone selezionato ha la stessa
     altezza del campo di ricerca, così passando da ricerca → selezione il campo
     non cresce. Il target touch 44px torna solo su puntatore grossolano (come
     fa l'input stesso). */
  padding: 0.55rem 0.6rem 0.55rem 0.7rem;
  /* line-height come l'input (normal, non l'1.5 del corpo): stessa altezza di
     riga → stessa altezza del campo. */
  line-height: normal;
  background: var(--surface-card);
  border: 1px solid var(--line-gold);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  animation: ep-fade 150ms var(--ease-out);
}
@keyframes ep-fade {
  from { opacity: 0; transform: translateY(-2px); }
  to   { opacity: 1; transform: none; }
}
.ep--filled .ep__token { border-color: var(--accent); }
.ep__token .ep__glyph { color: var(--accent-text); }

/* Corpo del gettone come bottone invisibile: cliccarlo riapre la ricerca. */
.ep__token-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.ep__token-main:hover .ep__token-name {
  color: var(--accent-text);
  text-decoration: underline;
}
.ep__token-main:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}
.ep__token-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--fw-medium);
  color: var(--text-strong);
}
.ep__token-kind { flex: none; }
.ep__clear {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Altezza contenuta entro la riga di testo: non deve gonfiare il gettone oltre
     l'altezza dell'input. Il target comodo torna su touch (regola coarse sotto). */
  width: 26px;
  height: 22px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--dur-fast), background var(--dur-fast);
}
.ep__clear:hover { background: var(--surface-panel); color: var(--danger); }
.ep__clear:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

@media (pointer: coarse) {
  .ep__clear { width: 40px; height: 40px; }
  .ep__token { min-height: 44px; }
}

@media (prefers-reduced-motion: reduce) {
  .ep__list, .ep__token { animation: none; }
}

/* Mobile: via il badge tipo nel gettone (il glifo già indica personaggio/gruppo),
   così il nome selezionato ha spazio e non si tronca. */
@media (max-width: 640px) {
  .ep__token-kind { display: none; }
}

/* --- Dialog "Vedi tutti" --------------------------------------------------- */
.ep-browse__search { display: block; margin-bottom: var(--space-3); }
.ep-browse__search .ds-input { width: 100%; }
.ep-browse__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 50vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ep-browse__opt {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 0.55rem 0.6rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  color: var(--text-body);
  text-align: left;
  cursor: pointer;
  transition: background var(--dur-fast);
}
.ep-browse__opt:hover { background: var(--accent-tint); }
.ep-browse__opt:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
</style>
