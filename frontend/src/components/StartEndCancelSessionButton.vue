<script setup lang="ts">
import { useTeacherStore } from '@/stores/teacherStore'
import { computed } from 'vue'

const props = defineProps({
  purpose: {
    type: String,
    required: true,
  },
})

const teacherStore = useTeacherStore()

const styling = computed(() => {
  let cancel
  if (props.purpose === 'cancel') cancel = true
  return {
    'bg-red-700': !teacherStore.wsConnection.isLive || cancel,
    'bg-blue-700': teacherStore.wsConnection.isLive,
  }
})

const buttonText = computed(() => {
  if (props.purpose === 'cancel') return 'Cancel'
  if (teacherStore.wsConnection.isLive) return 'End Assessment Session'
  if (!teacherStore.wsConnection.isLive) return 'Start Assessment Session'
})
</script>
<template>
  <div
    class="w-fit text-center text-2xl rounded-lg text-white font-bold p-4 ml-auto mr-auto hover:scale-102 hover:shadow-lg transition duration-100 ease-in-out"
    :class="styling"
    @click="
      teacherStore.wsConnection.isLive
        ? teacherStore.endCurrentAssessmentSession(
            props.purpose === 'cancel' ? 'cancelled' : 'completed',
          )
        : teacherStore.startNewAssessmentSession()
    "
  >
    {{ buttonText }}
  </div>
</template>
