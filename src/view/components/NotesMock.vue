<template>
  <!-- MOCKUP: note markdown come pannello di tab. Stato locale (ref), non
       persistito, nessun STORE/MODEL. Matita in alto a destra: anteprima↔modifica. -->
  <div class="notes">
    <div class="notes__topright">
      <HoverTip v-if="!editing" text="Modifica" :tab-index="-1">
        <button type="button" class="notes__pencil" aria-label="Modifica note" @click="editing = true">
          <Icon name="edit" />
        </button>
      </HoverTip>
      <button v-else type="button" class="ds-btn ds-btn--sm ds-btn--ghost" @click="editing = false">
        <span class="ds-btn__icon"><Icon name="check" /></span> Fatto
      </button>
    </div>

    <textarea v-if="editing" class="ds-input notes__ta" v-model="text"
      rows="8" aria-label="Note in markdown"
      placeholder="markdown: **grassetto**, *corsivo*, `codice`, - elenco"></textarea>
    <div v-else class="notes__md" v-html="rendered"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';

const props = defineProps({
  kind: { type: String, required: true },
});

const editing = ref(false);
const text = ref(props.kind === 'character'
  ? 'Mercenario riservato, con un debito verso la **Gilda dei Velati**.\n\n- Fedele a chi paga\n- Odia i *nobiluomini di Valdûr*\n- Insegue la spada `Fendinube`'
  : 'Fondata dopo la **Caduta di Emberfall**.\n\n- Controlla i moli del porto\n- Alleata dei *Mercanti d\'Ottone*\n- Riscuote il pedaggio `del Ponte Nero`');

/* Mini-renderer markdown (mockup, no dipendenze). */
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
const rendered = computed(() => renderMd(text.value));
</script>

<style scoped>
.notes { position: relative; padding-top: 2rem; }
.notes__topright { position: absolute; top: 0; right: 0; }
.notes__pencil {
  background: none; border: none; cursor: pointer;
  color: var(--text-faint); opacity: .6; padding: .2rem;
  font-size: 1rem; line-height: 1; border-radius: var(--radius-sm);
  transition: opacity .15s, color .15s;
}
.notes__pencil:hover, .notes__pencil:focus-visible { opacity: 1; color: var(--text-strong); }
.notes__pencil:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

.notes__ta { width: 100%; resize: vertical; min-height: 8rem; line-height: 1.5; }
.notes__md {
  font-family: var(--font-sans); font-size: var(--fs-body);
  color: var(--text-body); line-height: 1.55; max-width: 70ch;
}
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
</style>
