<template>
  <!-- Dropdown single-select custom: trigger stilato + popover teleportato con
       opzioni stilate (hover oro, selezionata marcata). Rimpiazza il <select>
       nativo, la cui lista opzioni non e' stilabile via CSS.
       Con `creatable`: campo di ricerca in testa + riga "Crea «...»" (etichetta libera). -->
  <div class="isel" :class="{ 'isel--open': open }">
    <button ref="trigger" type="button" class="isel__trigger" :class="{ 'isel__trigger--flush': flush }"
      :aria-label="ariaLabel" aria-haspopup="listbox" :aria-expanded="open"
      @click.stop="toggle" @keydown="onTriggerKey">
      <span class="isel__val">{{ modelValue }}</span>
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
            :placeholder="searchPlaceholder" :aria-label="ariaLabel" @input="activeIndex = 0" />
        </div>
        <ul class="isel__opts" role="listbox" :aria-label="ariaLabel">
          <li v-for="(o, i) in shown" :key="o">
            <button type="button" class="isel__opt" role="option"
              :aria-selected="o === modelValue"
              :class="{ 'is-sel': o === modelValue, 'is-active': i === activeIndex }"
              @click="choose(o)" @mousemove="activeIndex = i">
              <span class="isel__opt-label">{{ o }}</span>
              <svg v-if="o === modelValue" class="isel__opt-check" viewBox="0 0 12 12" aria-hidden="true">
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';

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
});
const emit = defineEmits(['update:modelValue', 'close', 'create']);

const open = ref(false);
const activeIndex = ref(-1);
const query = ref('');
const popStyle = ref(null);
const trigger = ref(null);
const pop = ref(null);
const searchInput = ref(null);

// Opzioni mostrate: filtrate per query solo in modalità creatable.
const shown = computed(() => {
  if (!props.creatable) return props.options;
  const q = query.value.trim().toLowerCase();
  const filtered = q ? props.options.filter((o) => String(o).toLowerCase().includes(q)) : props.options;
  return filtered;
});
// "Crea …" quando c'è testo e nessuna opzione con quel nome esatto.
const canCreate = computed(() => {
  if (!props.creatable) return false;
  const q = query.value.trim();
  if (!q) return false;
  const exists = props.options.some((o) => String(o).toLowerCase() === q.toLowerCase());
  return !exists;
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
  const idx = props.options.findIndex((o) => o === props.modelValue);
  activeIndex.value = props.creatable ? 0 : (idx >= 0 ? idx : 0);
  anchor();
  open.value = true;
  await nextTick();
  if (props.creatable) searchInput.value?.focus();
  else pop.value?.focus();
  scrollActiveIntoView();
}
function closeMenu() {
  if (!open.value) return;
  open.value = false;
  emit('close');
}
function toggle() {
  if (open.value) closeMenu();
  else openMenu();
}
function choose(o) {
  emit('update:modelValue', o);
  closeMenu();
}
function createValue() {
  const name = query.value.trim();
  if (!name) return;
  emit('update:modelValue', name);
  emit('create', name);
  closeMenu();
}
function scrollActiveIntoView() {
  const el = pop.value?.querySelectorAll('.isel__opt')[activeIndex.value];
  el?.scrollIntoView({ block: 'nearest' });
}
function move(delta) {
  const total = shown.value.length + (canCreate.value ? 1 : 0);
  if (!total) return;
  activeIndex.value = (activeIndex.value + delta + total) % total;
  scrollActiveIntoView();
}
function pick() {
  if (canCreate.value && activeIndex.value === shown.value.length) { createValue(); return; }
  const o = shown.value[activeIndex.value];
  if (o != null) choose(o);
}
function onTriggerKey(e) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault();
    if (!open.value) openMenu();
  }
}
function onKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); pick(); }
  else if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
}

// @click.stop su trigger e popover -> qui arrivano solo i click esterni.
function onDocClick() { closeMenu(); }
// Chiude su scroll/resize della pagina, ma NON quando lo scroll avviene dentro
// il popover stesso (altrimenti la sua scrollbar sarebbe inutilizzabile).
function onViewportShift(e) {
  if (e?.type === 'scroll' && pop.value?.contains(e.target)) return;
  closeMenu();
}
onMounted(() => {
  document.addEventListener('click', onDocClick);
  window.addEventListener('scroll', onViewportShift, true);
  window.addEventListener('resize', onViewportShift);
  if (props.autoOpen) openMenu();
});
onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  window.removeEventListener('scroll', onViewportShift, true);
  window.removeEventListener('resize', onViewportShift);
});
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
  z-index: 1100; display: flex; flex-direction: column;
  max-width: min(20rem, calc(100vw - 1rem));
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

@media (pointer: coarse) { .isel__opt { min-height: 44px; } }
@media (prefers-reduced-motion: reduce) {
  .isel__chev { transition: none; }
  .isel__opt { transition: none; }
}
</style>
