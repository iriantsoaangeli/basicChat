import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/template/galerie',
  },
  {
    path: '/template/galerie',
    name: 'template-galerie',
    component: () => import('../views/template/GalerieView.vue'),
  },
  {
    // Une photo en grand ; props: true passe :id au composant comme prop
    path: '/template/photo/:id',
    name: 'template-photo',
    component: () => import('../components/photo/PhotoGrand.vue'),
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
