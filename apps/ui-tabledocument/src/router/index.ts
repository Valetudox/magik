import { createRouter, createWebHistory } from 'vue-router'
import TableDocumentDetail from '../views/TableDocumentDetail.vue'
import TableDocumentList from '../views/TableDocumentList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'TableDocumentList',
      component: TableDocumentList,
    },
    {
      path: '/:id(.*)',
      name: 'TableDocumentDetail',
      component: TableDocumentDetail,
    },
  ],
})

export default router
