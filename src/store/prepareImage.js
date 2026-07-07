// computeResizeDims è puro e testabile; prepareImage usa <canvas> (solo browser).
export function computeResizeDims({ width, height }, maxLong) {
  const longSide = Math.max(width, height);
  if (longSide <= maxLong) {
    const same = { width, height };
    return same;
  }
  const scale = maxLong / longSide;
  const dims = { width: Math.round(width * scale), height: Math.round(height * scale) };
  return dims;
}

// Ridimensiona e ricomprime un File immagine in un Blob (WebP, fallback JPEG).
// Solo browser: usa createImageBitmap/<canvas>. Non coperto da node:test.
export async function prepareImage(file, opts = {}) {
  const maxLong = opts.maxLong ?? 1600;
  const quality = opts.quality ?? 0.85;
  const bitmap = await createImageBitmap(file);
  const dims = computeResizeDims({ width: bitmap.width, height: bitmap.height }, maxLong);
  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, dims.width, dims.height);
  const type = 'image/webp';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  const out = blob ?? await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  // Entrambe le codifiche fallite → niente byte: meglio un errore (che fa fare
  // rollback del metadato al chiamante) che salvare un blob vuoto/nullo.
  if (!out) {
    throw new Error('Impossibile codificare l\'immagine');
  }
  return out;
}
