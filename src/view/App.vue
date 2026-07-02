<template>
  <div id="app-root">
    <header class="rep-header">
      <!-- Trigger drawer (solo mobile) -->
      <button ref="menuBtn" class="rep-header__menu rep-header__menu--mobile" @click="openDrawer"
        aria-label="Menu" :aria-expanded="drawerOpen ? 'true' : 'false'">
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

      <!-- Navigazione primaria persistente (desktop): flusso caldo, 1 click -->
      <nav class="ds-seg rep-header__nav" aria-label="Sezioni Reputazione">
        <button v-for="item in navItems" :key="item.routeName" class="ds-seg__btn"
          :class="{ active: item.isActive }" :aria-current="item.isActive ? 'page' : undefined"
          @click="goTo(item.routeName)">
          <span class="ds-seg__icon" aria-hidden="true"><Icon :name="item.icon" /></span>
          {{ item.label }}
        </button>
      </nav>

      <!-- Trigger menu dati & impostazioni (desktop) -->
      <button ref="moreBtn" class="rep-header__more" @click="openDrawer"
        aria-label="Dati e impostazioni" :aria-expanded="drawerOpen ? 'true' : 'false'">
        <Icon name="more" />
        <span class="rep-header__more-label">Menu</span>
      </button>
    </header>

    <main class="rep-main">
      <router-view />
    </main>

    <AppDrawer :open="drawerOpen" @close="onDrawerClose" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppDrawer from './components/AppDrawer.vue';
import Icon from './components/Icon.vue';

const route = useRoute();
const router = useRouter();

const drawerOpen = ref(false);
const menuBtn = ref(null);
const moreBtn = ref(null);

// Sezioni della funzione Reputazione. Ogni voce raggruppa le route che le appartengono
// (una sezione e' attiva anche dalle sue sotto-pagine di dettaglio).
const NAV_SECTIONS = [
  { routeName: 'characters', label: 'Personaggi', icon: 'user', match: ['characters', 'profile'] },
  { routeName: 'groups', label: 'Gruppi', icon: 'users', match: ['groups', 'groupProfile'] },
];

const navItems = computed(() => {
  const items = NAV_SECTIONS.map((s) => {
    const isActive = s.match.includes(route.name);
    return { ...s, isActive };
  });
  return items;
});

function openDrawer() {
  drawerOpen.value = true;
}

function goTo(routeName) {
  if (route.name !== routeName) {
    router.push({ name: routeName });
  }
}

function onDrawerClose() {
  drawerOpen.value = false;
  // Ridare il focus al trigger effettivamente visibile (dipende dal breakpoint).
  nextTick(() => {
    const visibleTrigger = moreBtn.value && moreBtn.value.offsetParent !== null ? moreBtn.value : menuBtn.value;
    visibleTrigger?.focus();
  });
}
</script>
