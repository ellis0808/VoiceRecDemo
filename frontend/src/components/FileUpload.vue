<script setup lang="ts">
import { useTeacherStore } from '@/stores/teacherStore'
import { ref } from 'vue'

const teacherStore = useTeacherStore()

const showSubmitButton = ref(false)

const selectedFile = ref<File | null>(null)
const onFilechange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) selectedFile.value = target.files[0] ?? null
}

const handleFileUpload = async () => {
  if (!selectedFile.value) return
  console.log('発火しているよ～')
  try {
    teacherStore.testDataImport.isProcessing = true
    await teacherStore.preUploadNewWords(selectedFile.value)
    teacherStore.testDataImport.isProcessing = false
  } catch (error) {
    alert('Upload failed. Please try again.')
    console.error('Upload failed: ', error)
  }
}
</script>

<template>
  <div v-if="!teacherStore.testDataImport.isProcessing">
    <div class="mt-5">
      <label
        class="custom-file-upload py-2 px-4 w-fit border rounded-md hover:bg-amber-400 active:bg-red-700 active:text-white"
      >
        <input
          type="file"
          name="upload"
          id="uploader"
          @change="(onFilechange($event), (showSubmitButton = true))"
        />
        Upload File
      </label>
      <button
        v-if="showSubmitButton"
        class="ml-15 py-2 px-4 w-fit border rounded-md hover:bg-amber-400 active:bg-red-700 active:text-white"
        id="uploader-submit-button"
        @click="handleFileUpload"
      >
        Submit
      </button>
    </div>
  </div>
  <div v-else class="flex flex-col w-60 justify-center">
    <div class="ml-15 mb-3">
      <span class="pi pi-spin pi-spinner-dotted text-7xl text-blue-600/55"></span>
    </div>
    <div class="text-center">Processing file...</div>
  </div>
</template>

<style>
.custom-file-upload input[type='file'] {
  display: none;
}
</style>
