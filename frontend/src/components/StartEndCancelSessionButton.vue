<script setup lang="ts">
import { useAssessmentStore } from '@/stores/assessmentStore'
import { computed } from 'vue'

const props = defineProps({
  purpose: {
    type: String,
    required: true,
  },
})

const styling = computed(() => {
  let cancel
  if (props.purpose === 'cancel') cancel = true
  return {
    'bg-red-700': !assessmentStore.isLive || cancel,
    'bg-blue-700': assessmentStore.isLive,
  }
})

const buttonText = computed(() => {
  if (props.purpose === 'cancel') return 'Cancel'
  if (assessmentStore.isLive) return 'End Assessment Session'
  if (!assessmentStore.isLive) return 'Start Assessment Session'
})

const assessmentStore = useAssessmentStore()
</script>
<template>
  <div
    class="w-fit text-center text-2xl rounded-lg text-white font-bold p-4 ml-auto mr-auto hover:scale-102 hover:shadow-lg transition duration-100 ease-in-out"
    :class="styling"
    @click="
      assessmentStore.isLive
        ? assessmentStore.endCurrentAssessmentSession(
            props.purpose === 'cancel' ? 'cancelled' : 'completed',
          )
        : assessmentStore.startNewAssessmentSession()
    "
  >
    {{ buttonText }}
  </div>
</template>
