import { defineStore } from 'pinia'
import type { ApiResponse, SchoolClass, School } from '../../../shared/types'
import router from '@/router'
import { useTeacherStore } from './teacherStore'
import { useStudentStore } from './studentStore'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    schools: [] as School[],
    school: null as School | null,
    classes: [] as SchoolClass[],
    class: null as SchoolClass | null,
    classStudents: [],
  }),
  getters: {},
  actions: {
    checkLoginStatus() {
      const token = localStorage.getItem('token')
      const loggedIn = sessionStorage.getItem('loggedIn')
      if (!token || !loggedIn) router.push('login')
    },

    async login(usernameOrEmail: string, password: string, userRole: string) {
      console.log(arguments)

      // if (!usernameOrEmail || !password || !userRole) return

      if (usernameOrEmail && password && userRole) {
        console.log('user: ', usernameOrEmail, 'password: ', password, 'role: ', userRole)

        try {
          const response = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usernameOrEmail: usernameOrEmail,
              password: password,
              userRole: userRole,
            }),
          })
          if (!response.ok) throw new Error()
          if (response.ok) {
            const result = (await response.json()) as ApiResponse<string, null>
            console.log(result)

            if (result.data) {
              const data = result.data[0]
              if (userRole === 'teacher') {
                const teacherStore = useTeacherStore()
                const tokenCheck = teacherStore.setToken(data)
                const userCheck = await teacherStore.setUser(data)

                if (tokenCheck && userCheck) {
                  if (teacherStore.user?.role === 'teacher') {
                    router.push('/teacherhome')
                    await this.getClasses(teacherStore.user.schoolId)
                  }
                }
              } else if (userRole === 'student') {
                const studentStore = useStudentStore()
                const tokenCheck = studentStore.setToken(data)
                const userCheck = await studentStore.setUser(data)

                if (tokenCheck && userCheck) {
                  if (studentStore.user?.role === 'student') {
                    router.push('/studenthome')
                    console.log('hello!')
                    console.log(studentStore.user)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error logging in: ', error)
        }
      }
    },
    async logout() {
      localStorage.removeItem('token')
      sessionStorage.removeItem('loggedIn')

      const teacherStore = useTeacherStore()
      const studentStore = useStudentStore()
      teacherStore.user ? teacherStore.clearUser() : studentStore.clearUser()

      this.checkLoginStatus()
    },
    async addUserSchool() {},
    async getIndividualSchool(schoolId: number) {
      if (!schoolId) return
      try {
        const response = await fetch(`http://localhost:5000/auth/schools/${schoolId}`, {
          method: 'GET',
        })
        if (!response.ok) throw new Error()
        const result = await response.json()
        this.school = result.data[0]
        console.log(this.school)
      } catch (error) {
        console.error('Error getting school! ', error)
      }
    },
    async getSchools() {
      try {
        const response = await fetch(`http://localhost:5000/auth/schools`, {
          method: 'GET',
        })
        if (!response.ok) throw new Error()
        const result = await response.json()
        this.schools = result.data[0]
        console.log(result)
      } catch (error) {
        console.error('Error getting schools: ', error)
      }
    },
    async getClasses(schoolId: number) {
      try {
        const response = await fetch(`http://localhost:5000/auth/schools/${schoolId}/classes`)
        if (!response.ok) throw new Error()
        if (response.ok) {
          const result = await response.json()
          this.classes = result.data?.[0]
          console.log(this.classes)
        }
      } catch (error) {
        console.error('Error getting classes: ', error)
      }
    },
    async getClasssStudents(schoolId: number, classNumber: number) {
      try {
        const response = await fetch(
          `http://localhost:5000/auth/schools/${schoolId}/classes/${classNumber}/students`,
        )
        if (!response.ok) throw new Error()
        if (response.ok) {
          const result = await response.json()
          this.classStudents = result.data?.[0]
          console.log(this.classes)
        }
      } catch (error) {
        console.error('Error getting classes: ', error)
      }
    },
  },
})
