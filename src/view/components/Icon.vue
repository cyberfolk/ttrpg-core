<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    style="display:inline-block;vertical-align:-0.13em" aria-hidden="true">
    <template v-for="(part, i) in parts" :key="i">
      <path v-if="typeof part === 'string'" :d="part" />
      <circle v-else-if="part.c" :cx="part.c[0]" :cy="part.c[1]" :r="part.c[2]" />
      <rect v-else-if="part.r" :x="part.r[0]" :y="part.r[1]" :width="part.r[2]" :height="part.r[3]" :rx="part.r[4]" />
    </template>
  </svg>
</template>

<script setup>
const ICONS = {
  plus:    ['M5 12h14', 'M12 5v14'],
  search:  [{ c: [11,11,8] }, 'm21 21-4.3-4.3'],
  goto:    ['M7 7h10v10', 'M7 17 17 7'],
  up:      ['m18 15-6-6-6 6'],
  down:    ['m6 9 6 6 6-6'],
  archive: [{ r: [3,4,18,4,1] }, 'M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8', 'M10 12h4'],
  restore: ['M3 7v6h6', 'M3.5 13a9 9 0 1 0 2.5-7.7L3 8'],
  trash:   ['M3 6h18', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  download:['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  upload:  ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  gallery: [{ r: [3,3,7,7,1] }, { r: [14,3,7,7,1] }, { r: [14,14,7,7,1] }, { r: [3,14,7,7,1] }],
  list:    ['M8 6h13','M8 12h13','M8 18h13','M3 6h.01','M3 12h.01','M3 18h.01'],
  matrix:  [{ r: [3,3,18,18,2] }, 'M3 9h18', 'M3 15h18', 'M9 3v18', 'M15 3v18'],
  help:    [{ c: [12,12,10] }, 'M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3', 'M12 17h.01'],
  close:   ['M18 6 6 18', 'm6 6 12 12'],
  check:   ['M20 6 9 17l-5-5'],
  menu:    ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  more:    ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  edit:    ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  prev:    ['m15 18-6-6 6-6'],
  next:    ['m9 18 6-6-6-6'],
  unlink:  ['M18.84 12.25l1.72-1.71a4 4 0 0 0-5.66-5.66l-1.71 1.72', 'M5.17 11.75l-1.71 1.71a4 4 0 0 0 5.66 5.66l1.71-1.71', 'M3 3l18 18'],
  sliders: ['M21 4H14', 'M10 4H3', 'M21 12H12', 'M8 12H3', 'M21 20H16', 'M12 20H3', 'M14 2v4', 'M8 10v4', 'M16 18v4'],
  filter:  ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  columns: [{ r: [3,3,18,18,2] }, 'M12 3v18'],
  user:    ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', { c: [12,7,4] }],
  users:   ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', { c: [9,7,4] }, 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
};

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: '1em' },
});

const parts = ICONS[props.name] || [];
</script>
