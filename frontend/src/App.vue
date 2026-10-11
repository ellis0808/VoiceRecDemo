<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'

const authStore = useAuthStore()

// const assessmentStore = useAssessmentStore()
// const userStore = useUserStore()

// let mediaRecorder: MediaRecorder | null = null

// interface TranscriptionResponse {
//   text: string
// }

// interface WordList {
//   data: string[]
// }
// const userInput = ref<string>('')

// const userInputStyling = computed(() => {
//   return {
//     'h-90 w-150 mt-5 ml-5': true,
//     'text-2xl': !userInput.value.length,
//     'text-lg': userInput.value.length,
//   }
// })

// if (navigator.mediaDevices) {
//   navigator.mediaDevices
//     .getUserMedia({ audio: true })
//     .then((stream) => {
//       mediaRecorder = new MediaRecorder(stream)
//       mediaRecorder.ondataavailable = (event) => {
//         audioChunks.push(event.data)
//       }
//       mediaRecorder.onstop = (event) => {
//         console.log('recorder stopped')
//         // const clipName = prompt('Enter a name for this recording')
//         recordedBlob.value = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' })
//         sendAudioToBackend(recordedBlob.value)
//         recordedBlob.value = []
//         const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
//         audioURL.value = URL.createObjectURL(audioBlob)
//       }
//     })

//     .catch((error) => {
//       console.error('getUserMedia error: ', error)
//     })
// } else {
//   console.log('Audio capture not supported by your browser. Please check your settings.')
// }

// const startRecording = async () => {
//   if (isRecording.value) {
//     return
//   }
//   if (mediaRecorder) {
//     clearAudioData()

//     mediaRecorder.start()
//     console.log(mediaRecorder.state)
//     console.log('recording started')
//   }
// try {

// } catch (error) {
//   console.error('Error getting user audio: ', error)
// }
//   isRecording.value = true
//   console.log(isRecording.value)
// }

// const clearAudioData = () => {
//   if (audioURL.value) {
//     URL.revokeObjectURL(audioURL.value)
//     audioURL.value = ''
//   }
//   if (recordedBlob.value) {
//     recordedBlob.value = null
//     audioChunks = []
//   }
// }

// const wordsToDisplay = ref<string[]>([])
// const currentWord = ref<number>(0)

// const increaseCurrentWordNumber = () => {
//   ++currentWord.value
// }

// const startAssessment = async () => {
//   try {
//     const response = await fetch('http://localhost:5000/api/words')
//     if (response.ok) {
//       isTesting.value = true
//       startRecording()
//       const result = (await response.json()) as WordList

//       wordsToDisplay.value = result.data
//     }
//   } catch (error) {
//     console.error('There was an error getting the necessary data to begin the assessment.', error)
//   }
// }
// const clearAssessment = async () => {
//   try {
//     const response = await fetch('http://localhost:5000/api/words/clear', { method: 'POST' })
//     if (response.ok) {
//       isRecording.value = false
//       isTesting.value = false
//       audioURL.value = ''
//       audioChunks = []
//       recordedBlob.value = null
//       wordsToDisplay.value = []
//       currentWord.value = 0
//     }
//   } catch (error) {
//     console.error('There was an error clearing the previous assessment.', error)
//   }
// }

onMounted(() => {
  authStore.checkLoginStatus()
})
</script>

<template>
  <Suspense>
    <RouterView />
  </Suspense>
  <!-- <div class="mx-8 mt-20">
    <div v-if="!isTesting" class="mb-10">
      <button
        class="bg-green-900 py-2 px-4 rounded-lg text-white text-2xl"
        @click="startAssessment"
      >
        Start Test
      </button>
    </div>
    <div v-else>
      <div class="text-3xl">Read the word:</div>
      <div class="w-160 h-100 md:max-w-272 border border-black mt-10">
        
        <div class="mt-8 text-4xl">{{ wordsToDisplay[currentWord] }}</div>
        <div v-if="isTesting && isRecording" class="flex w-160">
          <div
            class="text-3xl font-bold text-blue-900 mt-10 mx-auto rounded-md py-2 px-4"
            @click="stopRecording"
          >
            Stop
          </div>
        </div>
      </div>
    </div>
    <div v-if="audioURL" class="mt-20">
      <h3>Playback Test:</h3>
      <audio :src="audioURL" controls></audio>
    </div>
    <div v-if="isTesting && !isRecording" class="flex w-160">
      <div
        class="text-3xl font-bold text-red-900 mt-10 mx-auto rounded-md py-2 px-4"
        @click="clearAssessment"
      >
        Clear
      </div>
    </div>
  </div> -->
</template>
