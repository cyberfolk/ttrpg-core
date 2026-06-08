<template>
  <div id="app-root">
    <header class="rep-header">
      <!-- Hamburger drawer -->
      <button ref="menuBtn" class="rep-header__menu" @click="openDrawer" aria-label="Apri menu">
        <Icon name="menu" />
      </button>

      <!-- Logo -->
      <span class="ds-logo">
        <span class="ds-logo__mark">
          <svg :width="30" :height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="16" y="2.2" width="19.5" height="19.5" rx="3" transform="rotate(45 16 2.2)"
              stroke="currentColor" stroke-width="1.6" />
            <rect x="16" y="8" width="11.3" height="11.3" rx="2" transform="rotate(45 16 8)"
              stroke="currentColor" stroke-width="1.2" opacity="0.55" />
            <circle cx="16" cy="16" r="2.1" fill="currentColor" />
          </svg>
        </span>
        <span class="ds-logo__words">
          <span class="ds-logo__title">TTRPG</span>
          <span class="ds-logo__tag">Reputazione</span>
        </span>
      </span>
    </header>

    <main class="rep-main">
      <router-view />
    </main>

    <AppDrawer :open="drawerOpen" @close="onDrawerClose" />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import AppDrawer from './components/AppDrawer.vue';
import Icon from './components/Icon.vue';

const drawerOpen = ref(false);
const menuBtn = ref(null);

function openDrawer() {
  drawerOpen.value = true;
}

function onDrawerClose() {
  drawerOpen.value = false;
  nextTick(() => menuBtn.value?.focus());
}
</script>
