import { createMemoryHistory, createRouter } from 'vue-router'

import SingleWordView from '@/views/SingleWordView.vue'
import ChooseAssessment from '@/components/ChooseAssessment.vue'
import UserPage from '@/components/UserPage.vue'

const routes = [
  { path: '/', name: 'main', component: SingleWordView },
  { path: '/user', name: 'user', component: UserPage },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router
