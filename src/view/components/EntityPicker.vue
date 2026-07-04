<template>
  <div class="ep" :class="{ 'ep--filled': selected }">
    <span class="ep__label" :class="{ 'ep__label--sr': hideLabel }" :id="labelId">{{ label }}</span>

    <!-- Stato selezionato: gettone cliccabile (riapre la ricerca) + X per svuotare -->
    <div v-if="selected" class="ep__token">
      <button type="button" class="ep__token-main"
        :aria-label="`Cambia ${label.toLowerCase()}: ${$name(selected.entity)}`"
        @click="clear">
        <span class="ep__glyph" aria-hidden="true">
          <Icon :name="selected.kind === 'group' ? 'users' : 'user'" />
        </span>
        <span class="ep__token-name">{{ $name(selected.entity) }}</span>
        <span v-if="ambiguous.has(selected.entity.id)" class="ep__hint">#{{ ambiguous.get(selected.entity.id) }}</span>
        <span v-if="showKind" class="ds-badge ep__token-kind">{{ kindLabel(selected.kind) }}</span>
      </button>
      <button type="button" class="ep__clear" :aria-label="`Svuota ${label.toLowerCase()}`"
        @click="clear">
        <Icon name="close" />
      </button>
    </div>

    <!-- Stato ricerca: combobox -->
    <div v-else class="ep__field" @focusout="onFocusout">
      <span class="ep__search-ico" aria-hidden="true"><Icon name="search" /></span>
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
          <li
            v-for="(node, i) in results"
            :key="node.entity.id"
            :id="`${listId}-opt-${i}`"
            class="ep__opt"
            :class="{ 'ep__opt--active': i === activeIndex }"
            role="option"
            :aria-selected="i === activeIndex"
            @mousedown.prevent="choose(node)"
            @mousemove="activeIndex = i">
            <span class="ep__glyph" aria-hidden="true">
              <Icon :name="node.kind === 'group' ? 'users' : 'user'" />
            </span>
            <span class="ep__opt-name">{{ $name(node.entity) }}</span>
            <span v-if="ambiguous.has(node.entity.id)" class="ep__hint">#{{ ambiguous.get(node.entity.id) }}</span>
            <span v-if="showKind" class="ep__opt-kind">{{ kindLabel(node.kind) }}</span>
          </li>
        </ul>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, useId, nextTick, onBeforeUnmount } from 'vue';
import { useStore } from '../useStore.js';
import { listActiveCharacters, listActiveGroups, resolveNode } from '../../model/reputation.js';
import { ambiguousIds } from '../disambiguation.js';
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
});

const emit = defineEmits(['update:modelValue']);

const { state } = useStore();

const uid = useId();
const labelId = `${uid}-label`;
const listId = `${uid}-list`;

const query = ref('');
const open = ref(false);
const activeIndex = ref(0);
const inputEl = ref(null);
const listEl = ref(null);
const listStyle = ref({});

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

const results = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const filtered = nodes.value.filter((node) => {
    if (node.entity.id === props.excludeId) return false;
    if (needle && !node.entity.name.toLowerCase().includes(needle)) return false;
    return true;
  });
  return filtered;
});

const selected = computed(() => {
  if (!props.modelValue) return null;
  const node = resolveNode(state.value, props.modelValue);
  return node;
});

function kindLabel(kind) {
  const label = kind === 'group' ? 'Gruppo' : 'Personaggio';
  return label;
}

function choose(node) {
  emit('update:modelValue', node.entity.id);
  query.value = '';
  open.value = false;
}

async function clear() {
  emit('update:modelValue', null);
  query.value = '';
  await nextTick();
  inputEl.value?.focus();
  open.value = true;
}

// Al focus (specie mobile) la tastiera copre il fondo del viewport: porto
// l'input verso l'alto così la lista sottostante resta visibile. Il ritardo
// dà tempo alla tastiera di comparire e ridurre l'area utile.
function onFocus() {
  open.value = true;
  const el = inputEl.value;
  if (!el) return;
  const scrollIntoView = () => el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  setTimeout(scrollIntoView, 300);
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    open.value = true;
    if (results.value.length) activeIndex.value = (activeIndex.value + 1) % results.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    open.value = true;
    if (results.value.length) {
      activeIndex.value = (activeIndex.value - 1 + results.value.length) % results.value.length;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const node = results.value[activeIndex.value];
    if (node) choose(node);
  } else if (e.key === 'Escape') {
    if (open.value) {
      e.preventDefault();
      open.value = false;
    }
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
  activeIndex.value = 0;
  if (open.value) { await nextTick(); positionList(); }
});

// Popup teleportato a body: posizione `fixed` calcolata dal box dell'input.
// Apre verso il basso; se sotto non c'è spazio sufficiente, apre verso l'alto.
const LIST_MAX = 272; // ~17rem, coerente con max-height del CSS
function positionList() {
  const el = inputEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceBelow < LIST_MAX && rect.top > spaceBelow;
  const style = { left: `${rect.left}px`, width: `${rect.width}px` };
  if (openUp) style.bottom = `${window.innerHeight - rect.top + 4}px`;
  else style.top = `${rect.bottom + 4}px`;
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
/* Contesti compatti (es. add-row in tabella): etichetta solo per screen reader. */
.ep__label--sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* Campo di ricerca + lista */
.ep__field { position: relative; }
.ep__search-ico {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-faint);
  z-index: 1;
}
/* scroll-margin: riserva lo spazio dell'header sticky quando scrollIntoView porta su l'input. */
.ep__input { width: 100%; scroll-margin-top: 5rem; }

.ep__list {
  position: fixed;
  z-index: 1000;
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  max-height: 17rem;
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
  padding: 0.5rem 0.6rem;
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
/* Coda-id per omonimi: de-enfatizzata, monospazio numerico. */
.ep__hint {
  flex: none;
  font-size: var(--fs-xs);
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
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
  padding: 0.5rem 0.6rem 0.5rem 0.7rem;
  min-height: 44px;
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
  width: 30px;
  height: 30px;
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
}

@media (prefers-reduced-motion: reduce) {
  .ep__list, .ep__token { animation: none; }
}

/* Mobile: via il badge tipo nel gettone (il glifo già indica personaggio/gruppo),
   così il nome selezionato ha spazio e non si tronca. */
@media (max-width: 640px) {
  .ep__token-kind { display: none; }
}
</style>
