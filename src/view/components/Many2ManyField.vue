<template>
  <!-- Campo many2many inline (stile Odoo many2many_tags): riga "· Label: [tag] [tag]",
       badge con ✕ per scollegare, riga "aggiungi" che apre un combobox filtrabile
       (cerca / crea al volo). Riusabile: Gruppi, Tag, ... -->
  <div class="m2m" :class="{ 'm2m--picking': pickerOpen }">
    <span class="m2m__sep" aria-hidden="true">·</span>
    <span class="m2m__label">{{ label }}</span>
    <div class="m2m__body">
      <ul v-if="linked.length" class="m2m__tags">
        <li v-for="it in linked" :key="it.id">
          <span class="m2m__tag ds-badge ds-badge--gold" :class="{ 'm2m__tag--nav': navigable }"
            :role="navigable ? 'link' : undefined" :tabindex="navigable ? 0 : undefined"
            :aria-label="navigable ? `Vai a ${it.name}` : undefined"
            @click="navigable && onNavigate(it)" @keydown.enter="navigable && onNavigate(it)">
            <Icon :name="icon" class="m2m__tag-ico" />
            <span class="m2m__tag-name">{{ it.name }}</span>
            <button type="button" class="m2m__tag-x" tabindex="-1"
              :aria-label="`Rimuovi ${it.name}`"
              @click.stop="unlink(it)" @keydown.enter.stop="unlink(it)">
              <Icon name="close" />
            </button>
          </span>
        </li>
      </ul>
      <button ref="addTrigger" type="button" class="m2m__addline"
        :class="{ 'is-empty': !linked.length, 'is-compact': linked.length }"
        :aria-label="addText" aria-haspopup="listbox" :aria-expanded="pickerOpen" @click.stop="togglePicker">
        <Icon name="plus" class="m2m__add-ico" />
        <span v-if="!linked.length">{{ emptyText }}</span>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="pickerOpen" ref="pickerPop" class="m2m__pop" :style="pickerStyle" @click.stop>
        <div class="m2m__search">
          <Icon name="search" class="m2m__search-ico" />
          <input ref="searchInput" v-model="query" type="text" class="m2m__search-input"
            :placeholder="searchPlaceholder" :aria-label="searchPlaceholder"
            @keydown.escape="closePicker" @keydown.enter.prevent="addFirst" />
        </div>
        <ul class="m2m__opts" role="listbox" :aria-label="label">
          <li v-for="it in available" :key="it.id">
            <button type="button" class="m2m__opt" role="option" @click="addItem(it)">
              <Icon :name="icon" class="m2m__opt-ico" />
              <span class="m2m__opt-label">{{ it.name }}</span>
            </button>
          </li>
          <li v-if="canCreate">
            <button type="button" class="m2m__opt m2m__opt--create" role="option" @click="createItem">
              <Icon name="plus" class="m2m__opt-ico" />
              <span>Crea «<strong>{{ query.trim() }}</strong>»</span>
            </button>
          </li>
          <li v-if="!available.length && !canCreate" class="m2m__opt-empty">Nessun risultato</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import Icon from './Icon.vue';
import { placeInViewport } from '../anchoring.js';
import { useDismiss } from '../useDismiss.js';

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Array, default: () => [] }, // id collegati
  pool: { type: Array, default: () => [] },        // universo opzioni {id,name}
  icon: { type: String, default: 'users' },
  navigable: { type: Boolean, default: false },
  addText: { type: String, default: 'aggiungi…' },
  emptyText: { type: String, default: 'Nessuno · aggiungi' },
  searchPlaceholder: { type: String, default: 'cerca…' },
});
const emit = defineEmits(['update:modelValue', 'navigate', 'create']);

const linked = computed(() => props.pool.filter((it) => props.modelValue.includes(it.id)));

const query = ref('');
const available = computed(() => {
  const q = query.value.trim().toLowerCase();
  const pool = props.pool.filter((it) => !props.modelValue.includes(it.id));
  const filtered = q ? pool.filter((it) => it.name.toLowerCase().includes(q)) : pool;
  return filtered;
});
// Mostra "Crea …" quando c'è testo e nessun elemento con quel nome esatto.
const canCreate = computed(() => {
  const q = query.value.trim();
  if (!q) return false;
  const exists = props.pool.some((it) => it.name.toLowerCase() === q.toLowerCase());
  return !exists;
});

function unlink(it) {
  const next = props.modelValue.filter((id) => id !== it.id);
  emit('update:modelValue', next);
}
function addItem(it) {
  emit('update:modelValue', [...props.modelValue, it.id]);
  query.value = '';
  nextTick(() => searchInput.value?.focus());
}
// Delega la creazione al parent: crea nel pool e collega il riferimento.
function createItem() {
  const name = query.value.trim();
  if (!name) return;
  emit('create', name);
  query.value = '';
}
// Enter: se c'è un match lo aggiunge, altrimenti crea col testo digitato.
function addFirst() {
  const first = available.value[0];
  if (first) addItem(first);
  else if (canCreate.value) createItem();
}
function onNavigate(it) {
  emit('navigate', it);
}

// Combobox teleportato su <body> (la card ha overflow:hidden), posizione fixed
// ancorata al bordo sinistro della riga "aggiungi".
const pickerOpen = ref(false);
const pickerStyle = ref(null);
const addTrigger = ref(null);
const pickerPop = ref(null);
const searchInput = ref(null);

// Posizione iniziale (best-guess ancorata al trigger): serve solo a far
// renderizzare il popover, poi placePicker() lo clampa entro il viewport.
function anchorPicker() {
  const rect = addTrigger.value.getBoundingClientRect();
  pickerStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 220)}px`,
  };
}
// Clampa il popover dentro il viewport (helper condiviso): mai tagliato a destra
// (mobile, «+» vicino al bordo) né in basso (poco spazio → apre verso l'alto).
function placePicker() {
  if (!addTrigger.value) return;
  const w = addTrigger.value.getBoundingClientRect().width;
  pickerStyle.value = placeInViewport(addTrigger.value, pickerPop.value, {
    gap: 6, minWidth: Math.max(w, 220),
  });
}
// Identità di questa istanza: un solo picker m2m aperto per volta. Aprendone uno
// si notifica agli altri (evento su document) di chiudersi — serve un canale
// esterno perché il click sul trigger ha @click.stop e non arriva a onDocClick.
const instanceId = {};
function onOtherOpen(e) { if (e.detail !== instanceId && pickerOpen.value) closePicker(); }

async function openPicker() {
  document.dispatchEvent(new CustomEvent('m2m:open', { detail: instanceId }));
  query.value = '';
  anchorPicker();
  pickerOpen.value = true;
  await nextTick();
  placePicker();
  searchInput.value?.focus();
}
function closePicker() { pickerOpen.value = false; }
function togglePicker() {
  if (pickerOpen.value) closePicker();
  else openPicker();
}

// Chiusura su click esterno / scroll / resize / Esc (composable condiviso).
// Lo scroll dentro il popover non chiude (scrollGuard).
useDismiss(() => pickerOpen.value, closePicker, { scrollGuard: pickerPop, escape: true });

// Mutual-close: un solo picker m2m aperto per volta (canale a parte dal dismiss).
onMounted(() => document.addEventListener('m2m:open', onOtherOpen));
onUnmounted(() => document.removeEventListener('m2m:open', onOtherOpen));
</script>

<style scoped>
/* Riga da registro: "· Label: [tag] [tag]". Middot + label muta a sinistra. */
.m2m {
  display: flex; align-items: baseline; gap: .4rem;
  margin-top: .8rem; font-family: var(--font-sans); font-size: var(--fs-body);
}
.m2m__sep { flex: 0 0 auto; color: var(--text-faint); font-weight: 400; }
.m2m__label { flex: 0 0 auto; color: var(--text-muted); line-height: 1.4; }
.m2m__label::after { content: ':'; margin-right: .18rem; }
/* Tag e affordance "aggiungi" sullo stesso flusso (wrap): niente riga
   riservata sotto i badge → meno spazio verticale verso il campo seguente. */
.m2m__body { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
.m2m__tags, .m2m__tags > li { display: contents; }

/* Badge: pill oro. Con navigable è cliccabile (→ naviga); altrimenti solo etichetta. */
.m2m__tag {
  gap: .3em; padding: .2rem .48rem .09rem .5rem; padding-right: .35rem;
  font-size: calc(var(--fs-label) * 0.92);
  /* Il maiuscoletto Cinzel siede alto nella riga: più padding sopra, meno sotto
     → il testo risulta centrato otticamente nel badge. */
  transition: background .15s, border-color .15s, box-shadow .15s, transform .1s;
}
.m2m__tag--nav { cursor: pointer; }
.m2m__tag--nav:hover { background: var(--gold-100); border-color: var(--gold-500); box-shadow: var(--shadow-xs); }
.m2m__tag--nav:active { transform: translateY(1px); }
.m2m__tag--nav:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.m2m__tag-ico { font-size: .82em; opacity: .65; }
.m2m__tag-name { line-height: 1.1; }

/* ✕: sempre visibile (larghezza fissa, il badge non cambia mai dimensione).
   A riposo tenue; badge in hover la accende; ✕ in hover vira all'arancione
   (effetto distinto dal badge) per dire "premi qui per rimuovere". */
.m2m__tag-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.2em; height: 1.2em; margin-left: .15rem;
  border: none; background: none; padding: 0; cursor: pointer;
  color: var(--text-faint); border-radius: var(--radius-pill); font-size: .95em; line-height: 1;
  transition: color .15s, background .15s;
}
.m2m__tag:hover .m2m__tag-x,
.m2m__tag:focus-within .m2m__tag-x { color: var(--text-muted); }
.m2m__tag-x:hover { color: var(--ember-500); background: var(--danger-tint); }
.m2m__tag-x:focus-visible { outline: none; opacity: 1; box-shadow: var(--shadow-focus); }

/* Riga "aggiungi": affordance discreta che emerge all'hover dell'area. */
.m2m__addline {
  align-self: center; display: inline-flex; align-items: center; gap: .3rem;
  padding: .22rem .4rem; cursor: pointer;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-muted);
  background: none; border: 1px dashed transparent; border-radius: var(--radius-sm);
  transition: color .15s, border-color .15s, background .15s;
}
/* Con tag presenti: solo "+" compatto e tenue in coda ai badge (niente riga extra). */
.m2m__addline.is-compact { color: var(--text-faint); padding: .2rem .35rem; }
.m2m__addline:hover,
.m2m--picking .m2m__addline { color: var(--gold-700); border-color: var(--line-gold); background: var(--accent-tint); }
.m2m__add-ico { font-size: .9em; }

/* Combobox teleportato su <body>. */
.m2m__pop {
  z-index: 1100; max-width: min(20rem, calc(100vw - 1rem)); max-height: 15rem; overflow: auto;
  background: var(--surface-card); border: 1px solid var(--line-gold);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: .3rem;
}
.m2m__search { display: flex; align-items: center; gap: .4rem; padding: .3rem .4rem .4rem; border-bottom: 1px solid var(--border-hairline); }
.m2m__search-ico { flex: 0 0 auto; color: var(--text-faint); font-size: .9em; }
.m2m__search-input {
  width: 100%; border: none; background: none; outline: none;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-strong);
}
.m2m__search-input::placeholder { color: var(--text-muted); opacity: 1; }
.m2m__opts { list-style: none; margin: 0; padding: .25rem 0 0; display: flex; flex-direction: column; gap: 1px; }
.m2m__opt {
  width: 100%; display: flex; align-items: center; gap: .5rem; text-align: left;
  border: none; background: none; cursor: pointer; border-radius: var(--radius-sm);
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-body); padding: .4rem .5rem;
  transition: background .12s, color .12s;
}
.m2m__opt:hover,
.m2m__opt:focus-visible { outline: none; background: var(--accent-tint); color: var(--gold-700); }
.m2m__opt-ico { flex: 0 0 auto; color: var(--text-faint); font-size: .9em; }
/* Etichetta opzione su una riga con ellissi (come InlineSelect): i nomi lunghi
   non vanno a capo → righe della stessa altezza dei gruppi, non più spaziate. */
.m2m__opt-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* "Crea …": separata dai match esistenti, accento oro sull'azione di creazione. */
.m2m__opt--create { color: var(--gold-700); margin-top: 1px; border-top: 1px solid var(--border-hairline); border-radius: 0 0 var(--radius-sm) var(--radius-sm); }
.m2m__opt--create .m2m__opt-ico { color: var(--gold-600); }
.m2m__opt--create strong { font-weight: var(--fw-semibold); }
.m2m__opt-empty { padding: .5rem; font-size: var(--fs-sm); color: var(--text-faint); }

/* m2m impilati (Gruppi → Tag): margine ridotto tra i due. */
.m2m + .m2m { margin-top: .4rem; }

/* Mobile: «· Label:» resta in riga con la lista; solo i tag in eccesso vanno a
   capo DENTRO il corpo (allineati fra loro sotto il primo badge), senza impilare
   pallino/label. align-items:flex-start perché i badge sono più alti della label:
   la label si àncora in cima alla prima riga di badge invece di fluttuare a metà. */
@media (max-width: 520px) {
  .m2m { align-items: flex-start; gap: .3rem; }
  .m2m__label { line-height: 1.5; }
}

/* Touch: niente hover → ✕ e riga "aggiungi" sempre visibili, target più ampi. */
@media (pointer: coarse) {
  .m2m__tag-x { color: var(--text-muted); }
  .m2m__opt { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .m2m__tag, .m2m__tag-x, .m2m__addline, .m2m__opt { transition: none; }
}
</style>
