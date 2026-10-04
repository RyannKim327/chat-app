import { createRouter, createWebHistory } from "vue-router";

import Index from "../pages/index.vue";
import Login from "../pages/login.vue";
import Register from "../pages/register.vue";
import Chat from "../pages/chat.vue";

import { useAuth } from "../composables/useAuth";

const routes = [
  { path: "/", name: "index", component: Index },
  { path: "/login", name: "login", component: Login, meta: { guestOnly: true } },
  { path: "/register", name: "register", component: Register, meta: { guestOnly: true } },
  { path: "/chat", name: "chat", component: Chat, meta: { requiresAuth: true } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const { bootstrap, isAuthenticated } = useAuth();

  await bootstrap();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && isAuthenticated.value) {
    return { name: "chat" };
  }

  return true;
});

export default router;