<script setup lang="ts">
import { useStudentStore } from '@/stores/studentStore'

const studentStore = useStudentStore()
</script>

<template>
  <div v-if="studentStore.currentTargetWords">
    <div
      v-for="(item, index) in studentStore.currentTargetWords"
      class="w-full h-full mt-2 text-8xl"
    >
      <div class="w-full h-full" v-if="index === studentStore.currentDisplayWordCount">
        {{ studentStore.isTiming ? item.word[0] : '' }}
      </div>
    </div>
  </div>
</template>
