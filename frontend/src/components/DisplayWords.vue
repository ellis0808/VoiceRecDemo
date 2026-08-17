<script setup lang="ts">
import { useAssessmentStore } from '@/stores/assessmentStore'

const assessmentStore = useAssessmentStore()

const targetPhonemes: string[][] = []
</script>

<template>
  <div v-if="assessmentStore.currentTargetWords">
    <div
      v-for="(item, index) in assessmentStore.currentTargetWords"
      class="w-full h-full mt-2 text-8xl"
    >
      <div class="w-full h-full" v-if="index === assessmentStore.currentDisplayWordCount">
        {{ assessmentStore.isTiming ? item.word[0] : '' }}
      </div>
    </div>
  </div>
</template>
