<template>
  <!-- Testata anagrafica reale: legge/scrive lo STORE (dispatch verso i setter
       MODEL). Stessa resa "riga da registro" del mockup: valori forti, label
       mute, inline. Nessuna scatola, nessuna eyebrow oro. -->
  <section class="led" :aria-label="title">
    <!-- Ritratto: la tavola eletta a profilo (avatarPhotoId). Assente → niente
         medaglione, la testata resta piena larghezza. Si sceglie dalla Galleria. -->
    <div v-if="entity.avatarPhotoId" class="led__portrait"
      :class="{ 'led__portrait--char': kind === 'character' }">
      <GalleryThumb :photo-id="entity.avatarPhotoId" :focus="avatarFocus" :alt="portraitAlt" />
    </div>

    <div class="led__body">
    <!-- Riga meta: valori inline, ognuno editabile al click sul valore.
         Niente matita globale: l'affordance è per campo (hover → cornice + icona). -->
    <div class="led__read">
      <!-- Due colonne indipendenti (non una griglia a righe condivise): se un campo
           va a capo, la colonna accanto resta invariata. Distribuzione a parità di
           indice → stesso accoppiamento di righe della griglia precedente. -->
      <div class="led__cols">
        <div v-for="(col, ci) in metaCols" :key="ci" class="led__col">
        <div v-for="f in col" :key="f.key" class="led__item"
          :class="{ 'led__item--player': f.key === 'giocatore', 'led__item--role': f.key === 'ruolo' }">
          <span class="led__sep" aria-hidden="true">·</span>
          <!-- Etichetta: se il campo è derivato (livello, reputazione) il tooltip
               vive anche sul nome, non solo sul valore. -->
          <HoverTip v-if="f.tip" :text="f.tip" :label="f.label" class-name="led__k ds-hint">
            {{ f.label }}
          </HoverTip>
          <span v-else class="led__k">{{ f.label }}</span>

          <!-- Livello: derivato (somma classi), sola lettura. Tooltip che spiega
               che è un campo calcolato dalla classe. -->
          <HoverTip v-if="f.type === 'readonly'" :text="f.tip"
            :label="f.label" class-name="led__val ds-hint">
            {{ f.display }}
          </HoverTip>

          <!-- Reputazione: derivata dalle transazioni, sola lettura -->
          <HoverTip v-else-if="f.type === 'score'" :text="f.tip"
            label="Spiegazione punteggio sintetico" class-name="led__repchip">
            <ScoreChip :score="reputation" size="sm" />
          </HoverTip>

          <!-- Ruolo PG/PNG: toggle inline (primo campo della scheda personaggio). -->
          <button v-else-if="f.type === 'role'" type="button"
            class="led__roleval" :class="entity.isPg ? 'is-pg' : 'is-png'"
            :aria-pressed="entity.isPg" aria-label="Cambia ruolo (PG/PNG)"
            title="Clic: cambia PG/PNG" @click.stop="onRole">{{ f.display }}</button>

          <!-- Select inline (Razza, Allineamento, Giocatore, Guida) e combo
               ricercabile+crea (Tipo: etichetta libera). Pool-backed (oggetti
               {id,name}) vs libera (stringhe) via f.pool. -->
          <template v-else-if="f.type === 'select'">
            <button v-if="editingField !== f.key" type="button" class="led__val ds-inline-edit led__val--edit"
              :class="stateClass(f)" :aria-label="`Modifica ${f.label}`" @click.stop="startField(f.key)">
              <span v-if="!f.emptyable || f.state === 'filled'">{{ f.display }}</span>
              <span v-else-if="f.state === 'none'" class="led__none-word">{{ f.noneLabel }}</span>
              <span v-else class="led__todo" aria-label="Da definire">–</span>
              <Icon name="edit" class="ds-inline-edit__ico led__val-ico" />
            </button>
            <span v-else class="led__editwrap">
              <InlineSelect flush auto-open :creatable="f.creatable"
                :model-value="f.value" :options="f.options"
                :option-value="f.pool ? 'id' : ''" :option-label="f.pool ? 'name' : ''"
                :aria-label="f.label" @update:model-value="f.onUpdate($event)"
                @create="f.onCreate && f.onCreate($event)" @close="stopField" />
              <HoverTip v-if="f.emptyable" text="da definire"
                :tab-index="-1" class-name="led__none-tip">
                <button type="button" class="led__none-btn"
                  :aria-label="`Svuota ${f.label} (da definire)`"
                  @mousedown.prevent="clearField(f)"><Icon name="minus" /></button>
              </HoverTip>
              <HoverTip v-if="f.emptyable" text="nessuno"
                :tab-index="-1" class-name="led__none-tip">
                <button type="button" class="led__none-btn"
                  :aria-label="`Segna ${f.label} come nessuno`"
                  @mousedown.prevent="markFieldNone(f)"><Icon name="ban" /></button>
              </HoverTip>
            </span>
          </template>

          <!-- Testo inline (Sede, Motto) -->
          <template v-else-if="f.type === 'text'">
            <button v-if="editingField !== f.key" type="button" class="led__val ds-inline-edit led__val--edit"
              :class="stateClass(f)" :aria-label="`Modifica ${f.label}`" @click.stop="startTextField(f.key, f.value)">
              <span v-if="!f.emptyable || f.state === 'filled'">{{ f.display }}</span>
              <span v-else-if="f.state === 'none'" class="led__none-word">{{ f.noneLabel }}</span>
              <span v-else class="led__todo" aria-label="Da definire">–</span>
              <Icon name="edit" class="ds-inline-edit__ico led__val-ico" />
            </button>
            <span v-else class="led__editwrap">
              <input class="led__select led__input led__select--inline" type="text"
                v-model="textDraft" v-focus :aria-label="f.label"
                @blur="commitText(f)" @keydown.enter="commitText(f)" @keydown.escape="commitText(f)" />
              <HoverTip v-if="f.emptyable" text="da definire"
                :tab-index="-1" class-name="led__none-tip">
                <button type="button" class="led__none-btn"
                  :aria-label="`Svuota ${f.label} (da definire)`"
                  @mousedown.prevent="clearField(f)"><Icon name="minus" /></button>
              </HoverTip>
              <HoverTip v-if="f.emptyable" text="nessuno"
                :tab-index="-1" class-name="led__none-tip">
                <button type="button" class="led__none-btn"
                  :aria-label="`Segna ${f.label} come nessuno`"
                  @mousedown.prevent="markFieldNone(f)"><Icon name="ban" /></button>
              </HoverTip>
            </span>
          </template>

          <!-- Classe: valore sintetico come trigger; click apre un popover ricco
               teleportato (righe livello+classe) ancorato al valore → il layout
               della testata non si sposta mai. -->
          <template v-else-if="f.type === 'multiclass'">
            <button type="button" class="led__val ds-inline-edit led__val--edit"
              :class="[{ 'is-open': editingField === 'classe' }, stateClass(f)]"
              aria-haspopup="dialog" :aria-expanded="editingField === 'classe'"
              aria-label="Modifica classe e livelli" @click.stop="toggleClasse">
              <span v-if="f.state === 'filled'">{{ classLabel }}</span>
              <span v-else-if="f.state === 'none'" class="led__none-word">{{ f.noneLabel }}</span>
              <span v-else class="led__todo" aria-label="Da definire">–</span>
              <Icon name="edit" class="ds-inline-edit__ico led__val-ico" />
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
                    <button type="button" class="led__mcpop-rm"
                      aria-label="Rimuovi classe" @click.stop="removeClassRow(i)"><Icon name="close" /></button>
                  </div>
                  <p v-if="!entity.classLevels.length" class="led__mcpop-vuoto">Nessuna classe.</p>
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
    </div>
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
import GalleryThumb from './GalleryThumb.vue';
import { SCORE_TIP, LEVEL_TIP } from '../uiCopy.js';
import { useStore } from '../useStore.js';
import { createLookup } from '../../model/schema.js';
import {
  addLookupItem, listLookup,
  setRole, setRace, setAlignment, setPlayer, setClassLevels,
  setCharacterTags, characterLevel,
  setGroupType, setGroupSeat, setGroupGuide, setGroupMotto, setGroupTags,
  addMember, removeMember, addGroup, listActiveGroups,
  fieldState, confirmCharacterFieldEmpty, confirmGroupFieldEmpty,
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
const portraitAlt = computed(() => `Ritratto di ${props.entity.name || 'entità'}`);
// Punto focale dell'avatar: il medaglione in testata segue la reinquadratura scelta.
const avatarFocus = computed(() => {
  const id = props.entity.avatarPhotoId;
  if (!id) {
    return null;
  }
  const photo = state.value.photos.find((p) => p.id === id);
  const focus = photo ? photo.focus : null;
  return focus;
});

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
  // Crea il gruppo e iscrive subito il personaggio. Il nuovo gruppo si
  // identifica per id (diff prima/dopo la create), non per nome: un gruppo
  // omonimo preesistente non deve rubare l'iscrizione.
  const beforeIds = new Set(listActiveGroups(state.value).map((g) => g.id));
  dispatch((s) => addGroup(s, name, ''));
  const created = listActiveGroups(state.value).find((g) => !beforeIds.has(g.id));
  if (created) dispatch((s) => addMember(s, created.id, charId.value));
}

function goToGroup(it) {
  router.push({ name: 'groupProfile', params: { id: it.id } });
}

/* ---- Edit inline: un solo campo alla volta (null = tutto in lettura) ---- */
const editingField = ref(null);
function startField(key) { marking.value = false; editingField.value = key; }
function stopField() { editingField.value = null; }

// Campi testo (Sede, Motto): editor su una copia locale, persistita al commit
// (blur/invio/escape), come nel resto della testata.
const textDraft = ref('');
function startTextField(key, value) {
  textDraft.value = value;
  startField(key);
}
// Guard: quando si marca "nessuno" da un campo testo, il click sul bottone fa
// perdere il focus all'input → commitText scatterebbe riscrivendo la bozza (e
// scancellando il "confermato vuoto"). Il flag lo neutralizza.
const marking = ref(false);
function commitText(f) {
  if (marking.value) {
    stopField();
    return;
  }
  f.onUpdate(textDraft.value);
  stopField();
}

// "Segna come «nessuno»": conferma il campo vuoto (confirmedEmpty) invece di
// lasciarlo "da definire". Vale per i campi opzionali (f.emptyable).
function confirmEmpty(field) {
  if (props.kind === 'character') {
    dispatch((s) => confirmCharacterFieldEmpty(s, charId.value, field));
  } else {
    dispatch((s) => confirmGroupFieldEmpty(s, groupId.value, field));
  }
}
function markFieldNone(f) {
  // Resta true fino al prossimo edit (startField/startTextField): così il blur
  // di commit dell'input smontato non riscrive il valore, sconfermando il campo.
  marking.value = true;
  confirmEmpty(f.dataField);
  stopField();
}

// Svuota il campo → "da definire" (–): azzera il valore (null per i riferimenti,
// '' per i testi) senza confermarlo vuoto.
function clearField(f) {
  marking.value = true;
  const empty = f.pool ? null : '';
  f.onUpdate(empty);
  stopField();
}


// Classi-modificatore del valore in lettura secondo il tri-stato del campo.
function stateClass(f) {
  const cls = {
    'led__val--absent': f.emptyable && f.state === 'absent',
    'led__val--none': f.emptyable && f.state === 'none',
  };
  return cls;
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

// Descrittori dei campi meta: tipo di controllo + sorgente valore.
// Derivati (livello, reputazione) → sola lettura; classe → editor multiclasse.
// Il ruolo (PG/PNG) esce dai campi: è un badge sopra la griglia.
const fields = computed(() => {
  if (props.kind === 'character') {
    const characterFields = [
      { key: 'ruolo', label: 'Ruolo', type: 'role', display: props.entity.isPg ? 'PG' : 'PNG' },
      { key: 'razza', label: 'Razza', type: 'select', pool: true, creatable: true,
        value: props.entity.raceId, display: raceLabel.value, options: races.value,
        onUpdate: onRace, onCreate: onCreateRace,
        emptyable: true, dataField: 'raceId', noneLabel: 'nessuna',
        state: fieldState(props.entity, 'raceId') },
      { key: 'classe', label: 'Classe', type: 'multiclass',
        emptyable: true, dataField: 'classLevels', noneLabel: 'nessuna',
        state: fieldState(props.entity, 'classLevels') },
      { key: 'allineamento', label: 'Allineamento', type: 'select', pool: false, creatable: true,
        value: props.entity.alignment, display: props.entity.alignment || EMPTY, options: ALIGNMENTS,
        onUpdate: onAlignment, onCreate: null,
        emptyable: true, dataField: 'alignment', noneLabel: 'nessuno',
        state: fieldState(props.entity, 'alignment') },
      { key: 'livello', label: 'Livello', type: 'readonly', display: String(totalLevel.value), tip: LEVEL_TIP },
      { key: 'reputazione', label: 'Reputazione', type: 'score', tip: SCORE_TIP },
    ];
    if (props.entity.isPg) {
      characterFields.push({ key: 'giocatore', label: 'Giocatore', type: 'select', pool: true, creatable: true,
        value: props.entity.playerId, display: playerLabel.value, options: players.value,
        onUpdate: onPlayer, onCreate: onCreatePlayer,
        emptyable: true, dataField: 'playerId', noneLabel: 'nessuno',
        state: fieldState(props.entity, 'playerId') });
    }
    return characterFields;
  }
  const groupFields = [
    { key: 'tipo', label: 'Tipo', type: 'select', pool: false, creatable: true,
      value: props.entity.type, display: props.entity.type || EMPTY, options: TYPES,
      onUpdate: onType, onCreate: null,
      emptyable: true, dataField: 'type', noneLabel: 'nessuno',
      state: fieldState(props.entity, 'type') },
    { key: 'sede', label: 'Sede', type: 'text',
      value: props.entity.seat, display: props.entity.seat || EMPTY, onUpdate: onSeat,
      emptyable: true, dataField: 'seat', noneLabel: 'nessuna',
      state: fieldState(props.entity, 'seat') },
    { key: 'guida', label: 'Guida', type: 'select', pool: true, creatable: false,
      value: props.entity.guideId, display: guideLabel.value, options: memberOptions.value,
      onUpdate: onGuide, onCreate: null,
      emptyable: true, dataField: 'guideId', noneLabel: 'nessuna',
      state: fieldState(props.entity, 'guideId') },
    { key: 'motto', label: 'Motto', type: 'text',
      value: props.entity.motto, display: props.entity.motto || EMPTY, onUpdate: onMotto,
      emptyable: true, dataField: 'motto', noneLabel: 'nessuno',
      state: fieldState(props.entity, 'motto') },
    { key: 'reputazione', label: 'Reputazione', type: 'score', tip: SCORE_TIP },
  ];
  return groupFields;
});

// Due colonne a parità di indice: [pari] a sinistra, [dispari] a destra. Ogni
// colonna impila i propri campi in modo indipendente (vedi .led__col).
const metaCols = computed(() => {
  const all = fields.value;
  const left = all.filter((_, i) => i % 2 === 0);
  const right = all.filter((_, i) => i % 2 === 1);
  const cols = [left, right];
  return cols;
});
</script>

<style scoped>
.led {
  position: relative;
  border-top: 1px solid var(--border-hairline);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);
}
.led__body { flex: 1 1 auto; min-width: 0; }

/* Ritratto di profilo: medaglione incorniciato d'oro, come una tavola eletta. */
.led__portrait {
  flex: 0 0 auto;
  width: 6.5rem;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: 2px solid var(--gold-500);
  box-shadow: 0 0 0 3px var(--accent-tint), var(--shadow-sm);
  background: var(--surface-panel);
}
@media (max-width: 520px) {
  .led__portrait { width: 4.75rem; }
  .led { gap: var(--space-4); }
  /* Avatar del personaggio nascosto su telefono: la testata resta compatta. */
  .led__portrait--char { display: none; }
}

/* --- meta (lettura): campi impilati su due colonne, ciascuno col "·" --- */
.led__read { position: relative; }
/* Due colonne come contenitori flex indipendenti: le altezze non si accoppiano
   riga per riga, così un campo che va a capo non aggiunge spazio all'altra colonna. */
.led__cols {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 1.5rem;
  font-family: var(--font-sans); font-size: var(--fs-body); line-height: 1.4;
}
.led__col { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
/* min-height riserva lo spazio del controllo di modifica: aprendo il select
   la riga non cresce e le righe restano allineate (lettura ed edit stessa altezza). */
/* align-items: flex-start → con un valore su più righe l'etichetta resta in alto
   (allineata alla prima riga), non centrata verticalmente sul blocco. */
.led__item { display: flex; align-items: flex-start; gap: .4rem; min-width: 0; min-height: 1.7rem; }
/* Ruolo (pill, non va mai a capo): baseline → il badge PG/PNG allinea al nome campo. */
.led__item--role { align-items: baseline; }
.led__repchip { display: inline-flex; }
/* Chip vuoto "–": il glifo trattino siede alto nella pill → sembra avere più
   padding sotto. Ricentro il glifo dentro la pill (solo qui, non nel DS). */
.led__repchip :deep(.ds-score--empty) { padding-top: .3em; padding-bottom: .14em; }
@media (max-width: 520px) { .led__cols { grid-template-columns: 1fr; } }

/* Ruolo PG/PNG: primo campo meta, valore-toggle a pill. Default PNG (grigio),
   clic → PG (oro tenue). */
.led__roleval {
  font-family: var(--font-display); font-size: var(--fs-label);
  font-weight: var(--fw-semibold); letter-spacing: var(--ls-caps); text-transform: uppercase;
  border-radius: var(--radius-pill); padding: .1rem .5rem; line-height: 1.15;
  border: 1px solid; cursor: pointer;
  transition: background .15s, color .15s, border-color .15s, transform .1s;
}
.led__roleval:active { transform: translateY(1px); }
.led__roleval:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.led__roleval.is-pg { background: var(--accent-tint); color: var(--gold-700); border-color: var(--line-gold); }
.led__roleval.is-pg:hover { border-color: var(--gold-500); }
.led__roleval.is-png { background: var(--surface-panel); color: var(--text-muted); border-color: var(--border-hairline); }
.led__roleval.is-png:hover { color: var(--text-strong); border-color: var(--border-strong); }
.led__val { color: var(--text-strong); font-weight: var(--fw-semibold); overflow-wrap: anywhere; }
.led__sep { color: var(--text-faint); font-weight: 400; }
.led__k { color: var(--text-muted); }
/* Nome campo seguito da due punti: "· Livello: 6". Un solo punto di verità.
   margin-right → piccolo respiro tra ":" e il contenuto (solo lì, non sul middot). */
.led__k::after { content: ':'; margin-right: .18rem; }

/* Override locali sopra .ds-inline-edit (base condivisa in main.css): tipografia
   del valore + spaziatura/rientro specifici della riga di registro. */
.led__val--edit {
  font: inherit; color: var(--text-strong); font-weight: var(--fw-semibold);
  gap: .3rem; margin: -.1rem -.35rem; padding: .1rem .35rem;
}
.led__val-ico { font-size: .78em; }

/* --- Tri-stato del campo opzionale ---
   "Da definire" (assente): trattino oro con sottolineatura punteggiata → summons,
   c'è lavoro qui. "nessuno/a" (confermato vuoto): parola faint corsivo → stato
   chiuso, vuoto per scelta. Entrambi restano cliccabili per modificare. */
.led__todo {
  color: var(--text-muted); font-weight: var(--fw-semibold);
  letter-spacing: .05em;
}
.led__none-word {
  color: var(--text-faint); font-weight: 400; font-style: italic;
}
/* Sul valore assente/confermato la matita è più discreta (non è un dato forte). */
.led__val--absent .led__val-ico,
.led__val--none .led__val-ico { opacity: 0; }
.led__val--absent:hover .led__val-ico,
.led__val--none:hover .led__val-ico { opacity: .6; }

/* Editor + azioni compatte «vuoto»/«nessuno» affiancate. Il select può
   restringersi (min-width:0 → il valore lungo tronca con ellissi) così le
   iconcine restano sempre dentro la cella, senza sforare sulla colonna a lato. */
.led__editwrap { display: inline-flex; align-items: center; gap: .3rem; min-width: 0; max-width: 100%; }
.led__editwrap :deep(.isel) { flex: 1 1 auto; min-width: 0; }
.led__none-tip { display: inline-flex; flex: 0 0 auto; }
.led__none-btn {
  flex: 0 0 auto; display: inline-grid; place-items: center; cursor: pointer;
  width: 1.5rem; height: 1.5rem; padding: 0; font-size: .82rem;
  color: var(--text-muted); background: none;
  border: 1px solid var(--border-hairline); border-radius: var(--radius-sm);
  transition: color .15s, border-color .15s, background .15s;
}
.led__none-btn:hover { color: var(--gold-700); border-color: var(--line-gold); background: var(--accent-tint); }
.led__none-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

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
.led__mcpop-vuoto { margin: .1rem 0; font-size: var(--fs-sm); color: var(--text-muted); font-style: italic; }
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
