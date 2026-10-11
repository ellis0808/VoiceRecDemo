<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import DisplayWords from '@/components/DisplayWords.vue'
import { currentTestingStatus } from '../../../shared/types'
import { onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'

const authStore = useAuthStore()
const studentStore = useStudentStore()

await studentStore.loadMediaRecorder()

const startTest = async () => {
  if (!studentStore.wsConnection.isLive) return
  // await studentStore.loadWords()
  studentStore.toggleTestingState(true)
  studentStore.setCurrentTimeLimit(3)
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
  <div class="text-lg my-5 border py-3 px-2" @click="authStore.logout">Logout</div>

  <div class="flex gap-20 mb-10 text-2xl">Hello {{ studentStore.user?.firstName }}!</div>

  <hr />

  <div
    v-if="studentStore.wsConnection.isLive && studentStore.currentAssessmentStatus !== 'finished'"
    class="my-10"
  >
    <button class="bg-green-900 py-2 px-4 rounded-lg text-white text-2xl" @click="startTest">
      Start Test
    </button>
  </div>
  <div v-if="studentStore.isTesting" class="flex flex-col w-fit">
    <div
      class="flex h-50 w-100 items-center place-content-center border-2 border-black transition duration-75 ease-in"
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
</template>
