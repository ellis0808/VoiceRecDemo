import { defineStore } from 'pinia'
import {
  type TargetWordObject,
  type ApiResponse,
  CurrentTestingStatus,
  type TranscriptionResponse,
} from '../../../shared/types'

interface DisplayWordArray {}
export const useAssessmentStore = defineStore('assessments', {
  state: () => ({
    recordingArray: [] as Blob[],
    currentBlob: null as Blob | null,
    mediaRecorder: null as MediaRecorder | null,
    currentTargetWords: null as TargetWordObject[] | null,
    currentDisplayWords: [''] as string[] | null,
    currentDisplayWordCount: 0,
    maxTargetWords: 9,
    timer: 0,
    isTiming: false,
    currentItemTimer: 0,
    currentTimeLimit: 0,
    isRecording: false,
    isTesting: false,
    currentTest: '',
    currentTestStatus: CurrentTestingStatus.notTesting,
  }),
  getters: {},
  actions: {
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
      if (this.isRecording) {
        this.stopRecording()
        this.toggleRecordingState(false)
      }
      this.toggleTestingState(false)
      this.toggleTimingState(false)
      this.currentTestStatus = CurrentTestingStatus.finished
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
        this.getWordsForDisplay()
      } catch (error) {
        console.error('There was a problem loading the Target Words. ', error)
      }
    },
    async getTargetWordsAndPhonemes() {
      const response = await fetch('http://localhost:5000/assessment/targetWords')

      const result: ApiResponse<TargetWordObject[]> = await response.json()

      console.log(result.data)

      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'There was an error retrieving the target words.')
      }
      this.currentTargetWords = result.data
    },
    changeCurrentDisplayWordCount(param: string) {
      if (param === 'increase') {
        if (this.currentDisplayWordCount < this.maxTargetWords) {
          console.log('increasing')

          ++this.currentDisplayWordCount
        }
      }
      if (param === 'decrease') {
        if (this.currentDisplayWordCount > 1) {
          console.log('decreasing')
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
        const shuffledArray = this.shuffleItems(this.currentTargetWords)
        console.log(shuffledArray)

        let i = 0
        for (const item of shuffledArray) {
          if (i <= this.maxTargetWords) {
            if (item.word.length > 1) {
              const randomNumber = Math.floor(Math.random() * item.word.length)
              this.currentDisplayWords?.push(item.word[randomNumber] ?? '')
            } else {
              this.currentDisplayWords?.push(item.word[0] ?? '')
            }
            ++i
          }
        }
        console.log(this.currentDisplayWords)
      }
    },
    async loadMediaRecorder() {
      console.log(navigator)

      if (navigator.mediaDevices) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            this.mediaRecorder = new MediaRecorder(stream)
            this.mediaRecorder.ondataavailable = (event) => {
              this.resetRecordingArray()
              this.recordingArray.push(event.data)
            }
            this.mediaRecorder.onstop = async (event) => {
              console.log('recorder stopped')
              this.currentBlob = new Blob(this.recordingArray, { type: 'audio/ogg; codecs=opus' })
              await this.sendAudioToBackend(this.currentBlob)
              this.currentBlob = null
              const audioBlob = new Blob(this.recordingArray, { type: 'audio/webm' })
              // audioURL.value = URL.createObjectURL(audioBlob)
            }
            console.log('mediarecorder loaded')
          })

          .catch((error) => {
            console.error('getUserMedia error: ', error)
          })
      } else {
        console.log('Audio capture not supported by your browser. Please check your settings.')
      }
    },
    resetRecordingArray() {
      this.recordingArray.length = 0

      console.log('recording array reset!', this.recordingArray)
    },
    async sendAudioToBackend(audioData: Blob) {
      const formData = new FormData()
      formData.append('audio', audioData, 'recording.webm')
      try {
        const response = await fetch('http://localhost:5000/assessment/transcribe', {
          method: 'POST',
          body: formData,
        })
        if (response.ok) {
          const data = (await response.json()) as TranscriptionResponse
        }
      } catch (error) {
        console.error('There was an error sending the audio to the server.', error)
      }
    },
    async startRecording() {
      if (this.isRecording) {
        return
      }
      console.log(this.mediaRecorder)

      if (this.mediaRecorder) {
        // this.clearAudioData
        this.mediaRecorder.start()
        console.log('mediaRecorder State: ', this.mediaRecorder.state)
        console.log('recording started')
        this.toggleRecordingState(true)
      }
    },
    stopRecording() {
      if (!this.isRecording) {
        return
      }
      if (this.mediaRecorder) {
        this.mediaRecorder.stop()
        console.log('mediaRecorderState: ', this.mediaRecorder.state)
        console.log('recording ended')
        this.toggleRecordingState(false)
      }
    },
  },
})
