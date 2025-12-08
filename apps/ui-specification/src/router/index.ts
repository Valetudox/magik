import { createRouter, createWebHistory } from 'vue-router'
import SpecificationDetail from '../views/SpecificationDetail.vue'
import SpecificationList from '../views/SpecificationList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL as string | undefined),
  routes: [
    {
      path: '/',
      name: 'SpecificationList',
      component: SpecificationList as never,
    },
    {
      path: '/:id(.*)',
      name: 'SpecificationDetail',
      component: SpecificationDetail as never,
    },
  ],
})

export default router
