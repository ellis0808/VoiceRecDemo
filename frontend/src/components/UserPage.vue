<script setup lang="ts">
import { useAssessmentStore } from '@/stores/assessmentStore'
import { useUserStore } from '@/stores/userStore'
import { computed, onMounted, ref } from 'vue'
import TestFocus from './TestFocus.vue'
import { useUiStore } from '@/stores/uiStore'

const assessmentStore = useAssessmentStore()
const userStore = useUserStore()
const uiStore = useUiStore()

const isFocused = ref<Boolean>(false)
const assessmentId = ref<number | null>(null)
const testId = ref<number | null>(null)
const assessmentSessionId = ref<number | null>(null)
// const isMatch = computed(() => {})

onMounted(async () => {
  await assessmentStore.getUserAssessments()
})
</script>

<template>
  <div v-if="!uiStore.currentTestIsFocused" class="ml-5">
    <div class="text-2xl">{{ userStore.user.username }}'s Tests</div>
    <div class="ml-5" v-for="(assessment, index) in userStore.user.assessments">
      <div
        class="cursor-pointer"
        @click="
          ((uiStore.currentTestIsFocused = true),
          (testId = assessment.testId),
          (assessmentId = assessment.id))
        "
      >
        <div class="ml-2 text-lg">
          {{ assessment.testId }}
        </div>
        <table>
          <thead>
            <tr class="px-3">
              <th scope="col" v-for="n in assessment.questions.length">{{ n }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="(question, index) in assessment.questions">
                {{ question?.word[0] }}
              </td>
            </tr>
            <tr>
              <td v-for="(question, index) in assessment.questions">
                <span v-for="phone in question?.arpabet?.[0]">{{ phone }}&nbsp;</span>
              </td>
            </tr>
            <tr>
              <td v-for="answer in assessment.answersArpabet">
                <span v-for="phone in answer">{{ phone }}&nbsp;</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div v-if="uiStore.currentTestIsFocused">
    <TestFocus
      :assessment-id="assessmentId"
      :test-id="testId"
      :assessment-session-id="assessmentSessionId"
    />
  </div>
</template>
