<template>
  <!-- Dropdown single-select custom: trigger stilato + popover teleportato con
       opzioni stilate (hover oro, selezionata marcata). Rimpiazza il <select>
       nativo, la cui lista opzioni non e' stilabile via CSS. -->
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
      <ul v-if="open" ref="pop" class="isel__pop" role="listbox" tabindex="-1"
        :aria-label="ariaLabel" :style="popStyle" @click.stop @keydown="onPopKey">
        <li v-for="(o, i) in options" :key="o">
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
      </ul>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  ariaLabel: { type: String, default: '' },
  // Rientro a filo del valore in lettura (usato per i campi inline della testata).
  flush: { type: Boolean, default: false },
  // Apre subito il popover al montaggio (flusso "click sul valore -> apri").
  autoOpen: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'close']);

const open = ref(false);
const activeIndex = ref(-1);
const popStyle = ref(null);
const trigger = ref(null);
const pop = ref(null);

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
  const idx = props.options.findIndex((o) => o === props.modelValue);
  activeIndex.value = idx >= 0 ? idx : 0;
  anchor();
  open.value = true;
  await nextTick();
  pop.value?.focus();
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
function scrollActiveIntoView() {
  const el = pop.value?.querySelectorAll('.isel__opt')[activeIndex.value];
  el?.scrollIntoView({ block: 'nearest' });
}
function move(delta) {
  const n = props.options.length;
  activeIndex.value = (activeIndex.value + delta + n) % n;
  scrollActiveIntoView();
}
function onTriggerKey(e) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault();
    if (!open.value) openMenu();
  }
}
function onPopKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); choose(props.options[activeIndex.value]); }
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
  z-index: 1100; max-height: 15rem; overflow: auto; list-style: none; margin: 0;
  padding: .25rem; display: flex; flex-direction: column; gap: 1px;
  max-width: min(20rem, calc(100vw - 1rem));
  background: var(--surface-card); border: 1px solid var(--line-gold);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md);
}
.isel__pop:focus-visible { outline: none; }
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

@media (pointer: coarse) { .isel__opt { min-height: 44px; } }
@media (prefers-reduced-motion: reduce) {
  .isel__chev { transition: none; }
  .isel__opt { transition: none; }
}
</style>
