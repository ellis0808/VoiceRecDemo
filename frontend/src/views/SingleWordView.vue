<script setup lang="ts">
import DisplayWords from '@/components/DisplayWords.vue'
import { useAssessmentStore } from '@/stores/assessmentStore'
import { CurrentTestingStatus } from '../../../shared/types'
import { onMounted } from 'vue'

const assessmentStore = useAssessmentStore()

await assessmentStore.loadMediaRecorder()

const startAssessment = async () => {
  await assessmentStore.loadWords()
  assessmentStore.toggleTestingState(true)
  assessmentStore.setCurrentTimeLimit(3)
  assessmentStore.startTimer()
  assessmentStore.currentTestStatus = CurrentTestingStatus.inProgress
}
</script>

<template>
  <div
    v-if="!assessmentStore.isTesting && assessmentStore.currentTestStatus === 'notTesting'"
    class="mb-10"
  >
    <button class="bg-green-900 py-2 px-4 rounded-lg text-white text-2xl" @click="startAssessment">
      Start Test
    </button>
  </div>
  <div v-if="assessmentStore.isTesting" class="flex flex-col w-fit">
    <div
      class="flex h-50 w-100 items-center place-content-center border-2 border-black transition duration-75 ease-in"
    >
      <DisplayWords />
    </div>
    <div class="flex text-4xl mx-auto gap-x-7">
      <div
        class="cursor-pointer"
        @click="
          assessmentStore.isTiming && assessmentStore.currentTestStatus === 'inProgress'
            ? assessmentStore.displayNewItem()
            : ''
        "
      >
        Next
      </div>
      <div v-show="assessmentStore.currentItemTimer > 0">
        {{ assessmentStore.currentItemTimer }}
      </div>
    </div>
    <div class="text-3xl" @click="assessmentStore.stopTimer">Stop</div>
  </div>
  <div v-else-if="!assessmentStore.isTesting && assessmentStore.currentTestStatus === 'finished'">
    <span class="text-5xl"> Finished! </span>
  </div>
</template>
