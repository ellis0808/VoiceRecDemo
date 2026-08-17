<script setup lang="ts">
import { computed, ref } from 'vue'
let mediaRecorder: MediaRecorder | null = null

interface TranscriptionResponse {
  text: string
}
const userInput = ref<string>('')

const userInputStyling = computed(() => {
  return {
    'h-90 w-150 mt-5 ml-5': true,
    'text-2xl': !userInput.value.length,
    'text-lg': userInput.value.length,
  }
})

if (navigator.mediaDevices) {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      mediaRecorder.onstop = (event) => {
        console.log('recorder stopped')
        // const clipName = prompt('Enter a name for this recording')
        recordedBlob.value = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' })
        sendAudioToBackend(recordedBlob.value)
        recordedBlob.value = []
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        audioURL.value = URL.createObjectURL(audioBlob)
      }
    })

    .catch((error) => {
      console.error('getUserMedia error: ', error)
    })
} else {
  console.log('Audio capture not supported by your browser. Please check your settings.')
}

let audioChunks: Blob[] = []
const audioURL = ref<string>('')
const recordedBlob = ref()
const isRecording = ref(false)

const startRecording = async () => {
  if (isRecording.value) {
    return
  }
  if (mediaRecorder) {
    clearAudioData()

    mediaRecorder.start()
    console.log(mediaRecorder.state)
    console.log('recording started')
  }
  // try {

  // } catch (error) {
  //   console.error('Error getting user audio: ', error)
  // }
  isRecording.value = true
  console.log(isRecording.value)
}
const stopRecording = () => {
  if (!isRecording.value) {
    return
  } else {
    if (mediaRecorder) {
      mediaRecorder.stop()
      console.log(mediaRecorder.state)
      console.log('recording ended')
    }
    isRecording.value = false
  }
  console.log(isRecording.value)
}

const sendAudioToBackend = async (audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  try {
    const response = await fetch('http://localhost:5000/api/transcribe', {
      method: 'POST',
      body: formData,
    })
    if (response.ok) {
      const data = (await response.json()) as TranscriptionResponse
      userInput.value = ''
      userInput.value = data.text
    }
  } catch (error) {
    console.error('There was an error sending the audio to the server.', error)
  }
}

const clearAudioData = () => {
  if (audioURL.value) {
    URL.revokeObjectURL(audioURL.value)
    audioURL.value = ''
  }
  if (recordedBlob.value) {
    recordedBlob.value = null
    audioChunks = []
  }
}

const wordsToDisplay = ref<string[]>([])
const currentWord = ref<number>(0)

const increaseCurrentWordNumber = () => {
  ++currentWord.value
}
</script>

<template>
  <div class="mx-8">
    <h1>Read the word:</h1>

    <div class="mt-8 text-4xl">{{ wordsToDisplay }}</div>
    <div class="w-160 h-100 md:max-w-272 border border-black mt-10">
      <!-- <div v-if="!userInput.length" id="output-placeholder" :class="userInputStyling">
        Start Speaking!
      </div>
      <div v-else id="output" :class="userInputStyling">{{ userInput }}</div> -->
    </div>
    <div class="flex w-160">
      <div
        class="text-3xl font-bold text-red-700 mt-10 mx-auto rounded-md py-2 px-4 transition duration-100 ease-in-out"
        :class="isRecording ? 'bg-red-700 text-white' : ''"
        @click="startRecording"
      >
        <span v-if="!isRecording"> Record </span>
        <span v-else="isRecording"> Recording </span>
      </div>
      <div
        class="text-3xl font-bold text-blue-900 mt-10 mx-auto rounded-md py-2 px-4"
        @click="stopRecording"
      >
        Stop
      </div>
    </div>
    <div v-if="audioURL" class="mt-20">
      <h3>Playback Test:</h3>
      <audio :src="audioURL" controls></audio>
    </div>
  </div>
</template>

<style scoped></style>
