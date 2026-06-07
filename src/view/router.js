import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: { template: '<p>app viva</p>' } },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
