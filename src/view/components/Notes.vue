<template>
  <!-- Note markdown come pannello di tab, persistite nello store (MODEL: setCharacterNotes /
       setGroupNotes). Matita in alto a destra: anteprima↔modifica. -->
  <div class="notes">
    <div class="notes__topright">
      <HoverTip v-if="!editing" text="Modifica" :tab-index="-1">
        <button type="button" class="notes__pencil" aria-label="Modifica note" @click="edit">
          <Icon name="edit" />
        </button>
      </HoverTip>
      <button v-else type="button" class="ds-btn ds-btn--sm ds-btn--ghost" @click="done">
        <span class="ds-btn__icon"><Icon name="check" /></span> Fatto
      </button>
    </div>

    <textarea v-if="editing" class="ds-input notes__ta" v-model="text"
      rows="8" aria-label="Note in markdown" @blur="done"
      placeholder="markdown: **grassetto**, *corsivo*, `codice`, - elenco"></textarea>
    <div v-else class="notes__md" v-html="rendered"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from './Icon.vue';
import HoverTip from './HoverTip.vue';
import { useStore } from '../useStore.js';
import { setCharacterNotes, setGroupNotes } from '../../model/reputation.js';

const props = defineProps({
  kind: { type: String, required: true },
  entity: { type: Object, required: true },
});

const { dispatch } = useStore();

const editing = ref(false);
const text = ref(props.entity.notes || '');

function edit() {
  text.value = props.entity.notes || '';
  editing.value = true;
}
function done() {
  editing.value = false;
  const id = props.entity.id;
  const value = text.value;
  if (props.kind === 'character') dispatch((s) => setCharacterNotes(s, id, value));
  else dispatch((s) => setGroupNotes(s, id, value));
}

/* Mini-renderer markdown (no dipendenze). */
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
