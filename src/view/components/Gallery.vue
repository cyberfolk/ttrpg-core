<template>
  <!-- Galleria "tavole" del tomo: griglia image-forward. La tavola eletta a profilo
       porta cornice oro + sigillo. Clic su una tavola → dettaglio (didascalia,
       descrizione, tag, azioni). Byte in IndexedDB (photoBlobStore), metadati nello STORE. -->
  <div class="gallery"
    :class="{ 'gallery--drag': dragActive }"
    @dragenter.prevent="dragActive = true"
    @dragover.prevent="dragActive = true"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop">

    <ul v-if="photos.length || busy" class="gallery__grid">
      <li v-for="p in photos" :key="p.id" class="gallery__plate"
        :class="{ 'gallery__plate--avatar': p.id === entity.avatarPhotoId, 'gallery__plate--framing': framingId === p.id }">
        <div class="gallery__framewrap">
          <button type="button" class="gallery__frame"
            :aria-label="p.caption ? `Apri «${p.caption}»` : 'Apri tavola'"
            :disabled="framingId === p.id"
            @click="openDetail(p.id)">
            <GalleryThumb :photo-id="p.id" :alt="p.caption" :focus="p.focus" />
            <span v-if="p.id === entity.avatarPhotoId" class="gallery__seal"
              aria-label="Tavola di profilo" title="Tavola di profilo">
              <Icon name="check" />
            </span>
          </button>

          <!-- Reinquadra: sposta il punto focale (per i ritratti tagliati male).
               Attivo → clic/trascina sull'immagine sceglie il punto da mostrare. -->
          <button type="button" class="gallery__reframe"
            :class="{ 'is-on': framingId === p.id }" :aria-pressed="framingId === p.id"
            :title="framingId === p.id ? 'Fine reinquadratura' : 'Reinquadra'"
            aria-label="Reinquadra la tavola" @click.stop="toggleFraming(p.id)">
            <Icon :name="framingId === p.id ? 'check' : 'crosshair'" />
          </button>

          <div v-if="framingId === p.id" class="gallery__reframe-surf"
            title="Clic o trascina sul punto da mostrare"
            @pointerdown="onReframe($event, p.id)" @pointermove="onReframe($event, p.id)">
            <span class="gallery__reframe-dot"
              :style="{ left: (p.focus ? p.focus.x : 50) + '%', top: (100 - (p.focus ? p.focus.y : 50)) + '%' }"></span>
          </div>
        </div>

        <div class="gallery__cap">
          <input class="gallery__cap-input" type="text" :value="p.caption"
            placeholder="Senza titolo" :aria-label="`Didascalia di ${p.caption || 'tavola'}`"
            @change="setCaption(p.id, $event.target.value)" />
        </div>
      </li>

      <li v-if="busy" class="gallery__plate gallery__plate--busy" aria-live="polite">
        <span class="gallery__busy">
          <span class="gallery__spinner" aria-hidden="true"></span>
          Preparo…
        </span>
      </li>
    </ul>

    <!-- Stato vuoto: arioso, non una card. Insegna cos'è e invita a caricare. -->
    <div v-else class="gallery__empty">
      <span class="gallery__empty-glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </span>
      <h3 class="gallery__empty-title">Nessuna tavola</h3>
      <p class="gallery__empty-body">
        Raccogli qui i ritratti e le scene di {{ entityName }}. Una tavola può diventare
        l'immagine di profilo.
      </p>
    </div>

    <p v-if="uploadError" class="gallery__err" role="alert">{{ uploadError }}</p>

    <div class="gallery__foot">
      <label class="ds-btn ds-btn--primary ds-btn--sm gallery__upload">
        <input type="file" accept="image/*" multiple hidden @change="onPick" />
        <Icon name="plus" />
        <span>Aggiungi tavole</span>
      </label>
      <span class="gallery__hint">o trascina qui le immagini</span>
    </div>

    <PhotoDetail v-if="detailId" :photo-id="detailId" :entity="entity"
      @close="detailId = null" @deleted="detailId = null" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from '../useStore.js';
import { photoBlobStore } from '../photoStore.js';
import { prepareImage } from '../../store/prepareImage.js';
import { addPhoto, removePhoto, updatePhotoMeta, listPhotos, setPhotoFocus } from '../../model/photos.js';
import { displayName } from '../disambiguation.js';
import Icon from './Icon.vue';
import GalleryThumb from './GalleryThumb.vue';
import PhotoDetail from './PhotoDetail.vue';

const props = defineProps({
  // 'character' | 'group' — parità con Notes.vue; non discrimina la logica (id polimorfo).
  kind: { type: String, required: true },
  entity: { type: Object, required: true },
});

const { state, dispatch, getState } = useStore();

const photos = computed(() => listPhotos(state.value, props.entity.id));
const entityName = computed(() => displayName(props.entity));

const detailId = ref(null);
const busy = ref(false);
const dragActive = ref(false);
const uploadError = ref('');

function openDetail(id) {
  detailId.value = id;
}

// Reinquadratura: attiva/disattiva la modalità per una tavola; mentre è attiva,
// clic o trascinamento sull'immagine sceglie il punto focale (object-position).
const framingId = ref(null);
function toggleFraming(id) {
  framingId.value = framingId.value === id ? null : id;
}
function onReframe(e, id) {
  // pointermove senza pulsante premuto: ignora (solo hover).
  if (e.type === 'pointermove' && e.buttons === 0) {
    return;
  }
  const rect = e.currentTarget.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  // Asse Y invertito: trascinare in su rivela la parte opposta (object-position
  // cresce), coerente col gesto di spostare l'immagine.
  const y = (1 - (e.clientY - rect.top) / rect.height) * 100;
  dispatch((s) => setPhotoFocus(s, id, { x, y }));
}

function setCaption(photoId, caption) {
  dispatch((s) => updatePhotoMeta(s, photoId, { caption }));
}

// Prepara l'immagine, crea il metadato, recupera l'id appena nato (diff prima/dopo),
// salva il blob con quell'id. Se la scrittura del blob fallisce, fa rollback del
// metadato per non lasciare una Photo orfana (senza byte) nello STORE.
async function ingestFile(file) {
  const blob = await prepareImage(file);
  const before = new Set(getState().photos.map((p) => p.id));
  const entityId = props.entity.id;
  dispatch((s) => addPhoto(s, entityId, {}));
  const created = getState().photos.find((p) => !before.has(p.id));
  if (!created) {
    return;
  }
  try {
    await photoBlobStore.put(created.id, blob);
  } catch (err) {
    dispatch((s) => removePhoto(s, created.id));
    throw err;
  }
}

async function ingestFiles(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
  if (!files.length) {
    return;
  }
  busy.value = true;
  uploadError.value = '';
  let failed = 0;
  // Un file corrotto non deve interrompere il batch: isola ogni ingest.
  for (const file of files) {
    try {
      await ingestFile(file);
    } catch (err) {
      failed += 1;
    }
  }
  busy.value = false;
  if (failed > 0) {
    uploadError.value = failed === 1
      ? 'Una tavola non è stata caricata (file non valido).'
      : `${failed} tavole non sono state caricate (file non validi).`;
  }
}

async function onPick(e) {
  await ingestFiles(e.target.files);
  e.target.value = '';
}

function onDragLeave(e) {
  // Ignora i dragleave verso figli interni: disattiva solo uscendo dal contenitore.
  if (e.currentTarget.contains(e.relatedTarget)) {
    return;
  }
  dragActive.value = false;
}

async function onDrop(e) {
  dragActive.value = false;
  const files = e.dataTransfer ? e.dataTransfer.files : null;
  if (files) {
    await ingestFiles(files);
  }
}
</script>

<style scoped>
.gallery { position: relative; padding-left: .7rem; }

/* Griglia responsive senza breakpoint: tavole che riempiono lo spazio disponibile. */
.gallery__grid {
  list-style: none; margin: 0; padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: var(--space-4);
}

.gallery__plate { display: flex; flex-direction: column; gap: .4rem; min-width: 0; }

/* Cornice della tavola: il bordo del tomo attorno all'immagine. */
.gallery__frame {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--surface-panel);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  transition: border-color .18s var(--ease-out, ease), box-shadow .18s var(--ease-out, ease), transform .18s var(--ease-out, ease);
}
.gallery__frame:hover {
  border-color: var(--line-gold);
  box-shadow: var(--shadow-md);
}
.gallery__frame:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

/* Tavola-profilo: cornice oro piena + sigillo d'angolo. */
.gallery__plate--avatar .gallery__frame {
  border-color: var(--gold-500);
  border-width: 2px;
  box-shadow: 0 0 0 3px var(--accent-tint), var(--shadow-sm);
}
.gallery__seal {
  position: absolute; top: .4rem; right: .4rem;
  display: grid; place-items: center;
  width: 1.5rem; height: 1.5rem;
  color: var(--on-accent);
  background: linear-gradient(180deg, var(--gold-300), var(--gold-500));
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  font-size: .85rem;
}

/* Wrapper della cornice: ancora i controlli sovrapposti (reinquadra). */
.gallery__framewrap { position: relative; }

/* Bottone «reinquadra»: pallino d'angolo, compare all'hover della tavola. */
.gallery__reframe {
  position: absolute; top: .4rem; left: .4rem; z-index: 2;
  display: grid; place-items: center;
  width: 1.6rem; height: 1.6rem; padding: 0; cursor: pointer;
  color: var(--text-strong); background: var(--surface-card);
  border: 1px solid var(--border-strong); border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm); font-size: .8rem;
  opacity: 0; transition: opacity .15s, color .15s, border-color .15s, background .15s;
}
.gallery__plate:hover .gallery__reframe,
.gallery__reframe:focus-visible,
.gallery__reframe.is-on { opacity: 1; }
.gallery__reframe:hover { color: var(--gold-700); border-color: var(--gold-500); }
.gallery__reframe:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.gallery__reframe.is-on {
  color: var(--on-accent); border-color: var(--gold-500);
  background: linear-gradient(180deg, var(--gold-300), var(--gold-500));
}
@media (pointer: coarse) { .gallery__reframe { opacity: 1; } }

/* Superficie di reinquadratura: cattura clic/trascinamento sopra l'immagine
   (la cornice è disabilitata mentre è attiva) e mostra il punto focale scelto. */
.gallery__reframe-surf {
  position: absolute; inset: 0; z-index: 1; cursor: crosshair;
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 0 2px var(--gold-500), inset 0 0 0 6px var(--accent-tint);
  touch-action: none;
}
.gallery__reframe-dot {
  position: absolute; width: .95rem; height: .95rem;
  transform: translate(-50%, -50%); pointer-events: none;
  border: 2px solid var(--gold-300); border-radius: var(--radius-pill);
  background: rgba(0, 0, 0, .25); box-shadow: 0 0 0 1px rgba(0, 0, 0, .35);
}

/* Didascalia inline sotto la tavola: modificabile al volo, discreta. */
.gallery__cap-input {
  width: 100%;
  font-family: var(--font-sans); font-size: var(--fs-sm); color: var(--text-strong);
  background: transparent; border: none; border-bottom: 1px solid transparent;
  padding: .15rem .1rem; border-radius: 0;
  transition: border-color .15s;
}
.gallery__cap-input::placeholder { color: var(--text-faint); font-style: italic; }
.gallery__cap-input:hover { border-bottom-color: var(--border-hairline); }
.gallery__cap-input:focus {
  outline: none; border-bottom-color: var(--gold-500); color: var(--text-strong);
}

/* Tavola "in preparazione": stessa impronta, contenuto di attesa. */
.gallery__plate--busy .gallery__busy {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: .5rem; width: 100%; aspect-ratio: 4 / 5;
  color: var(--text-muted); font-size: var(--fs-sm);
  background: var(--surface-panel);
  border: 1px dashed var(--line-gold); border-radius: var(--radius-md);
}
.gallery__spinner {
  width: 1.4rem; height: 1.4rem; border-radius: 50%;
  border: 2px solid var(--line-gold); border-top-color: var(--gold-500);
  animation: gallery-spin .7s linear infinite;
}
@keyframes gallery-spin { to { transform: rotate(360deg); } }

/* Stato vuoto arioso (glifo, titolo, corpo), coerente con gli altri empty state. */
.gallery__empty {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  gap: .5rem; padding: var(--space-8) var(--space-4) var(--space-6);
  color: var(--text-muted);
}
.gallery__empty-glyph { color: var(--gold-500); }
.gallery__empty-glyph svg { width: 2.6rem; height: 2.6rem; }
.gallery__empty-title {
  font-family: var(--font-display); font-size: var(--fs-h3);
  color: var(--text-strong); margin: 0;
}
.gallery__empty-body { max-width: 42ch; margin: 0; line-height: 1.5; }

/* Piede: azione di caricamento + suggerimento drag. */
.gallery__foot {
  display: flex; align-items: center; gap: .8rem; flex-wrap: wrap;
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-hairline);
}
.gallery__upload { cursor: pointer; }
.gallery__hint { color: var(--text-faint); font-size: var(--fs-sm); }

.gallery__err {
  margin: var(--space-3) 0 0;
  color: var(--ember-700);
  background: var(--ember-100);
  border: 1px solid var(--ember-300);
  border-radius: var(--radius-sm);
  padding: .5rem .7rem; font-size: var(--fs-sm);
}

/* Feedback drag: la galleria si "accende" come area di rilascio. */
.gallery--drag { }
.gallery--drag::after {
  content: "Rilascia per aggiungere";
  position: absolute; inset: -.4rem;
  display: grid; place-items: center;
  font-family: var(--font-display); font-size: var(--fs-lg); color: var(--gold-700);
  background: color-mix(in oklab, var(--accent-tint) 82%, transparent);
  border: 2px dashed var(--gold-500); border-radius: var(--radius-lg);
  pointer-events: none; z-index: 5;
}

@media (prefers-reduced-motion: reduce) {
  .gallery__frame { transition: none; }
  .gallery__frame:hover { transform: none; }
  .gallery__spinner { animation: none; }
}
</style>
