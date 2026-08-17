<script setup lang="ts">
import { ref } from 'vue'
import type { ApiResponse, TargetWordObject } from '../../../shared/types'
import { useAssessmentStore } from '@/stores/assessmentStore'

const assessmentStore = useAssessmentStore()

const targetPhonemes: string[][] = []
</script>

<template>
  <div v-if="assessmentStore.currentDisplayWords">
    <div
      v-for="(word, index) in assessmentStore.currentDisplayWords"
      class="w-full h-full mt-2 text-8xl"
    >
      <div class="w-full h-full" v-if="index === assessmentStore.currentDisplayWordCount">
        {{ assessmentStore.isTiming ? word : '' }}
      </div>
    </div>
  </div>
</template>
