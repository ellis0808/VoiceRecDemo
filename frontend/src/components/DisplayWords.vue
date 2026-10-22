<script setup lang="ts">
import { useStudentStore } from '@/stores/studentStore'

const studentStore = useStudentStore()
</script>

<template>
  <div v-if="studentStore.currentTargetWords">
    <div
      v-for="(item, index) in studentStore.currentTargetWords"
      class="w-full h-full mt-2 text-8xl lg:text-9xl"
    >
      <div
        class="w-full h-full md:text-[23rem] md:tracking-wider"
        v-if="index === studentStore.currentDisplayWordCount"
      >
        {{ studentStore.isTiming ? item.word[0] : '' }}
      </div>
    </div>
  </div>
</template>
