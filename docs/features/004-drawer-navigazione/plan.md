# Drawer di navigazione — Implementation Plan

> **STATO: COMPLETATO (2026-06-09)** — tutti i 6 task implementati (parte inline, parte subagent-driven con spec + code-quality review), 41/41 test verdi, build pulita, mergiato in `main`. In coda alla feature le impostazioni del drawer sono state rese reali (sezione generale con export/import spostati dall'header; sezione Reputazione con "Mostra archiviati" spostato dalla toolbar). Documento storico: le checkbox `- [ ]` non sono mantenute aggiornate.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere un drawer laterale a scomparsa che dà contesto all'app (TTRPG-Core = base, Reputazione = funzione attiva), spiega in breve la reputazione e ospita impostazioni placeholder.

**Architecture:** Lavoro interamente nel layer VIEW. Un modulo puro `appFunctions.js` (testato con `node:test`) descrive le funzioni dell'app; un componente `AppDrawer.vue` rende il drawer; `App.vue` possiede lo stato aperto/chiuso e aggiunge l'hamburger nell'header. Nessuna modifica a MODEL/STORE/IO.

**Tech Stack:** Vue 3 (script setup), vue-router, CSS in `styles/main.css`, test con `node:test`.

---

## File Structure

- **Create** `src/view/appFunctions.js` — modulo puro: array `APP_FUNCTIONS` + funzione `activeFunctionId(routeName)`. Nessuna dipendenza da Vue/browser.
- **Create** `scripts/tests/appFunctions.test.js` — test `node:test` per `activeFunctionId`.
- **Create** `src/view/components/AppDrawer.vue` — il drawer (scrim + pannello + 4 sezioni).
- **Modify** `src/view/uiCopy.js` — aggiunge `REPUTATION_HELP`.
- **Modify** `src/view/components/Icon.vue` — aggiunge l'icona `menu` (hamburger).
- **Modify** `src/view/App.vue` — stato `drawerOpen`, hamburger nell'header, render di `AppDrawer`.
- **Modify** `styles/main.css` — stili del drawer.

**Convenzioni di progetto da rispettare:**
- Stile codice: mai `return <espressione>` diretta — assegnare a variabile con nome e poi ritornare (vale anche per i body delle computed/funzioni).
- Test singolo file: `node --test scripts/tests/<nome>.test.js` (forma directory rotta su Windows).
- Commit: `[TAG] Titolo`; `git add` di file specifici; nessun `Co-Authored-By`.

---

## Task 1: Modulo `appFunctions.js` (TDD)

**Files:**
- Create: `src/view/appFunctions.js`
- Test: `scripts/tests/appFunctions.test.js`

- [ ] **Step 1: Write the failing test**

`scripts/tests/appFunctions.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_FUNCTIONS, activeFunctionId } from '../../src/view/appFunctions.js';

test('APP_FUNCTIONS: prima voce è Reputazione attiva', () => {
  const first = APP_FUNCTIONS[0];
  assert.equal(first.id, 'reputazione');
  assert.equal(first.routeName, 'characters');
  assert.equal(first.status, 'active');
});

test('APP_FUNCTIONS: esiste una voce generica "Altro" in arrivo', () => {
  const altro = APP_FUNCTIONS.find((f) => f.id === 'altro');
  assert.ok(altro);
  assert.equal(altro.status, 'soon');
  assert.equal(altro.routeName, null);
});

test('activeFunctionId: route "characters" → reputazione', () => {
  const id = activeFunctionId('characters');
  assert.equal(id, 'reputazione');
});

test('activeFunctionId: route "profile" → reputazione', () => {
  const id = activeFunctionId('profile');
  assert.equal(id, 'reputazione');
});

test('activeFunctionId: route sconosciuta → null', () => {
  const id = activeFunctionId('notfound');
  assert.equal(id, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/tests/appFunctions.test.js`
Expected: FAIL (cannot find module `appFunctions.js`).

- [ ] **Step 3: Write minimal implementation**

`src/view/appFunctions.js`:

```javascript
// Configurazione statica delle funzioni dell'app (layer VIEW).
// Modulo puro: nessuna dipendenza da Vue o dal browser.
export const APP_FUNCTIONS = [
  { id: 'reputazione', label: 'Reputazione', routeName: 'characters', status: 'active' },
  { id: 'altro', label: 'Altro', routeName: null, status: 'soon' },
];

// Route che appartengono alla funzione Reputazione.
const REPUTATION_ROUTES = ['characters', 'profile'];

// Restituisce l'id della funzione attiva data la route corrente, o null.
export function activeFunctionId(routeName) {
  const isReputation = REPUTATION_ROUTES.includes(routeName);
  const id = isReputation ? 'reputazione' : null;
  return id;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/tests/appFunctions.test.js`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
git add src/view/appFunctions.js scripts/tests/appFunctions.test.js
git commit -m "[VIEW] Modulo appFunctions: config funzioni app + activeFunctionId"
```

---

## Task 2: Testo `REPUTATION_HELP` in `uiCopy.js`

**Files:**
- Modify: `src/view/uiCopy.js`

- [ ] **Step 1: Aggiungere la costante**

Aggiungere in coda a `src/view/uiCopy.js` (dopo `SCORE_TIP`):

```javascript
export const REPUTATION_HELP = "Ogni personaggio ha un'opinione su ogni altro, da 1 a 100 (di base 50). Le relazioni sono asimmetriche: ciò che A pensa di B è indipendente da ciò che B pensa di A. Ogni transazione, un evento positivo o negativo, alza o abbassa il punteggio. Il punteggio sintetico mostrato è la media dei voti che un personaggio riceve dagli altri.";
```

- [ ] **Step 2: Commit**

```bash
git add src/view/uiCopy.js
git commit -m "[VIEW] uiCopy: testo REPUTATION_HELP per il drawer"
```

---

## Task 3: Icona `menu` (hamburger) in `Icon.vue`

**Files:**
- Modify: `src/view/components/Icon.vue`

- [ ] **Step 1: Aggiungere la voce all'oggetto ICONS**

In `src/view/components/Icon.vue`, dentro l'oggetto `ICONS`, aggiungere dopo la riga `close:`:

```javascript
  menu:    ['M3 6h18', 'M3 12h18', 'M3 18h18'],
```

Il blocco risultante (le ultime due voci):

```javascript
  close:   ['M18 6 6 18', 'm6 6 12 12'],
  menu:    ['M3 6h18', 'M3 12h18', 'M3 18h18'],
```

- [ ] **Step 2: Verifica manuale rapida**

Avviare `npm run dev` e confermare nessun errore di compilazione. (Render verificato nel Task 6.)

- [ ] **Step 3: Commit**

```bash
git add src/view/components/Icon.vue
git commit -m "[VIEW] Icon: aggiunge icona menu (hamburger)"
```

---

## Task 4: Componente `AppDrawer.vue`

**Files:**
- Create: `src/view/components/AppDrawer.vue`

Dipende da: Task 1 (`appFunctions.js`), Task 2 (`REPUTATION_HELP`), Task 3 (icona `close` già esistente).

- [ ] **Step 1: Creare il componente**

`src/view/components/AppDrawer.vue`:

```vue
<template>
  <div class="rep-drawer-root">
    <div class="rep-drawer-scrim" :class="{ 'is-open': open }"
      @click="emit('close')" aria-hidden="true"></div>

    <aside ref="panel" class="rep-drawer" :class="{ 'is-open': open }"
      role="dialog" aria-modal="true" aria-label="Menu TTRPG-Core">

      <!-- Identità app -->
      <div class="rep-drawer__sec rep-drawer__brand">
        <span class="rep-drawer__mark" aria-hidden="true">◆</span>
        <span class="rep-drawer__brandtext">
          <b>TTRPG-Core</b>
          <span>Toolset per le tue campagne</span>
        </span>
        <button ref="closeBtn" class="rep-drawer__close" @click="emit('close')" aria-label="Chiudi menu">
          <Icon name="close" />
        </button>
      </div>

      <!-- Selettore funzioni -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Funzioni</div>
        <template v-for="fn in functions" :key="fn.id">
          <button v-if="fn.status === 'active'" class="rep-drawer__fn"
            :class="{ 'is-active': fn.id === activeId }" @click="onSelect(fn)">
            <span class="rep-drawer__fn-ic" aria-hidden="true"></span>
            {{ fn.label }}
          </button>
          <span v-else class="rep-drawer__fn rep-drawer__fn--soon">
            <span class="rep-drawer__fn-ic" aria-hidden="true"></span>
            {{ fn.label }}
            <span class="rep-drawer__badge">in arrivo</span>
          </span>
        </template>
      </div>

      <!-- Come funziona la reputazione -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Reputazione · come funziona</div>
        <p class="rep-drawer__doc">{{ reputationHelp }}</p>
      </div>

      <!-- Impostazioni (placeholder) -->
      <div class="rep-drawer__sec">
        <div class="rep-drawer__label">Impostazioni · Reputazione</div>
        <div class="rep-drawer__placeholder">Nessuna impostazione disponibile (in arrivo)</div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_FUNCTIONS, activeFunctionId } from '../appFunctions.js';
import { REPUTATION_HELP } from '../uiCopy.js';
import Icon from './Icon.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);

const route = useRoute();
const router = useRouter();

const functions = APP_FUNCTIONS;
const reputationHelp = REPUTATION_HELP;

const activeId = computed(() => {
  const id = activeFunctionId(route.name);
  return id;
});

const panel = ref(null);
const closeBtn = ref(null);

function onSelect(fn) {
  if (fn.routeName && route.name !== fn.routeName) {
    router.push({ name: fn.routeName });
  }
  emit('close');
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) {
    emit('close');
  }
}

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    closeBtn.value?.focus();
  }
});

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/view/components/AppDrawer.vue
git commit -m "[VIEW] AppDrawer: componente drawer di navigazione"
```

---

## Task 5: Stili del drawer in `main.css`

**Files:**
- Modify: `styles/main.css`

- [ ] **Step 1: Aggiungere il blocco stili**

Aggiungere in coda a `styles/main.css`:

```css
/* === Drawer di navigazione ================================= */
.rep-header__menu {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.2rem; height: 2.2rem; margin-right: .6rem; flex: none;
  background: transparent; border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm); color: var(--text-strong); cursor: pointer;
  transition: background var(--dur-fast), border-color var(--dur-fast);
}
.rep-header__menu:hover { background: var(--surface-card); border-color: var(--line-gold); }
.rep-header__menu:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--gold-400); }

.rep-drawer-scrim {
  position: fixed; inset: 0; z-index: 1500;
  background: rgba(40, 32, 18, .34);
  opacity: 0; pointer-events: none;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.rep-drawer-scrim.is-open { opacity: 1; pointer-events: auto; }

.rep-drawer {
  position: fixed; top: 0; left: 0; bottom: 0; z-index: 1600;
  width: min(300px, 85vw);
  display: flex; flex-direction: column;
  background: var(--surface-panel);
  border-right: 1px solid var(--line-gold);
  box-shadow: 0 8px 24px rgba(40, 32, 18, .22);
  transform: translateX(-100%);
  transition: transform var(--dur-fast) var(--ease-out);
  overflow-y: auto;
}
.rep-drawer.is-open { transform: translateX(0); }

.rep-drawer__sec { padding: .9rem 1rem; border-bottom: 1px solid var(--border-hairline); }
.rep-drawer__sec:last-child { border-bottom: none; }

.rep-drawer__brand { display: flex; align-items: center; gap: .6rem; }
.rep-drawer__mark {
  width: 1.9rem; height: 1.9rem; flex: none; border-radius: var(--radius-sm);
  background: var(--gold-400); color: #2c220e;
  display: inline-flex; align-items: center; justify-content: center; font-weight: 800;
}
.rep-drawer__brandtext { display: flex; flex-direction: column; line-height: 1.15; }
.rep-drawer__brandtext b {
  font-family: var(--font-display); color: var(--text-strong); letter-spacing: .04em;
}
.rep-drawer__brandtext span { font-size: var(--fs-xs); color: var(--text-muted); }
.rep-drawer__close {
  margin-left: auto; background: transparent; border: none; cursor: pointer;
  color: var(--text-muted); display: inline-flex; padding: .25rem; border-radius: var(--radius-sm);
}
.rep-drawer__close:hover { color: var(--text-strong); background: var(--surface-card); }

.rep-drawer__label {
  font-family: var(--font-display); font-size: var(--fs-label);
  text-transform: uppercase; letter-spacing: var(--ls-caps);
  color: var(--gold-700); margin-bottom: .5rem;
}
.rep-drawer__fn {
  display: flex; align-items: center; gap: .55rem; width: 100%;
  padding: .5rem .55rem; margin-bottom: .25rem;
  background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
  font-family: var(--font-display); font-size: var(--fs-sm); color: var(--text-strong);
  text-align: left; cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.rep-drawer__fn:hover { background: var(--surface-card); }
.rep-drawer__fn.is-active {
  background: linear-gradient(180deg,
    color-mix(in oklab, var(--gold-400), var(--gold-300) 38%),
    color-mix(in oklab, var(--gold-500), var(--gold-400) 38%));
  border-color: var(--gold-500); color: #2c220e; font-weight: var(--fw-semibold);
}
.rep-drawer__fn--soon { color: var(--text-faint); cursor: default; }
.rep-drawer__fn-ic {
  width: 1rem; height: 1rem; flex: none; border-radius: 3px;
  background: rgba(120, 100, 50, .25);
}
.rep-drawer__fn.is-active .rep-drawer__fn-ic { background: #2c220e; }
.rep-drawer__badge {
  margin-left: auto; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .06em;
  background: var(--gold-100); color: var(--gold-700);
  padding: .1rem .4rem; border-radius: var(--radius-pill);
}
.rep-drawer__doc { font-size: var(--fs-sm); line-height: 1.55; color: var(--text-strong); margin: 0; }
.rep-drawer__placeholder {
  border: 1px dashed var(--border-hairline); border-radius: var(--radius-sm);
  padding: .7rem; text-align: center; color: var(--text-faint); font-size: var(--fs-sm);
}

@media (prefers-reduced-motion: reduce) {
  .rep-drawer, .rep-drawer-scrim { transition: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/main.css
git commit -m "[STYLE] Drawer di navigazione: stili rep-drawer"
```

---

## Task 6: Integrazione in `App.vue` + verifica manuale

**Files:**
- Modify: `src/view/App.vue`

Dipende da tutti i task precedenti.

- [ ] **Step 1: Aggiornare gli import e lo script**

In `src/view/App.vue`, sostituire il blocco import iniziale dello `<script setup>`:

```javascript
import { useStore } from './useStore.js';
import { serializeState, parseImport } from '../store/io.js';

const { getState, replaceState } = useStore();
```

con:

```javascript
import { ref, nextTick } from 'vue';
import { useStore } from './useStore.js';
import { serializeState, parseImport } from '../store/io.js';
import AppDrawer from './components/AppDrawer.vue';
import Icon from './components/Icon.vue';

const { getState, replaceState } = useStore();

const drawerOpen = ref(false);
const menuBtn = ref(null);

function openDrawer() {
  drawerOpen.value = true;
}

function onDrawerClose() {
  drawerOpen.value = false;
  nextTick(() => menuBtn.value?.focus());
}
```

- [ ] **Step 2: Aggiungere l'hamburger nell'header**

In `src/view/App.vue`, sostituire l'apertura dell'header:

```html
    <header class="rep-header">
      <!-- Logo -->
      <span class="ds-logo">
```

con:

```html
    <header class="rep-header">
      <!-- Hamburger drawer -->
      <button ref="menuBtn" class="rep-header__menu" @click="openDrawer" aria-label="Apri menu">
        <Icon name="menu" />
      </button>

      <!-- Logo -->
      <span class="ds-logo">
```

- [ ] **Step 3: Rendere il drawer**

In `src/view/App.vue`, sostituire la chiusura del main:

```html
    <main class="rep-main">
      <router-view />
    </main>
  </div>
</template>
```

con:

```html
    <main class="rep-main">
      <router-view />
    </main>

    <AppDrawer :open="drawerOpen" @close="onDrawerClose" />
  </div>
</template>
```

- [ ] **Step 4: Verifica manuale nel browser**

Avviare `npm run dev` e verificare:

1. L'hamburger compare nell'header; il click apre il drawer (scrim + pannello da sinistra).
2. Chiusura con X, click sullo scrim ed Esc funzionano tutte.
3. "Reputazione" è evidenziata come attiva (sia su `/personaggi` sia su un profilo); "Altro" è disabilitata col badge "in arrivo".
4. La spiegazione mostra il testo di `REPUTATION_HELP`.
5. La sezione impostazioni mostra il placeholder.
6. Su mobile (320 / 375 / 425px) il drawer non sfora (max 85vw) e il contenuto sottostante resta usabile a drawer chiuso.
7. All'apertura il focus va sul bottone di chiusura; alla chiusura torna sull'hamburger.

- [ ] **Step 5: Commit**

```bash
git add src/view/App.vue
git commit -m "[VIEW] App: hamburger nell'header e render del drawer"
```

---

## Note finali

- Aggiornare `docs/features/004-drawer-navigazione/` con un eventuale file `STATO` o spuntare i follow-up a feature completata, come da workflow del progetto.
- Nessun ADR necessario: nessuna decisione architetturale nuova (il drawer è interamente VIEW, coerente coi vincoli esistenti).
