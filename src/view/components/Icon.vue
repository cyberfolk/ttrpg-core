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
  menu:    ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  edit:    ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  prev:    ['m15 18-6-6 6-6'],
  next:    ['m9 18 6-6-6-6'],
};

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: '1em' },
});

const parts = ICONS[props.name] || [];
</script>
