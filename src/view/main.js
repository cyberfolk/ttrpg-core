import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import { vActivate } from './activate.js';
import { displayName } from './disambiguation.js';
import '../../styles/main.css';

const app = createApp(App);
app.use(router);
app.directive('activate', vActivate);
// Helper globale nei template: nome entità con segnaposto se vuoto.
app.config.globalProperties.$name = displayName;
app.mount('#app');
