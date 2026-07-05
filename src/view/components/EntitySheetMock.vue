<template>
  <!-- MOCKUP: scheda anagrafica con dati HARDCODATI, non persistiti, nessuna
       chiamata a STORE/MODEL. Serve solo a valutare il look nelle testate profilo.
       Stato locale (ref): editabile in sessione, si azzera al reload. -->
  <section class="sheet" :aria-label="title">
    <header class="sheet__bar">
      <span class="sheet__title">{{ title }}</span>
      <span class="sheet__demo">dati dimostrativi</span>
    </header>

    <div class="sheet__grid">
      <!-- ===== Personaggio ===== -->
      <template v-if="kind === 'character'">
        <div class="sheet__field">
          <span class="sheet__label">Ruolo</span>
          <div class="ds-seg sheet__seg">
            <button type="button" class="ds-seg__btn" :class="{ active: isPg }"
              @click="isPg = true">PG</button>
            <button type="button" class="ds-seg__btn" :class="{ active: !isPg }"
              @click="isPg = false">PNG</button>
          </div>
        </div>

        <div class="sheet__field" v-if="isPg">
          <label class="sheet__label" :for="uid('player')">Giocatore</label>
          <select :id="uid('player')" class="ds-input sheet__select" v-model="player">
            <option v-for="p in PLAYERS" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <div class="sheet__field">
          <label class="sheet__label" :for="uid('race')">Razza</label>
          <select :id="uid('race')" class="ds-input sheet__select" v-model="race">
            <option v-for="r in RACES" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div class="sheet__field">
          <label class="sheet__label" :for="uid('class')">Classe</label>
          <select :id="uid('class')" class="ds-input sheet__select" v-model="klass">
            <option v-for="c in CLASSES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="sheet__field sheet__field--narrow">
          <label class="sheet__label" :for="uid('level')">Livello</label>
          <select :id="uid('level')" class="ds-input sheet__select" v-model.number="level">
            <option v-for="n in LEVELS" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </template>

      <!-- ===== Gruppo ===== -->
      <template v-else>
        <div class="sheet__field">
          <label class="sheet__label" :for="uid('align')">Allineamento</label>
          <select :id="uid('align')" class="ds-input sheet__select" v-model="alignment">
            <option v-for="a in ALIGNMENTS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <div class="sheet__field">
          <label class="sheet__label" :for="uid('seat')">Sede</label>
          <select :id="uid('seat')" class="ds-input sheet__select" v-model="seat">
            <option v-for="s in SEATS" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="sheet__field">
          <label class="sheet__label" :for="uid('reach')">Influenza</label>
          <select :id="uid('reach')" class="ds-input sheet__select" v-model="reach">
            <option v-for="r in REACHES" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div class="sheet__field sheet__field--narrow">
          <label class="sheet__label" :for="uid('founded')">Fondata nel</label>
          <input :id="uid('founded')" class="ds-input" type="text" v-model="founded"
            placeholder="es. 1247 E.T." />
        </div>
      </template>

      <!-- ===== Note markdown (comune) ===== -->
      <div class="sheet__field sheet__notes">
        <div class="sheet__notes-head">
          <span class="sheet__label">Note</span>
          <div class="ds-seg sheet__seg sheet__seg--sm">
            <button type="button" class="ds-seg__btn" :class="{ active: !editNotes }"
              @click="editNotes = false">Anteprima</button>
            <button type="button" class="ds-seg__btn" :class="{ active: editNotes }"
              @click="editNotes = true">Modifica</button>
          </div>
        </div>

        <textarea v-if="editNotes" class="ds-input sheet__textarea" v-model="notes"
          rows="6" aria-label="Note in markdown"
          placeholder="Scrivi in markdown: **grassetto**, *corsivo*, `codice`, - elenco"></textarea>
        <div v-else class="sheet__md" v-html="renderedNotes"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  // 'character' | 'group' — decide quali campi fittizi mostrare.
  kind: { type: String, required: true },
});

const title = computed(() => (props.kind === 'character' ? 'Scheda anagrafica' : 'Scheda del gruppo'));

// id univoci per accoppiare <label>/<control> senza collisioni tra le due schede.
const instance = ++EntitySheetMock_counter;
function uid(name) {
  const id = `sheet-${instance}-${name}`;
  return id;
}

/* ---- Elenchi fittizi (mockup) ---- */
const PLAYERS = ['Marco', 'Giulia', 'Andrea', 'Sara', 'Luca', 'Elena'];
const CLASSES = ['Guerriero', 'Ladro', 'Mago', 'Chierico', 'Ranger', 'Bardo',
  'Paladino', 'Stregone', 'Druido', 'Barbaro', 'Warlock', 'Monaco'];
const RACES = ['Umano', 'Elfo', 'Nano', 'Halfling', 'Mezzelfo', 'Mezzorco',
  'Tiefling', 'Gnomo', 'Dragonide', 'Goliath'];
const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const ALIGNMENTS = ['Legale Buono', 'Neutrale Buono', 'Caotico Buono',
  'Legale Neutrale', 'Neutrale', 'Caotico Neutrale',
  'Legale Malvagio', 'Neutrale Malvagio', 'Caotico Malvagio'];
const SEATS = ['Valdûr', 'Porto Cenere', 'Emberfall', 'Le Guglie', 'Fosso Nero', "Rocca d'Avorio"];
const REACHES = ['Locale', 'Regionale', 'Nazionale', 'Continentale'];

/* ---- Stato locale hardcodato (non persistito) ---- */
const isPg = ref(true);
const player = ref('Giulia');
const klass = ref('Ranger');
const level = ref(7);
const race = ref('Mezzelfo');

const alignment = ref('Caotico Neutrale');
const seat = ref('Porto Cenere');
const reach = ref('Regionale');
const founded = ref('1247 E.T.');

const editNotes = ref(false);
const notes = ref(props.kind === 'character'
  ? '**Mercenario** riservato, con un debito verso la Gilda dei Velati.\n\n- Fedele a chi paga\n- Odia i *nobiluomini di Valdûr*\n- Insegue la spada `Fendinube`'
  : 'Fondata dopo la **Caduta di Emberfall**.\n\n- Controlla i moli del porto\n- Alleata dei *Mercanti d\'Ottone*\n- Riscuote il pedaggio `del Ponte Nero`');

/* ---- Mini-renderer markdown (mockup, no dipendenze) ----
   Escape prima di tutto, poi grassetto/corsivo/codice inline + liste + paragrafi. */
function escapeHtml(s) {
  const out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return out;
}
function inlineMd(s) {
  const out = s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return out;
}
function renderMd(src) {
  const lines = escapeHtml(src).split(/\r?\n/);
  let html = '';
  let inList = false;
  for (const line of lines) {
    const isBullet = /^\s*[-*]\s+/.test(line);
    if (isBullet) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inlineMd(line.replace(/^\s*[-*]\s+/, '')) + '</li>';
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if (line.trim() === '') continue;
    html += '<p>' + inlineMd(line) + '</p>';
  }
  if (inList) html += '</ul>';
  return html;
}
const renderedNotes = computed(() => renderMd(notes.value));
</script>

<script>
// Contatore d'istanza a livello di modulo: id stabili e distinti tra le due schede.
let EntitySheetMock_counter = 0;
</script>

<style scoped>
.sheet {
  margin-top: var(--space-4);
  padding: var(--space-4) var(--space-5) var(--space-5);
  background: var(--surface-panel);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}

.sheet__bar {
  display: flex; align-items: baseline; gap: var(--space-2);
  margin-bottom: var(--space-4);
}
.sheet__title {
  font-family: var(--font-display); font-size: var(--fs-label);
  letter-spacing: var(--ls-caps); text-transform: uppercase;
  font-weight: var(--fw-bold); color: var(--gold-700);
}
.sheet__demo {
  font-family: var(--font-sans); font-size: var(--fs-xs);
  font-style: italic; color: var(--text-faint);
}

.sheet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3) var(--space-4);
  align-items: start;
}
.sheet__field { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
.sheet__field--narrow { max-width: 8rem; }

.sheet__label {
  font-family: var(--font-display); font-size: var(--fs-label);
  letter-spacing: var(--ls-caps); text-transform: uppercase;
  font-weight: var(--fw-semibold); color: var(--gold-700);
}

/* Select: riusa .ds-input, aggiunge il caret (appearance nativa rimossa). */
.sheet__select {
  appearance: none; -webkit-appearance: none;
  padding-right: 1.9rem; cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4 L6 8 L10 4' fill='none' stroke='%237a5c1f' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat;
  background-position: right .65rem center;
  background-size: .72rem;
}

/* Segmenti compatti dentro la scheda. */
.sheet__seg { align-self: start; }
.sheet__seg--sm .ds-seg__btn { padding: .3rem .6rem; font-size: var(--fs-xs); }

/* Note: campo a piena larghezza. */
.sheet__notes { grid-column: 1 / -1; }
.sheet__notes-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-3); flex-wrap: wrap;
}
.sheet__textarea {
  width: 100%; resize: vertical; min-height: 6rem;
  font-family: var(--font-sans); line-height: 1.5;
}

/* Prosa renderizzata dalle note (contenuto v-html → :deep). */
.sheet__md {
  font-family: var(--font-sans); font-size: var(--fs-body);
  color: var(--text-body); line-height: 1.55;
  max-width: 70ch;
}
.sheet__md :deep(p) { margin: 0 0 .5rem; }
.sheet__md :deep(p:last-child) { margin-bottom: 0; }
.sheet__md :deep(ul) { margin: .25rem 0 .5rem; padding-left: 1.2rem; }
.sheet__md :deep(li) { margin: .15rem 0; }
.sheet__md :deep(strong) { font-weight: var(--fw-bold); color: var(--text-strong); }
.sheet__md :deep(em) { font-style: italic; }
.sheet__md :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .88em; padding: .05rem .3rem;
  background: var(--accent-tint); color: var(--gold-700);
  border-radius: var(--radius-sm);
}

@media (max-width: 480px) {
  .sheet__field--narrow { max-width: none; }
}
</style>
