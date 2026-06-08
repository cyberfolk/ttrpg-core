<template>
  <span class="rep-tip" :class="className" ref="anchorRef"
    :tabindex="tabIndex" role="note" :aria-label="label"
    @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <Teleport to="body" v-if="open && anchor">
      <span ref="bubbleRef" class="rep-hint__bubble" role="tooltip"
        :style="bubbleStyle">{{ text }}</span>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

const props = defineProps({
  text:      { type: String, required: true },
  className: { type: String, default: '' },
  label:     { type: String, default: '' },
  tabIndex:  { type: Number, default: 0 },
});

const anchorRef = ref(null);
const bubbleRef = ref(null);
const open   = ref(false);
const anchor = ref(null); // { cx, top }
const box    = ref(null); // { left, arrow }

const bubbleStyle = computed(() => {
  if (!box.value) {
    return { left: anchor.value ? `${anchor.value.cx}px` : '0', top: anchor.value ? `${anchor.value.top}px` : '0', visibility: 'hidden' };
  }
  const style = { left: `${box.value.left}px`, top: `${anchor.value.top}px`, visibility: 'visible', '--arrow-x': `${box.value.arrow}px` };
  return style;
});

function show() {
  const el = anchorRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  anchor.value = { cx: r.left + r.width / 2, top: r.bottom + 8 };
  open.value = true;
  nextTick(() => {
    if (!bubbleRef.value) return;
    const w = bubbleRef.value.offsetWidth;
    const margin = 12;
    const half = w / 2;
    const left = Math.max(margin + half, Math.min(window.innerWidth - margin - half, anchor.value.cx));
    box.value = { left, arrow: anchor.value.cx - left };
  });
}

function hide() {
  open.value = false;
  box.value = null;
}
</script>
