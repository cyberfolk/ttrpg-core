<template>
  <!-- Note markdown come pannello di tab, persistite nello store (MODEL: setCharacterNotes /
       setGroupNotes). In lettura la matita compare all'hover sopra l'anteprima; in modifica
       la textarea occupa tutto lo spazio con «Fatto» in overlay. -->
  <div class="notes">
    <template v-if="editing">
      <textarea ref="taRef" class="ds-input notes__ta" v-model="text"
        rows="1" aria-label="Note in markdown" @input="autosize" @blur="onBlur"
        @keydown.escape.prevent="cancel"
        placeholder="markdown: # titolo, **grassetto**, *corsivo*, `codice`, - elenco"></textarea>
      <!-- @mousedown.prevent: sopprime il blur del mouse (il click arriva comunque).
           Il caso tastiera lo copre onBlur, che guarda dove sta andando il focus. -->
      <div ref="actionsEl" class="notes__actions edit-actions">
        <button type="button" class="ds-btn ds-btn--sm ds-btn--confirm"
          @mousedown.prevent @click="done">
          <span class="ds-btn__icon"><Icon name="check" /></span> Fatto
        </button>
        <button type="button" class="ds-btn ds-btn--sm ds-btn--secondary"
          @mousedown.prevent @click="cancel">
          <span class="ds-btn__icon"><Icon name="close" /></span> Annulla
        </button>
      </div>
    </template>

    <div v-else class="notes__view">
      <div v-if="rendered" class="notes__md" v-html="rendered"></div>
      <p v-else class="notes__empty">Nessuna nota. Usa la matita per scrivere.</p>
      <HoverTip text="Modifica" class-name="notes__pencilwrap" :tab-index="-1">
        <button type="button" class="notes__pencil" aria-label="Modifica note" @click="edit">
          <Icon name="edit" />
        </button>
      </HoverTip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import { useStore } from '../useStore.js';
import { setCharacterNotes, setGroupNotes } from '../../model/reputation.js';
import { renderMarkdown } from '../markdown.js';

const props = defineProps({
  kind: { type: String, required: true },
  entity: { type: Object, required: true },
});

const { dispatch } = useStore();

const editing = ref(false);
const text = ref(props.entity.notes || '');
const taRef = ref(null);
const actionsEl = ref(null);

// Auto-resize: la textarea cresce per contenere tutto il contenuto, senza
// scrollbar interna. min-height (CSS) resta il pavimento per contenuti brevi.
function autosize() {
  const el = taRef.value;
  if (!el) return;
  el.style.height = 'auto';
  // scrollHeight = contenuto+padding; con box-sizing border-box aggiungo i bordi
  // così l'altezza contiene tutto senza clip né scrollbar.
  const border = el.offsetHeight - el.clientHeight;
  el.style.height = `${el.scrollHeight + border}px`;
}

function edit() {
  text.value = props.entity.notes || '';
  editing.value = true;
  nextTick(autosize);
}
function done() {
  editing.value = false;
  const id = props.entity.id;
  const value = text.value;
  if (props.kind === 'character') dispatch((s) => setCharacterNotes(s, id, value));
  else dispatch((s) => setGroupNotes(s, id, value));
}

/* Uscendo dalla textarea si salva — ma non quando il focus sta andando su uno dei
   due bottoni: prima si aspetta di sapere QUALE. Prima questo era un
   @mousedown.prevent sui bottoni, che funziona solo col mouse: da tastiera il Tab
   faceva scattare done() e smontava i bottoni, quindi «Annulla» era irraggiungibile
   e si usciva sempre salvando. */
function onBlur(e) {
  const to = e.relatedTarget;
  if (to instanceof Node && actionsEl.value?.contains(to)) return;
  done();
}

/* Scarta le modifiche: ripristina il testo originale e torna in lettura, senza
   dispatch (nessun salvataggio). Raggiungibile col bottone e con Escape. */
function cancel() {
  editing.value = false;
  text.value = props.entity.notes || '';
}

const rendered = computed(() => renderMarkdown(text.value));
</script>

<style scoped>
/* Rientro leggero: il contenuto rende come «annidato» sotto la riga dei tab
   (il label della tab parte a .8rem dal bordo → .7rem qui lo allinea). */
.notes { position: relative; padding-left: .7rem; }

/* --- Lettura: anteprima con matita in overlay all'hover --- */
.notes__view { position: relative; min-height: 3rem; border-radius: var(--radius-sm); }
/* Il posizionamento assoluto sta sul WRAPPER di HoverTip (non sul bottone): così
   il rect dell'anchor coincide con la matita e il tooltip si ancora all'icona,
   invece che al wrapper inline a larghezza ~0 nell'angolo. */
.notes__pencilwrap { position: absolute; top: .25rem; right: .25rem; }
.notes__pencil {
  display: inline-flex;
  background: var(--surface); border: none; cursor: pointer;
  color: var(--text-faint); opacity: 0; padding: .2rem;
  font-size: 1rem; line-height: 1; border-radius: var(--radius-sm);
  transition: opacity .15s, color .15s;
}
/* Su hover l'icona si colora d'oro, come la matita dentro i campi (.led__val-ico). */
.notes__view:hover .notes__pencil,
.notes__pencil:focus-visible { opacity: 1; color: var(--gold-600); }
.notes__pencil:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

/* Touch: niente hover. Con `opacity: 0` l'unico modo per scrivere una nota
   sarebbe un bottone invisibile — e lo stato vuoto invita proprio a «usare la
   matita». Qui resta visibile e diventa un bersaglio da 44px; il testo le lascia
   spazio a destra invece di scorrerle sotto. Stessa scelta di .led__val-ico. */
@media (pointer: coarse) {
  .notes__pencil {
    opacity: .75;
    display: grid; place-items: center;
    width: 44px; height: 44px; padding: 0;
  }
  .notes__pencilwrap { top: 0; right: 0; }
  .notes__view { padding-right: 44px; }
}

.notes__empty { margin: 0; color: var(--text-muted); font-style: italic; }

/* --- Modifica: textarea a tutta altezza, «Annulla»/«Fatto» in overlay --- */
/* padding-top ampio: la prima riga parte sotto i bottoni Fatto/Annulla in overlay
   (top .35rem + altezza bottone) e non ci finisce nascosta sotto. */
/* Autogrow: cresce col contenuto (JS setta height=scrollHeight), niente scrollbar
   interna; min-height è il pavimento per note brevi. */
.notes__ta { width: 100%; resize: none; overflow: hidden; min-height: 8rem; line-height: 1.5; padding-top: 2.4rem; }
.notes__actions { position: absolute; top: .35rem; right: .35rem; }

.notes__md {
  font-family: var(--font-sans); font-size: var(--fs-body);
  color: var(--text-body); line-height: 1.55; max-width: 70ch;
}
.notes__md :deep(h1),
.notes__md :deep(h2),
.notes__md :deep(h3),
.notes__md :deep(h4),
.notes__md :deep(h5),
.notes__md :deep(h6) {
  font-family: var(--font-display); color: var(--text-strong);
  font-weight: var(--fw-bold); line-height: 1.2; margin: .8rem 0 .35rem;
}
.notes__md :deep(h1:first-child),
.notes__md :deep(h2:first-child),
.notes__md :deep(h3:first-child) { margin-top: 0; }
.notes__md :deep(h1) { font-size: 1.4em; }
.notes__md :deep(h2) { font-size: 1.22em; }
.notes__md :deep(h3) { font-size: 1.08em; }
.notes__md :deep(h4),
.notes__md :deep(h5),
.notes__md :deep(h6) { font-size: 1em; }
.notes__md :deep(p) { margin: 0 0 .5rem; }
.notes__md :deep(p:last-child) { margin-bottom: 0; }
.notes__md :deep(ul) { margin: .25rem 0 .5rem; padding-left: 1.2rem; }
.notes__md :deep(li) { margin: .15rem 0; }
.notes__md :deep(strong) { font-weight: var(--fw-bold); color: var(--text-strong); }
.notes__md :deep(em) { font-style: italic; }
.notes__md :deep(code) {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: .88em; padding: .05rem .3rem;
  background: var(--accent-tint); color: var(--gold-700); border-radius: var(--radius-sm);
}
.notes__md :deep(blockquote) {
  margin: .5rem 0; padding: .4rem .75rem;
  background: var(--accent-tint); border-radius: var(--radius-sm);
  color: var(--text-body); font-style: italic;
}
.notes__md :deep(blockquote:first-child) { margin-top: 0; }
.notes__md :deep(blockquote:last-child) { margin-bottom: 0; }
</style>
