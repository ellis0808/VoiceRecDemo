<script setup lang="ts">
import { useAssessmentStore } from '@/stores/assessmentStore'
import { useUserStore } from '@/stores/userStore'
import { useUiStore } from '@/stores/uiStore'
import { computed, onMounted, onUnmounted } from 'vue'
import type { UserTestDataObject } from '../../../shared/types'

const userStore = useUserStore()
const assessmentStore = useAssessmentStore()
const uiStore = useUiStore()

const props = defineProps<{
  assessmentId: number | null
  testId?: number | null
  assessmentSessionId?: number | null
}>()

const currentAssessment = computed((): UserTestDataObject | undefined => {
  return userStore.user.assessments?.find((item) => item.id === props.assessmentId)
})

//   const testLength = computed(() => {
//     return userStore.user.assessments[currentAssessment.value]
//   })
// })

onMounted(async () => {
  await assessmentStore.getUserAudio(props.assessmentId)
})

onUnmounted(() => {
  userStore.user.assessmentAudio?.forEach((item) => {
    if (item.audioUrl) {
      URL.revokeObjectURL(item.audioUrl)
    }
  })
})
</script>

<template>
  <div @click="uiStore.currentTestIsFocused = false">BACK</div>
  TEST
  <div class="ml-8">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Word</th>
          <th>Answers</th>
          <th>Student Answers</th>
          <th>Audio</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(question, index) in currentAssessment?.questions" :key="index">
          <td>{{ index + 1 }}</td>
          <td>{{ question.word[0] }}</td>
          <td>
            <span v-for="phone in question?.arpabet?.[0]">{{ phone }}&nbsp;</span>
          </td>
          <td>
            <span v-for="answer in currentAssessment?.answersArpabet[index]"
              >{{ answer }}&nbsp;</span
            >
          </td>
          <td>
            <template v-for="audioItem in userStore.user.assessmentAudio" :key="audioItem.id">
              <audio
                v-if="audioItem.questionId === question.wordId"
                :src="audioItem.audioUrl"
                controls
              />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
