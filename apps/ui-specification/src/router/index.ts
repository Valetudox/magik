import { createRouter, createWebHistory } from 'vue-router'
import SpecificationDetail from '../views/SpecificationDetail.vue'
import SpecificationList from '../views/SpecificationList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'SpecificationList',
      component: SpecificationList,
    },
    {
      path: '/:id(.*)',
      name: 'SpecificationDetail',
      component: SpecificationDetail,
    },
  ],
})

export default router
