import { createRouter, createWebHistory } from 'vue-router'
import DecisionDetail from '../views/DecisionDetail.vue'
import DecisionList from '../views/DecisionList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'DecisionList',
      component: DecisionList,
    },
    {
      path: '/:id(.*)',
      name: 'DecisionDetail',
      component: DecisionDetail,
    },
  ],
})

export default router
