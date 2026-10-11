<script setup lang="ts">
import { onMounted } from 'vue'
import type { WordTestsBEObject } from '../../../shared/types'
import { useAuthStore } from '@/stores/authStore'
import { useTeacherStore } from '@/stores/teacherStore'

const authStore = useAuthStore()
const teacherStore = useTeacherStore()

const tableStyling = (test: WordTestsBEObject[]) => {
  return {
    'flex flex-col': true,
    'my-5 mx-8': true,
    'py-5 px-5': true,
    'transition-all duration-75 ease-in-out': true,
    'border-2 border-transparent': test[0]?.testId !== teacherStore.currentAssessment[0]?.testId,
    'border-2 border-black rounded shadow-md/35':
      test[0]?.testId === teacherStore.currentAssessment[0]?.testId,
  }
}

const selectButtonText = (test: WordTestsBEObject[]): 'Select' | 'Deselect' => {
  const currentSelectedId = teacherStore.currentAssessment[0]?.testId
  const targetId = test[0]?.testId

  if (targetId !== undefined && targetId === currentSelectedId) return 'Deselect'
  return 'Select'
}

onMounted(async () => {
  await teacherStore.getAllAssessments()
})
</script>

<template>
  <div class="flex flex-col">
    <div class="text-2xl font-bold mb-3">Select Test</div>
    <div class="w-fit p-2 ml-6">
      <span class="text-2xl"> Current Test: </span>
      <span class="text-2xl">
        {{ teacherStore.currentAssessment[0]?.name ?? 'No test currently selected' }}
      </span>
    </div>
    <div v-for="(test, testId) in teacherStore.testMap" :key="test[testId]?.testId">
      <div class="flex flex-col">
        <div v-if="test">
          <div id="test-words-container" :class="tableStyling(test)">
            <div class="flex mb-1">
              <div class="flex text-2xl font-bold">{{ test[0]?.name }}</div>
              <div
                class="flex w-25 justify-center ml-auto p-2 font-bold text-white bg-blue-900 rounded-md cursor-pointer transition duration-500 ease-in-out"
                @click="teacherStore.selectAssessment(test)"
              >
                <span class="transition duration-500 ease-in-out">{{
                  selectButtonText(test)
                }}</span>
              </div>
            </div>
            <div class="ml-8">
              <table>
                <thead>
                  <tr>
                    <th scope="col" v-for="n in 10">{{ n }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td v-for="items in test">
                      {{ items.word[0] }}
                    </td>
                  </tr>
                  <tr>
                    <td v-for="items in test">
                      <span v-for="phone in items.arpabet[0]"> {{ phone }} &nbsp;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
th {
  font-weight: bold;
  text-align: left;
  background-color: lightblue;
  padding-left: 15px;
}

td {
  text-align: left;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
}
tr th:first-child {
  border-radius: 5px 0 0 5px;
}
tr th:last-child {
  border-radius: 0 5px 5px 0;
}
</style>
