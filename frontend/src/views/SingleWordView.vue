<script setup lang="ts">
import DisplayWords from '@/components/DisplayWords.vue'
import { useAssessmentStore } from '@/stores/assessmentStore'
import { currentTestingStatus } from '../../../shared/types'
import ChooseAssessment from '@/components/ChooseAssessment.vue'
import StartEndCancelSessionButton from '@/components/StartEndCancelSessionButton.vue'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const assessmentStore = useAssessmentStore()

await assessmentStore.loadMediaRecorder()

const startTest = async () => {
  if (!assessmentStore.isLive) return
  // await assessmentStore.loadWords()
  assessmentStore.convertAssessmentBEToFE()
  assessmentStore.toggleTestingState(true)
  assessmentStore.setCurrentTimeLimit(3)
  assessmentStore.startTimer()
  assessmentStore.currentAssessmentStatus = currentTestingStatus.inProgress
}

onMounted(() => {
  assessmentStore.establishWebsocketConnection()
})
</script>

<template>
  <div class="mb-30">
    <ChooseAssessment />
  </div>

  <div class="flex gap-20 mb-10">
    <div class="flex ml-auto mr-auto">
      <StartEndCancelSessionButton :purpose="assessmentStore.isLive ? 'end' : 'start'" />
    </div>
    <div v-if="assessmentStore.isLive" class="mr-auto">
      <StartEndCancelSessionButton :purpose="'cancel'" />
    </div>
  </div>

  <hr />

  <div v-if="assessmentStore.isLive" class="my-10">
    <button class="bg-green-900 py-2 px-4 rounded-lg text-white text-2xl" @click="startTest">
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
          assessmentStore.isTiming && assessmentStore.currentAssessmentStatus === 'inProgress'
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
    <div
      class="text-3xl"
      @click="
        (assessmentStore.stopTimer(),
        assessmentStore.endAssessment(),
        assessmentStore.finishAssessment())
      "
    >
      Stop
    </div>
  </div>
  <div
    v-else-if="!assessmentStore.isTesting && assessmentStore.currentAssessmentStatus === 'finished'"
  >
    <span class="text-5xl"> Finished! </span>
  </div>
  <hr />
  <RouterLink to="/user">
    <div class="text-2xl">Student Tests</div>
  </RouterLink>
</template>
