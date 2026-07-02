<template>
  <section class="fv">
    <header class="fv__intro">
      <h1 class="fv__title">Faccia a faccia</h1>
      <p class="fv__lead">
        Scegli due nomi e leggi la reputazione che ciascuno ha dell'altro — le due
        direzioni sono indipendenti — con il registro delle transazioni tra loro.
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
        <div class="fv__versi">
          <article v-for="v in versi" :key="v.key" class="fv-verso">
            <div class="fv-verso__flow">
              <span class="fv-verso__tag fv-verso__tag--come" aria-hidden="true">Come</span>
              <span class="fv-verso__tag fv-verso__tag--vede" aria-hidden="true">Vede</span>

              <RouterLink class="fv-verso__party fv-verso__party--from"
                :to="linkTo(v.fromKind, v.fromId)" :title="v.fromName">
                <span class="fv-verso__glyph" aria-hidden="true"><Icon :name="v.fromIcon" /></span>
                <span class="fv-verso__pname">{{ v.fromName }}</span>
              </RouterLink>

              <Icon name="next" class="fv-verso__arrow fv-verso__arrow--1" aria-hidden="true" />

              <span class="fv-verso__score"
                :style="{ background: scoreColor(v.score) }"
                :aria-label="`${v.fromName} verso ${v.toName}: reputazione ${v.score} su 100`">
                {{ v.score }}
              </span>

              <Icon name="next" class="fv-verso__arrow fv-verso__arrow--2" aria-hidden="true" />

              <RouterLink class="fv-verso__party fv-verso__party--to"
                :to="linkTo(v.toKind, v.toId)" :title="v.toName">
                <span class="fv-verso__glyph" aria-hidden="true"><Icon :name="v.toIcon" /></span>
                <span class="fv-verso__pname">{{ v.toName }}</span>
              </RouterLink>
            </div>
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
                      <span class="fv-ledger__dir-glyph" aria-hidden="true"><Icon :name="row.fromIcon" /></span>
                      <span class="fv-ledger__dir-name">{{ row.fromName }}</span>
                      <Icon name="next" class="fv-ledger__dir-arrow" aria-hidden="true" />
                      <span class="fv-ledger__dir-glyph" aria-hidden="true"><Icon :name="row.toIcon" /></span>
                      <span class="fv-ledger__dir-name">{{ row.toName }}</span>
                    </span>
                  </td>
                  <td class="rep-col--right">
                    <span class="fv-ledger__delta" :class="row.t.delta >= 0 ? 'pos' : 'neg'">
                      {{ row.t.delta >= 0 ? '+' : '' }}{{ row.t.delta }}
                    </span>
                  </td>
                  <td class="fv-ledger__reason">{{ row.t.name }}</td>
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
import { resolveNode, computeScore, listTransactions } from '../../model/reputation.js';
import { scoreColor } from '../scoreColor.js';
import Icon from './Icon.vue';
import EntityPicker from './EntityPicker.vue';
import TransactionModal from './TransactionModal.vue';

const { state } = useStore();

const idA = ref(null);
const idB = ref(null);
const tx = ref(null);

const nodeA = computed(() => (idA.value ? resolveNode(state.value, idA.value) : null));
const nodeB = computed(() => (idB.value ? resolveNode(state.value, idB.value) : null));

function iconOf(node) {
  const name = node.kind === 'group' ? 'users' : 'user';
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
      fromName: a.entity.name, toName: b.entity.name,
      fromIcon: iconOf(a), toIcon: iconOf(b),
      fromKind: a.kind, toKind: b.kind,
      score: computeScore(state.value, a.entity.id, b.entity.id),
    },
    {
      key: 'ba',
      fromId: b.entity.id, toId: a.entity.id,
      fromName: b.entity.name, toName: a.entity.name,
      fromIcon: iconOf(b), toIcon: iconOf(a),
      fromKind: b.kind, toKind: a.kind,
      score: computeScore(state.value, b.entity.id, a.entity.id),
    },
  ];
  return list;
});

// Registro unificato: transazioni A→B e B→A, dalle più recenti.
const ledger = computed(() => {
  if (!nodeA.value || !nodeB.value) return [];
  const a = nodeA.value;
  const b = nodeB.value;
  const ab = listTransactions(state.value, a.entity.id, b.entity.id)
    .map((t) => ({ t, fromName: a.entity.name, toName: b.entity.name, fromIcon: iconOf(a), toIcon: iconOf(b) }));
  const ba = listTransactions(state.value, b.entity.id, a.entity.id)
    .map((t) => ({ t, fromName: b.entity.name, toName: a.entity.name, fromIcon: iconOf(b), toIcon: iconOf(a) }));
  const rows = [...ab, ...ba].sort((x, y) => y.t.createdAt - x.t.createdAt);
  return rows;
});

const hintText = computed(() => {
  if (!nodeA.value && !nodeB.value) {
    return 'Seleziona due nomi qui sopra per confrontarli.';
  }
  const chosen = nodeA.value ? nodeA.value.entity.name : nodeB.value.entity.name;
  return `Hai scelto ${chosen}. Seleziona anche l'altro nome per vedere la reputazione reciproca.`;
});

// Destinazione del link al profilo/scheda dell'entità (personaggio o gruppo).
function linkTo(kind, id) {
  const name = kind === 'group' ? 'groupProfile' : 'profile';
  const loc = { name, params: { id } };
  return loc;
}

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
.fv-verso {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-5) var(--space-6);
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
/* Flusso "Come [entità] Vede [punteggio] [entità]": due righe incolonnate —
   micro-etichette sopra, flusso allineato sotto. */
.fv-verso__flow {
  display: grid;
  grid-template-columns: 1fr auto auto auto 1fr;
  grid-template-areas:
    "l-tag .  s-tag .  ."
    "from  a1 score a2 to";
  align-items: center;
  justify-items: center;
  column-gap: var(--space-3);
  row-gap: var(--space-2);
  width: 100%;
}

/* Micro-etichette Cinzel maiuscole (voce da catalogo Atlante), de-enfatizzate. */
.fv-verso__tag {
  font-family: var(--font-display);
  font-size: var(--fs-label);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--text-faint);
}
.fv-verso__tag--come { grid-area: l-tag; }
.fv-verso__tag--vede { grid-area: s-tag; }

/* Parte in gioco = link alla scheda: glifo con nome sotto. */
.fv-verso__party {
  min-width: 0;
  justify-self: stretch; /* riempie la colonna 1fr → il nome lungo si tronca */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  transition: color var(--dur-fast);
}
.fv-verso__party--from { grid-area: from; }
.fv-verso__party--to { grid-area: to; }
.fv-verso__party:hover .fv-verso__glyph,
.fv-verso__party:hover .fv-verso__pname { color: var(--accent-text); }
.fv-verso__party:hover .fv-verso__pname { text-decoration: underline; }
.fv-verso__party:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

.fv-verso__glyph {
  display: inline-flex;
  font-size: 1.5rem;
  color: var(--text-muted);
}
.fv-verso__pname {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--fw-medium);
  font-size: var(--fs-sm);
  color: var(--text-body);
}
.fv-verso__arrow { color: var(--gold-500); }
.fv-verso__arrow--1 { grid-area: a1; }
.fv-verso__arrow--2 { grid-area: a2; }

/* Il punteggio è l'eroe: grande numerale Cinzel su pillola tinta scoreColor,
   stessa forma dei chip punteggio delle altre schermate. */
.fv-verso__score {
  grid-area: score;
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

.fv-verso__add { align-self: center; margin-top: var(--space-2); }

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
.fv-ledger__delta {
  font-variant-numeric: tabular-nums;
  font-weight: var(--fw-semibold);
}
.fv-ledger__delta.pos { color: var(--gold-700); }
.fv-ledger__delta.neg { color: var(--ember-700); }
.fv-ledger__reason { color: var(--text-body); }
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

/* Ingresso del pannello relazione */
.fv-rise-enter-active { transition: opacity var(--dur) var(--ease-out), transform var(--dur) var(--ease-out); }
.fv-rise-enter-from { opacity: 0; transform: translateY(8px); }

@media (max-width: 640px) {
  .fv__pickers { grid-template-columns: 1fr; }
  .fv__vs { display: none; }
  .fv__versi { grid-template-columns: 1fr; }
  .fv-verso__cap { min-height: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fv-rise-enter-active { transition: opacity var(--dur) linear; }
  .fv-rise-enter-from { transform: none; }
}
</style>
