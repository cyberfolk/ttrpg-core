import { ref, watch, onUnmounted } from 'vue';
import { photoBlobStore } from './photoStore.js';

// Risolve un photoId in un object URL per <img :src>. Revoca l'URL precedente a
// ogni cambio e allo smontaggio: nessun memory leak. `photoIdRef` è un ref (o
// getter-ref) al photoId; null → nessuna immagine (placeholder a carico del chiamante).
export function usePhotoUrl(photoIdRef) {
  const url = ref(null);
  // Vero dopo lo smontaggio: la get in volo, quando si risolve, non deve creare
  // un object URL che nessuno revocherà più (leak).
  let disposed = false;

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
    // Scarta il risultato se: componente smontato, oppure id cambiato nel frattempo.
    if (disposed || photoIdRef.value !== id) {
      return;
    }
    if (blob) {
      url.value = URL.createObjectURL(blob);
    }
  }

  watch(photoIdRef, (id) => { load(id); }, { immediate: true });
  onUnmounted(() => { disposed = true; revoke(); });

  return url;
}
