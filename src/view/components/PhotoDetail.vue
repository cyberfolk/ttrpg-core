<template>
  <Teleport to="body">
    <div class="ds-overlay" @click.self="emit('close')">
      <div class="ds-dialog gphoto" role="dialog" aria-label="Dettaglio tavola">
        <button class="ds-dialog__close ds-dialog__close--corner" @click="emit('close')" aria-label="Chiudi">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        <template v-if="photo">
          <div class="gphoto__stage">
            <GalleryThumb :photo-id="photo.id" :alt="photo.caption" :cover="false" />
          </div>

          <div class="gphoto__side">
            <input class="ds-input gphoto__caption" type="text" :value="photo.caption"
              placeholder="Didascalia" aria-label="Didascalia"
              @change="commit({ caption: $event.target.value })" />

            <label class="gphoto__lbl" :for="descId">Descrizione</label>
            <textarea :id="descId" ref="descRef" class="ds-input gphoto__desc" rows="3"
              v-model="descDraft" @input="autosize" @blur="commitDesc"
              placeholder="markdown: **grassetto**, *corsivo*, - elenco"></textarea>
            <div v-if="descHtml" class="gphoto__preview notes__md" v-html="descHtml"></div>

            <Many2ManyField class="gphoto__tags" label="Tag" :model-value="photo.tagIds"
              :pool="tagPool" icon="tag" add-text="aggiungi tag…" empty-text="Nessun tag · aggiungi"
              search-placeholder="cerca tag…" @update:model-value="onTags" @create="onCreateTag" />

            <div class="gphoto__meta">Aggiunta il {{ addedOn }}</div>

            <div class="gphoto__actions">
              <button v-if="!isAvatar" type="button" class="ds-btn ds-btn--primary ds-btn--sm"
                @click="setAsAvatar">
                <Icon name="check" /> Imposta come profilo
              </button>
              <button v-else type="button" class="ds-btn ds-btn--secondary ds-btn--sm"
                @click="removeAsAvatar">
                Rimuovi dal profilo
              </button>

              <template v-if="confirmDelete">
                <button type="button" class="ds-btn ds-btn--danger ds-btn--sm" @click="doDelete">
                  Conferma eliminazione
                </button>
                <button type="button" class="ds-btn ds-btn--ghost ds-btn--sm" @click="confirmDelete = false">
                  Annulla
                </button>
              </template>
              <button v-else type="button" class="ds-btn ds-btn--danger ds-btn--sm gphoto__del"
                @click="confirmDelete = true">
                <Icon name="trash" /> Elimina
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useStore } from '../useStore.js';
import { useDialog } from '../useDialog.js';
import { photoBlobStore } from '../photoStore.js';
import { renderMarkdown } from '../markdown.js';
import { createLookup } from '../../model/schema.js';
import { addLookupItem, listLookup } from '../../model/reputation.js';
import { updatePhotoMeta, removePhoto, setAvatar, clearAvatar } from '../../model/photos.js';
import GalleryThumb from './GalleryThumb.vue';
import Many2ManyField from './Many2ManyField.vue';
import Icon from './Icon.vue';

const props = defineProps({
  photoId: { type: String, required: true },
  entity: { type: Object, required: true },
});
const emit = defineEmits(['close', 'deleted']);

const { state, dispatch } = useStore();

useDialog({ onClose: () => emit('close') });

const photo = computed(() => state.value.photos.find((p) => p.id === props.photoId) || null);
const isAvatar = computed(() => props.entity.avatarPhotoId === props.photoId);
const tagPool = computed(() => listLookup(state.value, 'tags'));

const descId = `gphoto-desc-${props.photoId}`;
const descDraft = ref(photo.value ? photo.value.description : '');
const descRef = ref(null);
const confirmDelete = ref(false);

// Se la foto cambia (o si ricarica), riallinea la bozza descrizione.
watch(photo, (p) => { if (p) descDraft.value = p.description; });

const descHtml = computed(() => renderMarkdown(descDraft.value));

const addedOn = computed(() => {
  if (!photo.value) {
    return '';
  }
  const label = new Date(photo.value.createdAt).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  return label;
});

function commit(patch) {
  const id = props.photoId;
  dispatch((s) => updatePhotoMeta(s, id, patch));
}

function commitDesc() {
  commit({ description: descDraft.value });
}

function autosize() {
  const el = descRef.value;
  if (!el) {
    return;
  }
  el.style.height = 'auto';
  const border = el.offsetHeight - el.clientHeight;
  el.style.height = `${el.scrollHeight + border}px`;
}

function onTags(ids) {
  commit({ tagIds: ids });
}
function onCreateTag(name) {
  const item = createLookup(name);
  dispatch((s) => addLookupItem(s, 'tags', item));
  const nextIds = [...photo.value.tagIds, item.id];
  commit({ tagIds: nextIds });
}

function setAsAvatar() {
  const entityId = props.entity.id;
  const id = props.photoId;
  dispatch((s) => setAvatar(s, entityId, id));
}
function removeAsAvatar() {
  const entityId = props.entity.id;
  dispatch((s) => clearAvatar(s, entityId));
}

async function doDelete() {
  const id = props.photoId;
  dispatch((s) => removePhoto(s, id));
  await photoBlobStore.delete(id);
  emit('deleted', id);
}

nextTick(autosize);
</script>

<style scoped>
/* Dettaglio a due colonne: palco immagine + colonna metadati. Su mobile impila. */
.gphoto {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(15rem, 1fr);
  gap: 0;
  max-width: min(56rem, calc(100vw - 2rem));
  width: 100%;
  padding: 0;
  overflow: hidden;
}

.gphoto__stage {
  background:
    radial-gradient(120% 120% at 50% 0%, var(--paper-100), var(--paper-200));
  display: grid; place-items: center;
  min-height: 18rem;
  max-height: 78vh;
  padding: var(--space-4);
}
.gphoto__stage :deep(img) { max-height: 74vh; border-radius: var(--radius-sm); box-shadow: var(--shadow-md); }

.gphoto__side {
  display: flex; flex-direction: column; gap: .6rem;
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-left: 1px solid var(--border-hairline);
  overflow-y: auto;
  max-height: 78vh;
}

.gphoto__caption {
  font-family: var(--font-display); font-size: var(--fs-lg);
  color: var(--text-strong);
}
.gphoto__lbl {
  font-family: var(--font-display); font-size: var(--fs-label);
  letter-spacing: var(--ls-caps, .08em); text-transform: uppercase;
  color: var(--text-muted); margin-top: .2rem;
}
.gphoto__desc { resize: none; overflow: hidden; min-height: 4rem; line-height: 1.5; }

.gphoto__preview {
  font-family: var(--font-sans); font-size: var(--fs-sm);
  color: var(--text-body, var(--text-strong)); line-height: 1.5;
  padding: .4rem .1rem; border-top: 1px solid var(--border-hairline);
}
.gphoto__preview :deep(p) { margin: 0 0 .4rem; }
.gphoto__preview :deep(p:last-child) { margin-bottom: 0; }
.gphoto__preview :deep(strong) { color: var(--text-strong); }
.gphoto__preview :deep(code) {
  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .88em;
  padding: .05rem .3rem; background: var(--accent-tint); color: var(--gold-700);
  border-radius: var(--radius-sm);
}

.gphoto__tags { margin-top: .2rem; }

.gphoto__meta { font-size: var(--fs-xs); color: var(--text-faint); }

.gphoto__actions {
  display: flex; flex-wrap: wrap; gap: .5rem;
  margin-top: auto; padding-top: var(--space-4);
  border-top: 1px solid var(--border-hairline);
}
.gphoto__del { margin-left: auto; }

@media (max-width: 640px) {
  .gphoto { grid-template-columns: 1fr; }
  .gphoto__stage { max-height: 42vh; }
  .gphoto__stage :deep(img) { max-height: 40vh; }
  .gphoto__side { border-left: none; border-top: 1px solid var(--border-hairline); max-height: none; }
}
</style>
