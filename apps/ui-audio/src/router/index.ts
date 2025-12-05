import { createRouter, createWebHistory } from 'vue-router'
import RecordingDetail from '../views/RecordingDetail.vue'
import RecordingList from '../views/RecordingList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'RecordingList',
      component: RecordingList,
    },
    {
      path: '/:id',
      name: 'RecordingDetail',
      component: RecordingDetail,
    },
  ],
})

export default router
