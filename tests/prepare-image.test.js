import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeResizeDims } from '../src/store/prepareImage.js';

test('non fa upscaling quando l immagine è più piccola del massimo', () => {
  const d = computeResizeDims({ width: 800, height: 600 }, 1600);
  assert.deepEqual(d, { width: 800, height: 600 });
});

test('scala giù mantenendo l aspect ratio (lato lungo orizzontale)', () => {
  const d = computeResizeDims({ width: 3200, height: 1600 }, 1600);
  assert.deepEqual(d, { width: 1600, height: 800 });
});

test('scala giù quando il lato lungo è verticale', () => {
  const d = computeResizeDims({ width: 1000, height: 4000 }, 1600);
  assert.deepEqual(d, { width: 400, height: 1600 });
});
