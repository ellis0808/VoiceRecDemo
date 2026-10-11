<script setup lang="ts">
import { useUiStore } from '@/stores/uiStore'
import { computed, onMounted, onUnmounted } from 'vue'
import type { UserTestDataObject } from '../../../shared/types'
import { useTeacherStore } from '@/stores/teacherStore'

const teacherStore = useTeacherStore()
const uiStore = useUiStore()

const props = defineProps<{
  assessmentId: number | null
  testId?: number | null
  assessmentSessionId?: number | null
  studentId: number | null
}>()

console.log('Test Focus props:', props)

const currentAssessment = computed((): UserTestDataObject | undefined => {
  if (teacherStore.user)
    return teacherStore.studentAssessments?.find((item) => item.id === props.assessmentId)
})

console.log(currentAssessment.value)

onMounted(async () => {
  if (props.assessmentId && props.studentId)
    await teacherStore.getUserAudio(props.assessmentId, props.studentId)
  await teacherStore.getAllAssessments()
})

onUnmounted(() => {
  teacherStore.studentAssessmentAudio?.forEach((item) => {
    if (item.audioUrl) {
      URL.revokeObjectURL(item.audioUrl)
    }
  })
})
</script>

<template>
  <div @click="uiStore.currentTestIsFocused = false">BACK</div>

  <div class="ml-8">
    <div id="test-name" class="text-2xl mb-2">{{ currentAssessment?.questions[0]?.name }}</div>
    <div id="score" class="text-2xl mb-2">Score: {{ currentAssessment?.score }}</div>
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
            <span v-for="phones in question.arpabet[0]">{{ phones }}&nbsp;</span>
          </td>
          <td>
            <span v-for="answer in currentAssessment?.answersArpabet[index]"
              >{{ answer }}&nbsp;</span
            >
          </td>

          <td>
            <template v-for="audioItem in teacherStore.studentAssessmentAudio" :key="audioItem.id">
              <audio
                v-if="audioItem.questionId === question.wordId"
                :src="audioItem.audioUrl"
                controls
                class="block"
              />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
