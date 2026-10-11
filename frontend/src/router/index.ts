import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import TeacherHomeView from '@/views/TeacherHomeView.vue'
import StudentAllTestResults from '@/components/StudentAllTestResults.vue'
import SingleWordView from '@/views/SingleWordView.vue'

const routes = [
  { path: '/login', name: 'login', component: Login },
  { path: '/user', name: 'user', component: StudentAllTestResults },
  { path: '/teacherhome', name: 'teacherHome', component: TeacherHomeView },
  { path: '/studenthome', name: 'studentHome', component: SingleWordView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
