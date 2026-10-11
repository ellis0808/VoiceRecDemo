import { defineStore } from 'pinia'
import {
  type TargetWordFEObject,
  type ApiResponse,
  currentTestingStatus,
  type AssessmentIdInfoObject,
  type AssessmentObject,
  type WordTestsBEObject,
  type UserTestDataObject,
  type UserLoadedAudio,
  type SchoolClass,
  type Teacher,
} from '../../../shared/types'
import { useAuthStore } from './authStore'
import { jwtDecode, type JwtPayload } from 'jwt-decode'

export const useTeacherStore = defineStore('teacherStore', {
  state: () => ({
    user: null as Teacher | null,
    token: null as string | null,
    availableAssessments: [] as AssessmentObject[],
    currentTargetWords: [] as TargetWordFEObject[],
    currentAssessmentId: null as number | null,
    currentDisplayWords: [''] as string[] | null,
    previewTest: [] as WordTestsBEObject[],
    currentAssessment: [] as WordTestsBEObject[],
    currentAssessmentStatus: currentTestingStatus.notTesting,
    currentAssessmentSessionId: null as number | null,
    allTests: [] as WordTestsBEObject[],
    testMap: {} as Record<number, WordTestsBEObject[]>,
    studentAssessments: [] as UserTestDataObject[],
    studentAssessmentAudio: [] as UserLoadedAudio[],
    selectedClasses: [] as number[],
    wsConnection: {
      websocket: null as WebSocket | null,
      socketConnected: false,
      isLive: false,
    },
  }),
  getters: {
    displayCurrentlySelectedTest(state) {
      if (state.currentAssessment) {
        return state.currentAssessment
      }
    },
  },
  actions: {
    getAllStudents() {
      const schoolId = this.user?.schoolId
      try {
      } catch (error) {
        console.error("There was an error getting students' information")
      }
    },
    async refreshUser() {
      const tempToken = localStorage.getItem('token')
      if (tempToken) this.token = tempToken
      if (this.token) {
        this.setToken(this.token)
        await this.setUser(this.token)
      }
    },
    setToken(token: string) {
      if (!token) throw new Error('No token provided')
      localStorage.setItem('token', token)
      sessionStorage.setItem('loggedIn', 'true')
      this.token = token
      return localStorage.getItem('token') ? true : false
    },
    async setUser(token: string | undefined): Promise<boolean> {
      if (!token) throw new Error('No token provided, cannot set user properties')
      const userTokenData = jwtDecode<JwtPayload>(token) as Teacher
      if (userTokenData.role === 'teacher') {
        this.user = userTokenData as Teacher
        const authStore = useAuthStore()
        await authStore.getIndividualSchool(this.user.schoolId)
        await authStore.getClasses(this.user.schoolId)
        console.log(authStore.school)
      }
      console.log(this.user)
      return this.user?.username ? true : false
    },
    clearUser() {
      this.user = null
      this.token = null
    },
    selectClass(schoolClass: SchoolClass) {
      if (schoolClass) {
        console.log(schoolClass)

        const index = this.selectedClasses.findIndex((id) => id === schoolClass.id)
        if (index !== -1) {
          this.selectedClasses.splice(index, 1)
        } else {
          this.selectedClasses.push(schoolClass.id)
        }
      }
      console.log('class: ', schoolClass)

      console.log('selected classes: ', this.selectedClasses)
    },
    clearSelectedClasses() {
      this.selectedClasses = []
    },
    async convertAssessmentBEToFE(studentId: number, assessment: WordTestsBEObject[]) {
      this.currentTargetWords.length = 0

      this.currentTargetWords = assessment.map((item, index) => {
        const { schoolId, testId, wordId, arpabet, ...rest } = item
        return { ...rest, listNumber: index + 1 }
      })
      const targerWordsForSaving = assessment.map((item, index) => {
        const { schoolId, testId, ...rest } = item
        return { ...rest, listNumber: index + 1 }
      })
      // await this.saveTest(studentId, targerWordsForSaving)
    },

    async getUserAudio(assessmentId: number, studentId: number) {
      const schoolId = this.user?.schoolId
      const userId = studentId
      try {
        const response = await fetch(
          `http://localhost:5000/teacher/assessment/${schoolId}/${userId}/${assessmentId}/audio`,
          { method: 'GET' },
        )

        if (!response.ok) throw new Error()
        const result = await response.json()
        const rawAudioRows = result.data[0] as UserLoadedAudio[]

        const audioWithUrls = rawAudioRows.map((row) => {
          const byteArray = new Uint8Array(row.audio.data)
          const blob = new Blob([byteArray], { type: 'audio/webm' })

          return {
            ...row,
            audioUrl: URL.createObjectURL(blob),
          }
        })

        this.studentAssessmentAudio = audioWithUrls
        console.log(this.studentAssessmentAudio)
      } catch (error) {
        console.error('There was an error retrieving the audio: ', error)
      }
    },
    clearStudentAssessments() {
      if (this.studentAssessments) this.studentAssessments = []
    },
    async getUserAssessments(studentId: number) {
      this.clearStudentAssessments()
      const schoolId = this.user?.schoolId
      const userId = studentId
      console.log('ID: ', userId)
      try {
        const response = await fetch(
          `http://localhost:5000/teacher/assessment/tests/user/${schoolId}/${userId}`,
          {
            method: 'GET',
          },
        )

        if (!response.ok) throw new Error()
        if (response.ok) {
          const result: ApiResponse<UserTestDataObject[], null> = await response.json()
          console.log(result)
          if (!result.success || !result.data) {
            throw new Error(result.error ?? 'There was an error getting the users results.')
          } else {
            const data = result.data[0] ?? []
            this.studentAssessments = data
          }
          console.log(this.studentAssessments)
        }
      } catch (error) {
        console.error("There was an error getting the student's assessments: ", error)
      }
    },
    async getAllAssessments() {
      try {
        const schoolId = this.user?.schoolId
        const response = await fetch(`http://localhost:5000/teacher/assessment/tests/${schoolId}`, {
          method: 'GET',
        })

        if (!response.ok) throw new Error()

        if (response.ok) {
          const result: ApiResponse<WordTestsBEObject[], null> = await response.json()
          if (!result.success || !result.data) {
            throw new Error(result.error ?? 'There was an error getting the tests.')
          }
          console.log(result.data)
          this.allTests = result.data[0]
          console.log(this.allTests)
          this.organizeAssessments()
          console.log(this.testMap)
        }
      } catch (error) {
        console.error('There was an error getting the tests: ', error)
      }
    },

    organizeAssessments() {
      const map: Record<number, WordTestsBEObject[]> = {}
      for (const item of this.allTests) {
        if (!map[item.testId]) map[item.testId] = []
        map[item.testId]?.push(item)
      }
      this.testMap = map
    },
    selectAssessment(test: WordTestsBEObject[]) {
      if (test[0]?.testId !== this.currentAssessment[0]?.testId) {
        this.clearCurrentAssessment()
        this.currentAssessment = test
      } else {
        this.clearCurrentAssessment()
      }
    },
    clearCurrentAssessment() {
      this.currentAssessment = []
    },
    async startNewAssessmentSession() {
      if (this.currentAssessment.length === 0) {
        alert('Please choose an assessment first.')
        return
      }
      if (this.selectedClasses.length === 0)
        return alert('Please select a class for testing first.')
      try {
        if (this.user) {
          const response = await fetch('http://localhost:5000/teacher/assessment/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schoolId: this.user.schoolId,
              userId: this.user.id,
              selectedClasses: this.selectedClasses,
              assessmentData: this.currentAssessment,
            }),
          })
          if (response.ok) {
            const result: ApiResponse<number, null> = await response.json()
            if (!result.success || !result.data) {
              throw new Error(result.error ?? 'There was an error beginning the assessment')
            }

            console.log(result.data[0])

            this.wsConnection.isLive = true
            this.currentAssessmentSessionId = result.data[0] as number
          }
        }
      } catch (error) {
        console.error('There was an error starting the new assessment: ', error)
      }
    },
    async endCurrentAssessmentSession(status: string) {
      try {
        const response = await fetch('http://localhost:5000/teacher/assessment/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: this.user?.schoolId,
            user: this.user?.id,
            assessmentSessionId: this.currentAssessmentSessionId,
            status: status,
          }),
        })
        if (!response.ok) {
          return
        } else {
          const result: ApiResponse<string, null> = await response.json()
          if (!result.success || !result.data) {
            throw new Error(result.error ?? 'There was an error ending the assessment')
          }
          this.clearCurrentAssessment()
          this.wsConnection.isLive = false
        }
      } catch (error) {}
    },

    async getTargetWordsAndPhonemes() {
      const authStore = useAuthStore()
      const schoolId = authStore.school?.id
      const userId = this.user?.id
      const testId = 1 // ???

      const response = await fetch('http://localhost:5000//teacher/assessment/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: schoolId,
          userId: userId,
          testId: testId,
          // numberOfQuestions: this.maxTargetWords,
        }),
      })
      if (response.ok) {
        const result: ApiResponse<TargetWordFEObject[], AssessmentIdInfoObject> =
          await response.json()

        console.log(result.data)

        if (!result.success || !result.data) {
          throw new Error(result.error ?? 'There was an error retrieving the target words.')
        }

        const [words, info] = result.data
        this.currentTargetWords = words
        this.currentAssessmentId = info?.id ?? null
      }
    },
    // return type??
    shuffleItems<T>(array: T[]): T[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j: number = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j]!, array[i]!]
      }
      return array
    },
  },
})
