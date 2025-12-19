import { createRouter, createWebHistory } from 'vue-router'
import DecisionDetail from '../views/DecisionDetail.vue'
import DecisionList from '../views/DecisionList.vue'

const baseUrl = import.meta.env.BASE_URL
const router = createRouter({
  history: createWebHistory(typeof baseUrl === 'string' ? baseUrl : '/'),
  routes: [
    {
      path: '/',
      name: 'DecisionList',
      component: DecisionList as never,
    },
    {
      path: '/:id(.*)',
      name: 'DecisionDetail',
      component: DecisionDetail as never,
    },
  ],
})

export default router
