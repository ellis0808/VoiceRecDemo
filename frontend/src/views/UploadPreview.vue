<script setup lang="ts">
import { useTeacherStore } from '@/stores/teacherStore'
import { useUiStore } from '@/stores/uiStore'
import { ref } from 'vue'
import type { ConvertedWord, NewTestUpload } from '../../../shared/types'
import router from '@/router'
import FileUpload from '@/components/FileUpload.vue'

const teacherStore = useTeacherStore()
const uiStore = useUiStore()

// const testName =
const previewTests = ref<NewTestUpload[]>([])
const testNameArray = ref<string[]>([])
const saveTests = async (data: ConvertedWord[][]) => {
  console.log('Word Data: ', data)

  if (!data) return
  data.map((datum, index) => {
    const thing: NewTestUpload = {
      name: testNameArray.value[index] ? testNameArray.value[index] : 'New Test',
      data: datum,
    }
    previewTests.value?.push(thing)
  })

  console.log('Test Preview: ', previewTests.value)

  await teacherStore.saveNewTests(previewTests.value)
}

const cancelUpload = () => {
  previewTests.value = []
  router.push('teacherHome')
}
</script>

<template>
  <div class="ml-10 mt-20">
    <div><FileUpload /></div>
  </div>
  <div class="ml-10 mt-20">
    <div v-for="(items, unit) in teacherStore.uploadPreview" :key="unit" class="w-[80%]">
      <div class="text-xl mt-5 mb-2">
        <input
          v-model="testNameArray[unit]"
          type="text"
          :placeholder="'Test Name: Test ' + String(unit + 1)"
          maxlength="80"
          class="border rounded-md py-1 px-2"
        />
      </div>
      <div class="w-[60%] grid grid-cols-[0.1fr_0.3fr_0.5fr]">
        <div></div>
        <div class="ml-1 font-bold">Word</div>
        <div class="ml-1 font-bold">Arpabet</div>
      </div>
      <div v-for="(item, index) in items" class="w-[60%] grid grid-cols-[0.1fr_0.3fr_0.5fr] ml-3">
        <div>{{ index + 1 }}.</div>
        <div class="ml-1">{{ item?.word[0] }}</div>
        <div class="ml-1">
          <span v-for="phone in item?.arpabet[0]"> {{ phone }}&nbsp; </span>
        </div>
      </div>
    </div>
  </div>
  <div class="flex ml-10 my-10 gap-20">
    <div id="save-button-container">
      <div
        id="save-button"
        class="w-fit py-2 px-4 border rounded-md text-2xl hover:bg-amber-400 active:bg-red-700"
        @click="saveTests(teacherStore.testDataImport.preSavedWordData)"
      >
        Save
      </div>
    </div>
    <div id="cancel-button-container">
      <button
        id="cancel-button"
        class="w-fit py-2 px-4 border rounded-md text-2xl hover:bg-amber-400 active:bg-red-700"
        @click="cancelUpload"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
