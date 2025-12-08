import { createRouter, createWebHistory } from 'vue-router'
import RecordingDetail from '../views/RecordingDetail.vue'
import RecordingList from '../views/RecordingList.vue'

const baseUrl = import.meta.env.BASE_URL
const router = createRouter({
  history: createWebHistory(typeof baseUrl === 'string' ? baseUrl : '/'),
  routes: [
    {
      path: '/',
      name: 'RecordingList',
      component: RecordingList as never,
    },
    {
      path: '/:id',
      name: 'RecordingDetail',
      component: RecordingDetail as never,
    },
  ],
})

export default router
