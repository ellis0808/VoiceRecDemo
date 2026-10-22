<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import DisplayWords from '@/components/DisplayWords.vue'
import { currentTestingStatus } from '../../../shared/types'
import { onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'
import Logout from '@/components/Logout.vue'

const authStore = useAuthStore()
const studentStore = useStudentStore()

await studentStore.loadMediaRecorder()

const startTest = async () => {
  if (!studentStore.wsConnection.isLive) return
  // await studentStore.loadWords()
  studentStore.toggleTestingState(true)
  studentStore.setCurrentTimeLimit(5)
  studentStore.startTimer()
  studentStore.currentAssessmentStatus = currentTestingStatus.inProgress
}

onMounted(async () => {
  console.log('User: ', studentStore.user)

  if (!studentStore.user?.id) {
    await studentStore.refreshUser()
  }
  console.log('User: ', studentStore.user)
  if (studentStore.token)
    if (!studentStore.wsConnection.socketConnected)
      await studentStore.establishWebsocketConnection(studentStore.token)
})
</script>

<template>
  <Logout />
  <div class="ml-10 h-full">
    <div class="h-fit" v-if="!studentStore.isTesting">
      <div class="flex gap-20 my-10 text-3xl md:text-5xl text-center">
        Hello {{ studentStore.user?.firstName }}!
      </div>
    </div>
    <div v-if="!studentStore.isTesting" class="flex justify-center items-center">
      <div
        v-if="
          studentStore.wsConnection.isLive && studentStore.currentAssessmentStatus !== 'finished'
        "
        class="flex h-full my-10 place-content-center"
      >
        <button
          class="bg-green-900 py-2 px-4 lg:py-20 lg:px-40 rounded-lg md:rounded-4xl text-white text-2xl md:text-9xl"
          @click="startTest"
        >
          Start Test
        </button>
      </div>
    </div>
    <div v-if="studentStore.isTesting" class="flex flex-col w-fit">
      <div
        class="flex h-200 w-300 items-center place-content-center border-2 border-black transition duration-75 ease-in"
      >
        <DisplayWords />
      </div>
      <div class="flex text-4xl mx-auto gap-x-7">
        <div
          class="cursor-pointer"
          @click="
            studentStore.isTiming && studentStore.currentAssessmentStatus === 'inProgress'
              ? studentStore.displayNewItem()
              : ''
          "
        >
          Next
        </div>
        <div v-show="studentStore.currentItemTimer > 0">
          {{ studentStore.currentItemTimer }}
        </div>
      </div>
      <div
        class="text-3xl"
        @click="
          (studentStore.stopTimer(), studentStore.endAssessment(), studentStore.finishAssessment())
        "
      >
        Stop
      </div>
    </div>
    <div v-else-if="!studentStore.isTesting && studentStore.currentAssessmentStatus === 'finished'">
      <span class="text-5xl"> Finished! </span>
    </div>
  </div>
</template>
