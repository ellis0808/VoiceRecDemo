import { defineStore } from 'pinia'
import {
  type TargetWordFEObject,
  type ApiResponse,
  currentTestingStatus,
  type TranscriptionResponse,
  type AssessmentIdInfoObject,
  type AssessmentObject,
  type WordTestsBEObject,
  type TargetWordBEObject,
  type UserTestDataObject,
  type UserLoadedAudio,
} from '../../../shared/types'
import { useUserStore } from './userStore'

export const useAssessmentStore = defineStore('assessmentsStore', {
  state: () => ({
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
    maxTargetWords: 10,
    timer: 0,
    isTiming: false,
    currentItemTimer: 0,
    currentTimeLimit: 0,
    isRecording: false,
    isTesting: false,
    isLive: false,
    previewTest: [] as WordTestsBEObject[],
    currentAssessment: [] as WordTestsBEObject[],
    currentAssessmentStatus: currentTestingStatus.notTesting,
    currentAssessmentSessionId: null as number | null,
    allTests: [] as WordTestsBEObject[],
    testMap: {} as Record<number, WordTestsBEObject[]>,
    websocket: null as WebSocket | null,
    socketConnected: false,
  }),
  getters: {
    displayCurrentlySelectedTest(state) {
      if (state.currentAssessment) {
        return state.currentAssessment
      }
    },
  },
  actions: {
    establishWebsocketConnection() {
      const wsUri = 'ws://localhost:8080'
      this.websocket = new WebSocket(wsUri)

      this.websocket.addEventListener('open', () => {
        this.socketConnected = true
        console.log('Connected!')
      })

      this.websocket.addEventListener('error', (error) => {
        console.log('There was an error with the websocket:', error)
      })

      this.websocket.addEventListener('close', () => {
        this.socketConnected = false
        this.websocket = null
        console.log('Disconnected!')
      })

      this.websocket.addEventListener('message', (event) => {
        const payload = JSON.parse(event.data)
        switch (payload.type) {
          case 'session-started':
            this.isLive = true

            break
          case 'session-ended':
            this.isLive = false

            break

          default:
            break
        }
      })
    },
    convertAssessmentBEToFE() {
      this.currentTargetWords.length = 0

      this.currentTargetWords = this.currentAssessment.map((item, index) => {
        const { schoolId, testId, wordId, arpabet, ...rest } = item
        return { ...rest, listNumber: index + 1 }
      })
      const targerWordsForSaving = this.currentAssessment.map((item, index) => {
        const { schoolId, testId, ...rest } = item
        return { ...rest, listNumber: index + 1 }
      })

      this.saveTest(targerWordsForSaving)
    },
    async saveTest(items?: TargetWordBEObject[]) {
      if (items) {
        if (this.currentAssessmentStatus === currentTestingStatus.notTesting) {
          try {
            const schoolId = 1
            const studentId = 1
            const testId = 1
            const status = 'pending'
            const payload = JSON.stringify(items)

            const response = await fetch('http://localhost:5000/assessment/studentassessments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                schoolId: schoolId,
                studentId: studentId,
                testId: testId,
                status: status,
                currentAssessmentSessionID: this.currentAssessmentSessionId,
                payload: payload,
              }),
            })

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
        }
      }
    },
    async getUserAudio(assessmentId: number | null) {
      const schoolId = 1
      const userId = 1
      try {
        const response = await fetch(
          `http://localhost:5000/assessment/${schoolId}/${userId}/${assessmentId}/audio`,
          { method: 'GET' },
        )

        if (!response.ok) throw new Error()
        const result = await response.json()
        const rawAudioRows = result.data[0] as UserLoadedAudio[]
        console.log(rawAudioRows[0])

        const audioWithUrls = rawAudioRows.map((row) => {
          const byteArray = new Uint8Array(row.audio.data)
          const blob = new Blob([byteArray], { type: 'audio/webm' })
          console.log('Data: ', row.audio.data)
          console.log('Type: ', row.mimeType)

          return {
            ...row,
            audioUrl: URL.createObjectURL(blob),
          }
        })
        const userStore = useUserStore()
        userStore.user.assessmentAudio = audioWithUrls
        console.log(userStore.user.assessmentAudio)
      } catch (error) {
        console.error('There was an error retrieving the audio: ', error)
      }
    },
    clearUserAssessments() {
      const userStore = useUserStore()
      userStore.user.assessments = []
    },
    async getUserAssessments() {
      this.clearUserAssessments()
      const schoolId = 1
      const userId = 1
      try {
        const response = await fetch(
          `http://localhost:5000/assessment/tests/user/${schoolId}/${userId}`,
          {
            method: 'GET',
          },
        )

        if (!response.ok) throw new Error()
        if (response.ok) {
          const userStore = useUserStore()
          const result: ApiResponse<UserTestDataObject[], null> = await response.json()
          console.log(result)
          if (!result.success || !result.data) {
            throw new Error(result.error ?? 'There was an error getting the users results.')
          } else {
            const data = result.data[0] ?? []
            userStore.user.assessments = data
          }
          console.log(userStore.user.assessments)
        }
      } catch (error) {
        console.error("There was an error getting the student's assessments: ", error)
      }
    },
    async getAllAssessments() {
      try {
        const schoolId = 1
        const response = await fetch(`http://localhost:5000/assessment/tests/${schoolId}`, {
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
      const userStore = useUserStore()
      try {
        const response = await fetch('http://localhost:5000/assessment/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: 1,
            user: 1,
            assessmentData: this.currentAssessment,
          }),
        })
        if (response.ok) {
          const result: ApiResponse<number, null> = await response.json()
          if (!result.success || !result.data) {
            throw new Error(result.error ?? 'There was an error beginning the assessment')
          }

          console.log(result.data[0])

          this.currentAssessmentSessionId = result.data[0] as number
        }
      } catch (error) {
        console.error('There was an error starting the new assessment: ', error)
      }
    },
    async endCurrentAssessmentSession(status: string) {
      const userStore = useUserStore()
      try {
        const response = await fetch('http://localhost:5000/assessment/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: 1,
            user: 1,
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
        }
      } catch (error) {}
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
          } else if (this.currentDisplayWordCount >= this.maxTargetWords) {
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
    async loadWords() {
      try {
        await this.getTargetWordsAndPhonemes()
        this.currentTargetWords
      } catch (error) {
        console.error('There was a problem loading the Target Words. ', error)
      }
    },
    async getTargetWordsAndPhonemes() {
      const schoolId = 1
      const userId = 1
      const testId = 1

      console.log(this.maxTargetWords)

      const response = await fetch('http://localhost:5000/assessment/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: schoolId,
          userId: userId,
          testId: testId,
          numberOfQuestions: this.maxTargetWords,
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
    changeCurrentDisplayWordCount(param: string) {
      if (param === 'increase') {
        if (this.currentDisplayWordCount < this.maxTargetWords) {
          ++this.currentDisplayWordCount
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
              autoGainControl: false,
              echoCancellation: false,
              noiseSuppression: false,
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

      console.log('recording array reset!', this.recordingArray)
    },

    async finishAssessment() {
      if (this.currentAssessmentStatus === currentTestingStatus.finished) {
        await this.sendAudioToBackend(this.completedAudioArray)
        this.resetRecordingArray()
        this.completedAudioArray = []
      }
    },
    async sendAudioToBackend(audioData: Blob[]) {
      const schoolId = 1
      const userId = 1
      const testId = 1
      const assessmentId = this.currentAssessmentId
      const assessmentSessionId = this.currentAssessmentSessionId
      const wordData = JSON.stringify(this.currentAssessment)
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
      try {
        const response = await fetch(`http://localhost:5000/assessment/transcribe`, {
          method: 'POST',
          body: formData,
        })
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
  },
})
