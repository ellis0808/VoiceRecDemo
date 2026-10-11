<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { computed, onMounted, ref } from 'vue'

const authStore = useAuthStore()
const uiStore = useUiStore()

const enum LoginType {
  Teacher = 'teacher',
  Student = 'student',
}
const loginType = ref<LoginType>(LoginType.Student)
const loginTypeSelected = ref('')
const usernameOrEmail = ref<string | null>(null)
const password = ref<string | null>(null)
const schoolView = ref(true)
const classView = ref(false)
const studentView = ref(false)
const schoolId = ref<number | null>(null)
const classId = ref<number | null>(null)

const clearFields = () => {
  usernameOrEmail.value = ''
  password.value = ''
  uiStore.search.input = ''
  classView.value = false
}

const backButton = () => {
  if (schoolView.value && !classView.value && !studentView.value) {
    uiStore.search.input = ''
  }
  if (schoolView.value && classView.value && !studentView.value) {
    classView.value = false
  }
  if (schoolView.value && classView.value && studentView.value) {
    studentView.value = false
  }
}

const login = async (usernameOrEmail: string, password: string) => {
  if (usernameOrEmail && password) {
    await authStore.login(usernameOrEmail, password, loginType.value)
  }
}

const changeLoginType = (type: LoginType) => {
  loginType.value = type
  clearFields()
}
const studentTeacherButtonStyling = computed(() => {
  return {
    'bg-white ': true,
    'border rounded': true,
    'px-2 py-1': true,
    'mx-3': true,
    'font-bold': (loginType.value = LoginType.Teacher),
  }
})

const getClasses = async (schId: number) => {
  console.log(schoolId)
  schoolId.value = schId
  if (schoolId.value) await authStore.getClasses(schoolId.value)
  classView.value = true
}
const getClassStudents = async (clssId: number) => {
  classId.value = clssId
  if (schoolId.value && classId.value)
    await authStore.getClasssStudents(schoolId.value, classId.value)
  studentView.value = true
}

onMounted(async () => {
  await authStore.getSchools()
  console.log(authStore.schools)
})
</script>

<template>
  <div class="">
    <div>
      {{ uiStore.title }}
    </div>
    <div class="ml-5">
      <div id="student-teacher-button-container" class="my-4">
        <button
          id="student-button"
          :class="studentTeacherButtonStyling"
          @click="changeLoginType(LoginType.Student)"
        >
          Student
        </button>
        <button
          id="teacher-button"
          :class="studentTeacherButtonStyling"
          @click="changeLoginType(LoginType.Teacher)"
        >
          Teacher
        </button>
      </div>

      <div v-if="loginType === LoginType.Teacher">
        <div>
          <label for="usernameOrEmail">Username / Email: </label>
          <div class="flex content-center">
            <input
              v-model="usernameOrEmail"
              type="text"
              name="usernameOrEmail"
              id="usernameOrEmail"
              class="border rounded-md px-2 py-1"
            />
          </div>
        </div>
        <div>
          <label for="password">Password: </label>
          <div class="flex content-center">
            <input
              v-model="password"
              type="password"
              name="password"
              id="password"
              class="border rounded-md px-2 py-1"
              @keyup.enter="login(usernameOrEmail ?? '', password ?? '')"
            />
          </div>
        </div>
        <div id="login-button-container">
          <button
            id="login-button"
            class="px-2 py-1 rounded-md text-lg shadow-md/35"
            @click="login(usernameOrEmail ?? '', password ?? '')"
          >
            Login
          </button>
        </div>
      </div>
      <div v-if="loginType === LoginType.Student">
        <div>
          School Search:
          <input
            v-model="uiStore.search.input"
            class="border black rounded-md px-2 py-1 w-60"
            id="school-search-input"
            ref="school-search-input"
            placeholder="My school..."
            type="text"
          />
        </div>
        <div id="back-button" v-if="uiStore.searchResults.length > 0" @click="backButton">Back</div>
        <div id="school-search-results" class="mt-10" v-if="schoolView && !classView">
          <div v-for="school in uiStore.searchResults">
            <div
              class="flex bg-green-800 w-70 h-30 rounded-2xl text-2xl font-bold shadow-md/35 text-white items-center text-center hover:scale-102 transition duration-75 cursor-pointer"
              @click="getClasses(school.id)"
            >
              {{ school.name }}
            </div>
          </div>
        </div>
        <div id="classes-display-container" v-if="classView && !studentView">
          <div v-for="schoolClass in authStore.classes">
            <div
              class="flex gap-4 bg-blue-200 w-50 h-15 mt-10 rounded-2xl text-2xl font-bold shadow-md/35 text-white items-center text-center hover:scale-102 transition duration-75 cursor-pointer"
              @click="getClassStudents(schoolClass.id)"
            >
              {{ schoolClass.name }}
            </div>
          </div>
        </div>
        <div id="class-students-display-container" v-if="studentView && classView">
          <div v-for="student in authStore.classStudents">
            <div
              class="flex gap-4 bg-blue-200 w-50 h-15 mt-10 rounded-2xl text-2xl font-bold shadow-md/35 text-white items-center text-center hover:scale-102 transition duration-75 cursor-pointer"
              @click="login(student.username, 'test')"
            >
              {{ student.lastName }}, {{ student.firstName }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
