<template>
  <!-- Testata anagrafica reale: legge/scrive lo STORE (dispatch verso i setter
       MODEL). Stessa resa "riga da registro" del mockup: valori forti, label
       mute, inline. Nessuna scatola, nessuna eyebrow oro. -->
  <section class="led" :aria-label="title">
    <!-- Riga meta: valori inline, ognuno editabile al click sul valore.
         Niente matita globale: l'affordance è per campo (hover → cornice + icona). -->
    <div class="led__read">
      <button v-if="kind === 'character'" type="button" class="led__role"
        :class="entity.isPg ? 'led__role--pg' : 'led__role--png'" :aria-pressed="entity.isPg"
        aria-label="Cambia ruolo (PG/PNG)" title="Clic: cambia PG/PNG"
        @click="onRole">{{ entity.isPg ? 'PG' : 'PNG' }}</button>

      <div class="led__grid">
        <div v-for="f in fields" :key="f.key" class="led__item"
          :class="{ 'led__item--player': f.key === 'giocatore' }">
          <span class="led__sep" aria-hidden="true">·</span>
          <span class="led__k">{{ f.label }}</span>

          <!-- Livello: derivato (somma classi), sola lettura -->
          <span v-if="f.type === 'readonly'" class="led__val">{{ f.display }}</span>

          <!-- Reputazione: derivata dalle transazioni, sola lettura -->
          <HoverTip v-else-if="f.type === 'score'" :text="SCORE_TIP"
            label="Spiegazione punteggio sintetico" class-name="led__repchip">
            <ScoreChip :score="reputation" size="sm" />
          </HoverTip>

          <!-- Select inline (Razza, Allineamento, Giocatore, Guida) e combo
               ricercabile+crea (Tipo: etichetta libera). Pool-backed (oggetti
               {id,name}) vs libera (stringhe) via f.pool. -->
          <template v-else-if="f.type === 'select'">
            <button v-if="editingField !== f.key" type="button" class="led__val led__val--edit"
              :aria-label="`Modifica ${f.label}`" @click.stop="startField(f.key)">
              <span>{{ f.display }}</span>
              <Icon name="edit" class="led__val-ico" />
            </button>
            <InlineSelect v-else flush auto-open :creatable="f.creatable"
              :model-value="f.value" :options="f.options"
              :option-value="f.pool ? 'id' : ''" :option-label="f.pool ? 'name' : ''"
              :aria-label="f.label" @update:model-value="f.onUpdate($event)"
              @create="f.onCreate && f.onCreate($event)" @close="stopField" />
          </template>

          <!-- Testo inline (Sede, Motto) -->
          <template v-else-if="f.type === 'text'">
            <button v-if="editingField !== f.key" type="button" class="led__val led__val--edit"
              :aria-label="`Modifica ${f.label}`" @click.stop="startTextField(f.key, f.value)">
              <span>{{ f.display }}</span>
              <Icon name="edit" class="led__val-ico" />
            </button>
            <input v-else class="led__select led__input led__select--inline" type="text"
              v-model="textDraft" v-focus :aria-label="f.label"
              @blur="commitText(f)" @keydown.enter="commitText(f)" @keydown.escape="commitText(f)" />
          </template>

          <!-- Classe: valore sintetico come trigger; click apre un popover ricco
               teleportato (righe livello+classe) ancorato al valore → il layout
               della testata non si sposta mai. -->
          <template v-else-if="f.type === 'multiclass'">
            <button type="button" class="led__val led__val--edit"
              :class="{ 'is-open': editingField === 'classe' }"
              aria-haspopup="dialog" :aria-expanded="editingField === 'classe'"
              aria-label="Modifica classe e livelli" @click.stop="toggleClasse">
              <span>{{ classLabel }}</span>
              <Icon name="edit" class="led__val-ico" />
            </button>
            <Teleport to="body">
              <div v-if="editingField === 'classe'" class="led__mcpop" :style="classePopStyle"
                role="dialog" aria-label="Classe e livelli" @click.stop>
                <div class="led__mcpop-rows">
                  <div v-for="(c, i) in entity.classLevels" :key="i" class="led__mcpop-row">
                    <InlineSelect class="led__mcpop-lvl" :model-value="c.level" :options="LEVELS"
                      aria-label="Livello classe" @update:model-value="setClassRow(i, { level: $event })" />
                    <InlineSelect :model-value="c.classId" :options="classPool"
                      option-value="id" option-label="name" creatable
                      aria-label="Classe" @update:model-value="setClassRow(i, { classId: $event })"
                      @create="onCreateClass(i, $event)" />
                    <button v-if="entity.classLevels.length > 1" type="button" class="led__mcpop-rm"
                      aria-label="Rimuovi classe" @click.stop="removeClassRow(i)"><Icon name="close" /></button>
                  </div>
                </div>
                <div class="led__mcpop-foot">
                  <button type="button" class="led__mcpop-add" @click.stop="addClassRow">
                    <Icon name="plus" /> classe
                  </button>
                  <span class="led__mcpop-total">Totale liv. {{ totalLevel }}</span>
                </div>
              </div>
            </Teleport>
          </template>
        </div>
      </div>
    </div>

    <!-- Campi many2many inline (widget riusabile): badge + combobox filtrabile.
         Gruppi solo per i personaggi (membership reale); Tag per personaggi e gruppi. -->
    <Many2ManyField v-if="kind === 'character'" label="Gruppi" :model-value="charGroupIds"
      :pool="allGroups" icon="users" navigable
      add-text="aggiungi gruppo…" empty-text="Nessun gruppo · aggiungi"
      search-placeholder="cerca gruppo…" @update:model-value="onCharGroups"
      @create="onCreateGroup" @navigate="goToGroup" />
    <Many2ManyField label="Tag" :model-value="entity.tagIds" :pool="tagPool" icon="tag"
      add-text="aggiungi tag…" empty-text="Nessun tag · aggiungi"
      search-placeholder="cerca tag…" @update:model-value="onEntityTags" @create="onCreateEntityTag" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Icon from './Icon.vue';
import ScoreChip from './ScoreChip.vue';
import HoverTip from './HoverTip.vue';
import InlineSelect from './InlineSelect.vue';
import Many2ManyField from './Many2ManyField.vue';
import { SCORE_TIP } from '../uiCopy.js';
import { useStore } from '../useStore.js';
import { createLookup } from '../../model/schema.js';
import {
  addLookupItem, listLookup,
  setRole, setRace, setAlignment, setPlayer, setClassLevels,
  setCharacterTags, characterLevel,
  setGroupType, setGroupSeat, setGroupGuide, setGroupMotto, setGroupTags,
  addMember, removeMember, addGroup, listActiveGroups,
} from '../../model/reputation.js';

const router = useRouter();
const { state, dispatch } = useStore();

const props = defineProps({
  // 'character' | 'group' — decide quali campi mostrare.
  kind: { type: String, required: true },
  // Il personaggio o gruppo reale (record dello STORE).
  entity: { type: Object, required: true },
  // Reputazione complessiva (dato reale dal profilo). null → pill vuota.
  reputation: { type: Number, default: null },
});

const title = computed(() => (props.kind === 'character' ? 'Scheda anagrafica' : 'Scheda del gruppo'));

// Segnaposto per campo lookup non ancora impostato.
const EMPTY = '–';

/* ---- Suggerimenti locali (non pool: etichette libere) ---- */
const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const ALIGNMENTS = ['Legale Buono', 'Neutrale Buono', 'Caotico Buono',
  'Legale Neutrale', 'Neutrale', 'Caotico Neutrale',
  'Legale Malvagio', 'Neutrale Malvagio', 'Caotico Malvagio'];
const TYPES = ['Fazione', 'Città', 'Gilda', 'Villaggio', 'Casato', 'Ordine', 'Clan'];

/* ---- Pool reattivi (dallo STORE) per i picker con creazione al volo ---- */
const races = computed(() => listLookup(state.value, 'races'));
const players = computed(() => listLookup(state.value, 'players'));
const classPool = computed(() => listLookup(state.value, 'classes'));
const tagPool = computed(() => listLookup(state.value, 'tags'));

// Crea una voce nel pool e ritorna il suo id (poi il chiamante applica il setter specifico).
function createInPool(coll, name) {
  const item = createLookup(name);
  dispatch((s) => addLookupItem(s, coll, item));
  return item.id;
}

function labelOf(pool, id, fallback) {
  const found = pool.find((x) => x.id === id);
  const label = found ? found.name : fallback;
  return label;
}

/* ---- Personaggio ---- */
const charId = computed(() => props.entity.id);
const raceLabel = computed(() => labelOf(races.value, props.entity.raceId, EMPTY));
const playerLabel = computed(() => labelOf(players.value, props.entity.playerId, EMPTY));

function onRole() {
  const nextIsPg = !props.entity.isPg;
  dispatch((s) => setRole(s, charId.value, nextIsPg));
}
function onRace(raceId) { dispatch((s) => setRace(s, charId.value, raceId)); }
function onCreateRace(name) {
  const id = createInPool('races', name);
  dispatch((s) => setRace(s, charId.value, id));
}
function onAlignment(a) { dispatch((s) => setAlignment(s, charId.value, a)); }
function onPlayer(pid) { dispatch((s) => setPlayer(s, charId.value, pid)); }
function onCreatePlayer(name) {
  const id = createInPool('players', name);
  dispatch((s) => setPlayer(s, charId.value, id));
}
function onCharTags(ids) { dispatch((s) => setCharacterTags(s, charId.value, ids)); }
function onCreateCharTag(name) {
  const id = createInPool('tags', name);
  const nextIds = [...props.entity.tagIds, id];
  dispatch((s) => setCharacterTags(s, charId.value, nextIds));
}

/* ---- Multiclasse: livello personaggio = somma dei livelli di classe ---- */
function commitClassLevels(next) {
  dispatch((s) => setClassLevels(s, charId.value, next));
}
function setClassRow(i, patch) {
  const next = props.entity.classLevels.map((cl, idx) => (idx === i ? { ...cl, ...patch } : cl));
  commitClassLevels(next);
}
function addClassRow() {
  const first = classPool.value[0];
  const classId = first ? first.id : createInPool('classes', 'Guerriero');
  const next = [...props.entity.classLevels, { classId, level: 1 }];
  commitClassLevels(next);
}
function removeClassRow(i) {
  const next = props.entity.classLevels.filter((_, idx) => idx !== i);
  commitClassLevels(next);
}
function onCreateClass(i, name) {
  const id = createInPool('classes', name);
  setClassRow(i, { classId: id });
}
const totalLevel = computed(() => characterLevel(props.entity));
const classLabel = computed(() => {
  const parts = props.entity.classLevels.map((cl) => {
    const k = classPool.value.find((x) => x.id === cl.classId);
    const name = k ? k.name : '?';
    const part = `${cl.level} ${name}`;
    return part;
  });
  const label = parts.length ? parts.join(' / ') : 'nessuna classe';
  return label;
});

/* ---- Gruppo ---- */
const groupId = computed(() => props.entity.id);
// Pool della Guida: i membri del gruppo (id→nome).
const memberOptions = computed(() => {
  const opts = props.entity.memberIds
    .map((mid) => state.value.characters.find((c) => c.id === mid))
    .filter(Boolean)
    .map((c) => ({ id: c.id, name: c.name }));
  return opts;
});
const guideLabel = computed(() => labelOf(memberOptions.value, props.entity.guideId, EMPTY));

function onType(t) { dispatch((s) => setGroupType(s, groupId.value, t)); }
function onSeat(v) { dispatch((s) => setGroupSeat(s, groupId.value, v)); }
function onGuide(cid) { dispatch((s) => setGroupGuide(s, groupId.value, cid)); }
function onMotto(v) { dispatch((s) => setGroupMotto(s, groupId.value, v)); }
function onGroupTags(ids) { dispatch((s) => setGroupTags(s, groupId.value, ids)); }
function onCreateGroupTag(name) {
  const id = createInPool('tags', name);
  const nextIds = [...props.entity.tagIds, id];
  dispatch((s) => setGroupTags(s, groupId.value, nextIds));
}

/* ---- Tag: campo condiviso personaggio/gruppo ---- */
function onEntityTags(ids) {
  if (props.kind === 'character') onCharTags(ids);
  else onGroupTags(ids);
}
function onCreateEntityTag(name) {
  if (props.kind === 'character') onCreateCharTag(name);
  else onCreateGroupTag(name);
}

/* ---- Gruppi del personaggio (m2m su membership reale, non un pool) ---- */
const allGroups = computed(() => {
  const opts = listActiveGroups(state.value).map((g) => ({ id: g.id, name: g.name }));
  return opts;
});
const charGroupIds = computed(() => {
  const ids = listActiveGroups(state.value)
    .filter((g) => g.memberIds.includes(charId.value))
    .map((g) => g.id);
  return ids;
});
function onCharGroups(nextIds) {
  const current = charGroupIds.value;
  const added = nextIds.filter((id) => !current.includes(id));
  const removed = current.filter((id) => !nextIds.includes(id));
  for (const gid of added) dispatch((s) => addMember(s, gid, charId.value));
  for (const gid of removed) dispatch((s) => removeMember(s, gid, charId.value));
}
function onCreateGroup(name) {
  // Crea il gruppo e iscrive subito il personaggio.
  dispatch((s) => addGroup(s, name, ''));
  const created = listActiveGroups(state.value)
    .find((g) => g.name === name && !g.memberIds.includes(charId.value));
  if (created) dispatch((s) => addMember(s, created.id, charId.value));
}

function goToGroup(it) {
  router.push({ name: 'groupProfile', params: { id: it.id } });
}

/* ---- Edit inline: un solo campo alla volta (null = tutto in lettura) ---- */
const editingField = ref(null);
function startField(key) { editingField.value = key; }
function stopField() { editingField.value = null; }

// Campi testo (Sede, Motto): editor su una copia locale, persistita al commit
// (blur/invio/escape), come nel resto della testata.
const textDraft = ref('');
function startTextField(key, value) {
  textDraft.value = value;
  startField(key);
}
function commitText(f) {
  f.onUpdate(textDraft.value);
  stopField();
}

// Classe: popover ricco teleportato ancorato al valore (il layout non si sposta).
const classePopStyle = ref(null);
function anchorClasse(el) {
  const r = el.getBoundingClientRect();
  classePopStyle.value = {
    position: 'fixed',
    top: `${r.bottom + 6}px`,
    left: `${r.left}px`,
    minWidth: `${Math.max(r.width, 220)}px`,
  };
}
function toggleClasse(e) {
  if (editingField.value === 'classe') { stopField(); return; }
  anchorClasse(e.currentTarget);
  startField('classe');
}
// Chiude cliccando fuori / Esc / scroll di pagina. Guardia: ignora i click e lo
// scroll dentro il popover e dentro i popover teleportati degli InlineSelect
// (altrimenti scegliere livello/classe chiuderebbe tutto).
function insidePopover(target) {
  const inside = !!(target?.closest?.('.led__mcpop') || target?.closest?.('.isel__pop'));
  return inside;
}
function onClasseDocClick(e) {
  if (editingField.value === 'classe' && !insidePopover(e.target)) stopField();
}
function onClasseKey(e) {
  if (e.key === 'Escape' && editingField.value === 'classe' && !document.querySelector('.isel__pop')) {
    stopField();
  }
}
function onClasseViewport(e) {
  if (editingField.value !== 'classe') return;
  if (e?.type === 'scroll' && insidePopover(e.target)) return;
  stopField();
}
onMounted(() => {
  document.addEventListener('click', onClasseDocClick);
  document.addEventListener('keydown', onClasseKey);
  window.addEventListener('scroll', onClasseViewport, true);
  window.addEventListener('resize', onClasseViewport);
});
onUnmounted(() => {
  document.removeEventListener('click', onClasseDocClick);
  document.removeEventListener('keydown', onClasseKey);
  window.removeEventListener('scroll', onClasseViewport, true);
  window.removeEventListener('resize', onClasseViewport);
});
// Autofocus sul controllo appena montato all'apertura dell'edit inline.
const vFocus = { mounted(el) { el.focus(); } };

// Descrittori dei campi meta: tipo di controllo + sorgente valore.
// Derivati (livello, reputazione) → sola lettura; classe → editor multiclasse.
// Il ruolo (PG/PNG) esce dai campi: è un badge sopra la griglia.
const fields = computed(() => {
  if (props.kind === 'character') {
    const characterFields = [
      { key: 'razza', label: 'Razza', type: 'select', pool: true, creatable: true,
        value: props.entity.raceId, display: raceLabel.value, options: races.value,
        onUpdate: onRace, onCreate: onCreateRace },
      { key: 'classe', type: 'multiclass' },
      { key: 'allineamento', label: 'Allineamento', type: 'select', pool: false, creatable: true,
        value: props.entity.alignment, display: props.entity.alignment || EMPTY, options: ALIGNMENTS,
        onUpdate: onAlignment, onCreate: null },
      { key: 'livello', label: 'Livello', type: 'readonly', display: String(totalLevel.value) },
      { key: 'reputazione', label: 'Reputazione', type: 'score' },
    ];
    if (props.entity.isPg) {
      characterFields.push({ key: 'giocatore', label: 'Giocatore', type: 'select', pool: true, creatable: true,
        value: props.entity.playerId, display: playerLabel.value, options: players.value,
        onUpdate: onPlayer, onCreate: onCreatePlayer });
    }
    return characterFields;
  }
  const groupFields = [
    { key: 'tipo', label: 'Tipo', type: 'select', pool: false, creatable: true,
      value: props.entity.type, display: props.entity.type || EMPTY, options: TYPES,
      onUpdate: onType, onCreate: null },
    { key: 'sede', label: 'Sede', type: 'text',
      value: props.entity.seat, display: props.entity.seat || EMPTY, onUpdate: onSeat },
    { key: 'guida', label: 'Guida', type: 'select', pool: true, creatable: false,
      value: props.entity.guideId, display: guideLabel.value, options: memberOptions.value,
      onUpdate: onGuide, onCreate: null },
    { key: 'motto', label: 'Motto', type: 'text',
      value: props.entity.motto, display: props.entity.motto || EMPTY, onUpdate: onMotto },
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
/* min-height riserva lo spazio del controllo di modifica: aprendo il select
   la riga non cresce e le righe restano allineate (lettura ed edit stessa altezza). */
.led__item { display: flex; align-items: center; gap: .4rem; min-width: 0; min-height: 1.7rem; }
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
.led__select.led__select--inline {
  font-size: var(--fs-body); font-weight: var(--fw-semibold);
  box-sizing: border-box; height: 1.7rem; line-height: 1.4;
  padding-top: 0; padding-bottom: 0;
  /* stesso rientro del valore in lettura (button con margin/padding -.35/.35):
     il testo resta fermo passando da lettura a select. */
  margin-left: -.35rem; padding-left: .35rem;
}
.led__select {
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-strong);
  background: var(--surface-card); border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm); padding: .3rem 1.5rem .3rem .5rem;
  cursor: pointer; appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4 L6 8 L10 4' fill='none' stroke='%237a5c1f' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat: no-repeat; background-position: right .45rem center; background-size: .65rem;
}
.led__input { padding-right: .5rem; background-image: none; cursor: text; }

/* Valore Classe aperto: mantiene la cornice oro del trigger. */
.led__val--edit.is-open { background: var(--accent-tint); border-color: var(--line-gold); }
.led__val--edit.is-open .led__val-ico { opacity: .75; }

/* Popover ricco Classe: teleportato, righe livello+classe + totale. */
.led__mcpop {
  z-index: 1100; max-width: min(22rem, calc(100vw - 1rem));
  background: var(--surface-card); border: 1px solid var(--line-gold);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md); padding: .5rem;
  display: flex; flex-direction: column; gap: .45rem;
}
.led__mcpop-rows { display: flex; flex-direction: column; gap: .35rem; }
.led__mcpop-row { display: flex; align-items: center; gap: .4rem; }
.led__mcpop-lvl :deep(.isel__trigger) { min-width: 2.8rem; }
.led__mcpop-rm {
  margin-left: auto; background: none; border: none; cursor: pointer; line-height: 1;
  color: var(--text-faint); padding: .2rem; border-radius: var(--radius-sm);
  transition: color .15s;
}
.led__mcpop-rm:hover { color: var(--ember-500); }
.led__mcpop-foot {
  display: flex; align-items: center; justify-content: space-between; gap: .6rem;
  padding-top: .4rem; border-top: 1px solid var(--border-hairline);
}
.led__mcpop-add {
  display: inline-flex; align-items: center; gap: .3rem; cursor: pointer;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-muted);
  background: none; border: 1px dashed transparent; border-radius: var(--radius-sm); padding: .2rem .4rem;
  transition: color .15s, border-color .15s, background .15s;
}
.led__mcpop-add:hover { color: var(--gold-700); border-color: var(--line-gold); background: var(--accent-tint); }
.led__mcpop-total { font-size: var(--fs-sm); color: var(--text-muted); }
.led__select:hover { border-color: var(--gold-500); }
.led__select:focus { outline: none; border-color: var(--gold-500); box-shadow: var(--shadow-focus); }

/* Giocatore (solo PG): valore oro per distinguerlo. */
.led__item--player .led__val { color: var(--gold-600); font-weight: var(--fw-semibold); }

/* Touch: niente hover → l'icona matita dei valori resta visibile. */
@media (pointer: coarse) {
  .led__val-ico { opacity: .75; }
}
@media (prefers-reduced-motion: reduce) {
  .led__val--edit, .led__val-ico { transition: none; }
}
</style>
