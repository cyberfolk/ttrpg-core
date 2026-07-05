<template>
  <section class="fv">
    <header class="fv__intro">
      <h1 class="fv__title">Faccia a faccia</h1>
      <p class="fv__lead">
        Scegli due nomi e leggi che reputazione ha ciascuno dell'altro: due giudizi
        indipendenti, con il registro delle transazioni tra loro.
      </p>
    </header>

    <!-- Selettori affiancati -->
    <div class="fv__pickers">
      <EntityPicker v-model="idA" label="Primo" placeholder="Cerca personaggio o gruppo…"
        :exclude-id="idB" />
      <span class="fv__vs" aria-hidden="true"><Icon name="facing" /></span>
      <EntityPicker v-model="idB" label="Secondo" placeholder="Cerca personaggio o gruppo…"
        :exclude-id="idA" />
    </div>

    <!-- Entrambi scelti: reputazione reciproca + registro -->
    <Transition name="fv-rise">
      <div v-if="nodeA && nodeB" class="fv__relation">
        <!-- Testata del blocco: titolo di sezione a sinistra, controllo unico
             (mostra/nasconde la complessiva su entrambe le card) a destra.
             Barra a due estremi voluta; dà contesto e casa al toggle. -->
        <div class="fv__reciprocal-head">
          <h2 class="fv__reciprocal-title">Reputazione reciproca</h2>
          <button type="button" class="fv__aggtoggle"
            :class="{ 'is-on': aggShown }" :aria-pressed="aggShown"
            @click="toggleAgg()">
            {{ aggShown ? 'Nascondi' : 'Mostra' }} reputazione complessiva
          </button>
        </div>

        <div class="fv__versi">

          <article v-for="v in versi" :key="v.key" class="fv-verso">
            <!-- Titolo = il possessore (l'osservato), identità della card. -->
            <RouterLink class="fv-verso__owner"
              :to="entityRouteTo(v.toKind, v.toId)" :title="v.toName">
              <span class="fv-verso__owner-glyph" aria-hidden="true"><Icon :name="v.toIcon" /></span>
              <span class="fv-verso__owner-name">{{ v.toName }}<span v-if="v.toSuffix" class="ds-idhint fv-verso__suffix">#{{ v.toSuffix }}</span></span>
            </RouterLink>

            <!-- Letture: il giudizio del singolo osservatore e, in progressive
                 disclosure, la reputazione complessiva. Stesso schema riga: badge
                 a sinistra + etichetta, su un unico asse. -->
            <div class="fv-verso__readings">
              <div class="fv-verso__reading">
                <span class="fv-verso__score"
                  :style="{ background: scoreColor(v.score) }"
                  :aria-label="`Reputazione di ${v.toName}: ${v.score} su 100, secondo ${v.fromName}`">
                  <CountUp :value="v.score" />
                </span>
                <span class="fv-verso__attrib-kicker">Reputazione secondo</span>
                <RouterLink class="fv-verso__source"
                  :to="entityRouteTo(v.fromKind, v.fromId)" :title="v.fromName">
                  <span class="fv-verso__source-glyph" aria-hidden="true"><Icon :name="v.fromIcon" /></span>
                  <span class="fv-verso__source-name">{{ v.fromName }}<span v-if="v.fromSuffix" class="ds-idhint fv-verso__suffix">#{{ v.fromSuffix }}</span></span>
                </RouterLink>
              </div>

              <!-- Comparsa fluida (grid-template-rows 0fr→1fr, non altezza): la
                   reputazione complessiva scivola giù invece di apparire di scatto. -->
              <Transition name="fv-agg">
                <div v-if="aggShown" class="fv-verso__agg-wrap">
                  <div class="fv-verso__reading fv-verso__reading--agg">
                    <span class="fv-verso__score fv-verso__score--agg"
                      :class="v.aggScore === null ? 'fv-verso__score--empty' : ''"
                      :style="v.aggScore !== null ? { background: scoreColor(v.aggScore) } : undefined"
                      :aria-label="`Reputazione complessiva di ${v.toName}: ${v.aggScore !== null ? v.aggScore + ' su 100' : 'nessun voto'}`">
                      {{ v.aggScore !== null ? v.aggScore : '–' }}
                    </span>
                    <!-- L'helper è sull'etichetta stessa: al hover/focus spiega cos'è
                         la reputazione complessiva, senza icona "?". -->
                    <HoverTip :text="SCORE_TIP" label="Cos'è la reputazione complessiva"
                      class-name="fv-verso__attrib-kicker fv-verso__agg-help">
                      Reputazione complessiva
                    </HoverTip>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Azione: unica, allineata all'asse sinistro come tutto il resto. -->
            <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm fv-verso__add"
              @click="registra(v.fromId, v.toId)">
              <span class="ds-btn__icon"><Icon name="plus" /></span>
              Registra transazione
            </button>
          </article>

        </div>

        <!-- Registro relazionale: entrambe le direzioni, dalle più recenti -->
        <div class="fv__ledger">
          <h2 class="fv__ledger-title">Registro</h2>
          <p v-if="ledger.length === 0" class="rep-empty">
            Nessuna transazione tra loro — entrambi partono da 50.
          </p>
          <div v-else class="rep-table-wrap">
            <table class="rep-table fv-ledger">
              <thead>
                <tr>
                  <th class="fv-ledger__dir-col">Direzione</th>
                  <th class="fv-ledger__delta-col rep-col--right">Delta</th>
                  <th>Motivo</th>
                  <th class="fv-ledger__when-col rep-col--right">Data</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in ledger" :key="row.t.id">
                  <td>
                    <span class="fv-ledger__dir">
                      <span class="fv-ledger__dir-glyph fv-ledger__dir-glyph--from" aria-hidden="true"><Icon :name="row.fromIcon" /></span>
                      <span class="fv-ledger__dir-name fv-ledger__dir-name--from">{{ row.fromName }}<span v-if="row.fromSuffix" class="ds-idhint fv-ledger__dir-suffix">#{{ row.fromSuffix }}</span></span>
                      <Icon name="next" class="fv-ledger__dir-arrow" aria-hidden="true" />
                      <span class="fv-ledger__dir-glyph fv-ledger__dir-glyph--to" aria-hidden="true"><Icon :name="row.toIcon" /></span>
                      <span class="fv-ledger__dir-name fv-ledger__dir-name--to">{{ row.toName }}<span v-if="row.toSuffix" class="ds-idhint fv-ledger__dir-suffix">#{{ row.toSuffix }}</span></span>
                    </span>
                  </td>
                  <td class="rep-col--right">
                    <span class="fv-ledger__delta" :class="row.t.delta >= 0 ? 'pos' : 'neg'">
                      {{ row.t.delta >= 0 ? '+' : '' }}{{ row.t.delta }}
                    </span>
                  </td>
                  <td class="fv-ledger__reason">
                    <template v-if="(row.t.name || '').trim()">{{ row.t.name }}</template>
                    <span v-else class="rep-empty">(nessun motivo)</span>
                  </td>
                  <td class="rep-col--right fv-ledger__when">{{ fmtDay(row.t.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Stati vuoti che insegnano -->
    <div v-if="!nodeA || !nodeB" class="fv__hint">
      <span class="fv__hint-glyph" aria-hidden="true"><Icon name="facing" /></span>
      <p class="fv__hint-text">{{ hintText }}</p>
    </div>

    <TransactionModal v-if="tx" :from-id="tx.fromId" :to-id="tx.toId" @close="tx = null" />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from '../useStore.js';
import { resolveNode, computeScore, averageIncomingScore, listTransactions, listActiveCharacters, listActiveGroups } from '../../model/reputation.js';
import { ambiguousIds, displayName } from '../disambiguation.js';
import { scoreColor } from '../scoreColor.js';
import { kindIcon, entityRouteTo } from '../entityKind.js';
import { SCORE_TIP } from '../uiCopy.js';
import Icon from './Icon.vue';
import EntityPicker from './EntityPicker.vue';
import TransactionModal from './TransactionModal.vue';
import CountUp from './CountUp.vue';
import HoverTip from './HoverTip.vue';

const { state } = useStore();

const idA = ref(null);
const idB = ref(null);
const tx = ref(null);

// Toggle globale: mostra/nasconde la reputazione complessiva (media dei giudizi
// entranti) su entrambe le card insieme.
const aggShown = ref(false);
function toggleAgg() {
  aggShown.value = !aggShown.value;
}

const nodeA = computed(() => (idA.value ? resolveNode(state.value, idA.value) : null));
const nodeB = computed(() => (idB.value ? resolveNode(state.value, idB.value) : null));

// Coda-id per gli omonimi (stesso tipo + nome): mostrata solo quando serve.
const ambiguous = computed(() => {
  const chars = listActiveCharacters(state.value).map((e) => ({ id: e.id, name: e.name, kind: 'character' }));
  const groups = listActiveGroups(state.value).map((e) => ({ id: e.id, name: e.name, kind: 'group' }));
  const map = ambiguousIds([...chars, ...groups]);
  return map;
});
function suffixOf(id) {
  const suffix = ambiguous.value.get(id) ?? null;
  return suffix;
}

function iconOf(node) {
  const name = kindIcon(node.kind);
  return name;
}

// Le due direzioni asimmetriche: A→B ("come A vede B") e B→A.
const versi = computed(() => {
  if (!nodeA.value || !nodeB.value) return [];
  const a = nodeA.value;
  const b = nodeB.value;
  const list = [
    {
      key: 'ab',
      fromId: a.entity.id, toId: b.entity.id,
      fromName: displayName(a.entity), toName: displayName(b.entity),
      fromIcon: iconOf(a), toIcon: iconOf(b),
      fromKind: a.kind, toKind: b.kind,
      fromSuffix: suffixOf(a.entity.id), toSuffix: suffixOf(b.entity.id),
      score: computeScore(state.value, a.entity.id, b.entity.id),
      aggScore: averageIncomingScore(state.value, b.entity.id, false),
    },
    {
      key: 'ba',
      fromId: b.entity.id, toId: a.entity.id,
      fromName: displayName(b.entity), toName: displayName(a.entity),
      fromIcon: iconOf(b), toIcon: iconOf(a),
      fromKind: b.kind, toKind: a.kind,
      fromSuffix: suffixOf(b.entity.id), toSuffix: suffixOf(a.entity.id),
      score: computeScore(state.value, b.entity.id, a.entity.id),
      aggScore: averageIncomingScore(state.value, a.entity.id, false),
    },
  ];
  // Card sinistra = il Primo (idA) come possessore della reputazione; il Secondo
  // a destra. L'ordine dei possessori segue quello dei selettori Primo/Secondo.
  list.reverse();
  return list;
});

// Registro unificato: transazioni A→B e B→A, dalle più recenti.
const ledger = computed(() => {
  if (!nodeA.value || !nodeB.value) return [];
  const a = nodeA.value;
  const b = nodeB.value;
  const aSuffix = suffixOf(a.entity.id);
  const bSuffix = suffixOf(b.entity.id);
  const ab = listTransactions(state.value, a.entity.id, b.entity.id)
    .map((t) => ({ t, fromName: displayName(a.entity), toName: displayName(b.entity), fromIcon: iconOf(a), toIcon: iconOf(b), fromSuffix: aSuffix, toSuffix: bSuffix }));
  const ba = listTransactions(state.value, b.entity.id, a.entity.id)
    .map((t) => ({ t, fromName: displayName(b.entity), toName: displayName(a.entity), fromIcon: iconOf(b), toIcon: iconOf(a), fromSuffix: bSuffix, toSuffix: aSuffix }));
  const rows = [...ab, ...ba].sort((x, y) => y.t.createdAt - x.t.createdAt);
  return rows;
});

const hintText = computed(() => {
  if (!nodeA.value && !nodeB.value) {
    return 'Seleziona due nomi qui sopra per confrontarli.';
  }
  const chosen = displayName(nodeA.value ? nodeA.value.entity : nodeB.value.entity);
  return `Hai scelto ${chosen}. Seleziona anche l'altro nome per vedere la reputazione reciproca.`;
});

function registra(fromId, toId) {
  tx.value = { fromId, toId };
}

function fmtDay(ts) {
  const label = new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  return label;
}
</script>

<style scoped>
.fv {
  max-width: 62rem;
  margin: 0 auto;
  padding: var(--space-6) 0 var(--space-12);
}

/* Intro */
.fv__intro { margin-bottom: var(--space-8); }
.fv__title {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 1.4rem + 2.2vw, 2.75rem);
  font-weight: var(--fw-semibold);
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-tight);
  color: var(--text-strong);
  text-wrap: balance;
  margin: 0 0 var(--space-3);
}
.fv__lead {
  max-width: 60ch;
  color: var(--text-body);
  line-height: var(--lh-body);
  text-wrap: pretty;
  margin: 0;
}

/* Selettori affiancati */
.fv__pickers {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: var(--space-4);
}
.fv__vs {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  font-size: 1.75rem;
  color: var(--accent);
}

/* Reputazione reciproca — il cuore della vista: due punteggi asimmetrici,
   allineati fianco a fianco perché l'occhio li confronti a colpo d'occhio. */
.fv__relation { margin-top: var(--space-10); }
.fv__versi {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}
/* Testata del blocco reciproco: titolo di sezione + toggle della complessiva,
   barra a due estremi. Rispecchia il titolo "Registro" più sotto (coerenza). */
.fv__reciprocal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.fv__reciprocal-title {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: var(--fw-semibold);
  color: var(--text-strong);
  margin: 0;
}
.fv__aggtoggle {
  padding: 0.28rem 0.7rem;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast), border-color var(--dur-fast);
}
.fv__aggtoggle:hover { color: var(--accent-text); border-color: var(--gold-500); background: var(--gold-100); }
.fv__aggtoggle:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.fv__aggtoggle:active { transform: translateY(1px); }
.fv__aggtoggle.is-on { color: var(--accent-text); border-color: var(--gold-500); background: var(--gold-100); }

/* Card distillata: asse unico a sinistra, gerarchia titolo → punteggio →
   contesto → azione. La segnatura oro resta il filetto in cima. */
.fv-verso {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: var(--space-5);
  padding: var(--space-6) var(--space-5);
  background: var(--surface-card);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  position: relative;
}
/* Filetto oro in testa: la segnatura dell'archivista */
.fv-verso::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: linear-gradient(90deg, transparent, var(--gold-400), transparent);
}

/* Letture impilate: giudizio del singolo osservatore e, in progressive
   disclosure, la reputazione complessiva. Gap 0: la spaziatura della complessiva
   vive nel suo padding-top, così la comparsa la clippa insieme al contenuto. */
.fv-verso__readings {
  display: flex;
  flex-direction: column;
}
/* Riga di lettura: badge a sinistra, kicker + fonte a destra su due righe.
   Il badge (grid-area score) copre entrambe le righe ed è centrato; le due
   righe 1fr/1fr spezzano l'altezza a metà del badge. Il kicker "Reputazione
   secondo" è ancorato in fondo alla riga 1 e il nome della fonte in cima alla
   riga 2 → la coppia resta stretta e a cavallo del centro verticale del badge. */
.fv-verso__reading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    "score kicker"
    "score source";
  align-items: center;
  column-gap: var(--space-4);
  row-gap: var(--space-1);
}
/* Nudge ottico: la coppia kicker→fonte sale un filo verso l'alto del badge.
   Margini (non transform), così resta nel flusso: il margin-bottom sul kicker
   (ancorato in fondo alla riga 1) lo solleva; il margin-top negativo sulla fonte
   (ancorata in cima alla riga 2) la tira su un pelo di più → coppia stretta e alta. */
.fv-verso__reading .fv-verso__attrib-kicker { align-self: end; margin-bottom: 6px; }
.fv-verso__reading .fv-verso__source { align-self: start; margin-top: -9px; }
.fv-verso__reading--agg { padding-top: var(--space-4); }
/* L'agg-reading ha solo il kicker (niente riga fonte): la griglia base lo chiude
   nella sola riga 1 (metà alta) → resta in alto. Qui lo faccio occupare entrambe
   le righe della col2 e lo centro, così sta in mezzo all'altezza del badge. */
.fv-verso__reading--agg .fv-verso__attrib-kicker {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  margin-bottom: 0;
}

/* Comparsa della complessiva: grid-template-rows 0fr→1fr (riflusso senza
   animare l'altezza) + opacità. ease-out-expo, uscita più rapida. */
.fv-verso__agg-wrap {
  display: grid;
  grid-template-rows: 1fr;
}
.fv-verso__agg-wrap > .fv-verso__reading { overflow: hidden; }
.fv-agg-enter-active,
.fv-agg-leave-active {
  transition: grid-template-rows 300ms cubic-bezier(0.16, 1, 0.3, 1),
              opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.fv-agg-leave-active { transition-duration: 220ms; }
.fv-agg-enter-from,
.fv-agg-leave-to { grid-template-rows: 0fr; opacity: 0; }
.fv-agg-enter-to,
.fv-agg-leave-from { grid-template-rows: 1fr; opacity: 1; }

/* Badge complessiva: stessa forma del chip, più piccolo → subordinato al
   giudizio del singolo osservatore. */
.fv-verso__score--agg {
  min-width: 3.25rem;
  padding: 0.3rem 0.9rem;
  font-size: 1.6rem;
}
.fv-verso__score--empty {
  background: var(--surface-panel);
  color: var(--text-faint);
  box-shadow: inset 0 0 0 1px var(--border-hairline);
}

/* Kicker etichetta: micro-maiuscoletto del catalogo, singola riga. */
.fv-verso__attrib-kicker {
  grid-area: kicker;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-display);
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--text-muted);
}
/* Helper sull'etichetta stessa: al hover/focus spiega cos'è la reputazione
   complessiva. Cursore "help" come segnale che c'è una spiegazione. */
.fv-verso__agg-help { cursor: help; transition: color var(--dur-fast); }
.fv-verso__agg-help:hover { color: var(--accent-text); }
.fv-verso__agg-help:focus-visible { outline: none; box-shadow: var(--shadow-focus); border-radius: var(--radius-sm); }

/* Possessore = identità eroe della card: glifo + nome display (link scheda).
   Nessun inset a sinistra: il glifo allinea col bordo sinistro delle righe sotto. */
.fv-verso__owner {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-1) 0;
  /* Nome grosso leggermente rientrato a sinistra (allineamento ottico del
     maiuscoletto display, che ha spalla sinistra marcata). */
  margin-left: -0.2rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  transition: color var(--dur-fast);
}
.fv-verso__owner-glyph {
  flex: none;
  display: inline-flex;
  font-size: 1.35rem;
  color: var(--text-muted);
  transition: color var(--dur-fast);
}
.fv-verso__owner-name {
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: var(--fw-semibold);
  line-height: var(--lh-tight);
  color: var(--text-strong);
  text-wrap: balance;
  /* nome intero fino a 2 righe, poi ellissi */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.fv-verso__owner:hover .fv-verso__owner-glyph { color: var(--accent-text); }
.fv-verso__owner:hover .fv-verso__owner-name {
  color: var(--accent-text);
  text-decoration: underline;
}
.fv-verso__owner:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

/* Attribuzione: nome della fonte "secondo [osservatore]", sotto il kicker. */
.fv-verso__source {
  grid-area: source;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  min-width: 0;
  /* Nessun inset a sinistra: il glifo fonte allinea col resto del blocco. */
  padding: 0.1rem 0.3rem 0.1rem 0;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-body);
  transition: color var(--dur-fast);
}
.fv-verso__source-glyph {
  flex: none;
  display: inline-flex;
  font-size: 1rem;
  color: var(--text-faint);
  transition: color var(--dur-fast);
}
.fv-verso__source-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--fw-medium);
}
.fv-verso__source:hover .fv-verso__source-name { color: var(--accent-text); text-decoration: underline; }
.fv-verso__source:hover .fv-verso__source-glyph { color: var(--accent-text); }
.fv-verso__source:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

/* Su touch (uso al tavolo dal telefono) i due link della card devono avere un
   bersaglio comodo: garantisco l'altezza minima consigliata. */
@media (pointer: coarse) {
  .fv-verso__owner { min-height: 44px; }
  .fv-verso__source { min-height: 44px; padding-inline: var(--space-2); }
}

/* Coda-id per omonimi (base .ds-idhint): qui solo l'inset in linea col nome. */
.fv-verso__suffix { margin-left: 0.25rem; }

/* Il punteggio è l'eroe visivo: grande numerale Cinzel su pillola tinta
   scoreColor, stessa forma dei chip punteggio delle altre schermate. */
.fv-verso__score {
  grid-area: score;
  flex: none;
  display: grid;
  place-items: center;
  min-width: 4.75rem;
  padding: 0.5rem 1.35rem;
  font-family: var(--font-display);
  font-size: clamp(2.1rem, 1.5rem + 2.6vw, 3.1rem);
  font-weight: var(--fw-semibold);
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--score-ink);
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1px rgba(33, 28, 21, 0.08), var(--shadow-sm);
}

/* Filo sinistro come le altre righe: compenso il padding-left del bottone sm
   (.7rem) con un margine negativo, così l'icona "+" allinea coi glifi sopra. */
/* Filo sinistro: compenso il padding-left del bottone ghost sm (~0.7rem) con un
   margine negativo, così l'icona "+" allinea con il bordo sinistro dei badge e
   del titolo — l'asse unico della card. */
.fv-verso__add { align-self: flex-start; margin: 0 0 0 -0.7rem; }

/* Registro */
.fv__ledger { margin-top: var(--space-8); }
.fv__ledger-title {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: var(--fw-semibold);
  color: var(--text-strong);
  margin: 0 0 var(--space-3);
}
.fv-ledger { width: 100%; }
.fv-ledger__delta-col { width: 6rem; }
.fv-ledger__when-col { width: 8.5rem; white-space: nowrap; }

.fv-ledger__dir {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}
.fv-ledger__dir-glyph { display: inline-flex; color: var(--text-muted); }
.fv-ledger__dir-arrow { color: var(--text-faint); }
.fv-ledger__dir-name {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 9rem;
}
/* Direzione = chi dà → chi riceve. Muto chi dà, evidenzio chi riceve la
   reputazione (destra), così il verso della transazione è leggibile. */
.fv-ledger__dir-name--from { color: var(--text-faint); }
.fv-ledger__dir-glyph--from { color: var(--text-faint); }
.fv-ledger__dir-name--to { color: var(--text-strong); font-weight: var(--fw-medium); }
.fv-ledger__dir-glyph--to { color: var(--text-muted); }
/* Coda-id per omonimi (base .ds-idhint): qui solo l'inset. */
.fv-ledger__dir-suffix { margin-left: 0.3rem; }
.fv-ledger__delta {
  font-variant-numeric: tabular-nums;
  font-weight: var(--fw-semibold);
}
.fv-ledger__delta.pos { color: var(--gold-700); }
.fv-ledger__delta.neg { color: var(--ember-700); }
.fv-ledger__reason { color: var(--text-body); overflow-wrap: anywhere; word-break: break-word; }
.fv-ledger__when {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Hint / empty */
.fv__hint {
  margin-top: var(--space-10);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  color: var(--text-muted);
}
.fv__hint-glyph {
  display: inline-flex;
  font-size: 2rem;
  color: var(--gold-300);
}
.fv__hint-text { max-width: 44ch; margin: 0; }

/* Ingresso del pannello relazione: reveal deciso (ease-out-expo). */
.fv-rise-enter-active {
  transition: opacity 340ms cubic-bezier(0.16, 1, 0.3, 1), transform 340ms cubic-bezier(0.16, 1, 0.3, 1);
}
.fv-rise-enter-from { opacity: 0; transform: translateY(10px); }

@media (max-width: 640px) {
  .fv__pickers { grid-template-columns: 1fr; }
  .fv__vs { display: none; }
  .fv__versi { grid-template-columns: 1fr; }

  /* Card più stretta: gap ridotto tra pillola e testo, punteggio più compatto
     e nome possessore fino a 3 righe, così nomi tipo "Sera Ombravento" non si
     croppano. La riga orizzontale resta (card a piena larghezza sul telefono). */
  .fv-verso { gap: var(--space-4); }
  /* Badge più grosso su telefono (l'eroe visivo della card compatta). */
  .fv-verso__score {
    min-width: 4.5rem;
    padding: 0.55rem 1.15rem;
    font-size: clamp(2.4rem, 2rem + 3vw, 3.1rem);
  }
  /* Fonte a filo del kicker: annullo il padding-inline della regola touch (che
     la indentava a destra) e la alzo a paro con l'inizio di "Reputazione secondo". */
  /* Specificità pari alla regola base .fv-verso__reading .fv-verso__source
     (0-2-0): con solo .fv-verso__source (0-1-0) il margin-top base -9px vince e
     questo resta inerte (il @media non aggiunge specificità). */
  .fv-verso__reading .fv-verso__source { padding-inline: 0; margin-top: -16px; }
  .fv-verso__owner-name { -webkit-line-clamp: 3; line-clamp: 3; }

  /* Registro: la tabella a 4 colonne si accrocchia su telefono (la colonna
     "Direzione" impacca due nomi in una riga nowrap). Diventa una lista di
     record impilati: ogni transazione è un blocco leggibile come unità —
     chi→chi in alto, delta + motivo al centro, data a chiudere. */
  .fv-ledger,
  .fv-ledger tbody,
  .fv-ledger tr,
  .fv-ledger td { display: block; }

  /* Intestazioni tabellari fuori dal flusso visivo, ma presenti per screen reader */
  .fv-ledger thead {
    position: absolute;
    width: 1px; height: 1px; margin: -1px; padding: 0;
    overflow: hidden; clip: rect(0 0 0 0); border: 0;
  }

  /* La cornice-card lascia la tabella: qui è trasparente, i record si separano
     da soli con un hairline. */
  .fv-ledger {
    border: none; border-radius: 0; box-shadow: none; background: transparent;
  }

  .fv-ledger tr {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      "dir    dir"
      "delta  reason"
      "date   date";
    align-items: start;
    column-gap: var(--space-3);
    row-gap: var(--space-1);
    padding: var(--space-4) var(--space-1);
    border-bottom: 1px solid var(--border-hairline);
  }
  .fv-ledger tbody tr:last-child { border-bottom: none; }
  .fv-ledger tbody tr:hover { background: transparent; }

  .fv-ledger td { padding: 0; border: none; text-align: left; }
  .fv-ledger td:nth-child(1) { grid-area: dir; }
  .fv-ledger td:nth-child(2) { grid-area: delta; }
  .fv-ledger td:nth-child(3) { grid-area: reason; }
  .fv-ledger td:nth-child(4) { grid-area: date; }

  /* Direzione: i nomi vanno a capo invece di sforare in una riga nowrap. */
  .fv-ledger__dir { white-space: normal; flex-wrap: wrap; row-gap: 0.15rem; }
  .fv-ledger__dir-name { max-width: none; }

  .fv-ledger__delta { font-size: var(--fs-sm); }
  .fv-ledger__reason { font-size: var(--fs-sm); }
  .fv-ledger__when { font-size: var(--fs-xs); color: var(--text-faint); }
}

@media (prefers-reduced-motion: reduce) {
  .fv-rise-enter-active { transition: opacity var(--dur) linear; }
  .fv-rise-enter-from { transform: none; }

  /* Comparsa complessiva: niente riflusso animato, solo crossfade. */
  .fv-agg-enter-active,
  .fv-agg-leave-active { transition: opacity 120ms linear; }
  .fv-agg-enter-from,
  .fv-agg-leave-to { grid-template-rows: 1fr; opacity: 0; }
}
</style>
