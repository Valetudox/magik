/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
