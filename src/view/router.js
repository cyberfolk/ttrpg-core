import { createRouter, createWebHistory } from 'vue-router';
import CharactersView from './components/CharactersView.vue';
import ProfileView from './components/ProfileView.vue';
import GroupsView from './components/GroupsView.vue';
import GroupProfileView from './components/GroupProfileView.vue';
import NotFound from './components/NotFound.vue';

const routes = [
  { path: '/', redirect: '/personaggi' },
  { path: '/personaggi', name: 'characters', component: CharactersView },
  { path: '/personaggio/:id', name: 'profile', component: ProfileView, props: true },
  { path: '/gruppi', name: 'groups', component: GroupsView },
  { path: '/gruppo/:id', name: 'groupProfile', component: GroupProfileView, props: true },
  { path: '/:pathMatch(.*)*', name: 'notfound', component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
