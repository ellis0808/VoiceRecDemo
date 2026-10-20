<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import type { Student, UserTestDataObject } from '../../../shared/types'
import { useTeacherStore } from '@/stores/teacherStore'
import StudentSingleTestResults from './StudentSingleTestResults.vue'

const teacherStore = useTeacherStore()
const uiStore = useUiStore()
const authStore = useAuthStore()

const isFocused = ref<Boolean>(false)
const studentId = ref<number | null>(null)
const assessmentId = ref<number | null>(null)
const testId = ref<number | null>(null)
const assessmentSessionId = ref<number | null>(null)
// const isMatch = computed(() => {})

const classStudents = ref<Student[]>([])

const selectClass = async (classId: number) => {
  if (classId === 0) {
    classStudents.value = teacherStore.allStudents.filter(
      (student) =>
        student.englishClass === 1 || student.englishClass === 2 || student.englishClass === 3,
    )
  } else {
    classStudents.value = teacherStore.allStudents.filter(
      (student) => student.englishClass === classId,
    )
  }
}

const currentStudentAssessments = ref<UserTestDataObject[]>([])

const getAssessments = async (studentId: number) => {
  console.log(studentId)

  await teacherStore.getUserAssessments(studentId)
  currentStudentAssessments.value = teacherStore.studentAssessments
}

const currentStudent = ref<Student>()

const setSingleTestResults = (
  stdntId: number,
  assssId: number,
  tstId: number,
  assssSessId: number,
) => {
  uiStore.currentTestIsFocused = true
  studentId.value = stdntId
  assessmentId.value = assssId
  testId.value = tstId
  assessmentSessionId.value = assssSessId
}
onMounted(async () => {
  if (teacherStore.user) {
    await teacherStore.getAllStudents()
  }
  selectClass(0)
})
</script>

<template>
  <div v-if="!uiStore.currentTestIsFocused" class="ml-5">
    <div class="flex flex-col">
      <div class="text-2xl font-bold mt-10">Select Class</div>
      <div class="flex flex-col">
        <div>
          <div class="flex">
            <div
              v-for="schoolClass in authStore.classes"
              class="flex text-2xl mt-3 w-25 h-15 justify-center items-center mx-4 px-2 py-2 border rounded-md select-none cursor-pointer"
              @click="selectClass(schoolClass.id)"
            >
              {{ schoolClass.name }}
            </div>
          </div>
          <div class="mt-5 mb-10">
            <div class="flex-col">
              <div :class="[`grid grid-cols-${authStore.classes.length}`]">
                <div v-for="(schoolClass, index) in authStore.classes" :style="{ gridRow: 1 }">
                  {{ schoolClass.name }}
                </div>
                <div v-for="student in classStudents" @click="getAssessments(student.userId)">
                  {{ student.lastName }}, {{ student.firstName }}
                </div>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentStudent" class="text-2xl">
      {{ currentStudent?.lastName }}, {{ currentStudent?.firstName }}'s Tests
    </div>
    <div class="ml-5" v-for="(assessment, index) in currentStudentAssessments">
      <div
        class="cursor-pointer"
        @click="
          setSingleTestResults(
            assessment.userId,
            assessment.id,
            assessment.testId,
            assessment.assessmentSessionId,
          )
        "
      >
        <div class="ml-2 text-lg font-bold">
          {{ assessment.questions[0]?.name }} - {{ assessment.score }} points
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
    <StudentSingleTestResults
      :assessment-id="assessmentId"
      :test-id="testId"
      :assessment-session-id="assessmentSessionId"
      :student-id="studentId"
    />
  </div>
</template>
