import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router.js';
import { vActivate } from './activate.js';
import '../../styles/main.css';

createApp(App).use(router).directive('activate', vActivate).mount('#app');
