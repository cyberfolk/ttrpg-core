<template>
  <!-- Dropdown single-select custom: trigger stilato + popover teleportato con
       opzioni stilate (hover oro, selezionata marcata). Rimpiazza il <select>
       nativo, la cui lista opzioni non e' stilabile via CSS.
       Con `creatable`: campo di ricerca in testa + riga "Crea «...»" (etichetta libera). -->
  <div class="isel" :class="{ 'isel--open': open }">
    <button ref="trigger" type="button" class="isel__trigger" :class="{ 'isel__trigger--flush': flush }"
      :aria-label="ariaLabel" aria-haspopup="listbox" :aria-expanded="open"
      @click.stop="toggle" @keydown="onTriggerKey">
      <span class="isel__val">{{ displayLabel }}</span>
      <svg class="isel__chev" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="open" ref="pop" class="isel__pop" tabindex="-1" :style="popStyle"
        @click.stop @keydown="onKey">
        <div v-if="creatable" class="isel__search">
          <input ref="searchInput" v-model="query" type="text" class="isel__search-input"
            :placeholder="searchPlaceholder" :aria-label="ariaLabel" @input="reset()" />
        </div>
        <ul class="isel__opts" role="listbox" :aria-label="ariaLabel">
          <li v-for="(o, i) in shown" :key="optValue(o)">
            <button type="button" class="isel__opt" role="option"
              :aria-selected="optValue(o) === modelValue"
              :class="{ 'is-sel': optValue(o) === modelValue, 'is-active': i === activeIndex }"
              @click="choose(o)" @mousemove="activeIndex = i">
              <span class="isel__opt-label">{{ optLabel(o) }}</span>
              <svg v-if="optValue(o) === modelValue" class="isel__opt-check" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6.5 L5 9 L9.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </li>
          <li v-if="canCreate">
            <button type="button" class="isel__opt isel__opt--create" role="option"
              :class="{ 'is-active': activeIndex === shown.length }"
              @click="createValue" @mousemove="activeIndex = shown.length">
              <span class="isel__opt-label">Crea «<strong>{{ query.trim() }}</strong>»</span>
            </button>
          </li>
          <li v-if="!shown.length && !canCreate" class="isel__opt-empty">Nessun risultato</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { placeInViewport } from '../anchoring.js';
import { useDismiss } from '../useDismiss.js';
import { useListNav } from '../useListNav.js';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  ariaLabel: { type: String, default: '' },
  // Rientro a filo del valore in lettura (usato per i campi inline della testata).
  flush: { type: Boolean, default: false },
  // Apre subito il popover al montaggio (flusso "click sul valore -> apri").
  autoOpen: { type: Boolean, default: false },
  // Ricerca + "Crea «...»": la selezione può essere un'opzione o un valore digitato.
  creatable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'cerca o crea…' },
  // Quando le opzioni sono oggetti {id,name}: la selezione emette l'id, non la label.
  optionValue: { type: String, default: '' }, // es. 'id' → opzione oggetto
  optionLabel: { type: String, default: '' },  // es. 'name'
});
const emit = defineEmits(['update:modelValue', 'close', 'create']);

const open = ref(false);
const query = ref('');
const popStyle = ref(null);
const trigger = ref(null);
const pop = ref(null);
const searchInput = ref(null);

function optValue(o) {
  const v = props.optionValue ? o[props.optionValue] : o;
  return v;
}
function optLabel(o) {
  const l = props.optionLabel ? o[props.optionLabel] : o;
  return l;
}
// Con optionValue: modelValue è un id → mostra la label cercandola nel pool.
const displayLabel = computed(() => {
  if (!props.optionValue) return props.modelValue;
  const found = props.options.find((o) => optValue(o) === props.modelValue);
  const label = found ? optLabel(found) : '';
  return label;
});

// Opzioni mostrate: filtrate per query solo in modalità creatable.
const shown = computed(() => {
  if (!props.creatable) return props.options;
  const q = query.value.trim().toLowerCase();
  const filtered = q ? props.options.filter((o) => String(optLabel(o)).toLowerCase().includes(q)) : props.options;
  return filtered;
});
// "Crea …" quando c'è testo e nessuna opzione con quel nome esatto.
const canCreate = computed(() => {
  if (!props.creatable) return false;
  const q = query.value.trim();
  if (!q) return false;
  const exists = props.options.some((o) => String(optLabel(o)).toLowerCase() === q.toLowerCase());
  return !exists;
});

// Navigazione da tastiera (frecce + Invio) dal composable condiviso: la voce
// "Crea «…»" siede in coda alle opzioni mostrate, quindi ha indice `shown.length`.
const { activeIndex, reset, scrollActiveIntoView, onKeydown: onListKey } = useListNav({
  count: () => shown.value.length + (canCreate.value ? 1 : 0),
  onPick: (index) => {
    if (canCreate.value && index === shown.value.length) createValue();
    else choose(shown.value[index]);
  },
  container: pop,
  itemSelector: '.isel__opt',
});

function anchor() {
  const rect = trigger.value.getBoundingClientRect();
  popStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
  };
}
async function openMenu() {
  query.value = '';
  const idx = props.options.findIndex((o) => optValue(o) === props.modelValue);
  reset(props.creatable ? 0 : Math.max(idx, 0));
  anchor();
  open.value = true;
  await nextTick();
  // Clampa/flip entro il viewport (helper condiviso): niente clipping a destra
  // (mobile) né in basso quando il campo è in fondo alla pagina.
  popStyle.value = placeInViewport(trigger.value, pop.value, {
    minWidth: trigger.value.getBoundingClientRect().width,
  });
  if (props.creatable) searchInput.value?.focus();
  else pop.value?.focus();
  scrollActiveIntoView();
}
// `restoreFocus`: chiusura intenzionale (Esc, scelta, toggle) → il focus torna al
// trigger. Chiusura passiva (click esterno, scroll) → il focus resta dov'è andato.
function closeMenu(restoreFocus = false) {
  if (!open.value) return;
  open.value = false;
  if (restoreFocus) trigger.value?.focus();
  emit('close');
}
function toggle() {
  if (open.value) closeMenu(true);
  else openMenu();
}
function choose(o) {
  if (o == null) return;
  emit('update:modelValue', optValue(o));
  closeMenu(true);
}
function createValue() {
  const name = query.value.trim();
  if (!name) return;
  if (props.optionValue) {
    // pool-backed: il parent crea l'entità e setta il riferimento.
    emit('create', name);
  } else {
    emit('update:modelValue', name);
    emit('create', name);
  }
  closeMenu(true);
}
function onTriggerKey(e) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault();
    if (!open.value) openMenu();
  }
}
function onKey(e) {
  if (onListKey(e)) return;
  if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
}

// Chiusura su click esterno / scroll / resize (composable condiviso). Lo scroll
// dentro il popover non chiude (scrollGuard). Esc è gestito localmente in onKey.
// Chiusura passiva: niente focus restore (il focus è già andato dove voleva).
useDismiss(() => open.value, () => closeMenu(false), { scrollGuard: pop });
onMounted(() => { if (props.autoOpen) openMenu(); });
</script>

<style scoped>
/* flex:none → non si comprime nella riga flex: il trigger mostra il valore intero. */
.isel { display: inline-flex; flex: none; min-width: 0; }
.isel__trigger {
  box-sizing: border-box; height: 1.7rem;
  display: inline-flex; align-items: center; gap: .5rem;
  font-family: var(--font-sans); font-size: var(--fs-body); font-weight: var(--fw-semibold);
  line-height: 1.4; color: var(--text-strong); text-align: left;
  background: var(--surface-card); border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm); padding: 0 .5rem; cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.isel__trigger--flush { margin-left: -.35rem; padding-left: .35rem; }
.isel__trigger:hover { border-color: var(--gold-500); }
.isel--open .isel__trigger,
.isel__trigger:focus-visible { outline: none; border-color: var(--gold-500); box-shadow: var(--shadow-focus); }
.isel__val { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.isel__chev { width: .65rem; height: .65rem; margin-left: auto; flex: 0 0 auto; color: var(--gold-700); transition: transform .15s; }
.isel--open .isel__chev { transform: rotate(180deg); }

.isel__pop {
  z-index: var(--z-popover); display: flex; flex-direction: column;
  max-width: min(20rem, calc(100vw - 1rem)); overflow: auto;
  background: var(--surface-card); border: 1px solid var(--line-gold);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: .25rem;
}
.isel__pop:focus-visible { outline: none; }
.isel__search { padding: .1rem .1rem .3rem; border-bottom: 1px solid var(--border-hairline); margin-bottom: .25rem; }
.isel__search-input {
  width: 100%; box-sizing: border-box; border: none; background: none; outline: none;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-strong); padding: .2rem .4rem;
}
.isel__search-input::placeholder { color: var(--text-muted); opacity: 1; }
.isel__opts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; max-height: 13rem; overflow: auto; }
.isel__opt {
  width: 100%; display: flex; align-items: center; gap: .5rem; text-align: left;
  border: none; background: none; cursor: pointer; border-radius: var(--radius-sm);
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-body);
  padding: .4rem .5rem; transition: background .12s, color .12s;
}
.isel__opt-label { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.isel__opt.is-active { background: var(--accent-tint); color: var(--gold-700); }
.isel__opt.is-sel { color: var(--gold-700); font-weight: var(--fw-semibold); }
.isel__opt-check { width: .8rem; height: .8rem; flex: 0 0 auto; color: var(--gold-600); }
/* "Crea …": accento oro sull'azione di creazione. */
.isel__opt--create { color: var(--gold-700); border-top: 1px solid var(--border-hairline); margin-top: 1px; border-radius: 0 0 var(--radius-sm) var(--radius-sm); }
.isel__opt--create strong { font-weight: var(--fw-semibold); }
.isel__opt-empty { padding: .5rem; font-size: var(--fs-sm); color: var(--text-faint); }

/* Touch: le VOCI erano già a 44px, il TRIGGER che le apre no (h 1.7rem ≈ 27px).
   `min-height` batte `height` senza toccarla, così la resa desktop non si muove. */
@media (pointer: coarse) {
  .isel__opt { min-height: 44px; }
  .isel__trigger { min-height: 44px; }
  .isel__search-input { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .isel__chev { transition: none; }
  .isel__opt { transition: none; }
}
</style>
