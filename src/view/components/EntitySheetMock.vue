<template>
  <!-- MOCKUP: dati HARDCODATI (ref locali), non persistiti, nessun STORE/MODEL.
       Resa "riga da registro": valori forti, label mute, inline. Nessuna scatola,
       nessuna eyebrow oro. Serve a valutare il look nelle testate profilo. -->
  <section class="led" :aria-label="title">
    <!-- Comando in alto a destra: matita (con tooltip "Modifica") ↔ "Fatto" in modifica. -->
    <div class="led__topright">
      <HoverTip v-if="!editing" text="Modifica" :tab-index="-1">
        <button type="button" class="led__pencil" aria-label="Modifica dati" @click="editing = true">
          <Icon name="edit" />
        </button>
      </HoverTip>
      <button v-else type="button" class="ds-btn ds-btn--sm ds-btn--ghost" @click="editing = false">
        <span class="ds-btn__icon"><Icon name="check" /></span> Fatto
      </button>
    </div>

    <!-- Riga meta: lettura immediata (default) -->
    <div v-if="!editing" class="led__read">
      <button v-if="kind === 'character'" type="button" class="led__role"
        :class="isPg ? 'led__role--pg' : 'led__role--png'" :aria-pressed="isPg"
        aria-label="Cambia ruolo (PG/PNG)" title="Clic: cambia PG/PNG"
        @click="isPg = !isPg">{{ isPg ? 'PG' : 'PNG' }}</button>

      <div class="led__grid">
        <div v-for="f in facts" :key="f.k" class="led__item">
          <span class="led__sep" aria-hidden="true">·</span>
          <span class="led__k">{{ f.k }}</span>
          <span class="led__val">{{ f.v }}</span>
        </div>
        <div class="led__item">
          <span class="led__sep" aria-hidden="true">·</span>
          <span class="led__k">Reputazione</span>
          <HoverTip :text="SCORE_TIP" label="Spiegazione punteggio sintetico" class-name="led__repchip">
            <ScoreChip :score="reputation" size="sm" />
          </HoverTip>
        </div>
        <div v-if="kind === 'character' && isPg" class="led__item led__item--player">
          <span class="led__sep" aria-hidden="true">·</span>
          <span class="led__k">Giocatore</span>
          <span class="led__val">{{ player }}</span>
        </div>
      </div>
    </div>

    <!-- Riga meta: modifica inline. Due colonne come la lettura: a destra
         l'editor multiclasse (che computa il Livello). -->
    <div v-else class="led__edit">
      <template v-if="kind === 'character'">
        <div class="led__col">
          <label class="led__field">
            <span class="led__flabel">Razza</span>
            <select class="led__select" v-model="race">
              <option v-for="r in RACES" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>
          <label class="led__field">
            <span class="led__flabel">Allineamento</span>
            <select class="led__select" v-model="alignment">
              <option v-for="a in ALIGNMENTS" :key="a" :value="a">{{ a }}</option>
            </select>
          </label>
          <label class="led__field" v-if="isPg">
            <span class="led__flabel">Giocatore</span>
            <select class="led__select" v-model="player">
              <option v-for="p in PLAYERS" :key="p" :value="p">{{ p }}</option>
            </select>
          </label>
        </div>
        <div class="led__col">
          <div class="led__mc">
            <span class="led__flabel">Classe · liv. {{ totalLevel }}</span>
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
            <button type="button" class="led__mc-add ds-btn ds-btn--sm ds-btn--ghost" @click="addClass">
              <span class="ds-btn__icon"><Icon name="plus" /></span> classe
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="led__col">
          <label class="led__field">
            <span class="led__flabel">Allineamento</span>
            <select class="led__select" v-model="alignment">
              <option v-for="a in ALIGNMENTS" :key="a" :value="a">{{ a }}</option>
            </select>
          </label>
          <label class="led__field">
            <span class="led__flabel">Influenza</span>
            <select class="led__select" v-model="reach">
              <option v-for="r in REACHES" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>
        </div>
        <div class="led__col">
          <label class="led__field">
            <span class="led__flabel">Sede</span>
            <select class="led__select" v-model="seat">
              <option v-for="s in SEATS" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="led__field led__field--tiny">
            <span class="led__flabel">Fondata</span>
            <input class="led__select led__input" type="text" v-model="founded" size="9" />
          </label>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from './Icon.vue';
import ScoreChip from './ScoreChip.vue';
import HoverTip from './HoverTip.vue';
import { SCORE_TIP } from '../uiCopy.js';

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
const player = ref('Giulia');
const race = ref('Mezzelfo');

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

const alignment = ref('Caotico Neutrale');
const seat = ref('Porto Cenere');
const reach = ref('Regionale');
const founded = ref('1247 E.T.');

const editing = ref(false);

// Fatti in riga come coppie label-muta / valore-forte, separati da middot.
// Il ruolo (PG/PNG) esce dai fatti: è un badge nella toprow.
const facts = computed(() => {
  if (props.kind === 'character') {
    return [
      { k: 'Razza', v: race.value },
      { k: 'Classe', v: classLabel.value },
      { k: 'Allineamento', v: alignment.value },
      { k: 'Livello', v: String(totalLevel.value) },
    ];
  }
  return [
    { k: 'Allineamento', v: alignment.value },
    { k: 'Sede', v: seat.value },
    { k: 'Influenza', v: reach.value },
    { k: 'Fondata', v: founded.value },
  ];
});
</script>

<style scoped>
.led {
  position: relative;
  border-top: 1px solid var(--border-hairline);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  padding-right: 3rem;
}
/* comando in alto a destra: matita ↔ Fatto */
.led__topright { position: absolute; top: var(--space-3); right: 0; }

/* --- meta (lettura): campi impilati su due colonne, ciascuno col "·" --- */
.led__read { position: relative; }
.led__grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .4rem 1.5rem;
  font-family: var(--font-sans); font-size: var(--fs-body); line-height: 1.4;
}
.led__item { display: flex; align-items: center; gap: .4rem; min-width: 0; }
.led__repchip { display: inline-flex; }
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

/* matita: affordance discreta, si accende su hover/focus */
.led__pencil {
  background: none; border: none; cursor: pointer;
  color: var(--text-faint); opacity: .6; padding: .25rem;
  font-size: 1rem; line-height: 1; border-radius: var(--radius-sm);
  transition: opacity .15s, color .15s;
}
.led__pencil:hover, .led__pencil:focus-visible { opacity: 1; color: var(--text-strong); }
.led__pencil:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

/* --- meta (modifica): due colonne come la lettura --- */
.led__edit {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .8rem 1.5rem; align-items: start;
}
.led__col { display: flex; flex-direction: column; gap: .7rem; min-width: 0; }
@media (max-width: 520px) { .led__edit { grid-template-columns: 1fr; } }
.led__field { display: flex; flex-direction: column; gap: .25rem; }
.led__field--tiny { max-width: 6rem; }
.led__flabel { font-size: var(--fs-xs); color: var(--text-muted); }
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
.led__mc-add { align-self: flex-start; margin-top: .2rem; }
.led__select:hover { border-color: var(--gold-500); }
.led__select:focus { outline: none; border-color: var(--gold-500); box-shadow: var(--shadow-focus); }

/* Giocatore (solo PG): valore oro per distinguerlo. */
.led__item--player .led__val { color: var(--gold-600); font-weight: var(--fw-semibold); }
</style>
