<script setup lang="ts">
import ChooseAssessment from '@/components/ChooseAssessment.vue'
import FileUpload from '@/components/FileUpload.vue'
import StartEndCancelSessionButton from '@/components/StartEndCancelSessionButton.vue'
import StudentAllTestResults from '@/components/StudentAllTestResults.vue'
import { useAuthStore } from '@/stores/authStore'
import { useTeacherStore } from '@/stores/teacherStore'
import { useUiStore } from '@/stores/uiStore'
import { onMounted, ref } from 'vue'

const uiStore = useUiStore()
const teacherStore = useTeacherStore()
const authStore = useAuthStore()

type Tab = 'assessments' | 'results'
const tabsData = ref<Record<Tab, { isVisible: boolean }>>({
  assessments: { isVisible: true },
  results: { isVisible: false },
})
const tabsArray = ['Assessments', 'Results']
const changeTabs = (tab: string) => {
  const targetTab = tab.toLowerCase()

  Object.keys(tabsData.value).forEach((item) => {
    const key = item as Tab
    tabsData.value[key].isVisible = item === targetTab
  })
  console.log(tabsData.value)
}

const isSeletedClass = (classId: number) => {
  return {
    'bg-amber-400': Array.prototype.includes.call(teacherStore.selectedClasses, classId),
  }
}

const logout = () => {
  authStore.logout()
}
onMounted(async () => {
  console.log('User: ', teacherStore.user)

  if (!teacherStore.user?.id) {
    await teacherStore.refreshUser()
  }
  console.log('User: ', teacherStore.user)
})
</script>

<template>
  <div>
    <button class="border px-3 py-2" @click="logout">Logout</button>
  </div>
  <div class="flex mt-5">
    <div v-for="tab in tabsArray" class="ml-10 mr-10 text-lg" @click="changeTabs(tab)">
      {{ tab }}
    </div>
  </div>
  <div class="ml-10">
    <FileUpload />
  </div>
  <div v-if="tabsData.assessments.isVisible">
    <div class="text-2xl mt-10">Welcome back {{ teacherStore.user?.username }}!</div>
    <div class="flex flex-col">
      <div class="text-2xl font-bold mt-10">Select Classes</div>
      <div class="flex">
        <div
          v-for="schoolClass in authStore.classes"
          class="flex text-2xl mt-3 w-25 h-15 justify-center items-center mx-4 px-2 py-2 border rounded-md select-none cursor-pointer"
          :class="isSeletedClass(schoolClass.id)"
          @click="teacherStore.selectClass(schoolClass)"
        >
          {{ schoolClass.name }}
        </div>
      </div>
    </div>

    <div class="mt-10">
      <ChooseAssessment />
    </div>
    <hr />

    <div class="flex gap-20 my-10">
      <div class="flex ml-auto mr-auto">
        <StartEndCancelSessionButton
          :purpose="teacherStore.wsConnection.isLive ? 'end' : 'start'"
        />
      </div>
      <div v-if="teacherStore.wsConnection.isLive" class="mr-auto">
        <StartEndCancelSessionButton :purpose="'cancel'" />
      </div>
    </div>
  </div>
  <div v-else-if="tabsData.results.isVisible">
    <div>Student Results</div>
    <div><StudentAllTestResults /></div>
  </div>
</template>
