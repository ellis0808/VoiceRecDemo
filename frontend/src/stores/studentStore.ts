import { defineStore } from 'pinia'
import {
  type TargetWordFEObject,
  type ApiResponse,
  currentTestingStatus,
  type TranscriptionResponse,
  type AssessmentObject,
  type WordTestsBEObject,
  type TargetWordBEObject,
  type Student,
} from '../../../shared/types'
import { useAuthStore } from './authStore'
import { jwtDecode, type JwtPayload } from 'jwt-decode'

export const useStudentStore = defineStore('studentStore', {
  state: () => ({
    user: null as Student | null,
    token: null as string | null,
    recordingArray: [] as Blob[],
    completedAudioArray: [] as Blob[],
    currentBlob: null as Blob | null,
    mediaRecorder: null as MediaRecorder | null,
    mediaRecorderStream: null as MediaStream | null,
    availableAssessments: [] as AssessmentObject[],
    currentTargetWords: [] as TargetWordFEObject[],
    currentAssessmentId: null as number | null,
    currentDisplayWords: [''] as string[] | null,
    currentDisplayWordCount: 0,
    timer: 0,
    isTiming: false,
    currentItemTimer: 0,
    currentTimeLimit: 0,
    isRecording: false,
    isTesting: false,
    currentAssessment: [] as WordTestsBEObject[],
    currentAssessmentStatus: currentTestingStatus.notTesting,
    currentAssessmentSessionId: null as number | null,
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
      const authStore = useAuthStore()
      const schoolId = authStore.school?.id
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
      const userTokenData = jwtDecode<JwtPayload>(token) as Student
      if (userTokenData.role === 'student') {
        this.user = userTokenData as Student
      }
      console.log(this.user)
      return this.user?.username ? true : false
    },
    clearUser() {
      this.user = null
      this.token = null
    },

    toggleTestingState(param: boolean) {
      this.isTesting = param
    },
    toggleRecordingState(param: boolean) {
      this.isRecording = param
    },
    toggleTimingState(param: boolean) {
      this.isTiming = param
    },
    handleTimer() {
      if (this.isTiming) {
        this.resetTimer()
        this.timer = setInterval(() => {
          if (this.currentTimeLimit > this.currentItemTimer) {
            ++this.currentItemTimer
          } else if (this.currentDisplayWordCount >= this.currentTargetWords.length - 1) {
            this.endAssessment()
          } else {
            this.stopTimer()
            this.displayNewItem()
          }
        }, 1000)
      }
    },
    endAssessment() {
      console.log('ending assessment...')
      this.mediaRecorder?.stop()
      if (this.isRecording) {
        this.stopRecording()
        this.toggleRecordingState(false)
      }
      this.toggleTestingState(false)
      this.toggleTimingState(false)
      this.currentAssessmentStatus = currentTestingStatus.finished
    },
    displayNewItem() {
      this.toggleTimingState(false)
      this.resetTimer()
      setTimeout(() => {
        this.changeCurrentDisplayWordCount('increase')
      }, 1000)
      setTimeout(() => {
        this.startTimer()
      }, 1200)
    },
    setCurrentTimeLimit(timeLimit: number) {
      this.currentTimeLimit = timeLimit
    },
    startTimer() {
      this.toggleTimingState(true)
      this.startRecording()
      this.handleTimer()
    },
    stopTimer() {
      this.clearTimerInterval()
      this.resetTimer()
      this.stopRecording()
      this.toggleTimingState(false)
    },
    resetTimer() {
      this.clearTimerInterval()
      this.currentItemTimer = 0
    },
    clearTimerInterval() {
      clearInterval(this.timer)
    },
    // async loadWords() {
    //   try {
    //     await this.getTargetWordsAndPhonemes()
    //     this.currentTargetWords
    //   } catch (error) {
    //     console.error('There was a problem loading the Target Words. ', error)
    //   }
    // },
    // async getTargetWordsAndPhonemes() {
    //   const authStore = useAuthStore()
    //   const userStore = useUserStore()
    //   const schoolId = authStore.school?.id
    //   const userId = userStore.user?.id
    //   const testId = 1 // ???

    //   const response = await fetch('http://localhost:5000/assessment/students/', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       schoolId: schoolId,
    //       userId: userId,
    //       testId: testId,
    //       //   numberOfQuestions: this.maxTargetWords,
    //     }),
    //   })
    //   if (response.ok) {
    //     const result: ApiResponse<TargetWordFEObject[], AssessmentIdInfoObject> =
    //       await response.json()

    //     console.log(result.data)

    //     if (!result.success || !result.data) {
    //       throw new Error(result.error ?? 'There was an error retrieving the target words.')
    //     }

    //     const [words, info] = result.data
    //     this.currentTargetWords = words
    //     this.currentAssessmentId = info?.id ?? null
    //   }
    // },
    async changeCurrentDisplayWordCount(param: string) {
      if (param === 'increase') {
        if (this.currentDisplayWordCount < this.currentTargetWords.length - 1) {
          ++this.currentDisplayWordCount
        } else if (this.currentDisplayWordCount > this.currentTargetWords.length - 1) {
          await this.finishAssessment()
        }
      }
      if (param === 'decrease') {
        if (this.currentDisplayWordCount > 1) {
          --this.currentDisplayWordCount
        }
      }
      if (param === 'reset') this.currentDisplayWordCount = 0
      if (param === 'change') {
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
    getWordsForDisplay() {
      this.currentDisplayWords = []
      if (this.currentTargetWords) {
        console.log(this.currentDisplayWords)
      }
    },
    async loadMediaRecorder() {
      console.log(navigator)

      if (navigator.mediaDevices) {
        try {
          this.mediaRecorderStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true,
            },
          })
        } catch (error) {
          console.error('Error getting user media: ', error)
        }
      } else {
        console.log('Audio capture not supported by your browser. Please check your settings.')
      }
    },
    resetRecordingArray() {
      this.recordingArray = []
    },

    async finishAssessment() {
      if (this.currentAssessmentStatus === currentTestingStatus.finished) {
        await this.sendAudioToBackend(this.completedAudioArray)
        this.resetRecordingArray()
        this.completedAudioArray = []
      }
    },
    async sendAudioToBackend(audioData: Blob[]) {
      const schoolId = this.user?.schoolId
      const userId = this.user?.id
      const testId = this.currentTargetWords[0]?.test
      console.log('testId:', testId)

      const assessmentId = this.currentAssessmentId
      console.log(assessmentId)

      const assessmentSessionId = this.currentAssessmentSessionId
      const wordData = JSON.stringify(this.currentTargetWords)
      const formData = new FormData()
      audioData.forEach((datum, index) => {
        const mimeType = datum.type || 'audio/webm'
        const extension = mimeType.includes('webm') ? 'webm' : 'ogg'

        const audioFile = new File([datum], `question_${index + 1}.${extension}`, {
          type: mimeType,
        })
        formData.append('audio', audioFile)
      })

      formData.append('schoolId', `${schoolId}`)
      formData.append('userId', `${userId}`)
      formData.append('testId', `${testId}`)
      formData.append('assessmentId', `${assessmentId}`)
      formData.append('assessmentSessionId', `${assessmentSessionId}`)
      formData.append('wordData', `${wordData}`)
      console.log('formData: ', formData)

      try {
        const response = await fetch(`http://localhost:5000/student/assessment/transcribe`, {
          method: 'POST',
          body: formData,
        })
        if (!response.ok) throw new Error()
        if (response.ok) {
          const data = (await response.json()) as TranscriptionResponse
          console.log(data)
        }
      } catch (error) {
        console.error('There was an error sending the audio to the server.', error)
      }
    },
    async startRecording() {
      if (this.isRecording) return
      if (!this.mediaRecorderStream) {
        console.error('No active audio stream found.')
        return
      }
      this.resetRecordingArray()
      this.mediaRecorder = new MediaRecorder(this.mediaRecorderStream)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordingArray.push(event.data)
        }
        console.log('Recording Array: ', this.recordingArray)
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const audioBlob = new Blob([...this.recordingArray], { type: mimeType })
        this.completedAudioArray.push(audioBlob)
        this.resetRecordingArray()
      }
      this.mediaRecorder.start()

      console.log('recording started')
      this.toggleRecordingState(true)
    },
    stopRecording() {
      if (!this.isRecording) {
        return
      }
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
        console.log('recording ended')
        this.toggleRecordingState(false)
      }
    },
    async setAssessmentAndSession(sessionId: number, assessment: TargetWordFEObject[]) {
      this.currentAssessmentSessionId = sessionId

      this.currentTargetWords.length = 0
      this.currentTargetWords = assessment

      await this.saveTest(this.currentTargetWords)
      console.log(this.currentTargetWords)
    },

    async saveTest(items?: TargetWordFEObject[]) {
      if (items) {
        // if (this.currentAssessmentStatus === currentTestingStatus.notTesting) {
        try {
          console.log(this.user)

          const schoolId = this.user?.schoolId
          const testId = 1 // this needs to be pulled from somewhere
          const status = 'pending'
          const payload = JSON.stringify(items)
          console.log('schoolId: ', schoolId)
          console.log('studentId: ', this.user?.id)

          const response = await fetch(
            'http://localhost:5000/student/assessment/studentassessments',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                schoolId: schoolId,
                studentId: this.user?.id,
                testId: testId,
                status: status,
                currentAssessmentSessionID: this.currentAssessmentSessionId,
                payload: payload,
              }),
            },
          )

          if (!response.ok) {
            throw new Error('Failed to save test!')
          }
          if (response.ok) {
            const result = (await response.json()) as ApiResponse<number, null>

            this.currentAssessmentId = result.data?.[0] ?? null

            console.log(this.currentAssessmentId)
          }
        } catch (error) {
          console.error('There was an error saving the current assessment:', error)
        }
        // }
      }
    },
    async establishWebsocketConnection(token: string) {
      if (token) {
        const userTokenData = jwtDecode<JwtPayload>(token) as Student

        const wsUrl = new URL('ws://localhost:8080/')
        wsUrl.searchParams.set('token', token)
        wsUrl.searchParams.set('classId', String(userTokenData.englishClass))

        this.wsConnection.websocket = new WebSocket(wsUrl.toString())

        this.wsConnection.websocket.addEventListener('open', () => {
          this.wsConnection.socketConnected = true
          console.log('Connected!')
        })

        this.wsConnection.websocket.addEventListener('error', (error) => {
          console.log('There was an error with the websocket:', error)
        })

        this.wsConnection.websocket.addEventListener('close', () => {
          this.wsConnection.socketConnected = false
          this.wsConnection.websocket = null
          console.log('Disconnected!')
        })

        this.wsConnection.websocket.addEventListener('message', async (event) => {
          interface BEPayload {
            type: string
            message: string
            data?: {
              sessionId: number
              assessmentData: TargetWordFEObject[]
            }
          }
          const payload = JSON.parse(event.data) as BEPayload
          console.log(payload)
          if (payload) {
            console.log(payload.data?.sessionId)
            const sessionId = payload.data?.sessionId
            const assessmentData = payload.data?.assessmentData

            switch (payload.type) {
              case 'session-started':
                this.wsConnection.isLive = true
                if (sessionId && assessmentData) {
                  if (this.user) {
                    console.log('hello?')

                    console.log(assessmentData)

                    await this.setAssessmentAndSession(sessionId, assessmentData)
                  }
                }

                break
              case 'session-ended':
                this.wsConnection.isLive = false

                break
              case 'student-connected':
                console.log(payload.message)

                break

              default:
                break
            }
          }
        })
      }
    },
  },
})
