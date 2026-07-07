import { ref, watch, onUnmounted } from 'vue';
import { photoBlobStore } from './photoStore.js';

// Risolve un photoId in un object URL per <img :src>. Revoca l'URL precedente a
// ogni cambio e allo smontaggio: nessun memory leak. `photoIdRef` è un ref (o
// getter-ref) al photoId; null → nessuna immagine (placeholder a carico del chiamante).
export function usePhotoUrl(photoIdRef) {
  const url = ref(null);

  function revoke() {
    if (url.value) {
      URL.revokeObjectURL(url.value);
      url.value = null;
    }
  }

  async function load(id) {
    revoke();
    if (!id) {
      return;
    }
    const blob = await photoBlobStore.get(id);
    // Se nel frattempo l'id è cambiato di nuovo, scarta questo risultato stantìo.
    if (blob && photoIdRef.value === id) {
      url.value = URL.createObjectURL(blob);
    }
  }

  watch(photoIdRef, (id) => { load(id); }, { immediate: true });
  onUnmounted(revoke);

  return url;
}
