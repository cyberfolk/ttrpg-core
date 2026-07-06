<template>
  <!-- MOCKUP: dati HARDCODATI (ref locali), non persistiti, nessun STORE/MODEL.
       Resa "riga da registro": valori forti, label mute, inline. Nessuna scatola,
       nessuna eyebrow oro. Serve a valutare il look nelle testate profilo. -->
  <section class="led" :aria-label="title">
    <!-- Riga meta: valori inline, ognuno editabile al click sul valore.
         Niente matita globale: l'affordance è per campo (hover → cornice + icona). -->
    <div class="led__read">
      <button v-if="kind === 'character'" type="button" class="led__role"
        :class="isPg ? 'led__role--pg' : 'led__role--png'" :aria-pressed="isPg"
        aria-label="Cambia ruolo (PG/PNG)" title="Clic: cambia PG/PNG"
        @click="isPg = !isPg">{{ isPg ? 'PG' : 'PNG' }}</button>

      <div class="led__grid">
        <div v-for="f in fields" :key="f.key" class="led__item"
          :class="{ 'led__item--player': f.key === 'giocatore',
                    'led__item--wide': editingField === f.key && f.type === 'multiclass' }">
          <span class="led__sep" aria-hidden="true">·</span>
          <span class="led__k">{{ f.label }}</span>

          <!-- Livello: derivato (somma classi), sola lettura -->
          <span v-if="f.type === 'readonly'" class="led__val">{{ f.display }}</span>

          <!-- Reputazione: derivata dalle transazioni, sola lettura -->
          <HoverTip v-else-if="f.type === 'score'" :text="SCORE_TIP"
            label="Spiegazione punteggio sintetico" class-name="led__repchip">
            <ScoreChip :score="reputation" size="sm" />
          </HoverTip>

          <!-- Select inline (Razza, Allineamento, Giocatore, Sede, Influenza) -->
          <template v-else-if="f.type === 'select'">
            <button v-if="editingField !== f.key" type="button" class="led__val led__val--edit"
              :aria-label="`Modifica ${f.label}`" @click.stop="startField(f.key)">
              <span>{{ form[f.model] }}</span>
              <Icon name="edit" class="led__val-ico" />
            </button>
            <select v-else class="led__select led__select--inline" v-model="form[f.model]" v-focus
              :aria-label="f.label" @change="stopField" @blur="stopField" @keydown.escape="stopField">
              <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
            </select>
          </template>

          <!-- Testo inline (Fondata) -->
          <template v-else-if="f.type === 'text'">
            <button v-if="editingField !== f.key" type="button" class="led__val led__val--edit"
              :aria-label="`Modifica ${f.label}`" @click.stop="startField(f.key)">
              <span>{{ form[f.model] }}</span>
              <Icon name="edit" class="led__val-ico" />
            </button>
            <input v-else class="led__select led__input led__select--inline" type="text"
              v-model="form[f.model]" v-focus :aria-label="f.label"
              @blur="stopField" @keydown.enter="stopField" @keydown.escape="stopField" />
          </template>

          <!-- Classe: display sintetico; click apre l'editor multiclasse inline
               (che computa il Livello). -->
          <template v-else-if="f.type === 'multiclass'">
            <button v-if="editingField !== 'classe'" type="button" class="led__val led__val--edit"
              aria-label="Modifica classe e livelli" @click.stop="startField('classe')">
              <span>{{ classLabel }}</span>
              <Icon name="edit" class="led__val-ico" />
            </button>
            <div v-else class="led__mc">
              <div class="led__mc-rows">
                <div v-for="(c, i) in classes" :key="i" class="led__mc-row">
                  <select class="led__select led__mc-lvl" v-model.number="c.level" aria-label="Livello classe">
                    <option v-for="n in LEVELS" :key="n" :value="n">{{ n }}</option>
                  </select>
                  <select class="led__select" v-model="c.klass" aria-label="Classe">
                    <option v-for="cl in CLASSES" :key="cl" :value="cl">{{ cl }}</option>
                  </select>
                  <button v-if="classes.length > 1" type="button" class="led__mc-rm"
                    aria-label="Rimuovi classe" @click="removeClass(i)"><Icon name="close" /></button>
                </div>
              </div>
              <div class="led__mc-foot">
                <button type="button" class="led__mc-add ds-btn ds-btn--sm ds-btn--ghost" @click="addClass">
                  <span class="ds-btn__icon"><Icon name="plus" /></span> classe
                </button>
                <button type="button" class="ds-btn ds-btn--sm ds-btn--ghost" @click="stopField">
                  <span class="ds-btn__icon"><Icon name="check" /></span> Fatto
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Campo "Gruppi": widget many2many inline (stile Odoo many2many_tags).
         MOCKUP: pool e link locali, non persistiti. Sempre interattivo (niente matita):
         badge cliccabile → gruppo, ✕ su hover per scollegare, riga "aggiungi" che apre
         un combobox filtrabile. Solo per i personaggi. -->
    <div v-if="kind === 'character'" class="grp" :class="{ 'grp--picking': pickerOpen }">
      <span class="led__sep" aria-hidden="true">·</span>
      <span class="led__k grp__label">Gruppi</span>
      <div class="grp__body">
        <ul v-if="linkedGroups.length" class="grp__tags">
          <li v-for="g in linkedGroups" :key="g.id">
            <span class="grp__tag ds-badge ds-badge--gold" role="link" tabindex="0"
              :aria-label="`Vai al gruppo ${g.name}`"
              @click="goToGroup(g)" @keydown.enter="goToGroup(g)">
              <Icon name="users" class="grp__tag-ico" />
              <span class="grp__tag-name">{{ g.name }}</span>
              <button type="button" class="grp__tag-x" tabindex="-1"
                :aria-label="`Scollega ${g.name}`"
                @click.stop="unlink(g)" @keydown.enter.stop="unlink(g)">
                <Icon name="close" />
              </button>
            </span>
          </li>
        </ul>
        <button ref="addTrigger" type="button" class="grp__addline"
          :class="{ 'is-empty': !linkedGroups.length }"
          aria-haspopup="listbox" :aria-expanded="pickerOpen" @click.stop="togglePicker">
          <Icon name="plus" class="grp__add-ico" />
          <span>{{ linkedGroups.length ? 'aggiungi gruppo…' : 'Nessun gruppo · aggiungi' }}</span>
        </button>
      </div>

      <Teleport to="body">
        <div v-if="pickerOpen" ref="pickerPop" class="grp__pop" :style="pickerStyle" @click.stop>
          <div class="grp__search">
            <Icon name="search" class="grp__search-ico" />
            <input ref="searchInput" v-model="query" type="text" class="grp__search-input"
              placeholder="cerca gruppo…" aria-label="Cerca gruppo da collegare"
              @keydown.escape="closePicker" @keydown.enter.prevent="addFirst" />
          </div>
          <ul class="grp__opts" role="listbox" aria-label="Gruppi disponibili">
            <li v-for="g in available" :key="g.id">
              <button type="button" class="grp__opt" role="option" @click="addGroup(g)">
                <Icon name="users" class="grp__opt-ico" />
                <span>{{ g.name }}</span>
              </button>
            </li>
            <li v-if="canCreate">
              <button type="button" class="grp__opt grp__opt--create" role="option" @click="createGroup">
                <Icon name="plus" class="grp__opt-ico" />
                <span>Crea «<strong>{{ query.trim() }}</strong>»</span>
              </button>
            </li>
            <li v-if="!available.length && !canCreate" class="grp__opt-empty">Nessun gruppo disponibile</li>
          </ul>
        </div>
      </Teleport>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Icon from './Icon.vue';
import ScoreChip from './ScoreChip.vue';
import HoverTip from './HoverTip.vue';
import { SCORE_TIP } from '../uiCopy.js';

const router = useRouter();

const props = defineProps({
  // 'character' | 'group' — decide quali campi fittizi mostrare.
  kind: { type: String, required: true },
  // Reputazione complessiva (dato reale dal profilo). null → pill vuota.
  reputation: { type: Number, default: null },
});

const title = computed(() => (props.kind === 'character' ? 'Scheda anagrafica' : 'Scheda del gruppo'));

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
const isPg = ref(false);
const form = reactive({
  race: 'Mezzelfo',
  alignment: 'Caotico Neutrale',
  player: 'Giulia',
  seat: 'Porto Cenere',
  reach: 'Regionale',
  founded: '1247 E.T.',
});

// Edit inline: un solo campo alla volta (null = tutto in lettura).
const editingField = ref(null);
function startField(key) { editingField.value = key; }
function stopField() { editingField.value = null; }
// Autofocus sul controllo appena montato all'apertura dell'edit inline.
const vFocus = { mounted(el) { el.focus(); } };

// Multiclasse: lista {livello, classe}. Il livello personaggio è la somma (come D&D).
const classes = ref([
  { level: 3, klass: 'Barbaro' },
  { level: 2, klass: 'Chierico' },
  { level: 1, klass: 'Ladro' },
]);
const classLabel = computed(() => classes.value.map((c) => `${c.level} ${c.klass}`).join(' / '));
const totalLevel = computed(() => classes.value.reduce((sum, c) => sum + c.level, 0));

function addClass() {
  classes.value.push({ level: 1, klass: 'Guerriero' });
}
function removeClass(i) {
  if (classes.value.length > 1) classes.value.splice(i, 1);
}

/* ---- Campo Gruppi (many2many, mockup) ---- */
const GROUP_POOL = [
  { id: 'g1', name: 'La Compagnia' },
  { id: 'g2', name: "Corte d'Ombra" },
  { id: 'g3', name: 'Gilda dei Ladri' },
  { id: 'g4', name: 'Ordine del Sole' },
  { id: 'g5', name: 'Mercanti di Valdûr' },
  { id: 'g6', name: 'Guardia Cinerea' },
  { id: 'g7', name: 'Cerchio dei Druidi' },
  { id: 'g8', name: 'Casa Vantis' },
];
const linkedIds = ref(['g1', 'g2', 'g6']);

const query = ref('');
const groupPool = ref([...GROUP_POOL]);
const linkedGroups = computed(() => groupPool.value.filter((g) => linkedIds.value.includes(g.id)));
let nextGroupN = GROUP_POOL.length + 1;

const available = computed(() => {
  const q = query.value.trim().toLowerCase();
  const pool = groupPool.value.filter((g) => !linkedIds.value.includes(g.id));
  const filtered = q ? pool.filter((g) => g.name.toLowerCase().includes(q)) : pool;
  return filtered;
});
// Mostra "Crea …" (stile Odoo) quando c'è testo e nessun gruppo con quel nome esatto.
const canCreate = computed(() => {
  const q = query.value.trim();
  if (!q) return false;
  const exists = groupPool.value.some((g) => g.name.toLowerCase() === q.toLowerCase());
  return !exists;
});

function unlink(g) {
  linkedIds.value = linkedIds.value.filter((id) => id !== g.id);
}
function addGroup(g) {
  linkedIds.value.push(g.id);
  query.value = '';
  nextTick(() => searchInput.value?.focus());
}
// Crea al volo un gruppo col nome digitato (mock) e lo collega subito.
function createGroup() {
  const name = query.value.trim();
  if (!name) return;
  const g = { id: `gm${nextGroupN++}`, name };
  groupPool.value.push(g);
  addGroup(g);
}
// Enter: se c'è un match lo aggiunge, altrimenti crea col testo digitato.
function addFirst() {
  const first = available.value[0];
  if (first) addGroup(first);
  else if (canCreate.value) createGroup();
}
function goToGroup(g) {
  // MOCKUP: gli id sono fittizi, non risolvono a gruppi reali → si va all'elenco.
  // Nel profilo reale: router.push({ name: 'groupProfile', params: { id: g.id } }).
  router.push('/gruppi');
}

// Combobox "aggiungi": popover teleportato su <body> (la card ha overflow:hidden),
// posizione fixed ancorata al bordo sinistro della riga "aggiungi".
const pickerOpen = ref(false);
const pickerStyle = ref(null);
const addTrigger = ref(null);
const pickerPop = ref(null);
const searchInput = ref(null);

function anchorPicker() {
  const rect = addTrigger.value.getBoundingClientRect();
  pickerStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 220)}px`,
  };
}
async function openPicker() {
  query.value = '';
  anchorPicker();
  pickerOpen.value = true;
  await nextTick();
  searchInput.value?.focus();
}
function closePicker() {
  pickerOpen.value = false;
}
function togglePicker() {
  if (pickerOpen.value) closePicker();
  else openPicker();
}

// @click.stop su trigger e popover → qui arrivano solo i click esterni.
function onDocClick() {
  if (pickerOpen.value) closePicker();
}
function onDocKey(e) {
  if (e.key === 'Escape' && pickerOpen.value) closePicker();
}
function onViewportShift() {
  if (pickerOpen.value) closePicker();
}
onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onDocKey);
  window.addEventListener('scroll', onViewportShift, true);
  window.addEventListener('resize', onViewportShift);
});
onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onDocKey);
  window.removeEventListener('scroll', onViewportShift, true);
  window.removeEventListener('resize', onViewportShift);
});

// Descrittori dei campi meta: tipo di controllo + sorgente valore.
// Derivati (livello, reputazione) → sola lettura; classe → editor multiclasse.
// Il ruolo (PG/PNG) esce dai campi: è un badge sopra la griglia.
const fields = computed(() => {
  if (props.kind === 'character') {
    const characterFields = [
      { key: 'razza', label: 'Razza', type: 'select', model: 'race', options: RACES },
      { key: 'classe', label: 'Classe', type: 'multiclass' },
      { key: 'allineamento', label: 'Allineamento', type: 'select', model: 'alignment', options: ALIGNMENTS },
      { key: 'livello', label: 'Livello', type: 'readonly', display: String(totalLevel.value) },
      { key: 'reputazione', label: 'Reputazione', type: 'score' },
    ];
    if (isPg.value) {
      characterFields.push({ key: 'giocatore', label: 'Giocatore', type: 'select', model: 'player', options: PLAYERS });
    }
    return characterFields;
  }
  const groupFields = [
    { key: 'allineamento', label: 'Allineamento', type: 'select', model: 'alignment', options: ALIGNMENTS },
    { key: 'sede', label: 'Sede', type: 'select', model: 'seat', options: SEATS },
    { key: 'influenza', label: 'Influenza', type: 'select', model: 'reach', options: REACHES },
    { key: 'fondata', label: 'Fondata', type: 'text', model: 'founded' },
    { key: 'reputazione', label: 'Reputazione', type: 'score' },
  ];
  return groupFields;
});
</script>

<style scoped>
.led {
  position: relative;
  border-top: 1px solid var(--border-hairline);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
}

/* --- meta (lettura): campi impilati su due colonne, ciascuno col "·" --- */
.led__read { position: relative; }
.led__grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .4rem 1.5rem;
  font-family: var(--font-sans); font-size: var(--fs-body); line-height: 1.4;
}
.led__item { display: flex; align-items: center; gap: .4rem; min-width: 0; }
.led__repchip { display: inline-flex; }
/* Chip vuoto "–": il glifo trattino siede alto nella pill → sembra avere più
   padding sotto. Ricentro il glifo dentro la pill (solo qui, non nel DS). */
.led__repchip :deep(.ds-score--empty) { padding-top: .3em; padding-bottom: .14em; }
@media (max-width: 520px) { .led__grid { grid-template-columns: 1fr; } }

/* Ruolo: badge-toggle. Default PNG (grigio), clic → PG (oro tenue).
   Larghezza fissa: PG e PNG occupano la stessa pill (testo centrato). */
.led__role {
  font-family: var(--font-display); font-size: var(--fs-label);
  font-weight: var(--fw-semibold); letter-spacing: var(--ls-caps); text-transform: uppercase;
  border-radius: var(--radius-pill); padding: .3rem .55rem; line-height: 1;
  min-width: 3.6rem; text-align: center;
  border: 1px solid; cursor: pointer;
  transition: background .15s, color .15s, border-color .15s, transform .1s;
}
.led__role:active { transform: translateY(1px); }
.led__role:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.led__role--pg { background: var(--accent-tint); color: var(--gold-700); border-color: var(--line-gold); }
.led__role--pg:hover { border-color: var(--gold-500); }
.led__role--png { background: var(--surface-panel); color: var(--text-muted); border-color: var(--border-hairline); }
.led__role--png:hover { color: var(--text-strong); border-color: var(--border-strong); }
/* badge ruolo su riga propria sopra la griglia */
.led__role { margin-bottom: .7rem; }
.led__val { color: var(--text-strong); font-weight: var(--fw-semibold); overflow-wrap: anywhere; }
.led__sep { color: var(--text-faint); font-weight: 400; }
.led__k { color: var(--text-muted); }
/* Nome campo seguito da due punti: "· Livello: 6". Un solo punto di verità.
   margin-right → piccolo respiro tra ":" e il contenuto (solo lì, non sul middot). */
.led__k::after { content: ':'; margin-right: .18rem; }

/* Valore editabile inline: a riposo sembra testo forte; su hover/focus
   compaiono cornice oro tenue + icona matita → "cliccami per editare". */
.led__val--edit {
  font: inherit; color: var(--text-strong); font-weight: var(--fw-semibold);
  display: inline-flex; align-items: center; gap: .3rem;
  margin: -.1rem -.35rem; padding: .1rem .35rem;
  background: none; border: 1px solid transparent; border-radius: var(--radius-sm);
  cursor: pointer; text-align: left; overflow-wrap: anywhere;
  transition: background .15s, border-color .15s;
}
.led__val--edit:hover, .led__val--edit:focus-visible {
  outline: none; background: var(--accent-tint); border-color: var(--line-gold);
}
.led__val-ico { flex: 0 0 auto; font-size: .78em; color: var(--gold-600); opacity: 0; transition: opacity .15s; }
.led__val--edit:hover .led__val-ico,
.led__val--edit:focus-visible .led__val-ico { opacity: .75; }

/* Controllo inline (select/input): altezza ridotta per non far crescere la riga
   rispetto al valore in lettura quando si apre la selezione. */
.led__select--inline {
  font-weight: var(--fw-semibold); box-sizing: border-box; height: 1.5rem;
  padding-top: 0; padding-bottom: 0; line-height: 1.4;
}
/* Classe in modifica: la cella prende tutta la larghezza per l'editor multiclasse. */
.led__item--wide { grid-column: 1 / -1; align-items: flex-start; }
.led__select {
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-strong);
  background: var(--surface-card); border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm); padding: .3rem 1.5rem .3rem .5rem;
  cursor: pointer; appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4 L6 8 L10 4' fill='none' stroke='%237a5c1f' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat; background-position: right .45rem center; background-size: .65rem;
}
.led__input { padding-right: .5rem; background-image: none; cursor: text; }

/* editor multiclasse: righe livello+classe impilate, con aggiungi/rimuovi. */
.led__mc { display: flex; flex-direction: column; gap: .25rem; align-items: stretch; }
.led__mc-rows { display: flex; flex-direction: column; gap: .35rem; }
.led__mc-row { display: flex; align-items: center; gap: .4rem; }
.led__mc-lvl { max-width: 4rem; }
.led__mc-rm {
  background: none; border: none; cursor: pointer; line-height: 1;
  color: var(--text-faint); padding: .2rem; border-radius: var(--radius-sm);
  transition: color .15s;
}
.led__mc-rm:hover { color: var(--danger); }
.led__mc-foot { display: flex; align-items: center; gap: .4rem; margin-top: .3rem; }
.led__mc-add { align-self: flex-start; }
.led__select:hover { border-color: var(--gold-500); }
.led__select:focus { outline: none; border-color: var(--gold-500); box-shadow: var(--shadow-focus); }

/* Giocatore (solo PG): valore oro per distinguerlo. */
.led__item--player .led__val { color: var(--gold-600); font-weight: var(--fw-semibold); }

/* === Campo Gruppi: many2many inline ==================================== */
/* Stessa riga da registro dei fatti: "· Gruppi: [tag] [tag]".
   Middot + label muta a sinistra, contenuto (tag + aggiungi) a destra. */
.grp {
  display: flex; align-items: baseline; gap: .4rem;
  margin-top: .8rem; font-family: var(--font-sans); font-size: var(--fs-body);
}
.grp__label { flex: 0 0 auto; line-height: 1.4; }
.grp__body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: .3rem; }
.grp__tags { display: flex; flex-wrap: wrap; gap: .4rem; list-style: none; margin: 0; padding: 0; }

/* Badge gruppo: pill oro cliccabile → naviga. La ✕ compare a destra su hover. */
.grp__tag {
  gap: .32em; padding-right: .4rem; cursor: pointer;
  transition: background .15s, border-color .15s, box-shadow .15s, transform .1s;
}
.grp__tag:hover { background: var(--gold-100); border-color: var(--gold-500); box-shadow: var(--shadow-xs); }
.grp__tag:active { transform: translateY(1px); }
.grp__tag:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.grp__tag-ico { font-size: .82em; opacity: .65; }
.grp__tag-name { line-height: 1.1; }

/* ✕: sempre visibile (larghezza fissa, il badge non cambia mai dimensione).
   A riposo tenue; badge in hover la accende un po'; ✕ in hover vira al rosso
   (effetto distinto dal badge) per dire "premi qui per scollegare". */
.grp__tag-x {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.2em; height: 1.2em; margin-left: .15rem;
  border: none; background: none; padding: 0; cursor: pointer;
  color: var(--text-faint); border-radius: var(--radius-pill); font-size: .95em; line-height: 1;
  transition: color .15s, background .15s;
}
.grp__tag:hover .grp__tag-x,
.grp__tag:focus-within .grp__tag-x { color: var(--text-muted); }
.grp__tag-x:hover { color: var(--ember-500); background: var(--danger-tint); }
.grp__tag-x:focus-visible { outline: none; opacity: 1; box-shadow: var(--shadow-focus); }

/* Riga "aggiungi": affordance discreta che emerge all'hover dell'area. */
.grp__addline {
  align-self: flex-start; display: inline-flex; align-items: center; gap: .3rem;
  margin-left: -.4rem; padding: .22rem .4rem; cursor: pointer;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-muted);
  background: none; border: 1px dashed transparent; border-radius: var(--radius-sm);
  opacity: 0; transition: opacity .15s, color .15s, border-color .15s, background .15s;
}
.grp:hover .grp__addline,
.grp:focus-within .grp__addline,
.grp--picking .grp__addline,
.grp__addline.is-empty { opacity: 1; }
.grp__addline:hover,
.grp--picking .grp__addline { color: var(--gold-700); border-color: var(--line-gold); background: var(--accent-tint); }
.grp__add-ico { font-size: .9em; }

/* Combobox teleportato su <body>. */
.grp__pop {
  z-index: 1100; max-width: min(20rem, calc(100vw - 1rem)); max-height: 15rem; overflow: auto;
  background: var(--surface-card); border: 1px solid var(--line-gold);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: .3rem;
}
.grp__search { display: flex; align-items: center; gap: .4rem; padding: .3rem .4rem .4rem; border-bottom: 1px solid var(--border-hairline); }
.grp__search-ico { flex: 0 0 auto; color: var(--text-faint); font-size: .9em; }
.grp__search-input {
  width: 100%; border: none; background: none; outline: none;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-strong);
}
.grp__search-input::placeholder { color: var(--text-muted); opacity: 1; }
.grp__opts { list-style: none; margin: 0; padding: .25rem 0 0; display: flex; flex-direction: column; gap: 1px; }
.grp__opt {
  width: 100%; display: flex; align-items: center; gap: .5rem; text-align: left;
  border: none; background: none; cursor: pointer; border-radius: var(--radius-sm);
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-body); padding: .4rem .5rem;
  transition: background .12s, color .12s;
}
.grp__opt:hover,
.grp__opt:focus-visible { outline: none; background: var(--accent-tint); color: var(--gold-700); }
.grp__opt-ico { flex: 0 0 auto; color: var(--text-faint); font-size: .9em; }
/* "Crea …": separata dai match esistenti, accento oro sull'azione di creazione. */
.grp__opt--create { color: var(--gold-700); margin-top: 1px; border-top: 1px solid var(--border-hairline); border-radius: 0 0 var(--radius-sm) var(--radius-sm); }
.grp__opt--create .grp__opt-ico { color: var(--gold-600); }
.grp__opt--create strong { font-weight: var(--fw-semibold); }
.grp__opt-empty { padding: .5rem; font-size: var(--fs-sm); color: var(--text-faint); }

@media (max-width: 520px) { .grp { flex-direction: column; align-items: stretch; gap: .3rem; } }

/* Touch: niente hover → ✕, riga "aggiungi" e icona matita sempre visibili. */
@media (pointer: coarse) {
  .grp__tag-x { opacity: .7; }
  .grp__addline { opacity: 1; }
  .grp__opt { min-height: 44px; }
  .led__val-ico { opacity: .75; }
}
@media (prefers-reduced-motion: reduce) {
  .grp__tag, .grp__tag-x, .grp__addline, .grp__opt,
  .led__val--edit, .led__val-ico { transition: none; }
}
</style>
